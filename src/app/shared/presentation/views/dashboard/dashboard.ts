import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { catchError, forkJoin, map, of } from 'rxjs';

import { IamStore } from '../../../../iam/application/iam.store';
import { InventoryApi } from '../../../../inventory/infrastructure/inventory-api';
import { Equipment } from '../../../../inventory/domain/model/equipment.entity';
import { EquipmentStatus } from '../../../../inventory/domain/model/equipment-status.enum';
import { RentalsApi } from '../../../../rentals/infrastructure/rentals-api';
import { Rental } from '../../../../rentals/domain/model/rental.entity';
import { RentalRequest } from '../../../../rentals/domain/model/rental-request.entity';
import { RentalRequestStatus } from '../../../../rentals/domain/model/rental-request-status.enum';
import { MaintenanceApi } from '../../../../maintenance/infrastructure/maintenance-api';
import { Maintenance } from '../../../../maintenance/domain/model/maintenance.entity';
import { MaintenanceStatus } from '../../../../maintenance/domain/model/maintenance-status.enum';
import { IncidentApi } from '../../../../maintenance/infrastructure/incident-api';
import { Incident } from '../../../../maintenance/domain/model/incident.entity';
import { IncidentStatus } from '../../../../maintenance/domain/model/incident-status.enum';

type CareItem = {
  id: string;
  equipmentId: number;
  title: string;
  date: Date;
  status: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: Date;
};

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, MatButtonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #inventoryApi = inject(InventoryApi);
  readonly #rentalsApi = inject(RentalsApi);
  readonly #maintenanceApi = inject(MaintenanceApi);
  readonly #incidentApi = inject(IncidentApi);
  protected readonly store = inject(IamStore);

  protected readonly loading = signal(true);
  protected readonly equipment = signal<Equipment[] | null>(null);
  protected readonly rentalRequests = signal<RentalRequest[] | null>(null);
  protected readonly rentals = signal<Rental[] | null>(null);
  protected readonly maintenance = signal<Maintenance[] | null>(null);
  protected readonly incidents = signal<Incident[] | null>(null);
  #loadVersion = 0;

  protected readonly isRentalCompany = computed(() => this.store.currentRole() === 'rental_company');

  protected get companyType(): string {
    return this.isRentalCompany()
      ? 'dashboard.rental-company'
      : 'dashboard.construction-company';
  }

  protected readonly availableCount = computed(() =>
    this.equipment()?.filter((item) => item.status === EquipmentStatus.AVAILABLE).length ?? null,
  );
  protected readonly rentedEquipmentCount = computed(() =>
    this.equipment()?.filter((item) => item.status === EquipmentStatus.RENTED).length ?? null,
  );
  protected readonly maintenanceEquipmentCount = computed(() =>
    this.equipment()?.filter((item) => item.status === EquipmentStatus.MAINTENANCE).length ?? null,
  );
  protected readonly pendingRequestCount = computed(() =>
    this.rentalRequests()?.filter((request) => request.status === RentalRequestStatus.PENDING).length ?? null,
  );
  protected readonly activeRentalCount = computed(() =>
    this.rentals()?.filter((rental) => rental.isActive).length ?? null,
  );
  protected readonly upcomingReservations = computed(() =>
    this.rentals()
      ?.filter((rental) => rental.isConfirmed && this.#day(rental.period.startDate) >= this.#today())
      .sort((a, b) => a.period.startDate.getTime() - b.period.startDate.getTime()) ?? [],
  );
  protected readonly upcomingReservationCount = computed(() =>
    this.rentals() === null ? null : this.upcomingReservations().length,
  );
  protected readonly activeRentals = computed(() =>
    this.rentals()
      ?.filter((rental) => rental.isActive)
      .sort((a, b) => a.period.endDate.getTime() - b.period.endDate.getTime()) ?? [],
  );
  protected readonly recentRequests = computed(() =>
    this.rentalRequests()?.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) ?? [],
  );
  protected readonly careItems = computed<CareItem[]>(() => {
    const maintenance = this.maintenance();
    const incidents = this.incidents();
    const items: CareItem[] = [];
    for (const item of maintenance ?? []) {
      if (item.status === MaintenanceStatus.COMPLETED) continue;
      items.push({
        id: `m-${item.id}`,
        equipmentId: item.equipmentId,
        title: item.type,
        date: item.performedAt,
        status: item.status === MaintenanceStatus.IN_PROGRESS
          ? 'dashboard.in-progress' : 'dashboard.scheduled',
      });
    }
    for (const incident of incidents ?? []) {
      if (incident.status !== IncidentStatus.OPEN) continue;
      items.push({
        id: `i-${incident.id}`,
        equipmentId: incident.equipmentId,
        title: incident.description,
        date: incident.reportedAt,
        status: 'dashboard.open-incident',
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  });
  protected readonly recentActivities = computed<ActivityItem[]>(() => {
    const requests = this.rentalRequests() ?? [];
    const incidents = this.incidents() ?? [];
    const maintenance = this.maintenance() ?? [];
    const items: ActivityItem[] = [
      ...requests.map((request) => ({
        id: `r-${request.id}`,
        title: `#${request.id}`,
        description: this.equipmentName(request.equipmentId),
        date: request.createdAt,
      })),
      ...incidents.map((incident) => ({
        id: `i-${incident.id}`,
        title: this.equipmentName(incident.equipmentId),
        description: incident.description,
        date: incident.reportedAt,
      })),
      ...maintenance.filter((item) => item.status === MaintenanceStatus.COMPLETED).map((item) => ({
        id: `m-${item.id}`,
        title: this.equipmentName(item.equipmentId),
        description: item.type,
        date: item.performedAt,
      })),
    ];
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0,3);
  });

  constructor() {
    effect(() => {
      const userId = this.store.currentUserId();
      const role = this.store.currentRole();
      if (userId === null || (role !== 'rental_company' && role !== 'construction_company')) {
        ++this.#loadVersion;
        this.#reset();
        return;
      }
      this.#loadReadOnlyOverview(userId, role);
    });
  }

  #reset(): void {
    this.loading.set(false);
    this.equipment.set(null);
    this.rentalRequests.set(null);
    this.rentals.set(null);
    this.maintenance.set(null);
    this.incidents.set(null);
  }

  #loadReadOnlyOverview(userId: number, role: string): void {
    const version = ++this.#loadVersion;
    const isRental = role === 'rental_company';
    this.loading.set(true);
    this.equipment.set(null);
    this.rentalRequests.set(null);
    this.rentals.set(null);
    this.maintenance.set(null);
    this.incidents.set(null);

    // Read-only requests via already existing API services. This dashboard never calls POST/PATCH/DELETE.
    forkJoin({
      equipment: (isRental
        ? this.#inventoryApi.getEquipmentByUserId(userId)
        : this.#inventoryApi.getEquipment()).pipe(catchError(() => of(null))),
      requests: this.#rentalsApi.getRentalRequests().pipe(
        map((requests) => requests.filter((request) => isRental
          ? request.rentalCompanyUserId === userId
          : request.constructionUserId === userId)),
        catchError(() => of(null)),
      ),
      rentals: this.#rentalsApi.getRentals().pipe(
        map((rentals) => rentals.filter((rental) => isRental
          ? rental.rentalCompanyUserId === userId
          : rental.constructionUserId === userId)),
        catchError(() => of(null)),
      ),
      maintenance: isRental
        ? this.#maintenanceApi.getMaintenances().pipe(catchError(() => of(null)))
        : of([] as Maintenance[]),
      incidents: isRental
        ? this.#incidentApi.getIncidents().pipe(catchError(() => of(null)))
        : of([] as Incident[]),
    }).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((data) => {
      if (version !== this.#loadVersion) return;
      const ownedEquipmentIds = new Set((data.equipment ?? [])
        .filter((item) => item.userId === userId).map((item) => item.id));
      this.equipment.set(data.equipment);
      this.rentalRequests.set(data.requests);
      this.rentals.set(data.rentals);
      const maintenance = data.maintenance === null ? null : data.maintenance
        .filter((item) => !isRental || ownedEquipmentIds.has(item.equipmentId));
      const incidents = data.incidents === null ? null : data.incidents
        .filter((item) => !isRental || ownedEquipmentIds.has(item.equipmentId));
      this.maintenance.set(isRental && data.equipment === null ? null : maintenance);
      this.incidents.set(isRental && data.equipment === null ? null : incidents);
      this.loading.set(false);
    });
  }

  protected equipmentName(equipmentId: number): string {
    const item = this.equipment()?.find((equipment) => equipment.id === equipmentId);
    return item ? `${item.name} · ${item.code}` : `#${equipmentId}`;
  }

  protected requestStatusKey(status: RentalRequestStatus): string {
    return `rentals.my-requests.status.${status.toLowerCase()}`;
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  #day(date: Date): string {
    return date.toISOString().slice(0,10);
  }

  #today(): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
  }

  protected performSignOut(): void {
    this.store.signOut(this.#router);
  }
}
