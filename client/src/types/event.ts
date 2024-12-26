export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  imageUrl?: string;
  creatorId: string;
  createdAt: string;
  status: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  dateTime: string;
  location: string;
  imageUrl?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: string;
}
