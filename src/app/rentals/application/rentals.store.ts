import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { Delivery } from '../domain/model/delivery.entity';

import { EquipmentReturn } from '../domain/model/equipment-return.entity';

import { Rental } from '../domain/model/rental.entity';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalRequestStatus } from '../domain/model/rental-request-status.enum';

import { RentalStatus } from '../domain/model/rental-status.enum';

import { RentalsApi } from '../infrastructure/rentals-api';

import {
  EQUIPMENT_INFORMATION_PORT,
  RentalEquipmentInformation,
} from '../infrastructure/equipment-information.port';

import { EQUIPMENT_OPERATION_PORT } from '../infrastructure/equipment-operation.port';

import {
  PARTICIPANT_INFORMATION_PORT,
  RentalParticipantInformation,
} from '../infrastructure/participant-information.port';

import { SUBSCRIPTION_ACCESS_PORT } from '../infrastructure/subscription-access.port';

export type RentalOperationSuccess = 'DELIVERY' | 'RETURN';

@Injectable({
  providedIn: 'root',
})
export class RentalsStore {
  readonly #rentalsApi = inject(RentalsApi);

  readonly #subscriptionAccess = inject(SUBSCRIPTION_ACCESS_PORT);

  readonly #equipmentInformation = inject(EQUIPMENT_INFORMATION_PORT);

  readonly #equipmentOperation = inject(EQUIPMENT_OPERATION_PORT);

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

  readonly confirmedRentalCount = computed(
    () => this.rentals().filter((rental) => rental.isConfirmed).length,
  );

  readonly activeRentalCount = computed(
    () => this.rentals().filter((rental) => rental.isActive).length,
  );

  readonly upcomingReturnCount = computed(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const limit = new Date(today);

    limit.setDate(limit.getDate() + 7);

    return this.rentals().filter(
      (rental) =>
        rental.isActive && rental.period.endDate >= today && rental.period.endDate <= limit,
    ).length;
  });

  readonly overdueRentalCount = computed(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return this.rentals().filter((rental) => rental.isActive && rental.period.endDate < today)
      .length;
  });

  readonly #latestCreatedRequestSignal = signal<RentalRequest | null>(null);

  readonly latestCreatedRequest = this.#latestCreatedRequestSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #updatingRequestIdSignal = signal<number | null>(null);

  readonly updatingRequestId = this.#updatingRequestIdSignal.asReadonly();

  readonly #updatingRentalIdSignal = signal<number | null>(null);

  readonly updatingRentalId = this.#updatingRentalIdSignal.asReadonly();

  readonly #operationSuccessSignal = signal<RentalOperationSuccess | null>(null);

  readonly operationSuccess = this.#operationSuccessSignal.asReadonly();

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

    this.#operationSuccessSignal.set(null);

    this.#rentalsApi
      .getRentals()
      .pipe(
        map((rentals) =>
          rentals
            .filter(
              (rental) =>
                rental.rentalCompanyUserId === rentalCompanyUserId &&
                (rental.isConfirmed || rental.isActive),
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

          this.#errorSignal.set(this.#formatError(error, 'Failed to load rentals'));

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

  registerDelivery(rentalId: number, deliveredAt: Date, notes: string): void {
    const currentRental = this.rentals().find((rental) => rental.id === rentalId);

    if (!currentRental) {
      this.#errorSignal.set('Rental not found');

      return;
    }

    const updatedRental = new Rental({
      id: currentRental.id,

      equipmentId: currentRental.equipmentId,

      constructionUserId: currentRental.constructionUserId,

      rentalCompanyUserId: currentRental.rentalCompanyUserId,

      period: currentRental.period,

      status: currentRental.status,
    });

    try {
      updatedRental.registerDelivery();
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Failed to register delivery'));

      return;
    }

    let delivery: Delivery;

    try {
      delivery = new Delivery({
        id: 0,

        rentalId,

        deliveredAt,

        notes: notes.trim(),
      });
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Failed to register delivery'));

      return;
    }

    this.#updatingRentalIdSignal.set(rentalId);

    this.#operationSuccessSignal.set(null);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .createDelivery(delivery)
      .pipe(
        switchMap(() => this.#rentalsApi.updateRental(updatedRental)),

        switchMap((savedRental) =>
          this.#equipmentOperation
            .markAsRented(savedRental.equipmentId)
            .pipe(map(() => savedRental)),
        ),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (savedRental) => {
          this.#rentalsSignal.update((rentals) =>
            rentals.map((rental) => (rental.id === savedRental.id ? savedRental : rental)),
          );

          this.#updatingRentalIdSignal.set(null);

          this.#operationSuccessSignal.set('DELIVERY');

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#updatingRentalIdSignal.set(null);

          this.#operationSuccessSignal.set(null);

          this.#errorSignal.set(this.#formatError(error, 'Failed to register delivery'));
        },
      });
  }

  registerReturn(
    rentalId: number,
    returnedAt: Date,
    notes: string,
    maintenanceRequired: boolean,
  ): void {
    const currentRental = this.rentals().find((rental) => rental.id === rentalId);

    if (!currentRental) {
      this.#errorSignal.set('Rental not found');

      return;
    }

    const updatedRental = new Rental({
      id: currentRental.id,

      equipmentId: currentRental.equipmentId,

      constructionUserId: currentRental.constructionUserId,

      rentalCompanyUserId: currentRental.rentalCompanyUserId,

      period: currentRental.period,

      status: currentRental.status,
    });

    try {
      updatedRental.registerReturn();
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Failed to register return'));

      return;
    }

    let equipmentReturn: EquipmentReturn;

    try {
      equipmentReturn = new EquipmentReturn({
        id: 0,

        rentalId,

        returnedAt,

        notes: notes.trim(),

        maintenanceRequired,
      });
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Failed to register return'));

      return;
    }

    this.#updatingRentalIdSignal.set(rentalId);

    this.#operationSuccessSignal.set(null);

    this.#errorSignal.set(null);

    this.#rentalsApi
      .createEquipmentReturn(equipmentReturn)
      .pipe(
        switchMap(() => this.#rentalsApi.updateRental(updatedRental)),

        switchMap((savedRental) => {
          const equipmentUpdate = equipmentReturn.requiresMaintenance()
            ? this.#equipmentOperation.markAsMaintenance(savedRental.equipmentId)
            : this.#equipmentOperation.markAsAvailable(savedRental.equipmentId);

          return equipmentUpdate.pipe(map(() => savedRental));
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (savedRental) => {
          this.#rentalsSignal.update((rentals) =>
            rentals.filter((rental) => rental.id !== savedRental.id),
          );

          this.#updatingRentalIdSignal.set(null);

          this.#operationSuccessSignal.set('RETURN');

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#updatingRentalIdSignal.set(null);

          this.#operationSuccessSignal.set(null);

          this.#errorSignal.set(this.#formatError(error, 'Failed to register return'));
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

    this.#updatingRentalIdSignal.set(null);

    this.#operationSuccessSignal.set(null);
  }

  clearCreationState(): void {
    this.#latestCreatedRequestSignal.set(null);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);
  }

  clearOperationFeedback(): void {
    this.#errorSignal.set(null);

    this.#operationSuccessSignal.set(null);
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

    let operation: Observable<RentalRequest>;

    if (targetStatus === RentalRequestStatus.APPROVED) {
      const confirmedRental = new Rental({
        id: 0,

        equipmentId: currentRequest.equipmentId,

        constructionUserId: currentRequest.constructionUserId,

        rentalCompanyUserId: currentRequest.rentalCompanyUserId,

        period: currentRequest.period,

        status: RentalStatus.CONFIRMED,
      });

      operation = this.#equipmentOperation
        .reservePeriod(
          currentRequest.equipmentId,

          currentRequest.period.startDate,

          currentRequest.period.endDate,
        )
        .pipe(
          switchMap(() => this.#rentalsApi.createRental(confirmedRental)),

          switchMap(() => this.#rentalsApi.updateRentalRequest(updatedRequest)),
        );
    } else {
      operation = this.#rentalsApi.updateRentalRequest(updatedRequest);
    }

    operation.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe({
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
