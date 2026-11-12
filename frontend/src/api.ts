import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  RegisterRequestDTO,
  LoginRequestDTO,
  AuthResponseDTO,
  IncidentResponseDTO,
  IncidentCommentDTO,
  IncidentStatus,
  CurrentWeatherDTO,
  AlertsResponse,
  UserDTO,
  AdminStatsDTO,
  UpdateProfileRequestDTO,
  WeatherAlertDTO,
  CreateAlertRequestDTO,
  CreateMissingPersonReportDTO,
  ApproveMissingPersonRequestDTO,
  MissingPersonReportDTO,
  MissingPersonCommentDTO,
  CreateIncidentRequestDTO,
} from './types';

export const API_BASE = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('zelo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const headers = error.config?.headers as
      | { Authorization?: string; get?: (name: string) => unknown }
      | undefined;
    const sentToken = Boolean(headers?.Authorization ?? headers?.get?.('Authorization'));
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    // Só encerra a sessão quando o 401 veio de uma requisição que ENVIOU token.
    // Um 401 em /auth/login (senha errada) precisa chegar ao formulário em vez
    // de recarregar a página e perder a mensagem de erro.
    if (status === 401 && sentToken && !isAuthEndpoint) {
      localStorage.removeItem('zelo_token');
      localStorage.removeItem('zelo_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authRegister = (data: RegisterRequestDTO) =>
  api.post<AuthResponseDTO>('/auth/register', data);

export const authLogin = (data: LoginRequestDTO) =>
  api.post<AuthResponseDTO>('/auth/login', data);

/** Atualiza o próprio perfil (nome, cidade e senha opcional). */
export const updateProfile = (data: UpdateProfileRequestDTO) =>
  api.put<UserDTO>('/users/me', data);

export const getIncidentsNearby = (lat: number, lng: number, radiusMeters = 10000) =>
  api.get<IncidentResponseDTO[]>('/public/incidents', { params: { lat, lng, radiusMeters } });

export const getIncidentById = (id: string) =>
  api.get<IncidentResponseDTO>(`/public/incidents/${id}`);

export const createIncident = (data: CreateIncidentRequestDTO, images: FileList | File[]) => {
  const form = new FormData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  form.append('data', blob);
  const files = Array.isArray(images) ? images : Array.from(images);
  files.forEach((file) => form.append('images', file));
  // NÃO definir Content-Type manualmente: o navegador precisa gerar o boundary do multipart
  return api.post<IncidentResponseDTO>('/incidents', form, {
    headers: { 'Content-Type': undefined },
  });
};

export const addComment = (id: string, content: string) =>
  api.post<IncidentCommentDTO>(`/incidents/${id}/comments`, { content });

export const upvoteIncident = (id: string) =>
  api.post<IncidentResponseDTO>(`/incidents/${id}/upvote`);

export const getAlerts = (lat: number, lng: number) =>
  api.get<AlertsResponse>('/public/alerts', { params: { lat, lng } });

// ---------------------------------------------------------- Status + histórico
/** Transição de status + nota na linha do tempo (RBAC: fiscal/gestor/root). */
export const updateIncidentStatus = (id: string, status: IncidentStatus, note?: string) =>
  api.put<IncidentResponseDTO>(`/incidents/${id}/status`, { status, note });

/** Apaga um ponto crítico (autor, OU gestor/fiscal da cidade, OU root). */
export const deleteIncident = (id: string) => api.delete<void>(`/incidents/${id}`);

// ---------------------------------------------------------- Painel administrativo
export const adminListUsers = (search?: string, city?: string) =>
  api.get<UserDTO[]>('/admin/users', { params: { search, city } });

export const adminSetUserRole = (id: string, role: string, city?: string) =>
  api.put<UserDTO>(`/admin/users/${id}/role`, { role, city });

export const adminListIncidents = (city?: string) =>
  api.get<IncidentResponseDTO[]>('/admin/incidents', { params: { city } });

/** Apaga um ponto crítico pelo painel (root qualquer; gestor só da sua cidade). */
export const adminDeleteIncident = (id: string) =>
  api.delete<void>(`/admin/incidents/${id}`);

export const adminStats = () => api.get<AdminStatsDTO>('/admin/stats');

/** Quantos pontos críticos o usuário registrou (aviso do modal de exclusão, só root). */
export const adminUserIncidentCount = (id: string) =>
  api.get<{ count: number }>(`/admin/users/${id}/incident-count`);

/**
 * Apaga um usuário (somente ROOT). `deleteIncidents = true` remove também os
 * pontos críticos dele; caso contrário os pontos ficam com autoria anonimizada.
 */
export const adminDeleteUser = (id: string, deleteIncidents: boolean) =>
  api.delete<void>(`/admin/users/${id}`, { data: { deleteIncidents } });

// ---------------------------------------------------------- Alertas oficiais
export const adminListAlerts = () => api.get<WeatherAlertDTO[]>('/admin/alerts');

export const adminCreateAlert = (data: CreateAlertRequestDTO) =>
  api.post<WeatherAlertDTO>('/admin/alerts', data);

export const adminDeleteAlert = (id: string) =>
  api.delete<void>(`/admin/alerts/${id}`);

// ---------------------------------------------------------- Pessoa desaparecida
export const getMissingPersonAlerts = (lat: number, lng: number) =>
  api.get<MissingPersonReportDTO[]>('/public/missing-alerts', { params: { lat, lng } });

export const getMissingPersonAlert = (id: string) =>
  api.get<MissingPersonReportDTO>(`/public/missing-alerts/${id}`);

export const createMissingPersonAlert = (
  data: CreateMissingPersonReportDTO,
  photo: File,
) => {
  const form = new FormData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  form.append('data', blob);
  form.append('photo', photo);
  return api.post<MissingPersonReportDTO>('/missing-alerts', form, {
    headers: { 'Content-Type': undefined },
  });
};

export const addMissingPersonComment = (id: string, content: string, image?: File | null) => {
  const form = new FormData();
  const blob = new Blob([JSON.stringify({ content })], { type: 'application/json' });
  form.append('data', blob);
  if (image) form.append('image', image);
  return api.post<MissingPersonCommentDTO>(`/missing-alerts/${id}/comments`, form, {
    headers: { 'Content-Type': undefined },
  });
};

export const moderationListMissingPersonAlerts = () =>
  api.get<MissingPersonReportDTO[]>('/moderation/missing-alerts');

export const moderationApproveMissingPersonAlert = (
  id: string,
  data: ApproveMissingPersonRequestDTO,
) => api.post<MissingPersonReportDTO>(`/moderation/missing-alerts/${id}/approve`, data);

export const moderationRejectMissingPersonAlert = (id: string, reason?: string) =>
  api.post<MissingPersonReportDTO>(`/moderation/missing-alerts/${id}/reject`, { reason });

export const moderationDeleteMissingPersonAlert = (id: string) =>
  api.delete<void>(`/moderation/missing-alerts/${id}`);

export type { CurrentWeatherDTO };
