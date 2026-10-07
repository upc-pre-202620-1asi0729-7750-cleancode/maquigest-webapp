import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { Rental } from '../domain/model/rental.entity';

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

  readonly #selectedRentalRequestSignal = signal<RentalRequest | null>(null);

  readonly selectedRentalRequest = this.#selectedRentalRequestSignal.asReadonly();

  readonly #rentalRequestNotFoundSignal = signal<boolean>(false);

  readonly rentalRequestNotFound = this.#rentalRequestNotFoundSignal.asReadonly();

  readonly #rentalsSignal = signal<Rental[]>([]);

  readonly rentals = this.#rentalsSignal.asReadonly();

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

  readonly activeRentalCount = computed(
    () => this.rentals().filter((rental) => rental.isActive).length,
  );

  readonly #latestCreatedRequestSignal = signal<RentalRequest | null>(null);

  readonly latestCreatedRequest = this.#latestCreatedRequestSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #updatingRequestIdSignal = signal<number | null>(null);

  readonly updatingRequestId = this.#updatingRequestIdSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #subscriptionRequiredSignal = signal<boolean>(false);

  readonly subscriptionRequired = this.#subscriptionRequiredSignal.asReadonly();

  canManageRentals(userId: number): Observable<boolean> {
    return this.#subscriptionAccess.canManageRentals(userId);
  }

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

  loadRentalRequestsForConstructionCompany(constructionUserId: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .getRentalRequests()
      .pipe(
        map((requests) =>
          requests
            .filter((request) => request.constructionUserId === constructionUserId)
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
            });
          }

          const equipmentIds = Array.from(new Set(requests.map((request) => request.equipmentId)));

          return this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds).pipe(
            map((equipmentInformation) => ({
              requests,
              equipmentInformation,
            })),
          );
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ requests, equipmentInformation }) => {
          this.#rentalRequestsSignal.set(requests);

          this.#equipmentInformationSignal.set(
            new Map(equipmentInformation.map((equipment) => [equipment.id, equipment])),
          );

          this.#participantInformationSignal.set(new Map());

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.clearRentalRequests();

          this.#errorSignal.set(this.#formatError(error, 'Failed to load my rental requests'));

          this.#loadingSignal.set(false);
        },
      });
  }

  loadRentalRequestDetail(requestId: number, constructionUserId: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#rentalRequestNotFoundSignal.set(false);

    this.#selectedRentalRequestSignal.set(null);

    this.#rentalsApi
      .getRentalRequest(requestId)
      .pipe(
        switchMap((request) => {
          if (request.constructionUserId !== constructionUserId) {
            return of({
              request: null as RentalRequest | null,

              equipmentInformation: [] as RentalEquipmentInformation[],
            });
          }

          return this.#equipmentInformation
            .getEquipmentInformationByIds([request.equipmentId])
            .pipe(
              map((equipmentInformation) => ({
                request: request as RentalRequest | null,

                equipmentInformation,
              })),
            );
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ request, equipmentInformation }) => {
          if (!request) {
            this.#selectedRentalRequestSignal.set(null);

            this.#equipmentInformationSignal.set(new Map());

            this.#rentalRequestNotFoundSignal.set(true);

            this.#loadingSignal.set(false);

            return;
          }

          this.#selectedRentalRequestSignal.set(request);

          this.#equipmentInformationSignal.set(
            new Map(equipmentInformation.map((equipment) => [equipment.id, equipment])),
          );

          this.#rentalRequestNotFoundSignal.set(false);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#selectedRentalRequestSignal.set(null);

          this.#equipmentInformationSignal.set(new Map());

          const message = this.#formatError(error, 'Failed to load rental request');

          if (message.includes('Resource not found')) {
            this.#rentalRequestNotFoundSignal.set(true);

            this.#errorSignal.set(null);
          } else {
            this.#rentalRequestNotFoundSignal.set(false);

            this.#errorSignal.set(message);
          }

          this.#loadingSignal.set(false);
        },
      });
  }

  loadActiveRentalsForCompany(rentalCompanyUserId: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .getRentals()
      .pipe(
        map((rentals) =>
          rentals
            .filter(
              (rental) => rental.rentalCompanyUserId === rentalCompanyUserId && rental.isActive,
            )
            .sort(
              (firstRental, secondRental) =>
                firstRental.period.endDate.getTime() - secondRental.period.endDate.getTime(),
            ),
        ),

        switchMap((rentals) => {
          if (rentals.length === 0) {
            return of({
              rentals,

              equipmentInformation: [] as RentalEquipmentInformation[],

              participantInformation: [] as RentalParticipantInformation[],
            });
          }

          const equipmentIds = Array.from(new Set(rentals.map((rental) => rental.equipmentId)));

          const participantUserIds = Array.from(
            new Set(rentals.map((rental) => rental.constructionUserId)),
          );

          return forkJoin({
            equipmentInformation:
              this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds),

            participantInformation:
              this.#participantInformation.getParticipantInformationByUserIds(participantUserIds),
          }).pipe(
            map(({ equipmentInformation, participantInformation }) => ({
              rentals,
              equipmentInformation,
              participantInformation,
            })),
          );
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ rentals, equipmentInformation, participantInformation }) => {
          this.#rentalsSignal.set(rentals);

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
          this.clearRentals();

          this.#errorSignal.set(this.#formatError(error, 'Failed to load active rentals'));

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

  approveRentalRequest(requestId: number): void {
    this.#resolveRentalRequest(requestId, RentalRequestStatus.APPROVED);
  }

  rejectRentalRequest(requestId: number): void {
    this.#resolveRentalRequest(requestId, RentalRequestStatus.REJECTED);
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

    this.#updatingRequestIdSignal.set(null);
  }

  clearRentalRequestDetail(): void {
    this.#selectedRentalRequestSignal.set(null);

    this.#rentalRequestNotFoundSignal.set(false);

    this.#equipmentInformationSignal.set(new Map());

    this.#errorSignal.set(null);
  }

  clearRentals(): void {
    this.#rentalsSignal.set([]);

    this.#equipmentInformationSignal.set(new Map());

    this.#participantInformationSignal.set(new Map());
  }

  clearCreationState(): void {
    this.#latestCreatedRequestSignal.set(null);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);
  }

  #resolveRentalRequest(requestId: number, targetStatus: RentalRequestStatus): void {
    const currentRequest = this.rentalRequests().find((request) => request.id === requestId);

    if (!currentRequest) {
      this.#errorSignal.set('Rental request not found');

      return;
    }

    if (!currentRequest.isPending) {
      this.#errorSignal.set('Only pending rental requests can be updated');

      return;
    }

    const updatedRequest = new RentalRequest({
      id: currentRequest.id,

      equipmentId: currentRequest.equipmentId,

      constructionUserId: currentRequest.constructionUserId,

      rentalCompanyUserId: currentRequest.rentalCompanyUserId,

      period: currentRequest.period,

      status: currentRequest.status,

      createdAt: currentRequest.createdAt,
    });

    try {
      if (targetStatus === RentalRequestStatus.APPROVED) {
        updatedRequest.approve();
      } else if (targetStatus === RentalRequestStatus.REJECTED) {
        updatedRequest.reject();
      } else {
        return;
      }
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Failed to update rental request'));

      return;
    }

    this.#updatingRequestIdSignal.set(requestId);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .updateRentalRequest(updatedRequest)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (savedRequest) => {
          this.#rentalRequestsSignal.update((requests) =>
            requests.map((request) => (request.id === savedRequest.id ? savedRequest : request)),
          );

          this.#updatingRequestIdSignal.set(null);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#updatingRequestIdSignal.set(null);

          this.#errorSignal.set(this.#formatError(error, 'Failed to update rental request'));
        },
      });
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
