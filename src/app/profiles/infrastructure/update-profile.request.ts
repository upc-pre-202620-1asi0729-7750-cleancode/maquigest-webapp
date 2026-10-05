export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  contactEmail: string;
  phoneNumber: string;
  companyName: string;

  address: {
    street: string;
    district: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}
