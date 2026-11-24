import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, concatMap, distinctUntilChanged, EMPTY, finalize, map, merge, startWith, Subject, switchMap, tap, timeout, timer } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { RentalNotification } from '../domain/model/rental-notification.entity';
import { RentalNotificationApi } from '../infrastructure/rental-notification-api';

type InboxAction = { kind: 'refresh' } | { kind: 'read'; id: number };

/** Component-scoped inbox. Cancel requests when the authenticated identity changes. */
@Injectable()
export class RentalNotificationStore {
  readonly #api = inject(RentalNotificationApi);
  readonly #iam = inject(IamStore);
  readonly #translate = inject(TranslateService);
  readonly #actions = new Subject<InboxAction>();
  readonly #items = signal<RentalNotification[]>([]);
  readonly #owner = signal<number | null>(null);
  readonly #loading = signal(false);
  readonly #error = signal(false);

  readonly notifications = computed(() => this.#owner() === this.#iam.currentUserId() ? this.#items() : []);
  readonly unreadCount = computed(() => this.notifications().filter(item => !item.read).length);
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();

  constructor() {
    const language = this.#translate.onLangChange.pipe(
      map(event => event.lang), startWith(this.#translate.getCurrentLang() ?? 'en'), distinctUntilChanged(),
    );
    combineLatest([toObservable(this.#iam.currentUserId), language]).pipe(
      switchMap(([userId, lang]) => {
        this.#items.set([]);
        this.#owner.set(null);
        this.#error.set(false);
        if (userId === null) return EMPTY;
        const refresh: InboxAction = { kind: 'refresh' };
        return merge(timer(0, 30000).pipe(map(() => refresh)), this.#actions).pipe(
          concatMap(action => {
            if (this.#iam.currentUserId() !== userId) return EMPTY;
            this.#loading.set(true);
            this.#error.set(false);
            const request = action.kind === 'read'
              ? this.#api.markNotificationAsRead(action.id, lang).pipe(
                  map(updated => this.#items().map(item => item.id === updated.id ? updated : item)),
                )
              : this.#api.getNotifications(lang);
            return request.pipe(
              timeout(12000),
              tap(items => {
                if (this.#iam.currentUserId() === userId) {
                  this.#items.set(items);
                  this.#owner.set(userId);
                }
              }),
              catchError(() => { this.#error.set(true); return EMPTY; }),
              finalize(() => this.#loading.set(false)),
            );
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }

  refresh(): void { this.#actions.next({ kind: 'refresh' }); }

  markAsRead(id: number): void {
    if (this.#loading() || !this.notifications().some(item => item.id === id && !item.read)) return;
    this.#actions.next({ kind: 'read', id });
  }
}
