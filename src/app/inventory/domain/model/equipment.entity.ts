import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { RentalRate } from '../value-object/rental-rate.value-object';
import { EquipmentCategory } from './equipment-category.entity';
import { EquipmentStatus } from './equipment-status.enum';

export class Equipment implements BaseEntity {
  #id: number;
  #userId: number;
  #code: string;
  #name: string;
  #description: string;
  #categoryId: number;
  #category: EquipmentCategory | null;
  #location: string;
  #rentalRate: RentalRate;
  #status: EquipmentStatus;

  constructor(props: {
    id: number;
    userId: number;
    code: string;
    name: string;
    description: string;
    categoryId: number;
    category?: EquipmentCategory | null;
    location: string;
    rentalRate: RentalRate;
    status?: EquipmentStatus;
  }) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#code = props.code;
    this.#name = props.name;
    this.#description = props.description;
    this.#categoryId = props.categoryId;
    this.#category = props.category ?? null;
    this.#location = props.location;
    this.#rentalRate = props.rentalRate;
    this.#status = props.status ?? EquipmentStatus.AVAILABLE;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get userId(): number {
    return this.#userId;
  }

  set userId(value: number) {
    this.#userId = value;
  }

  get code(): string {
    return this.#code;
  }

  set code(value: string) {
    this.#code = value;
  }

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    this.#name = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get categoryId(): number {
    return this.#categoryId;
  }

  set categoryId(value: number) {
    this.#categoryId = value;
  }

  get category(): EquipmentCategory | null {
    return this.#category;
  }

  set category(value: EquipmentCategory | null) {
    this.#category = value;
  }

  get location(): string {
    return this.#location;
  }

  set location(value: string) {
    this.#location = value;
  }

  get rentalRate(): RentalRate {
    return this.#rentalRate;
  }

  set rentalRate(value: RentalRate) {
    this.#rentalRate = value;
  }

  get status(): EquipmentStatus {
    return this.#status;
  }

  set status(value: EquipmentStatus) {
    this.#status = value;
  }
}
