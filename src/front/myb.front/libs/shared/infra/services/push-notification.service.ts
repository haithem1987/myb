import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';

/**
 * - unsupported: browser without Web Push (or no service worker in this build)
 * - ios-install-required: iPhone/iPad Safari, push only works once MYB is on the home screen
 * - denied: the user blocked notifications in the browser settings
 * - available: can be enabled with a click
 * - enabled: this device receives push notifications for the signed-in user
 */
export type PushState = 'unsupported' | 'ios-install-required' | 'denied' | 'available' | 'enabled';

const SERVICE_WORKER_URL = '/service-worker.js';
/** Remembers which account opted in on this device, so a shared device never silently
 *  re-subscribes the next person who signs in. */
const OPT_IN_STORAGE_KEY = 'myb_push_opt_in_user';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly apiUrl: string;
  private readonly stateSubject = new BehaviorSubject<PushState>('unsupported');
  readonly state$ = this.stateSubject.asObservable();

  private initPromise: Promise<void> | null = null;
  private currentEndpoint: string | null = null;
  private currentSubscription: PushSubscription | null = null;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    @Optional() @Inject(ENVIRONMENT) private environment: any
  ) {
    this.apiUrl = this.environment?.services?.notification?.baseUrl ?? 'http://localhost:8085';
    this.keycloakService.onBeforeLogout(token => this.detachOnLogout(token));
  }

  get state(): PushState {
    return this.stateSubject.value;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  static isIosWithoutInstall(): boolean {
    if (typeof window === 'undefined') return false;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches;
    return ios && !standalone;
  }

  /** Detects the device state and refreshes this device's subscription on the server. Safe to
   *  call from every layout: runs once per page load. */
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInit().catch(error => {
        console.warn('MYB push init failed', error);
      });
    }
    return this.initPromise;
  }

  /** Must be called from a user gesture (click): browsers ignore permission prompts otherwise. */
  async enable(language?: string): Promise<PushState> {
    if (!PushNotificationService.isSupported()) return this.setState('unsupported');
    const registration = await this.getRegistration();
    if (!registration) return this.setState('unsupported');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return this.setState(permission === 'denied' ? 'denied' : 'available');

    const subscription = await this.subscribe(registration);
    await this.saveSubscription(subscription);
    this.rememberOptIn();
    this.setState('enabled');
    await this.post(`/api/push/test${language ? `?language=${encodeURIComponent(language)}` : ''}`, {})
      .catch(() => undefined);
    return this.state;
  }

  async disable(): Promise<PushState> {
    const registration = await this.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await this.request('DELETE', '/api/push/subscriptions', { endpoint: subscription.endpoint })
        .catch(() => undefined);
      await subscription.unsubscribe().catch(() => false);
    }
    this.forgetOptIn();
    this.currentEndpoint = null;
    this.currentSubscription = null;
    return this.setState(this.permissionState());
  }

  private async doInit(): Promise<void> {
    if (!PushNotificationService.isSupported()) {
      this.setState(PushNotificationService.isIosWithoutInstall() ? 'ios-install-required' : 'unsupported');
      return;
    }
    const registration = await this.getRegistration();
    if (!registration) {
      this.setState('unsupported');
      return;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (Notification.permission !== 'granted' || !this.isOptedInForCurrentUser()) {
      // A subscription nobody signed in here opted into (e.g. left by the previous account on
      // a shared device) must not keep delivering notifications.
      if (subscription) await subscription.unsubscribe().catch(() => false);
      this.forgetOptIn();
      this.setState(this.permissionState());
      return;
    }

    // Re-send the subscription: the browser may have rotated it, or the server may have
    // dropped it after delivery failures.
    await this.saveSubscription(subscription ?? await this.subscribe(registration));
    this.setState('enabled');
  }

  /** State of a device that has not opted in (yet). */
  private permissionState(): PushState {
    return Notification.permission === 'denied' ? 'denied' : 'available';
  }

  private async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    // The client app registers the worker in production; the admin app (syndic space, under
    // /admin/) shares the same origin and therefore the same root-scoped worker.
    if (!this.environment?.production && !this.environment?.pwaInDev) return null;
    try {
      await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/', updateViaCache: 'none' });
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn('MYB service worker registration failed', error);
      return null;
    }
  }

  private async subscribe(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;
    const { publicKey } = await firstValueFrom(
      this.http.get<{ publicKey: string }>(`${this.apiUrl}/api/push/vapid-public-key`, {
        headers: await this.authHeaders()
      })
    );
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer
    });
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    await this.post('/api/push/subscriptions', {
      endpoint: subscription.endpoint,
      keys: { p256dh: json.keys?.['p256dh'], auth: json.keys?.['auth'] }
    });
    this.currentEndpoint = subscription.endpoint;
    this.currentSubscription = subscription;
  }

  /** Runs synchronously inside logout(): the page is about to navigate away, so the server call
   *  uses fetch keepalive, which outlives the page. */
  private detachOnLogout(accessToken: string | null): void {
    this.forgetOptIn();
    const endpoint = this.currentEndpoint;
    const subscription = this.currentSubscription;
    this.currentEndpoint = null;
    this.currentSubscription = null;
    if (!endpoint) return;
    if (accessToken) {
      fetch(`${this.apiUrl}/api/push/subscriptions`, {
        method: 'DELETE',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ endpoint })
      }).catch(() => undefined);
    }
    subscription?.unsubscribe().catch(() => false);
  }

  private isOptedInForCurrentUser(): boolean {
    const userId = this.keycloakService.getUserId();
    return !!userId && localStorage.getItem(OPT_IN_STORAGE_KEY) === userId;
  }

  private rememberOptIn(): void {
    const userId = this.keycloakService.getUserId();
    if (userId) localStorage.setItem(OPT_IN_STORAGE_KEY, userId);
  }

  private forgetOptIn(): void {
    localStorage.removeItem(OPT_IN_STORAGE_KEY);
  }

  private setState(state: PushState): PushState {
    this.stateSubject.next(state);
    return state;
  }

  private post(path: string, body: unknown): Promise<unknown> {
    return this.request('POST', path, body);
  }

  private async request(method: 'POST' | 'DELETE', path: string, body: unknown): Promise<unknown> {
    const headers = await this.authHeaders();
    return firstValueFrom(this.http.request(method, `${this.apiUrl}${path}`, { headers, body }));
  }

  private async authHeaders(): Promise<HttpHeaders> {
    await this.keycloakService.updateToken();
    const token = this.keycloakService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}

/** VAPID public keys are base64url; PushManager.subscribe expects raw bytes. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
