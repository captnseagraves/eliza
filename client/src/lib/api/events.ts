import { CreateEventInput, Event, UpdateEventInput } from "@/shared/types/event";
import { apiClient } from "./client";
import { storage } from "../auth/storage";

const API_URL = "/events";

export async function getEvents(): Promise<Event[]> {
  const token = storage.getToken();
  return apiClient.get<Event[]>(API_URL, token);
}

export async function getEvent(id: string): Promise<Event> {
  const token = storage.getToken();
  return apiClient.get<Event>(`${API_URL}/${id}`, token);
}

export async function createEvent(data: CreateEventInput): Promise<Event> {
  const token = storage.getToken();
  return apiClient.post<Event>(API_URL, data, token);
}

export async function updateEvent(id: string, data: UpdateEventInput): Promise<Event> {
  const token = storage.getToken();
  return apiClient.put<Event>(`${API_URL}/${id}`, data, token);
}

export async function deleteEvent(id: string): Promise<void> {
  const token = storage.getToken();
  return apiClient.delete<void>(`${API_URL}/${id}`, token);
}
