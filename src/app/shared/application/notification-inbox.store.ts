import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, concatMap, distinctUntilChanged, EMPTY, finalize, map, merge, Observable, startWith, Subject, switchMap, tap, timeout, timer } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { NotificationInboxApi } from '../infrastructure/notification-inbox-api';
import { NotificationInboxItem, NotificationSource, notificationKey, sortNotifications } from './models/notification-inbox-item';

type InboxAction = { kind: 'refresh' } | { kind: 'read'; source: NotificationSource; id: number };

/** UI-only store; the six Bounded Contexts retain independent ownership. */
@Injectable()
export class NotificationInboxStore {
  readonly #api = inject(NotificationInboxApi);
  readonly #iam = inject(IamStore);
  readonly #translate = inject(TranslateService);
  readonly #actions = new Subject<InboxAction>();
  readonly #items = signal<NotificationInboxItem[]>([]);
  readonly #owner = signal<number | null>(null);
  readonly #loading = signal(false);
  readonly #failedSources = signal<NotificationSource[]>([]);
  readonly #writeError = signal(false);

  readonly notifications = computed(() => this.#iam.isSignedIn() && this.#owner() === this.#iam.currentUserId() ? this.#items() : []);
  readonly unreadCount = computed(() => this.notifications().filter(item => !item.read).length);
  readonly loading = this.#loading.asReadonly();
  readonly failedSources = this.#failedSources.asReadonly();
  readonly error = computed(() => this.#writeError() || this.#failedSources().length > 0);

  constructor() {
    const language = this.#translate.onLangChange.pipe(
      map(event => event.lang), startWith(this.#translate.getCurrentLang() ?? 'en'), distinctUntilChanged(),
    );
    combineLatest([toObservable(this.#iam.currentUserId), toObservable(this.#iam.isSignedIn), language]).pipe(
      switchMap(([userId, signedIn, lang]) => {
        this.#items.set([]);
        this.#owner.set(null);
        this.#failedSources.set([]);
        this.#writeError.set(false);
        if (!signedIn || userId === null) return EMPTY;
        const refresh: InboxAction = { kind: 'refresh' };
        const isCurrent = () => this.#iam.isSignedIn() && this.#iam.currentUserId() === userId;
        return merge(timer(0, 30000).pipe(map(() => refresh)), this.#actions).pipe(
          concatMap(action => {
            if (!isCurrent()) return EMPTY;
            this.#loading.set(true);
            this.#writeError.set(false);
            const request: Observable<unknown> = action.kind === 'read'
              ? this.#api.markAsRead(action.source, action.id, lang).pipe(
                  timeout(12000),
                  tap(updated => {
                    if (isCurrent()) this.#items.update(items => sortNotifications(items.map(item =>
                      notificationKey(item) === notificationKey(updated) ? updated : item)));
                  }),
                )
              : this.#api.getNotifications(lang).pipe(tap(results => {
                  if (!isCurrent()) return;
                  const previous = this.#items();
                  this.#items.set(sortNotifications(results.flatMap(result => result.items
                    ?? previous.filter(item => item.source === result.source))));
                  this.#failedSources.set(results.filter(result => result.items === null).map(result => result.source));
                  this.#owner.set(userId);
                }));
            return request.pipe(
              catchError(() => { if (isCurrent()) this.#writeError.set(true); return EMPTY; }),
              finalize(() => this.#loading.set(false)),
            );
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }

  refresh(): void { if (!this.#loading()) this.#actions.next({ kind: 'refresh' }); }

  markAsRead(item: NotificationInboxItem): void {
    if (this.#loading() || !this.notifications().some(current => notificationKey(current) === notificationKey(item) && !current.read)) return;
    this.#actions.next({ kind: 'read', source: item.source, id: item.id });
  }
}
