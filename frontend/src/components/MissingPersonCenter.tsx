import React from 'react';
import {
  X, Siren, UserX, MapPin, Clock, ShieldCheck, Send, Loader2, LogIn,
  CheckCircle2, XCircle, Trash2, ImagePlus, MessageCircle, RefreshCw,
  LocateFixed, Radio,
} from 'lucide-react';
import type {
  AlertScope,
  MapPoint,
  MissingPersonReportDTO,
  MissingPersonKind,
  UserDTO,
} from '@/types';
import {
  createMissingPersonAlert,
  moderationApproveMissingPersonAlert,
  moderationDeleteMissingPersonAlert,
  moderationListMissingPersonAlerts,
  moderationRejectMissingPersonAlert,
} from '@/api';
import { useAllMunicipios } from '@/hooks/useAllMunicipios';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsCompact } from '@/hooks/useIsCompact';
import Scrim from '@/components/Scrim';
import CityPicker from '@/components/CityPicker';

type Tab = 'active' | 'report' | 'moderation';

const KIND_LABEL: Record<MissingPersonKind, string> = {
  DESAPARECIMENTO: 'Pessoa desaparecida',
  SEQUESTRO: 'Sequestro',
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
};

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  APROVADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RECUSADO: 'bg-slate-100 text-slate-500 border-slate-200',
};

/** Contador ao vivo do pré-alerta de 1 km / 10 min. */
function PreAlertCountdown({
  expiresAt,
  className = '',
}: {
  expiresAt?: string | null;
  className?: string;
}) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!expiresAt) return null;
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${className}`}
    >
      <Radio className="w-3 h-3 animate-pulse" />
      PRÉ-ALERTA 1 km · {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

const DURATION_OPTIONS = [
  { label: '6 horas', value: 360 },
  { label: '12 horas', value: 720 },
  { label: '24 horas', value: 1440 },
  { label: '3 dias', value: 4320 },
  { label: '7 dias', value: 10080 },
];

interface MissingPersonCenterProps {
  open: boolean;
  onClose: () => void;
  user: UserDTO | null;
  activeAlerts: MissingPersonReportDTO[];
  onOpenAuth: () => void;
  onOpenAlert: (alert: MissingPersonReportDTO) => void;
  onRefresh: () => void;
  /** Localização atual do usuário (App), usada como padrão na denúncia. */
  userLocation?: MapPoint | null;
  initialTab?: Tab;
  /** Mantém a URL sincronizada quando a aba muda (`/desaparecidos/...`). */
  onTabChange?: (tab: Tab) => void;
}

/**
 * Central de pessoa desaparecida/sequestro.
 *
 * Abas:
 * - Ativos: alertas aprovados visíveis para a população.
 * - Denunciar: cidadão envia foto + dados (entra na fila de moderação).
 * - Moderação: fiscal/gestor/root aprova, recusa ou remove denúncias.
 */
export default function MissingPersonCenter({
  open,
  onClose,
  user,
  activeAlerts,
  onOpenAuth,
  onOpenAlert,
  onRefresh,
  userLocation = null,
  initialTab = 'active',
  onTabChange,
}: MissingPersonCenterProps) {
  const compact = useIsCompact();
  useBodyScrollLock(open);
  const { cities } = useAllMunicipios();

  const canModerate =
    !!user && (user.role === 'FISCAL' || user.role === 'GESTOR' || user.role === 'ROOT');

  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // ---------------------------------------------------------- Denúncia
  const [personName, setPersonName] = React.useState('');
  const [kind, setKind] = React.useState<MissingPersonKind>('DESAPARECIMENTO');
  const [description, setDescription] = React.useState('');
  const [lastSeenInfo, setLastSeenInfo] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [city, setCity] = React.useState(user?.city ?? '');
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  // Localização do denunciante + raio final desejado. A localização dispara o
  // pré-alerta imediato de 1 km / 10 min antes da moderação.
  const [reportLoc, setReportLoc] = React.useState<MapPoint | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError(null);
      setSuccess(null);
    }
  }, [open, initialTab]);

  const requestLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada neste navegador.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(
          'Não foi possível obter sua localização. Verifique a permissão do navegador.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Ao abrir a aba Denunciar, aproveita a localização já conhecida pelo app.
  // Sem ela, pede uma única vez ao navegador.
  React.useEffect(() => {
    if (!open || tab !== 'report') return;
    if (userLocation) {
      setReportLoc((current) => current ?? userLocation);
      return;
    }
    if (!reportLoc && !locating && !locationError) requestLocation();
  }, [open, tab, userLocation, reportLoc, locating, locationError, requestLocation]);

  React.useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ---------------------------------------------------------- Moderação
  const [reports, setReports] = React.useState<MissingPersonReportDTO[]>([]);
  const [loadingReports, setLoadingReports] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [approveDraft, setApproveDraft] = React.useState<
    Record<string, { scope: AlertScope; city: string; radiusKm: number; durationMinutes: number }>
  >({});

  const loadReports = React.useCallback(async () => {
    if (!canModerate) return;
    setLoadingReports(true);
    setError(null);
    try {
      const res = await moderationListMissingPersonAlerts();
      setReports(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar denúncias para moderação.');
    } finally {
      setLoadingReports(false);
    }
  }, [canModerate]);

  React.useEffect(() => {
    if (open && tab === 'moderation') loadReports();
  }, [open, tab, loadReports]);

  const resetForm = () => {
    setPersonName('');
    setKind('DESAPARECIMENTO');
    setDescription('');
    setLastSeenInfo('');
    setContact('');
    setPhoto(null);
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!photo) {
      setError('A foto da pessoa é obrigatória.');
      return;
    }
    if (!personName.trim() || !description.trim() || !city.trim()) {
      setError('Preencha nome, cidade e descrição.');
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await createMissingPersonAlert(
        {
          personName: personName.trim(),
          kind,
          description: description.trim(),
          lastSeenInfo: lastSeenInfo.trim() || undefined,
          contact: contact.trim() || undefined,
          city: city.trim(),
          lat: reportLoc?.lat,
          lng: reportLoc?.lng,
        },
        photo,
      );
      resetForm();
      setSuccess(
        reportLoc
          ? 'Denúncia enviada! Um pré-alerta de 1 km por 10 minutos já está ativo na sua região. Após a moderação, o alcance será definido pela equipe responsável.'
          : 'Denúncia enviada! Ela será analisada por um fiscal, gestor ou root. Compartilhe sua localização para disparar o pré-alerta imediato de 1 km.',
      );
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível enviar a denúncia.');
    } finally {
      setSending(false);
    }
  };

  const draftFor = (r: MissingPersonReportDTO) =>
    approveDraft[r.id] ?? {
      scope: 'LOCAL' as AlertScope,
      city: r.city,
      radiusKm: r.requestedRadiusMeters
        ? Math.min(200, Math.max(1, Math.round(r.requestedRadiusMeters / 1000)))
        : 50,
      durationMinutes: 1440,
    };

  const updateDraft = (
    id: string,
    patch: Partial<{ scope: AlertScope; city: string; radiusKm: number; durationMinutes: number }>,
  ) => {
    setApproveDraft((d) => {
      const current = d[id] ?? { scope: 'LOCAL' as AlertScope, city: '', radiusKm: 50, durationMinutes: 1440 };
      return { ...d, [id]: { ...current, ...patch } };
    });
  };

  const approve = async (r: MissingPersonReportDTO) => {
    const draft = draftFor(r);
    setBusyId(r.id);
    setError(null);
    setSuccess(null);
    try {
      await moderationApproveMissingPersonAlert(r.id, {
        scope: user?.role === 'ROOT' ? draft.scope : 'LOCAL',
        city: user?.role === 'ROOT' ? draft.city : r.city,
        radiusMeters: draft.scope === 'LOCAL' ? Math.round(draft.radiusKm * 1000) : undefined,
        durationMinutes: draft.durationMinutes,
      });
      setSuccess(`Alerta de ${r.personName} aprovado e publicado.`);
      await loadReports();
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível aprovar a denúncia.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (r: MissingPersonReportDTO) => {
    const reason = window.prompt(`Motivo da recusa da denúncia de ${r.personName} (opcional):`) ?? undefined;
    setBusyId(r.id);
    setError(null);
    setSuccess(null);
    try {
      await moderationRejectMissingPersonAlert(r.id, reason || undefined);
      setSuccess(`Denúncia de ${r.personName} recusada.`);
      await loadReports();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível recusar a denúncia.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r: MissingPersonReportDTO) => {
    if (!window.confirm(`Excluir definitivamente a denúncia de ${r.personName}?`)) return;
    setBusyId(r.id);
    setError(null);
    setSuccess(null);
    try {
      await moderationDeleteMissingPersonAlert(r.id);
      setSuccess('Denúncia excluída.');
      await loadReports();
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível excluir a denúncia.');
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const tabs: { id: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { id: 'active', label: 'Alertas ativos', icon: Siren, show: true },
    { id: 'report', label: 'Denunciar', icon: UserX, show: true },
    { id: 'moderation', label: 'Moderação', icon: ShieldCheck, show: canModerate },
  ];

  return (
    <>
      <Scrim onClick={onClose} />
      <div
        style={{ top: 'var(--zelo-header-h)' }}
        className="fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="missing-center-title"
      >
        <div
          className={`relative w-full bg-white shadow-zelo border border-zelo-mist flex flex-col overflow-hidden
            ${compact ? 'max-w-none rounded-none h-full' : 'max-w-2xl mx-4 rounded-2xl max-h-[92vh]'}`}
        >
          {/* Cabeçalho */}
          <div className="shrink-0 bg-gradient-to-r from-zelo-green-dark via-zelo-navy to-red-800 text-white px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-white/15 flex items-center justify-center">
              <Siren className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="missing-center-title" className="font-bold leading-tight truncate">
                Pessoas desaparecidas
              </h2>
              <p className="text-[11px] text-white/70 truncate">
                Pré-alertas imediatos de 1 km e denúncias verificadas
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 shrink-0 text-white/80 hover:text-white rounded-lg hover:bg-white/15"
              aria-label="Fechar central de desaparecidos"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Abas */}
          <div className="shrink-0 px-3 sm:px-5 pt-3 flex gap-1.5 border-b border-slate-100 overflow-x-auto">
            {tabs.filter((t) => t.show).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  onTabChange?.(id);
                }}
                className={`shrink-0 px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition ${
                  tab === id
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 inline -mt-0.5 mr-1.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                {success}
              </div>
            )}

            {/* -------------------------------------------------- ATIVOS */}
            {tab === 'active' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    Pré-alertas imediatos (1 km) e alertas aprovados na sua região.
                  </p>
                  <button
                    onClick={onRefresh}
                    className="shrink-0 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    title="Recarregar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {activeAlerts.length === 0 && (
                  <div className="py-10 text-center">
                    <Siren className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="mt-2 text-sm text-slate-400">
                      Nenhum alerta ativo na sua região agora.
                    </p>
                  </div>
                )}

                {activeAlerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenAlert(a)}
                    className="w-full text-left flex gap-3 p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/30 transition"
                  >
                    <img
                      src={a.photoUrl}
                      alt={`Foto de ${a.personName}`}
                      className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg object-cover border border-slate-200 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">{a.personName}</span>
                        <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                          {KIND_LABEL[a.kind]}
                        </span>
                        {a.preAlert && (
                          <PreAlertCountdown
                            expiresAt={a.preAlertExpiresAt}
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {a.scope === 'GLOBAL' ? 'Alcance global' : a.city}
                        <span className="mx-1">·</span>
                        <MessageCircle className="w-3 h-3" />
                        {a.commentCount}
                      </div>
                      <p
                        className="text-xs text-slate-600 mt-1 break-words"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {a.description}
                      </p>
                    </div>
                  </button>
                ))}

                {!user && (
                  <button
                    onClick={onOpenAuth}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zelo-green-dark text-white text-sm font-semibold hover:bg-zelo-navy transition"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar para enviar uma denúncia
                  </button>
                )}
              </div>
            )}

            {/* -------------------------------------------------- DENUNCIAR */}
            {tab === 'report' && (
              <div>
                {!user ? (
                  <div className="py-10 text-center">
                    <UserX className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">
                      Entre ou cadastre-se para enviar uma denúncia com foto.
                    </p>
                    <button
                      onClick={onOpenAuth}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zelo-green-dark text-white text-sm font-semibold hover:bg-zelo-navy transition"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar / Cadastrar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitReport} className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Envie uma foto nítida da pessoa. Com sua localização, um{' '}
                      <b>pré-alerta de 1 km por 10 minutos</b> é disparado na hora; depois
                      a denúncia é analisada por fiscal, gestor ou root e o alcance é
                      ampliado.
                    </p>

                    {/* Foto */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Foto da pessoa <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-red-300 cursor-pointer bg-slate-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                        />
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Prévia da foto"
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                            <ImagePlus className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-700">
                            {photo ? photo.name : 'Selecionar foto'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            JPG/PNG · obrigatória para a denúncia
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nome da pessoa <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          maxLength={120}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Tipo <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={kind}
                          onChange={(e) => setKind(e.target.value as MissingPersonKind)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="DESAPARECIMENTO">Pessoa desaparecida</option>
                          <option value="SEQUESTRO">Sequestro</option>
                        </select>
                      </div>
                    </div>

                    <CityPicker
                      value={city}
                      onChange={setCity}
                      idPrefix="missing-city"
                      hint="Cidade/região onde a pessoa desapareceu."
                    />

                    {/* Localização + alcance: pré-alerta imediato de 1 km */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                          <LocateFixed className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-700">
                            Sua localização
                          </div>
                          {reportLoc ? (
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              Capturada ({reportLoc.lat.toFixed(4)}, {reportLoc.lng.toFixed(4)}).
                              O pré-alerta de 1 km será disparado imediatamente.
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Compartilhe para disparar um pré-alerta de 1 km por 10 minutos
                              agora, antes da moderação.
                            </p>
                          )}
                          {locationError && (
                            <p className="text-[11px] text-red-600 mt-1">{locationError}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={requestLocation}
                          disabled={locating}
                          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 bg-white text-[11px] font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                        >
                          {locating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LocateFixed className="w-3.5 h-3.5" />
                          )}
                          {reportLoc ? 'Atualizar' : 'Usar minha localização'}
                        </button>
                      </div>

                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Descrição <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        placeholder="O que aconteceu, características da pessoa, roupas, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Última vez que foi vista
                      </label>
                      <input
                        value={lastSeenInfo}
                        onChange={(e) => setLastSeenInfo(e.target.value)}
                        maxLength={500}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Local, data e horário"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Contato do denunciante <span className="font-normal text-slate-400">(não é exibido publicamente)</span>
                      </label>
                      <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        maxLength={200}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Telefone ou e-mail"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Enviar denúncia e disparar pré-alerta
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* -------------------------------------------------- MODERAÇÃO */}
            {tab === 'moderation' && canModerate && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    {user?.role === 'ROOT'
                      ? 'Todas as denúncias. Aprove como local ou global.'
                      : `Denúncias de ${user?.city ?? 'sua cidade'}.`}
                  </p>
                  <button
                    onClick={loadReports}
                    className="shrink-0 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    title="Recarregar"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <datalist id="missing-moderation-cities">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>

                {loadingReports && (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </div>
                )}

                {!loadingReports && reports.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Nenhuma denúncia no seu escopo.
                  </p>
                )}

                {reports.map((r) => {
                  const draft = draftFor(r);
                  const isPending = r.status === 'PENDENTE';
                  const isRoot = user?.role === 'ROOT';
                  return (
                    <div key={r.id} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <img
                          src={r.photoUrl}
                          alt={`Foto de ${r.personName}`}
                          className="w-16 h-16 shrink-0 rounded-lg object-cover border border-slate-200 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">{r.personName}</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_STYLE[r.status]}`}>
                              {STATUS_LABEL[r.status] || r.status}
                            </span>
                            <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                              {KIND_LABEL[r.kind]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {r.city}
                            <span className="mx-1">·</span>
                            <Clock className="w-3 h-3" />
                            {new Date(r.createdAt).toLocaleString('pt-BR')}
                          </div>
                          <p
                            className="text-xs text-slate-600 mt-1 break-words"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {r.description}
                          </p>
                          <div className="text-[11px] text-slate-400 mt-0.5 break-words">
                            Enviada por {r.submittedByName || 'cidadão'}
                            {r.contact ? ` · contato: ${r.contact}` : ''}
                          </div>
                          {r.preAlert && (
                            <div className="mt-1">
                              <PreAlertCountdown
                                expiresAt={r.preAlertExpiresAt}
                                className="bg-amber-50 text-amber-700 border-amber-200"
                              />
                            </div>
                          )}
                          {r.lat != null && r.lng != null && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Localização do denunciante: {Number(r.lat).toFixed(4)},{' '}
                              {Number(r.lng).toFixed(4)}
                              {r.requestedRadiusMeters
                                ? ` · raio pedido: ${Math.round(r.requestedRadiusMeters / 1000)} km`
                                : ''}
                            </div>
                          )}
                          {r.status === 'RECUSADO' && r.rejectionReason && (
                            <div className="text-[11px] text-red-600 mt-1 break-words">
                              Motivo: {r.rejectionReason}
                            </div>
                          )}
                          {r.status === 'APROVADO' && r.expiresAt && (
                            <div className="text-[11px] text-emerald-700 mt-1">
                              Publicado até {new Date(r.expiresAt).toLocaleString('pt-BR')}
                              {r.scope === 'GLOBAL' ? ' · global' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {isPending && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2 bg-slate-50/60">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {isRoot && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Abrangência
                                  </label>
                                  <select
                                    value={draft.scope}
                                    onChange={(e) => updateDraft(r.id, { scope: e.target.value as AlertScope })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="LOCAL">Local (cidade)</option>
                                    <option value="GLOBAL">Global (todo o território)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Cidade
                                  </label>
                                  <input
                                    value={draft.city}
                                    onChange={(e) => updateDraft(r.id, { city: e.target.value })}
                                    list="missing-moderation-cities"
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Cidade do alerta"
                                  />
                                </div>
                              </>
                            )}
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                Duração
                              </label>
                              <select
                                value={draft.durationMinutes}
                                onChange={(e) => updateDraft(r.id, { durationMinutes: Number(e.target.value) })}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-red-500"
                              >
                                {DURATION_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {draft.scope === 'LOCAL' && (
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                  Raio: {draft.radiusKm} km
                                </label>
                                <input
                                  type="range"
                                  min={1}
                                  max={200}
                                  step={1}
                                  value={draft.radiusKm}
                                  onChange={(e) => updateDraft(r.id, { radiusKm: Number(e.target.value) })}
                                  className="w-full accent-red-600"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => approve(r)}
                              disabled={busyId === r.id}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Aprovar e disparar
                            </button>
                            <button
                              onClick={() => reject(r)}
                              disabled={busyId === r.id}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Recusar
                            </button>
                          </div>
                        </div>
                      )}

                      {!isPending && (
                        <div className="px-3 pb-3 border-t border-slate-100 pt-2 flex justify-end">
                          <button
                            onClick={() => remove(r)}
                            disabled={busyId === r.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir denúncia
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
