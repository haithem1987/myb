import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { KeycloakService } from '@myb-front/auth';
import { CopropertyService } from '@myb-front/coproperty-module';
import { firstValueFrom } from 'rxjs';

type ConversationKind = 'discussion' | 'annonce';
interface ChatMessage { id: string; authorId: string; author: string; role: 'syndic' | 'owner'; body: string; sentAt: string; }
interface Conversation { id: string; copropertyId: string; title: string; coproperty: string; kind: ConversationKind; participants: number; unread: number; pinned?: boolean; messages: ChatMessage[]; }

const DISCUSSIONS_QUERY = gql`query Discussions($copropertyId: UUID!) { discussions(copropertyId: $copropertyId) { id title kind isPinned copropertyId coproperty { name } messages { id authorId authorName authorRole body createdAt } } }`;
const CREATE_DISCUSSION = gql`mutation CreateDiscussion($input: CreateDiscussionInput!) { createDiscussion(input: $input) { id title kind copropertyId } }`;
const SEND_MESSAGE = gql`mutation SendDiscussionMessage($input: SendDiscussionMessageInput!) { sendDiscussionMessage(input: $input) { id discussionId authorId authorName authorRole body createdAt } }`;
const TOGGLE_PIN = gql`mutation ToggleDiscussionPin($id: UUID!) { toggleDiscussionPin(id: $id) }`;

@Component({
  selector: 'myb-coproperty-discussions', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './discussions.component.html', styleUrls: ['./discussions.component.scss']
})
export class DiscussionsComponent implements OnInit {
  private apollo = inject(Apollo);
  private keycloak = inject(KeycloakService);
  private copropertyService = inject(CopropertyService);
  readonly isSyndic: boolean;
  readonly currentUserId: string;
  readonly currentUserName: string;
  conversations = signal<Conversation[]>([]);
  coproperties = signal<Array<{ id: string; name: string }>>([]);
  loading = signal(true);
  error = signal('');
  selectedId = signal('');
  filter = signal<'all' | 'unread' | 'annonce'>('all');
  search = signal('');
  draft = '';
  showNewConversation = signal(false);
  newTitle = '';
  newCoproperty = '';
  newKind: ConversationKind = 'discussion';

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.conversations().filter(c =>
      (this.filter() === 'all' || (this.filter() === 'unread' ? c.unread > 0 : c.kind === 'annonce')) &&
      (!term || `${c.title} ${c.coproperty}`.toLowerCase().includes(term))
    ).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  });
  selected = computed(() => this.conversations().find(c => c.id === this.selectedId()));
  unreadTotal = computed(() => this.conversations().reduce((sum, c) => sum + c.unread, 0));

  constructor(router: Router) {
    this.isSyndic = router.url.includes('/syndic/');
    const profile = this.keycloak.getProfile();
    this.currentUserId = this.keycloak.getUserId() || profile?.id || '';
    this.currentUserName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.username || 'Utilisateur';
  }

  async ngOnInit(): Promise<void> {
    try {
      const managerId = this.keycloak.getSyndicManagerId();
      const items = await firstValueFrom(this.copropertyService.getCoproperties(managerId));
      this.coproperties.set(items.map(c => ({ id: c.id, name: c.name })));
      this.newCoproperty = items[0]?.id || '';
      if (this.newCoproperty) await this.loadDiscussions(this.newCoproperty);
    } catch { this.error.set('Impossible de charger les discussions.'); }
    finally { this.loading.set(false); }
  }

  private async loadDiscussions(copropertyId: string): Promise<void> {
    const result: any = await firstValueFrom(this.apollo.query({ query: DISCUSSIONS_QUERY, variables: { copropertyId }, fetchPolicy: 'network-only' }));
    const rows: any[] = result.data?.discussions || [];
    this.conversations.set(rows.map(c => ({
      id: c.id, copropertyId: c.copropertyId, title: c.title, coproperty: c.coproperty?.name || '',
      kind: c.kind === 'ANNOUNCEMENT' ? 'annonce' : 'discussion', pinned: c.isPinned, unread: 0,
      participants: new Set(c.messages.map((m: any) => m.authorId)).size,
      messages: c.messages.map((m: any) => ({ id: m.id, authorId: m.authorId, author: m.authorName, role: m.authorRole === 'syndic' ? 'syndic' : 'owner', body: m.body, sentAt: m.createdAt }))
    })));
    if (this.conversations().length) this.selectedId.set(this.conversations()[0].id);
  }

  select(id: string): void { this.selectedId.set(id); this.conversations.update(items => items.map(c => c.id === id ? { ...c, unread: 0 } : c)); }

  async send(): Promise<void> {
    const body = this.draft.trim();
    if (!body || !this.selected()) return;
    this.draft = '';
    try {
      const result: any = await firstValueFrom(this.apollo.mutate({ mutation: SEND_MESSAGE, variables: { input: { discussionId: this.selectedId(), authorId: this.currentUserId, authorName: this.currentUserName, authorRole: this.isSyndic ? 'syndic' : 'owner', body } } }));
      const m = result.data.sendDiscussionMessage;
      const message: ChatMessage = { id: m.id, authorId: m.authorId, author: m.authorName, role: m.authorRole, body: m.body, sentAt: m.createdAt };
      this.conversations.update(items => items.map(c => c.id === this.selectedId() ? { ...c, messages: [...c.messages, message] } : c));
      setTimeout(() => document.querySelector('.messages')?.scrollTo({ top: 999999, behavior: 'smooth' }));
    } catch { this.draft = body; this.error.set("Le message n'a pas pu être envoyé."); }
  }

  onComposerKeydown(event: KeyboardEvent): void { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void this.send(); } }

  async createConversation(): Promise<void> {
    if (!this.newTitle.trim() || !this.newCoproperty) return;
    try {
      const title = this.newTitle.trim();
      const result: any = await firstValueFrom(this.apollo.mutate({ mutation: CREATE_DISCUSSION, variables: { input: { copropertyId: this.newCoproperty, title, kind: this.newKind === 'annonce' ? 'ANNOUNCEMENT' : 'DISCUSSION' } } }));
      const row = result.data.createDiscussion;
      const name = this.coproperties().find(c => c.id === this.newCoproperty)?.name || '';
      this.conversations.update(items => [{ id: row.id, copropertyId: row.copropertyId, title, coproperty: name, kind: this.newKind, participants: 0, unread: 0, messages: [] }, ...items]);
      this.selectedId.set(row.id); this.newTitle = ''; this.showNewConversation.set(false);
    } catch { this.error.set("La discussion n'a pas pu être créée."); }
  }

  async togglePin(): Promise<void> {
    try { await firstValueFrom(this.apollo.mutate({ mutation: TOGGLE_PIN, variables: { id: this.selectedId() } })); this.conversations.update(items => items.map(c => c.id === this.selectedId() ? { ...c, pinned: !c.pinned } : c)); }
    catch { this.error.set("Impossible de modifier l'épinglage."); }
  }

  isMine(message: ChatMessage): boolean { return !!this.currentUserId && message.authorId === this.currentUserId; }
  displayAuthor(message: ChatMessage): string { return this.isMine(message) ? 'Moi' : message.author; }
  initials(name: string): string { return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(); }
  time(value: string): string { return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  lastMessage(c: Conversation): string { return c.messages[c.messages.length - 1]?.body || 'Aucun message pour le moment'; }
  trackById(_: number, item: { id: string }): string { return item.id; }
}
