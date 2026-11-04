import { EquipmentStatus } from '../domain/model/equipment-status.enum';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object';
import { EquipmentAssembler } from './equipment-assembler';

const resource = {
  id: 3,
  userId: 1,
  code: 'OPS-939A177A59A7',
  name: 'Excavadora de prueba',
  description: 'Equipo de prueba',
  categoryId: 1,
  location: 'Lima',
  dailyRate: 850,
  weeklyRate: 5100,
  status: EquipmentStatus.AVAILABLE,
  availabilityBlocks: [
    { id: 1, startDate: '2026-11-16T00:00:00-05:00', endDate: '2026-11-18T23:59:59.999-05:00' },
    { id: 2, startDate: '2026-11-19T00:00:00-05:00', endDate: '2026-11-20T23:59:59.999-05:00' },
  ],
};

describe('EquipmentAssembler - inclusive calendar-day boundaries', () => {
  const equipment = new EquipmentAssembler().toEntityFromResource(resource);

  const dayPeriod = (day: number) => new DateRange({
    startDate: new Date(2026, 10, day, 0, 0, 0, 0),
    endDate: new Date(2026, 10, day, 23, 59, 59, 999),
  });

  it('marks the final reserved day (November 20) unavailable', () => {
    expect(equipment.isAvailableFor(dayPeriod(20))).toBe(false);
  });

  it('marks the first free day (November 21) available', () => {
    expect(equipment.isAvailableFor(dayPeriod(21))).toBe(true);
  });
});
