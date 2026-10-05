export class Address {
  #street: string;
  #district: string;
  #city: string;
  #country: string;
  #latitude: number;
  #longitude: number;

  constructor(props: {
    street: string;
    district: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  }) {
    this.#street = props.street;
    this.#district = props.district;
    this.#city = props.city;
    this.#country = props.country;
    this.#latitude = props.latitude;
    this.#longitude = props.longitude;
  }

  get street(): string {
    return this.#street;
  }

  get district(): string {
    return this.#district;
  }

  get city(): string {
    return this.#city;
  }

  get country(): string {
    return this.#country;
  }

  get latitude(): number {
    return this.#latitude;
  }

  get longitude(): number {
    return this.#longitude;
  }
}
