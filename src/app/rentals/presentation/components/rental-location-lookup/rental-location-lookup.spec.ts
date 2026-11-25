import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RentalLocationService } from '../../../application/rental-location.service';
import { RentalLocationLookup } from './rental-location-lookup';
const result = { formattedAddress: 'Lima, Peru', latitude: -12, longitude: -77, placeId: 'place' };
describe('RentalLocationLookup', () => {
  const lookup = vi.fn();
  beforeEach(async () => {
    lookup.mockReset();
    await TestBed.configureTestingModule({ imports: [RentalLocationLookup], providers: [provideTranslateService(), {provide: RentalLocationService, useValue: {lookup}}] }).compileComponents();
  });
  function component() {
    const fixture = TestBed.createComponent(RentalLocationLookup); fixture.componentRef.setInput('rentalId',7); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input')!; input.value = 'Lima'; input.dispatchEvent(new Event('input', {bubbles:true})); fixture.detectChanges();
    return {fixture, root, input};
  }
  it('Enter performs lookup without submitting parent form', () => {
    lookup.mockReturnValue(of(result)); const {fixture, root, input} = component();
    const event = new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}); input.dispatchEvent(event); fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true); expect(lookup).toHaveBeenCalledExactlyOnceWith(7,'Lima');
    expect(root.querySelector('button')?.type).toBe('button'); expect(root.querySelector('a')?.href).toContain('google.com/maps/search/');
  });
  it('provider failure leaves optional lookup recoverable', () => {
    lookup.mockReturnValue(throwError(()=>({status:503,error:{code:'RENTAL_LOCATION_UNAVAILABLE'}}))); const {fixture,root} = component();
    root.querySelector('button')!.click(); fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).not.toBeNull(); expect(root.querySelector('button')!.disabled).toBe(false); expect(root.querySelector('a')).toBeNull();
  });
});
