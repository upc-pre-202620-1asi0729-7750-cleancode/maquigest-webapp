import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class EquipmentCategory implements BaseEntity {
  #id: number;
  #name: string;

  constructor(props: { id: number; name: string }) {
    this.#id = props.id;
    this.#name = props.name;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    this.#name = value;
  }
}
