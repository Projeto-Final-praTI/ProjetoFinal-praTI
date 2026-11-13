/** Papéis RBAC. USER=cidadão, FISCAL/GESTOR=municipal (vinculados a uma cidade),
 * ROOT=superusuário. */
export type Role = 'USER' | 'FISCAL' | 'GESTOR' | 'ROOT';
export type IncidentCategory =
  | 'BURACO'
  | 'PONTE_QUEBRADA'
  | 'ALAGAMENTO'
  | 'QUEDA_ARVORE'
  | 'DESLIZAMENTO'
  | 'OUTROS';
/** Status operacionais de um ponto crítico. */
export type IncidentStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO';
export type AlertSeverity = 'AMARELO' | 'LARANJA' | 'VERMELHO';
export type AlertScope = 'GLOBAL' | 'LOCAL';
export type MissingPersonKind = 'DESAPARECIMENTO' | 'SEQUESTRO';
export type MissingPersonStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO';

export interface UserDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  /** Cidade de atuação (RBAC). Null/ausente para cidadão sem cidade. */
  city?: string | null;
  createdAt: string;
}

export interface IncidentCommentDTO {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

/** Entrada da linha do tempo de status/notas de um ponto crítico. */
export interface IncidentStatusHistoryDTO {
  id: string;
  previousStatus: IncidentStatus | null;
  newStatus: IncidentStatus;
  note?: string | null;
  authorName?: string | null;
  createdAt: string;
}

export interface IncidentResponseDTO {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  lat: number;
  lng: number;
  author: UserDTO;
  upvotesCount: number;
  createdAt: string;
  /** Cidade do ponto (resolvida por geocodificação reversa; usada no filtro de gestão). */
  city?: string | null;
  images: string[];
  comments: IncidentCommentDTO[];
  /** Linha do tempo (mais recente primeiro). */
  statusHistory?: IncidentStatusHistoryDTO[];
}

/** Corpo (parte `data`) de POST /api/incidents — imagens vão em `images`. */
export interface CreateIncidentRequestDTO {
  title: string;
  description: string;
  category: IncidentCategory;
  /** Local exato do problema (clique no mapa). */
  incidentLat: number;
  incidentLng: number;
  /** Local do denunciante; o backend usa para validar o raio de 500 m. */
  userLat: number;
  userLng: number;
}

export interface WeatherAlertDTO {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  /** Abrangência de alertas oficiais; nulo nos alertas automáticos do clima. */
  scope?: AlertScope | null;
  /** Cidade de alertas locais oficiais. */
  city?: string | null;
  /** Quem disparou o alerta oficial (nulo nos automáticos). */
  createdByName?: string | null;
  /** Verdadeiro para alertas oficiais (gestor/root). */
  custom?: boolean;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number | null;
  expiresAt: string;
  createdAt: string;
}

/** Corpo de POST /api/admin/alerts */
export interface CreateAlertRequestDTO {
  title: string;
  description?: string;
  severity: AlertSeverity;
  scope?: AlertScope;
  city?: string;
  radiusMeters?: number;
  durationMinutes: number;
}

export interface MissingPersonCommentDTO {
  id: string;
  authorName: string;
  content: string;
  /** Imagem opcional anexada ao comentário. */
  imageUrl?: string | null;
  /** Verdadeiro quando quem comentou é o denunciante original. */
  reporter?: boolean;
  createdAt: string;
}

export interface MissingPersonReportDTO {
  id: string;
  personName: string;
  kind: MissingPersonKind;
  title: string;
  description: string;
  lastSeenInfo?: string | null;
  /** Só vem preenchido para moderadores/autores. */
  contact?: string | null;
  city: string;
  photoUrl: string;
  status: MissingPersonStatus;
  scope?: AlertScope | null;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number | null;
  /** Raio final desejado pelo denunciante (padrão da aprovação). */
  requestedRadiusMeters?: number | null;
  /** Pré-alerta imediato de 1 km / 10 min, antes da moderação. */
  preAlert?: boolean;
  preAlertExpiresAt?: string | null;
  expiresAt?: string | null;
  submittedByName?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  expired: boolean;
  commentCount: number;
  comments: MissingPersonCommentDTO[];
}

/** Corpo (parte data) de POST /api/missing-alerts */
export interface CreateMissingPersonReportDTO {
  personName: string;
  kind: MissingPersonKind;
  description: string;
  lastSeenInfo?: string;
  contact?: string;
  city: string;
  /** Localização do denunciante: dispara o pré-alerta de 1 km / 10 min. */
  lat?: number;
  lng?: number;
}

/** Corpo de POST /api/moderation/missing-alerts/{id}/approve */
export interface ApproveMissingPersonRequestDTO {
  scope?: AlertScope;
  city?: string;
  radiusMeters?: number;
  durationMinutes: number;
}

export interface CurrentWeatherDTO {
  temperature?: number;
  precipitation?: number;
  weatherCode?: number;
  windSpeed?: number;
}

export interface AlertsResponse {
  alerts: WeatherAlertDTO[];
  currentWeather: CurrentWeatherDTO | null;
}

export interface RegisterRequestDTO {
  fullName: string;
  email: string;
  cpf: string;
  password: string;
  /** Cidade/município (opcional) — área de atuação no RBAC. */
  city?: string;
}

/** Visão global do painel root (GET /api/admin/stats). */
export interface AdminStatsDTO {
  totalUsers: number;
  totalIncidents: number;
  usersByRole: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  cities: string[];
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

/** Corpo de PUT /api/users/me — atualização do próprio perfil. */
export interface UpdateProfileRequestDTO {
  fullName: string;
  /** Cidade de atuação (opcional; vazio limpa). */
  city?: string;
  /** Obrigatória apenas se newPassword for informada. */
  currentPassword?: string;
  /** Nova senha (mín. 6 caracteres). Opcional. */
  newPassword?: string;
}

export interface AuthResponseDTO {
  token: string;
  user: UserDTO;
}

export interface MapPoint {
  lat: number;
  lng: number;
}
