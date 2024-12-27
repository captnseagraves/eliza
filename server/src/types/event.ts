export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface CreateEventInput {
  title: string;
  description: string;
  dateTime: Date;
  location: Location;
  imageUrl?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  dateTime?: Date;
  location?: Location;
  imageUrl?: string;
  status?: string;
}
