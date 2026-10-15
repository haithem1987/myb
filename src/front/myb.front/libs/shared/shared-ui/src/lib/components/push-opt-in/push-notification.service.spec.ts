import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';
import {
  PushNotificationService,
  urlBase64ToUint8Array,
} from 'libs/shared/infra/services/push-notification.service';

describe('PushNotificationService', () => {
  let beforeLogout: ((token: string | null) => void) | undefined;
  let service: PushNotificationService;

  beforeEach(() => {
    beforeLogout = undefined;
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        PushNotificationService,
        { provide: HttpClient, useValue: {} },
        { provide: ENVIRONMENT, useValue: { production: false, services: { notification: { baseUrl: 'https://myb.test/api/notification' } } } },
        {
          provide: KeycloakService,
          useValue: {
            onBeforeLogout: (handler: (token: string | null) => void) => {
              beforeLogout = handler;
              return () => undefined;
            },
            getUserId: () => 'owner-1',
            updateToken: () => Promise.resolve(),
            getToken: () => 'token',
          },
        },
      ],
    });
    service = TestBed.inject(PushNotificationService);
  });

  it('decodes base64url VAPID keys to raw bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
  });

  it('reports unsupported when the browser has no Push API', async () => {
    await service.init();
    expect(service.state).toBe('unsupported');
  });

  it('detaches the device from the account on logout with a keepalive request', () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchMock;
    const unsubscribe = jest.fn().mockResolvedValue(true);
    (service as any).currentEndpoint = 'https://fcm.googleapis.com/fcm/send/abc';
    (service as any).currentSubscription = { unsubscribe };
    localStorage.setItem('myb_push_opt_in_user', 'owner-1');

    beforeLogout!('access-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://myb.test/api/notification/api/push/subscriptions',
      expect.objectContaining({
        method: 'DELETE',
        keepalive: true,
        body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc' }),
      })
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer access-token');
    expect(unsubscribe).toHaveBeenCalled();
    expect(localStorage.getItem('myb_push_opt_in_user')).toBeNull();
  });

  it('does nothing on logout when this device never subscribed', () => {
    const fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
    beforeLogout!('access-token');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
