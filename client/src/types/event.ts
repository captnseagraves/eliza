export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: Location;
  imageUrl?: string;
  creatorId: string;
  createdAt: string;
  status: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  dateTime: string;
  location: Location;
  imageUrl?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: string;
}
