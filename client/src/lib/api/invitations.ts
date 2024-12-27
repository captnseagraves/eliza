import { apiClient } from "./client";
import { storage } from "../auth/storage";
import {
  Invitation,
  CreateInvitationInput,
  UpdateInvitationStatusInput,
} from "@/shared/types/invitation";

export async function getEventInvitations(eventId: string): Promise<Invitation[]> {
  const token = storage.getToken();
  return apiClient.get<Invitation[]>(`/invitations/events/${eventId}/invites`, token);
}

export async function createInvitation(
  eventId: string,
  data: CreateInvitationInput
): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.post<Invitation>(`/invitations/events/${eventId}/invites`, data, token);
}

export async function getInvitation(id: string): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.get<Invitation>(`/invitations/invites/${id}`, token);
}

export async function updateInvitationStatus(
  id: string,
  data: UpdateInvitationStatusInput
): Promise<Invitation> {
  const token = storage.getToken();
  return apiClient.put<Invitation>(`/invitations/invites/${id}/status`, data, token);
}

export async function getUserInvitations(): Promise<Invitation[]> {
  const token = storage.getToken();
  return apiClient.get<Invitation[]>('/invitations/user/invites', token);
}
