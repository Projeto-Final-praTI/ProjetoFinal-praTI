import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, AlertTriangle, Bell, X } from 'lucide-react';
import Header from '@/components/Header';
import AlertBanner from '@/components/AlertBanner';
import MapView from '@/components/MapView';
import CriticalPointsPanel from '@/components/CriticalPointsPanel';
import IncidentDrawer from '@/components/IncidentDrawer';
import AuthModal from '@/components/AuthModal';
import IncidentForm from '@/components/IncidentForm';
import TimelineSlider, { isActiveDuring, type TimeRange } from '@/components/TimelineSlider';
import AdminPanel from '@/components/AdminPanel';
import ProfileModal from '@/components/ProfileModal';
import AboutModal from '@/components/AboutModal';
import MissingPersonCenter from '@/components/MissingPersonCenter';
import MissingPersonAlertModal from '@/components/MissingPersonAlertModal';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useRoute, paths } from '@/router';
import type {
  UserDTO,
  IncidentResponseDTO,
  WeatherAlertDTO,
  MissingPersonReportDTO,
  MapPoint,
  CurrentWeatherDTO,
  IncidentStatus,
} from '@/types';
import {
  getIncidentsNearby,
  getAlerts,
  getMissingPersonAlerts,
  getMissingPersonAlert,
  upvoteIncident,
  addComment,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} from '@/api';

const DEFAULT_CENTER: MapPoint = { lat: -23.5505, lng: -46.6333 }; // São Paulo
const MAX_DISTANCE_METERS = 500;

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [incidents, setIncidents] = useState<IncidentResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [center, setCenter] = useState<MapPoint>(DEFAULT_CENTER);
  const [selectedIncident, setSelectedIncident] = useState<IncidentResponseDTO | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlertDTO[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherDTO | null>(null);
  const [alertDetail, setAlertDetail] = useState<WeatherAlertDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapPoint | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // No celular os painéis viram tela cheia e disputam espaço com a pilha
  // inferior de controles (linha do tempo + botões flutuantes).
  const mobile = useIsMobile();
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    // No celular a visão inicial deve ser do mapa, não da lista lateral
    return !window.matchMedia('(max-width: 767px)').matches;
  });
  // Linha do tempo: null = período completo (sem filtro); intervalo = janela selecionada
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  // Central de pessoas desaparecidas + modal em destaque
  const [missingAlerts, setMissingAlerts] = useState<MissingPersonReportDTO[]>([]);
  const [missingDetail, setMissingDetail] = useState<MissingPersonReportDTO | null>(null);

  // A URL é a fonte da verdade dos modais/painéis: links diretos como
  // `/login`, `/cadastro`, `/sobre` e `/desaparecidos` funcionam e o botão
  // "voltar" do navegador fecha o modal em vez de sair do site.
  const { route, navigate, back } = useRoute();
  const authModalOpen = route.name === 'login' || route.name === 'register';
  const authMode = route.name === 'register' ? 'register' : 'login';
  const adminOpen = route.name === 'admin';
  const profileOpen = route.name === 'profile';
  const aboutOpen = route.name === 'about';
  const missingCenterOpen = route.name === 'missing';
  const missingCenterTab = route.name === 'missing' ? route.tab : 'active';

  // Evita redirecionar rotas protegidas antes de restaurar a sessão salva.
  const [sessionReady, setSessionReady] = useState(false);
  const fetchedMissingIdRef = useRef<string | null>(null);

  // Restaura sessão do localStorage
  useEffect(() => {
    const t = localStorage.getItem('zelo_token');
    const u = localStorage.getItem('zelo_user');
    if (t && u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem('zelo_token');
        localStorage.removeItem('zelo_user');
      }
    } else if (t || u) {
      // Sessão incompleta (token sem usuário ou vice-versa): limpa para não
      // enviar um token órfão nas requisições públicas.
      localStorage.removeItem('zelo_token');
      localStorage.removeItem('zelo_user');
    }
    setSessionReady(true);
  }, []);

  // Rotas que dependem de sessão/permissão. Só rodam depois que o localStorage
  // foi lido, senão um usuário logado abrindo `/perfil` seria mandado ao login.
  useEffect(() => {
    if (!sessionReady) return;
    if (authModalOpen && user) navigate(paths.home, { replace: true });
  }, [sessionReady, authModalOpen, user, navigate]);

  useEffect(() => {
    if (!sessionReady) return;
    if (profileOpen && !user) navigate(paths.login, { replace: true });
  }, [sessionReady, profileOpen, user, navigate]);

  useEffect(() => {
    if (!sessionReady) return;
    const allowed = !!user && (user.role === 'GESTOR' || user.role === 'ROOT');
    if (adminOpen && !allowed) navigate(paths.home, { replace: true });
  }, [sessionReady, adminOpen, user, navigate]);

  // A aba de moderação só existe para fiscal/gestor/root; um link direto sem
  // permissão cai na lista de alertas ativos.
  useEffect(() => {
    if (!sessionReady || route.name !== 'missing' || route.tab !== 'moderation') return;
    const canModerate =
      !!user &&
      (user.role === 'FISCAL' || user.role === 'GESTOR' || user.role === 'ROOT');
    if (!canModerate) navigate(paths.missing, { replace: true });
  }, [sessionReady, route, user, navigate]);

  // URL desconhecida volta para o mapa sem poluir o histórico.
  useEffect(() => {
    if (route.name === 'unknown') navigate(paths.home, { replace: true });
  }, [route, navigate]);

  // Link direto para um alerta: usa a lista em memória e, se necessário, busca
  // o alerta pelo id (a lista só cobre o raio do mapa).
  const routeMissingId = route.name === 'missing-detail' ? route.id : null;
  useEffect(() => {
    if (!routeMissingId) {
      fetchedMissingIdRef.current = null;
      return;
    }
    const found = missingAlerts.find((a) => a.id === routeMissingId);
    if (found) {
      setMissingDetail(found);
      return;
    }
    if (fetchedMissingIdRef.current === routeMissingId) return;
    fetchedMissingIdRef.current = routeMissingId;

    let cancelled = false;
    getMissingPersonAlert(routeMissingId)
      .then((res) => {
        if (!cancelled && res.data) setMissingDetail(res.data);
      })
      .catch(() => {
        if (!cancelled) navigate(paths.missing, { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [routeMissingId, missingAlerts, navigate]);

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      // allSettled: uma falha no clima não pode descartar os pontos críticos
      // (e vice-versa).
      const [incRes, alertRes, missingRes] = await Promise.allSettled([
        getIncidentsNearby(center.lat, center.lng, 10000),
        getAlerts(center.lat, center.lng),
        getMissingPersonAlerts(center.lat, center.lng),
      ]);

      if (incRes.status === 'fulfilled') {
        setIncidents(incRes.value.data || []);
      } else {
        console.error('Erro ao carregar pontos críticos:', incRes.reason);
      }

      if (alertRes.status === 'fulfilled') {
        setAlerts(alertRes.value.data?.alerts || []);
        setCurrentWeather(alertRes.value.data?.currentWeather || null);
      } else {
        console.error('Erro ao carregar clima/alertas:', alertRes.reason);
      }

      if (missingRes.status === 'fulfilled') {
        const list = missingRes.value.data || [];
        setMissingAlerts(list);
        // Mantém o modal em destaque sincronizado com a lista (novos comentários
        // e contagem) sem precisar recarregar a página.
        setMissingDetail((cur) =>
          cur ? list.find((a) => a.id === cur.id) ?? cur : cur,
        );
      } else {
        console.error('Erro ao carregar pessoas desaparecidas:', missingRes.reason);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [center.lat, center.lng]);

  // Sempre busca dados assim que o centro muda (independe da geolocalização)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tempo real: atualiza pontos críticos e alertas a cada 60s sem bloquear a tela
  useEffect(() => {
    const id = setInterval(() => fetchData({ silent: true }), 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Geolocalização do navegador - centraliza o mapa na localização do usuário
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number | null = null;
    const firstFixRef = { current: false };
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          // Centraliza apenas na 1ª correção (depois quem panar não é incomodado);
          // botão "Minha localização" recentraliza sob demanda
          if (!firstFixRef.current) {
            firstFixRef.current = true;
            setCenter(loc);
          }
        },
        () => {
          /* permissão negada / erro: mantém centro padrão (São Paulo) */
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    } catch {
      /* geolocalização indisponível */
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleLoginSuccess = (u: UserDTO) => {
    setUser(u);
    // Substitui `/login` no histórico: depois de entrar, "voltar" não deve
    // reabrir a tela de login.
    navigate(paths.home, { replace: true });
    if (center) fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('zelo_token');
    localStorage.removeItem('zelo_user');
    setUser(null);
    navigate(paths.home, { replace: true });
  };

  const handleUpvote = async (id: string) => {
    if (!user) return;
    try {
      const res = await upvoteIncident(id);
      const updated = res.data;
      setIncidents((list) => list.map((i) => (i.id === id ? updated : i)));
      setSelectedIncident((cur) => (cur?.id === id ? updated : cur));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao confirmar problema.');
    }
  };

  const handleAddComment = async (id: string, content: string) => {
    try {
      await addComment(id, content);
      const res = await getIncidentById(id);
      setSelectedIncident(res.data);
      setIncidents((list) => list.map((i) => (i.id === id ? res.data : i)));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao comentar.');
    }
  };

  const handleMapClick = (e: any) => {
    if (!userLocation) return;
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const dist = haversineMeters(userLocation.lat, userLocation.lng, lat, lng);
    if (dist > MAX_DISTANCE_METERS) {
      setCreateError(
        `Você está a ${Math.round(dist)} m do local. É necessário estar a no máximo 500 m para registrar.`,
      );
      setPendingLocation(null);
      return;
    }
    setCreateError(null);
    setPendingLocation({ lat, lng });
    setCreating(false);
    setFormOpen(true);
  };

  const openAlertDetail = (alert: WeatherAlertDTO) => {
    setAlertDetail(alert);
  };

  const closeAlertDetail = () => setAlertDetail(null);

  const openMissingCenter = (tab: 'active' | 'report' | 'moderation' = 'active') => {
    navigate(
      tab === 'report'
        ? paths.missingReport
        : tab === 'moderation'
          ? paths.missingModeration
          : paths.missing,
    );
  };

  const closeMissingDetail = () => {
    setMissingDetail(null);
    if (route.name === 'missing-detail') back(paths.missing);
  };

  // Mantém a lista e o modal sincronizados quando a população comenta.
  const handleMissingUpdated = (updated: MissingPersonReportDTO) => {
    setMissingAlerts((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    setMissingDetail((cur) => (cur?.id === updated.id ? updated : cur));
  };

  // Modal em destaque: abre automaticamente uma vez por alerta/sessão, sem
  // atropelar outro modal já aberto (login, formulário, painel etc.).
  useEffect(() => {
    if (missingAlerts.length === 0) return;
    const newest = missingAlerts[0];
    if (sessionStorage.getItem('zelo_missing_autoshown') === newest.id) return;
    if (
      authModalOpen ||
      formOpen ||
      adminOpen ||
      aboutOpen ||
      missingCenterOpen ||
      route.name === 'missing-detail'
    ) {
      return;
    }
    sessionStorage.setItem('zelo_missing_autoshown', newest.id);
    setMissingDetail(newest);
  }, [missingAlerts, authModalOpen, formOpen, adminOpen, aboutOpen, missingCenterOpen, route.name]);

  const handleCenterOnUserLocation = () => {
    if (userLocation) {
      setCenter(userLocation);
      return;
    }
    // Ainda não temos a localização: solicita agora e centraliza quando chegar
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setCenter(loc);
      },
      () => alert('Não foi possível obter sua localização. Verifique a permissão de localização do navegador.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Botão "Centralizar" do painel lateral: move o mapa para o ponto
  // (o Recenter do MapView aplica; dados recarregam em torno do novo centro)
  const handleCenterOnPoint = (inc: IncidentResponseDTO) => {
    setCenter({ lat: inc.lat, lng: inc.lng });
  };

  // Transição de status + nota (RBAC validado no backend: fiscal/gestor/root
  // da mesma cidade). Propaga para lista e drawer com o DTO atualizado.
  const handleUpdateStatus = async (id: string, status: IncidentStatus, note: string) => {
    const res = await updateIncidentStatus(id, status, note || undefined);
    const updated = res.data;
    setIncidents((list) => list.map((i) => (i.id === id ? updated : i)));
    setSelectedIncident((cur) => (cur?.id === id ? updated : cur));
  };

  // Pontos exibidos no mapa/painel.
  // - Sem filtro (timeRange = null) => janela = "até AGORA": pontos RESOLVIDOS
  //   desaparecem do mapa; só voltam quando a linha do tempo é rebobinada.
  // - Com filtro => pontos ativos durante a janela escolhida.
  const visibleIncidents = useMemo(() => {
    const end = timeRange === null ? Date.now() : timeRange.end;
    const start = timeRange === null ? Number.NEGATIVE_INFINITY : timeRange.start;
    return incidents.filter((i) => isActiveDuring(i, start, end));
  }, [incidents, timeRange]);

  // Apaga o próprio ponto (e fecha o drawer se for o aberto)
  const handleDeleteIncident = async (id: string) => {
    await deleteIncident(id);
    setIncidents((list) => list.filter((i) => i.id !== id));
    setSelectedIncident((cur) => (cur?.id === id ? null : cur));
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-slate-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => navigate(paths.login)}
        weather={currentWeather}
        onOpenAdmin={() => navigate(paths.admin)}
        onOpenProfile={() => navigate(paths.profile)}
        onOpenAbout={() => navigate(paths.about)}
        onOpenMissing={() => openMissingCenter('active')}
        onHome={() => navigate(paths.home)}
      />

      <AlertBanner
        alerts={alerts}
        missingAlerts={missingAlerts}
        onOpenDetail={openAlertDetail}
        onOpenMissing={setMissingDetail}
      />

      <CriticalPointsPanel
        incidents={visibleIncidents}
        open={panelOpen}
        onToggle={() => setPanelOpen((o) => !o)}
        onCenterOnPoint={handleCenterOnPoint}
        onOpenIncident={setSelectedIncident}
      />

      <MapView
        center={center}
        incidents={visibleIncidents}
        userLocation={userLocation}
        onIncidentClick={setSelectedIncident}
        missingAlerts={missingAlerts}
        onMissingClick={setMissingDetail}
        creating={creating}
        pendingLocation={pendingLocation}
        onMapClick={handleMapClick}
        createError={createError}
        onCenterOnUserLocation={handleCenterOnUserLocation}
        panelOpen={panelOpen}
      />

      {/* Linha do tempo / playback do mapa (dois marcadores: início e fim) */}
      <TimelineSlider
        incidents={incidents}
        timeRange={timeRange}
        onChange={setTimeRange}
        panelOpen={panelOpen}
      />

      <IncidentDrawer
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        user={user}
        onUpvote={handleUpvote}
        onAddComment={handleAddComment}
        onOpenAuth={() => navigate(paths.login)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteIncident}
      />

      {/* Painel administrativo RBAC (gestor/root) */}
      {adminOpen && user && (user.role === 'GESTOR' || user.role === 'ROOT') && (
        <AdminPanel
          user={user}
          onClose={() => back()}
          onAlertsChanged={() => fetchData({ silent: true })}
        />
      )}

      {/* Edição do próprio perfil (qualquer usuário logado) */}
      {user && (
        <ProfileModal
          open={profileOpen}
          user={user}
          onClose={() => back()}
          onUpdated={setUser}
        />
      )}

      {/* Apresentação pública da plataforma (Sobre o ZELO) */}
      <AboutModal
        open={aboutOpen}
        onClose={() => back()}
        isAuthenticated={!!user}
        onOpenAuth={() => navigate(paths.login)}
      />

      {/* Modo de criação: o mapa fica esperando o clique no local do problema.
          Sem um banner fixo o usuário não tem como sair desse estado. */}
      {creating && !formOpen && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[var(--z-map-msg)] flex items-center gap-2 bg-zelo-green-dark/95 text-white pl-3 pr-1.5 py-1.5 rounded-full shadow-xl border border-white/10 max-w-[92vw]"
          style={{ top: 'calc(var(--zelo-header-h) + var(--zelo-alert-h, 0px) + 8px)' }}
          role="status"
        >
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Toque no mapa para marcar o local
          </span>
          <button
            onClick={() => {
              setCreating(false);
              setPendingLocation(null);
              setCreateError(null);
            }}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
            aria-label="Cancelar registro de ponto crítico"
            title="Cancelar registro"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {/* FAB registrar ponto crítico.
          No celular vira um círculo só com o ícone, posicionado ACIMA da
          linha do tempo (offset em CSS puro — `env()` não compila como
          classe arbitrária do Tailwind).
          Quando a lista de pontos críticos está aberta em tela cheia, o FAB
          some para não flutuar por cima dela. */}
      {!(mobile && panelOpen) && (
        <button
          onClick={() => {
            if (!user) {
              navigate(paths.login);
              return;
            }
            if (!userLocation) {
              setCreateError('Aguardando localização...');
              return;
            }
            setCreating(true);
            setFormOpen(false);
            setPendingLocation(null);
            setCreateError(null);
          }}
          style={{ bottom: 'var(--zelo-fab-bottom)', zIndex: 'calc(var(--z-float) - 1)' }}
          className="fixed right-4 sm:right-8 flex items-center justify-center sm:justify-start gap-2 w-12 h-12 sm:w-auto sm:h-auto px-0 sm:px-5 py-0 sm:py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold shadow-xl hover:bg-emerald-700 active:scale-95 transition border border-emerald-400/30"
          aria-label="Registrar ponto crítico"
          title="Registrar ponto crítico"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Registrar ponto crítico</span>
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 z-[var(--z-map-msg)] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      )}

      <AuthModal
        open={authModalOpen}
        initialMode={authMode}
        onModeChange={(mode) =>
          navigate(mode === 'register' ? paths.register : paths.login, {
            replace: true,
          })
        }
        onClose={() => back()}
        onSuccess={handleLoginSuccess}
      />

      <IncidentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        userLocation={userLocation}
        pendingLocation={pendingLocation}
        onSuccess={() => {
          setFormOpen(false);
          setPendingLocation(null);
          setCreating(false);
          if (center) fetchData();
        }}
      />

      {/* Central de pessoas desaparecidas/sequestro (pública) */}
      <MissingPersonCenter
        open={missingCenterOpen}
        onClose={() => back()}
        user={user}
        activeAlerts={missingAlerts}
        onOpenAuth={() => navigate(paths.login)}
        onOpenAlert={(a) => {
          setMissingDetail(a);
          navigate(paths.missingDetail(a.id));
        }}
        onRefresh={() => fetchData({ silent: true })}
        userLocation={userLocation}
        initialTab={missingCenterTab}
        onTabChange={(tab) =>
          navigate(
            tab === 'report'
              ? paths.missingReport
              : tab === 'moderation'
                ? paths.missingModeration
                : paths.missing,
            { replace: true },
          )
        }
      />

      {/* Modal em destaque de pessoa desaparecida/sequestro */}
      <MissingPersonAlertModal
        alert={missingDetail}
        user={user}
        onClose={closeMissingDetail}
        onOpenAuth={() => {
          setMissingDetail(null);
          navigate(paths.login);
        }}
        onUpdated={handleMissingUpdated}
      />

      {/* Modal de detalhe do alerta climático ou oficial */}
      {alertDetail && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-zelo-green-dark/55 backdrop-blur-sm" onClick={closeAlertDetail} />
          <div className="relative w-full max-w-md p-4 sm:p-6 bg-white rounded-2xl shadow-zelo border border-zelo-mist max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zelo-ink">
                {alertDetail.custom ? 'Alerta oficial' : 'Alerta climático'}
              </h3>
              <button onClick={closeAlertDetail} aria-label="Fechar alerta" className="p-2 rounded-lg text-slate-400 hover:text-zelo-ink hover:bg-zelo-surface transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Bell className="w-5 h-5" />
              <span className="font-bold text-slate-800 capitalize">{alertDetail.severity}</span>
              <span className="ml-auto text-xs text-slate-400">
                {alertDetail.custom ? 'Oficial' : alertDetail.source}
              </span>
            </div>
            <h4 className="font-semibold text-slate-700 mb-2">{alertDetail.title}</h4>
            <p className="text-slate-600 mb-4">{alertDetail.description}</p>

            {alertDetail.custom && (
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {alertDetail.scope === 'GLOBAL' ? 'Alcance global' : alertDetail.city || 'Local'}
                </span>
                {alertDetail.createdByName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Por {alertDetail.createdByName}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {alertDetail.radiusMeters != null && (
                <div className="p-2 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-500">Raio</div>
                  <div className="font-medium">{Math.round(alertDetail.radiusMeters)} m</div>
                </div>
              )}
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-xs text-slate-500">Expira</div>
                <div className="font-medium">{new Date(alertDetail.expiresAt).toLocaleString('pt-BR')}</div>
              </div>
            </div>
            {!alertDetail.custom && currentWeather && (
              <div className="mt-4 pt-4 border-t border-zelo-mist flex items-center gap-3 text-sm text-slate-600">
                <span>Agora: {currentWeather.temperature?.toFixed(1)}°C</span>
                <span>• precipitação {currentWeather.precipitation?.toFixed(1)} mm</span>
                <span>• vento {currentWeather.windSpeed?.toFixed(1)} km/h</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
