import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { RentalLocationService } from '../../../application/rental-location.service';
import { RentalLocation } from '../../../domain/model/rental-location.entity';
@Component({
  selector: 'app-rental-location-lookup',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './rental-location-lookup.html',
  styleUrl: './rental-location-lookup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalLocationLookup {
  readonly rentalId = input.required<number>();
  readonly #service = inject(RentalLocationService);
  readonly #destroy = inject(DestroyRef);
  protected readonly address = signal('');
  protected readonly location = signal<RentalLocation | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected updateAddress(value: string): void {
    this.address.set(value); this.location.set(null); this.error.set('');
  }
  protected lookup(): void {
    const address = this.address().trim();
    if (this.busy() || address.length < 3 || address.length > 250) return;
    this.busy.set(true); this.error.set(''); this.location.set(null);
    this.#service.lookup(this.rentalId(), address).pipe(takeUntilDestroyed(this.#destroy)).subscribe({
      next: result => { this.location.set(result); this.busy.set(false); },
      error: err => {
        this.error.set(err?.error?.code === 'RENTAL_LOCATION_NO_RESULTS' ? 'rentals.location.no-results' : 'rentals.location.unavailable');
        this.busy.set(false);
      },
    });
  }
  protected mapsUrl(location: RentalLocation): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}&query_place_id=${encodeURIComponent(location.placeId)}`;
  }
}
