import { apiClient } from "./client";
import { storage } from "../auth/storage";
import {
  Invitation,
  CreateInvitationInput,
  UpdateInvitationStatusInput,
} from "@/shared/types/invitation";

export async function getEventInvitations(eventId: string): Promise<Invitation[]> {
  const token = storage.getToken();
  return apiClient.get<Invitation[]>(`/events/${eventId}/invites`, token);
}

export async function createInvitation(
  eventId: string,
  data: CreateInvitationInput
): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.post<Invitation>(`/events/${eventId}/invites`, data, token);
}

export async function getInvitation(id: string): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.get<Invitation>(`/invitations/${id}`, token);
}

export async function updateInvitationStatus(
  id: string,
  data: UpdateInvitationStatusInput
): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.put<Invitation>(`/invitations/${id}/status`, data, token);
}

export async function getUserInvitations(): Promise<Invitation[]> {
  const token = storage.getToken();
  return apiClient.get<Invitation[]>('/invitations/user', token);
}
