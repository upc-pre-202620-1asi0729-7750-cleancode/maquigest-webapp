import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, forkJoin, map, of, switchMap } from 'rxjs';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalRequestStatus } from '../domain/model/rental-request-status.enum';

import { RentalsApi } from '../infrastructure/rentals-api';

import {
  EQUIPMENT_INFORMATION_PORT,
  RentalEquipmentInformation,
} from '../infrastructure/equipment-information.port';

import {
  PARTICIPANT_INFORMATION_PORT,
  RentalParticipantInformation,
} from '../infrastructure/participant-information.port';

import { SUBSCRIPTION_ACCESS_PORT } from '../infrastructure/subscription-access.port';

@Injectable({
  providedIn: 'root',
})
export class RentalsStore {
  readonly #rentalsApi = inject(RentalsApi);

  readonly #subscriptionAccess = inject(SUBSCRIPTION_ACCESS_PORT);

  readonly #equipmentInformation = inject(EQUIPMENT_INFORMATION_PORT);

  readonly #participantInformation = inject(PARTICIPANT_INFORMATION_PORT);

  readonly #destroyRef = inject(DestroyRef);

  readonly #rentalRequestsSignal = signal<RentalRequest[]>([]);

  readonly rentalRequests = this.#rentalRequestsSignal.asReadonly();

  readonly #equipmentInformationSignal = signal<ReadonlyMap<number, RentalEquipmentInformation>>(
    new Map(),
  );

  readonly #participantInformationSignal = signal<
    ReadonlyMap<number, RentalParticipantInformation>
  >(new Map());

  readonly pendingRequestCount = computed(
    () =>
      this.rentalRequests().filter((request) => request.status === RentalRequestStatus.PENDING)
        .length,
  );

  readonly approvedRequestCount = computed(
    () =>
      this.rentalRequests().filter((request) => request.status === RentalRequestStatus.APPROVED)
        .length,
  );

  readonly rejectedRequestCount = computed(
    () =>
      this.rentalRequests().filter((request) => request.status === RentalRequestStatus.REJECTED)
        .length,
  );

  readonly #latestCreatedRequestSignal = signal<RentalRequest | null>(null);

  readonly latestCreatedRequest = this.#latestCreatedRequestSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #subscriptionRequiredSignal = signal<boolean>(false);

  readonly subscriptionRequired = this.#subscriptionRequiredSignal.asReadonly();

  loadRentalRequestsForCompany(rentalCompanyUserId: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .getRentalRequests()
      .pipe(
        map((requests) =>
          requests
            .filter((request) => request.rentalCompanyUserId === rentalCompanyUserId)
            .sort(
              (firstRequest, secondRequest) =>
                secondRequest.createdAt.getTime() - firstRequest.createdAt.getTime(),
            ),
        ),

        switchMap((requests) => {
          if (requests.length === 0) {
            return of({
              requests,

              equipmentInformation: [] as RentalEquipmentInformation[],

              participantInformation: [] as RentalParticipantInformation[],
            });
          }

          const equipmentIds = Array.from(new Set(requests.map((request) => request.equipmentId)));

          const participantUserIds = Array.from(
            new Set(requests.map((request) => request.constructionUserId)),
          );

          return forkJoin({
            equipmentInformation:
              this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds),

            participantInformation:
              this.#participantInformation.getParticipantInformationByUserIds(participantUserIds),
          }).pipe(
            map(({ equipmentInformation, participantInformation }) => ({
              requests,
              equipmentInformation,
              participantInformation,
            })),
          );
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ requests, equipmentInformation, participantInformation }) => {
          this.#rentalRequestsSignal.set(requests);

          this.#equipmentInformationSignal.set(
            new Map(equipmentInformation.map((equipment) => [equipment.id, equipment])),
          );

          this.#participantInformationSignal.set(
            new Map(participantInformation.map((participant) => [participant.userId, participant])),
          );

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.clearRentalRequests();

          this.#errorSignal.set(this.#formatError(error, 'Failed to load rental requests'));

          this.#loadingSignal.set(false);
        },
      });
  }

  getEquipmentInformation(equipmentId: number): RentalEquipmentInformation | undefined {
    return this.#equipmentInformationSignal().get(equipmentId);
  }

  getParticipantInformation(userId: number): RentalParticipantInformation | undefined {
    return this.#participantInformationSignal().get(userId);
  }

  createRentalRequest(rentalRequest: RentalRequest): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);

    this.#latestCreatedRequestSignal.set(null);

    this.#subscriptionAccess
      .hasActiveSubscription(rentalRequest.rentalCompanyUserId)
      .pipe(
        switchMap((hasActiveSubscription) => {
          if (!hasActiveSubscription) {
            this.#subscriptionRequiredSignal.set(true);

            this.#loadingSignal.set(false);

            return EMPTY;
          }

          return this.#rentalsApi.createRentalRequest(rentalRequest);
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (createdRequest) => {
          this.#latestCreatedRequestSignal.set(createdRequest);

          this.#subscriptionRequiredSignal.set(false);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#errorSignal.set(this.#formatError(error, 'Failed to create rental request'));

          this.#subscriptionRequiredSignal.set(false);

          this.#loadingSignal.set(false);
        },
      });
  }

  clearRentalRequests(): void {
    this.#rentalRequestsSignal.set([]);

    this.#equipmentInformationSignal.set(new Map());

    this.#participantInformationSignal.set(new Map());
  }

  clearCreationState(): void {
    this.#latestCreatedRequestSignal.set(null);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
