import React from 'react';
import {
  X, Search, ShieldCheck, UserCog, MapPin, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, Trash2, AlertTriangle,
  Bell, Send, Loader2, Globe2, Clock,
} from 'lucide-react';
import type {
  UserDTO, Role, IncidentStatus, IncidentResponseDTO, AdminStatsDTO,
  WeatherAlertDTO, AlertSeverity, AlertScope,
} from '@/types';
import {
  adminListUsers, adminSetUserRole, adminListIncidents, adminStats, updateIncidentStatus,
  adminDeleteIncident, adminDeleteUser, adminUserIncidentCount,
  adminListAlerts, adminCreateAlert, adminDeleteAlert,
} from '@/api';
import { useAllMunicipios } from '@/hooks/useAllMunicipios';

const ROLE_LABEL: Record<Role, string> = {
  USER: 'Cidadão',
  FISCAL: 'Fiscal',
  GESTOR: 'Gestor',
  ROOT: 'Root',
};

const ROLE_BADGE: Record<Role, string> = {
  USER: 'bg-slate-100 text-slate-600 border-slate-200',
  FISCAL: 'bg-blue-50 text-blue-700 border-blue-200',
  GESTOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ROOT: 'bg-zelo-navy text-white border-zelo-navy',
};

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDO: 'Resolvido',
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  AMARELO: 'Atenção (amarelo)',
  LARANJA: 'Alerta (laranja)',
  VERMELHO: 'Perigo (vermelho)',
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  AMARELO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LARANJA: 'bg-orange-50 text-orange-700 border-orange-200',
  VERMELHO: 'bg-red-50 text-red-700 border-red-200',
};

const DURATION_PRESETS = [
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '3 horas', value: 180 },
  { label: '6 horas', value: 360 },
  { label: '12 horas', value: 720 },
  { label: '24 horas', value: 1440 },
  { label: '3 dias', value: 4320 },
  { label: '7 dias', value: 10080 },
];

interface AdminPanelProps {
  user: UserDTO;
  onClose: () => void;
  /** Avisa o App para recarregar o banner público após criar/remover alerta. */
  onAlertsChanged?: () => void;
}

type Tab = 'users' | 'incidents' | 'alerts' | 'global';

/**
 * Painel administrativo RBAC:
 * - GESTOR: busca cidadãos da própria cidade e alterna USER <-> FISCAL;
 *           lista/gestiona os status dos pontos da sua cidade.
 * - ROOT:   vê tudo, promove gestores, muda qualquer cargo/cidade e consulta
 *           a visão global (aba "Visão global").
 */
export default function AdminPanel({ user, onClose, onAlertsChanged }: AdminPanelProps) {
  const isRoot = user.role === 'ROOT';  const [tab, setTab] = React.useState<Tab>('users');
  const [search, setSearch] = React.useState('');
  const [users, setUsers] = React.useState<UserDTO[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentResponseDTO[]>([]);
  const [stats, setStats] = React.useState<AdminStatsDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Estados para alteração de status inline (aba pontos)
  const [statusDraft, setStatusDraft] = React.useState<Record<string, { status: IncidentStatus; note: string }>>({});
  // Rascunhos de edição por usuário (root): cidade e cargo só aplicam ao salvar
  const [cityDraft, setCityDraft] = React.useState<Record<string, string>>({});
  const [roleDraft, setRoleDraft] = React.useState<Record<string, Role>>({});
  // Modal de exclusão de usuário (somente root)
  const [deleteTarget, setDeleteTarget] = React.useState<UserDTO | null>(null);
  const [deleteIncidentsToo, setDeleteIncidentsToo] = React.useState(false);
  const [deleteCount, setDeleteCount] = React.useState<number | null>(null);

  // ---------------------------------------------------------- Alertas oficiais
  const [alerts, setAlerts] = React.useState<WeatherAlertDTO[]>([]);
  const [alertsLoading, setAlertsLoading] = React.useState(false);
  const [alertSaving, setAlertSaving] = React.useState(false);
  const [alertError, setAlertError] = React.useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = React.useState<string | null>(null);
  const [alertForm, setAlertForm] = React.useState({
    title: '',
    description: '',
    severity: 'LARANJA' as AlertSeverity,
    scope: (isRoot ? 'GLOBAL' : 'LOCAL') as AlertScope,
    city: user.city ?? '',
    radiusKm: 50,
    durationMinutes: 1440,
    customDuration: false,
  });

  const load = React.useCallback(async (term?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, incidentsRes] = await Promise.all([
        adminListUsers(term ?? search),
        adminListIncidents(),
      ]);
      setUsers(usersRes.data || []);
      setIncidents(incidentsRes.data || []);
      if (isRoot) {
        const statsRes = await adminStats();
        setStats(statsRes.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  }, [search, isRoot]);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce da busca
  React.useEffect(() => {
    const id = setTimeout(() => load(search), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const changeRole = async (target: UserDTO, role: Role, explicitCity?: string) => {
    const city = explicitCity ?? cityDraft[target.id] ?? target.city ?? user.city ?? undefined;
    if ((role === 'FISCAL' || role === 'GESTOR') && !city) {
      setError(`Defina uma cidade para ${target.fullName} antes de promover.`);
      return;
    }
    setBusyId(target.id);
    setError(null);
    try {
      await adminSetUserRole(target.id, role, city ?? undefined);
      setCityDraft((c) => {
        const next = { ...c };
        delete next[target.id];
        return next;
      });
      setRoleDraft((r) => {
        const next = { ...r };
        delete next[target.id];
        return next;
      });
      await load(search);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível alterar o cargo.');
    } finally {
      setBusyId(null);
    }
  };

  /** Salva as edições de cidade + cargo de uma linha (somente root). */
  const saveUserDraft = async (target: UserDTO) => {
    const role = roleDraft[target.id] ?? target.role;
    const city = cityDraft[target.id] ?? target.city ?? '';
    await changeRole(target, role, city.trim() || undefined);
  };

  /** Abre o modal de exclusão e descobre quantos pontos o usuário registrou. */
  const askDeleteUser = async (target: UserDTO) => {
    setDeleteTarget(target);
    setDeleteIncidentsToo(false);
    setDeleteCount(null);
    setError(null);
    try {
      const res = await adminUserIncidentCount(target.id);
      setDeleteCount(res.data?.count ?? 0);
    } catch {
      setDeleteCount(null); // sem a contagem o modal ainda funciona
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError(null);
    try {
      await adminDeleteUser(deleteTarget.id, deleteIncidentsToo);
      setDeleteTarget(null);
      setDeleteIncidentsToo(false);
      setDeleteCount(null);
      await load(search);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível excluir o usuário.');
    } finally {
      setBusyId(null);
    }
  };

  const removeIncident = async (inc: IncidentResponseDTO) => {    if (!window.confirm(`Apagar o ponto crítico "${inc.title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setBusyId(inc.id);
    setError(null);
    try {
      await adminDeleteIncident(inc.id);
      setIncidents((list) => list.filter((i) => i.id !== inc.id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível apagar o ponto crítico.');
    } finally {
      setBusyId(null);
    }
  };

  const saveStatus = async (inc: IncidentResponseDTO) => {
    const draft = statusDraft[inc.id];
    if (!draft) return;
    setBusyId(inc.id);
    setError(null);
    try {
      await updateIncidentStatus(inc.id, draft.status, draft.note?.trim() || undefined);
      setStatusDraft((s) => ({ ...s, [inc.id]: { status: draft.status, note: '' } }));
      await load(search);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível salvar o status.');
    } finally {
      setBusyId(null);
    }
  };

  const adminOfCity = user.city ? `${user.city}` : null;
  // Sugestões de cidade (IBGE) para o autocomplete do root — evita grafia divergente.
  const { cities: cityOptions } = useAllMunicipios();

  // ---------------------------------------------------------- Alertas oficiais
  const loadAlerts = React.useCallback(async () => {
    setAlertsLoading(true);
    setAlertError(null);
    try {
      const res = await adminListAlerts();
      setAlerts(res.data || []);
    } catch (e: any) {
      setAlertError(e?.response?.data?.message || 'Erro ao carregar alertas oficiais.');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (tab === 'alerts') loadAlerts();
  }, [tab, loadAlerts]);

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);

    if (!alertForm.title.trim()) {
      setAlertError('Informe um título para o alerta.');
      return;
    }
    const scope: AlertScope = isRoot ? alertForm.scope : 'LOCAL';
    const city = isRoot ? alertForm.city.trim() : (user.city ?? '').trim();
    if (scope === 'LOCAL' && !city) {
      setAlertError('Informe a cidade do alerta local.');
      return;
    }
    const duration = alertForm.customDuration
      ? Number(alertForm.durationMinutes)
      : alertForm.durationMinutes;
    if (!Number.isFinite(duration) || duration < 5 || duration > 10080) {
      setAlertError('Duração deve estar entre 5 minutos e 7 dias.');
      return;
    }

    setAlertSaving(true);
    try {
      await adminCreateAlert({
        title: alertForm.title.trim(),
        description: alertForm.description.trim() || undefined,
        severity: alertForm.severity,
        scope,
        city: scope === 'LOCAL' ? city : undefined,
        radiusMeters: scope === 'LOCAL' ? Math.round(alertForm.radiusKm * 1000) : undefined,
        durationMinutes: Math.round(duration),
      });
      setAlertForm((f) => ({ ...f, title: '', description: '' }));
      setAlertSuccess('Alerta oficial disparado! Ele já aparece no banner de todos os usuários.');
      await loadAlerts();
      onAlertsChanged?.();
    } catch (e: any) {
      setAlertError(e?.response?.data?.message || 'Não foi possível disparar o alerta.');
    } finally {
      setAlertSaving(false);
    }
  };

  const removeAlert = async (alert: WeatherAlertDTO) => {
    if (!window.confirm(`Remover o alerta oficial "${alert.title}"?`)) return;
    setBusyId(alert.id);
    setAlertError(null);
    setAlertSuccess(null);
    try {
      await adminDeleteAlert(alert.id);
      setAlerts((list) => list.filter((a) => a.id !== alert.id));
      setAlertSuccess('Alerta removido.');
      onAlertsChanged?.();
    } catch (e: any) {
      setAlertError(e?.response?.data?.message || 'Não foi possível remover o alerta.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-zelo-green-dark/55 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-3xl h-[95vh] sm:h-auto sm:max-h-[85vh] rounded-xl sm:rounded-2xl border border-zelo-mist shadow-zelo flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-zelo-mist flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-zelo-green-dark text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-zelo-ink text-sm sm:text-base truncate">Painel administrativo</h2>
            <p className="text-xs text-slate-400 truncate">
              {isRoot ? 'Acesso irrestrito (root)' : `Gestor${adminOfCity ? ` de ${adminOfCity}` : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto shrink-0 p-2 text-slate-400 hover:text-zelo-ink hover:bg-zelo-surface rounded transition" aria-label="Fechar painel administrativo">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="px-3 sm:px-5 pt-3 flex gap-1.5 border-b border-zelo-mist overflow-x-auto">
          <button
            onClick={() => setTab('users')}
            className={`shrink-0 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition ${
              tab === 'users' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-zelo-ink'
            }`}
          >
            <UserCog className="w-4 h-4 inline -mt-0.5 mr-1.5" />
            Usuários
          </button>
          <button
            onClick={() => setTab('incidents')}
            className={`shrink-0 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition ${
              tab === 'incidents' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-zelo-ink'
            }`}
          >
            <MapPin className="w-4 h-4 inline -mt-0.5 mr-1.5" />
            Pontos críticos
          </button>
          <button
            onClick={() => setTab('alerts')}
            className={`shrink-0 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition ${
              tab === 'alerts' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-zelo-ink'
            }`}
          >
            <Bell className="w-4 h-4 inline -mt-0.5 mr-1.5" />
            Alertas
          </button>
          {isRoot && (
            <button
              onClick={() => setTab('global')}
              className={`shrink-0 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition ${
                tab === 'global' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-zelo-ink'
              }`}
            >
              Visão global
            </button>
          )}
        </div>

        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {tab === 'users' && (
            <div className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      isRoot
                        ? 'Buscar usuário por nome ou e-mail...'
                        : `Buscar cidadão em ${adminOfCity ?? 'sua cidade'}...`
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={() => load(search)}
                  className="shrink-0 p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!isRoot && (
                <p className="text-xs text-slate-400 mb-3">
                  Você só enxerga e altera usuários de <b>{adminOfCity ?? 'sua cidade'}</b>.
                  Gestores não gerenciam outras localidades.
                </p>
              )}

              {/* Sugestões de municípios do IBGE para o campo de cidade (root) */}
              <datalist id="admin-city-options">
                {cityOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div className="divide-y divide-slate-100">
                {users.map((u) => {
                  const canToggleFiscal =
                    !isRoot && (u.role === 'USER' || u.role === 'FISCAL');
                  const draftCity = cityDraft[u.id] ?? u.city ?? '';
                  const draftRole = roleDraft[u.id] ?? u.role;
                  const dirty = isRoot && u.id !== user.id && (draftCity !== (u.city ?? '') || draftRole !== u.role);
                  return (
                    <div key={u.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {/* Identificação (linha de cima no celular) */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 truncate">{u.fullName}</span>
                            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${ROLE_BADGE[u.role]}`}>
                              {ROLE_LABEL[u.role]}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {u.email}
                            {u.city && <span> · {u.city}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Ações (quebram em várias linhas no celular) */}
                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap sm:justify-end shrink-0">
                        {isRoot && u.id !== user.id && (
                          <input
                            value={draftCity}
                            onChange={(e) =>
                              setCityDraft((c) => ({ ...c, [u.id]: e.target.value }))
                            }
                            list="admin-city-options"
                            placeholder="cidade"
                            className="w-full sm:w-28 sm:flex-none rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            title={`Cidade de atuação de ${u.fullName}`}
                          />
                        )}
                        {isRoot && u.id !== user.id && (
                          <select
                            value={draftRole}
                            disabled={busyId === u.id}
                            onChange={(e) =>
                              setRoleDraft((r) => ({ ...r, [u.id]: e.target.value as Role }))
                            }
                            className="flex-1 min-w-[110px] sm:flex-none rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                            title={`Cargo de ${u.fullName}`}
                          >
                            <option value="USER">Cidadão</option>
                            <option value="FISCAL">Fiscal</option>
                            <option value="GESTOR">Gestor</option>
                            <option value="ROOT">Root</option>
                          </select>
                        )}
                        {isRoot && u.id !== user.id && (
                          <button
                            onClick={() => saveUserDraft(u)}
                            disabled={busyId === u.id || !dirty}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40 shrink-0 ${
                              dirty
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                            title="Salvar cidade e cargo"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {busyId === u.id ? '...' : 'Salvar'}
                          </button>
                        )}
                        {isRoot && u.id !== user.id && u.role !== 'ROOT' && (
                          <button
                            onClick={() => askDeleteUser(u)}
                            disabled={busyId === u.id}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 disabled:opacity-50 transition shrink-0"
                            title={`Excluir usuário ${u.fullName}`}
                            aria-label={`Excluir usuário ${u.fullName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {canToggleFiscal && u.role === 'USER' && (
                          <button
                            onClick={() => changeRole(u, 'FISCAL')}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition shrink-0"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            Promover a Fiscal
                          </button>
                        )}
                        {canToggleFiscal && u.role === 'FISCAL' && (
                          <button
                            onClick={() => changeRole(u, 'USER')}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition shrink-0"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            Remover Fiscal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && !loading && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum usuário encontrado.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'incidents' && (
            <div className="p-3 sm:p-5">
              <p className="text-xs text-slate-400 mb-3">
                {isRoot
                  ? 'Todos os pontos críticos (filtro opcional pela cidade do ponto).'
                  : `Somente os pontos de ${adminOfCity ?? 'sua cidade'} — altere status e registre notas.`}
              </p>
              <div className="divide-y divide-slate-100">
                {incidents.map((inc) => {
                  const draft = statusDraft[inc.id] ?? { status: inc.status, note: '' };
                  return (
                    <div key={inc.id} className="py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 min-w-0 break-words">{inc.title}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                          {STATUS_LABEL[inc.status] || inc.status}
                        </span>
                        {inc.city && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {inc.city}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-auto">
                          {new Date(inc.createdAt).toLocaleString('pt-BR')}
                        </span>
                        <button
                          onClick={() => removeIncident(inc)}
                          disabled={busyId === inc.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition shrink-0"
                          title="Apagar ponto crítico (falso/indevido)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Apagar
                        </button>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                        <select
                          value={draft.status}
                          disabled={busyId === inc.id}
                          onChange={(e) =>
                            setStatusDraft((s) => ({
                              ...s,
                              [inc.id]: { ...draft, status: e.target.value as IncidentStatus },
                            }))
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 sm:shrink-0"
                        >
                          <option value="ABERTO">Aberto</option>
                          <option value="EM_ATENDIMENTO">Em atendimento</option>
                          <option value="RESOLVIDO">Resolvido</option>
                        </select>
                        <input
                          value={draft.note}
                          disabled={busyId === inc.id}
                          onChange={(e) =>
                            setStatusDraft((s) => ({
                              ...s,
                              [inc.id]: { ...draft, note: e.target.value },
                            }))
                          }
                          placeholder={'Nota, ex.: "Equipe acionada às 14:30"'}
                          className="w-full sm:flex-1 sm:min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <button
                          onClick={() => saveStatus(inc)}
                          disabled={
                            busyId === inc.id ||
                            (draft.status === inc.status && !draft.note.trim())
                          }
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {busyId === inc.id ? '...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {incidents.length === 0 && !loading && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum ponto crítico no seu escopo.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'alerts' && (
            <div className="p-3 sm:p-5 space-y-5">
              <p className="text-xs text-slate-400">
                {isRoot
                  ? 'Dispare um alerta global (todo o território) ou local em qualquer cidade.'
                  : `Dispare um alerta local para ${adminOfCity ?? 'sua cidade'}.`}{' '}
                O alerta aparece no banner de todos os usuários e some sozinho ao expirar.
              </p>

              {alertError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                  {alertError}
                </div>
              )}
              {alertSuccess && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                  {alertSuccess}
                </div>
              )}

              <datalist id="admin-alert-city-options">
                {cityOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              {/* Formulário de disparo */}
              <form onSubmit={createAlert} className="rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={alertForm.title}
                    onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={120}
                    placeholder="Ex.: Interdição da Avenida Central"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mensagem / orientações
                  </label>
                  <textarea
                    value={alertForm.description}
                    onChange={(e) => setAlertForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    maxLength={1000}
                    placeholder="Explique o risco e o que a população deve fazer."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Severidade</label>
                    <select
                      value={alertForm.severity}
                      onChange={(e) => setAlertForm((f) => ({ ...f, severity: e.target.value as AlertSeverity }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="AMARELO">{SEVERITY_LABEL.AMARELO}</option>
                      <option value="LARANJA">{SEVERITY_LABEL.LARANJA}</option>
                      <option value="VERMELHO">{SEVERITY_LABEL.VERMELHO}</option>
                    </select>
                  </div>

                  {isRoot && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Abrangência</label>
                      <select
                        value={alertForm.scope}
                        onChange={(e) => setAlertForm((f) => ({ ...f, scope: e.target.value as AlertScope }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="GLOBAL">Global (todo o território)</option>
                        <option value="LOCAL">Local (cidade/região)</option>
                      </select>
                    </div>
                  )}
                </div>

                {(isRoot ? alertForm.scope : 'LOCAL') === 'LOCAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cidade {isRoot ? <span className="text-red-500">*</span> : null}
                      </label>
                      {isRoot ? (
                        <input
                          value={alertForm.city}
                          onChange={(e) => setAlertForm((f) => ({ ...f, city: e.target.value }))}
                          list="admin-alert-city-options"
                          placeholder="Cidade do alerta"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {adminOfCity ?? 'Cidade não definida no perfil'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Raio: {alertForm.radiusKm} km
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={200}
                        step={1}
                        value={alertForm.radiusKm}
                        onChange={(e) => setAlertForm((f) => ({ ...f, radiusKm: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1 km</span>
                        <span>50 km = cidade inteira</span>
                        <span>200 km</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duração</label>
                    <select
                      value={alertForm.customDuration ? 'custom' : String(alertForm.durationMinutes)}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setAlertForm((f) => ({ ...f, customDuration: true }));
                        } else {
                          setAlertForm((f) => ({
                            ...f,
                            customDuration: false,
                            durationMinutes: Number(e.target.value),
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {DURATION_PRESETS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                      <option value="custom">Personalizado...</option>
                    </select>
                  </div>
                  {alertForm.customDuration && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Minutos (5 a 10080)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={10080}
                        value={alertForm.durationMinutes}
                        onChange={(e) =>
                          setAlertForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={alertSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {alertSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Disparar alerta oficial
                </button>
              </form>

              {/* Alertas ativos */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Alertas oficiais ativos
                  </h3>
                  <button
                    onClick={loadAlerts}
                    className="shrink-0 p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    title="Recarregar"
                  >
                    <RefreshCw className={`w-4 h-4 ${alertsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {alertsLoading && (
                  <div className="py-6 text-center text-sm text-slate-400">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </div>
                )}

                {!alertsLoading && alerts.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Nenhum alerta oficial ativo agora.
                  </p>
                )}

                <div className="divide-y divide-slate-100">
                  {alerts.map((a) => {
                    const canDelete =
                      isRoot ||
                      (a.scope === 'LOCAL' &&
                        !!a.city &&
                        !!user.city &&
                        a.city.toLowerCase() === user.city.toLowerCase());
                    return (
                      <div key={a.id} className="py-3">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${SEVERITY_BADGE[a.severity] || SEVERITY_BADGE.AMARELO}`}>
                            {SEVERITY_LABEL[a.severity] || a.severity}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 min-w-0 break-words">
                            {a.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            {a.scope === 'GLOBAL' ? (
                              <>
                                <Globe2 className="w-3 h-3" /> Global
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3" /> {a.city}
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => removeAlert(a)}
                            disabled={busyId === a.id || !canDelete}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition shrink-0"
                            title={canDelete ? 'Remover alerta' : 'Somente leitura'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        </div>
                        {a.description && (
                          <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">{a.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira {new Date(a.expiresAt).toLocaleString('pt-BR')}
                          </span>
                          {a.createdByName && <span>Por {a.createdByName}</span>}
                          {a.radiusMeters != null && a.scope !== 'GLOBAL' && (
                            <span>{Math.round(a.radiusMeters / 1000)} km</span>
                          )}
                          {a.scope === 'GLOBAL' && !isRoot && <span>Somente leitura</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'global' && stats && (
            <div className="p-3 sm:p-5 space-y-5">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</div>
                  <div className="text-xs text-slate-400">Usuários</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-extrabold text-slate-900">{stats.totalIncidents}</div>
                  <div className="text-xs text-slate-400">Pontos críticos</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-extrabold text-slate-900">{stats.cities.length}</div>
                  <div className="text-xs text-slate-400">Cidades ativas</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Usuários por papel
                  </div>
                  {Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between py-1 text-sm">
                      <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${ROLE_BADGE[role as Role] || ROLE_BADGE.USER}`}>
                        {ROLE_LABEL[role as Role] || role}
                      </span>
                      <span className="font-semibold text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Pontos por status
                  </div>
                  {Object.entries(stats.incidentsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-slate-600">{STATUS_LABEL[status] || status}</span>
                      <span className="font-semibold text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Cidades cadastradas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.cities.map((c) => (
                    <span key={c} className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
                      {c}
                    </span>
                  ))}
                  {stats.cities.length === 0 && (
                    <span className="text-xs text-slate-400">Nenhuma cidade informada em perfis ainda.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão de usuário (somente root) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[var(--z-modal-top)] bg-zelo-green-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-md rounded-xl sm:rounded-2xl border border-zelo-mist shadow-zelo overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-zelo-mist flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">Excluir usuário</h2>
                <p className="text-xs text-slate-400 truncate">{deleteTarget.fullName}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                className="ml-auto p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600">
                Conta: <b className="text-slate-800">{deleteTarget.email}</b>
                {deleteTarget.city && <span className="text-slate-400"> · {deleteTarget.city}</span>}
              </p>
              <p className="text-sm text-slate-600">
                Esta ação é <b className="text-red-600">permanente</b>: o acesso do usuário será removido.
              </p>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteIncidentsToo}
                    disabled={busyId === deleteTarget.id}
                    onChange={(e) => setDeleteIncidentsToo(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700">
                    Apagar também os pontos críticos registrados por este usuário
                    {deleteCount !== null && (
                      <b className="text-slate-900">
                        {' '}
                        ({deleteCount} ponto{deleteCount === 1 ? '' : 's'})
                      </b>
                    )}
                    .
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {deleteIncidentsToo
                        ? 'Os pontos sairão do mapa, junto com comentários e confirmações deles.'
                        : 'Sem marcar, os pontos permanecem no mapa com a autoria anonimizada ("Usuário removido").'}
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-zelo-mist flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                className="zelo-btn-secondary text-center"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={busyId === deleteTarget.id}
                className="zelo-btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                {busyId === deleteTarget.id ? 'Excluindo...' : 'Excluir usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
