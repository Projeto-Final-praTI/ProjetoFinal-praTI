import L from 'leaflet';
import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { IncidentResponseDTO, MapPoint, MissingPersonReportDTO } from '@/types';
import { Target } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * A posição do bloco de zoom do Leaflet é definida em CSS puro
 * (`.leaflet-control-zoom`): no celular ele sobe para o topo-direita, porque
 * a base da tela é disputada pela linha do tempo e pelos botões flutuantes.
 * (Offsets com `env()` não podem ser classes arbitrárias do Tailwind.)
 */

export const CATEGORY_STYLE: Record<string, { color: string; letter: string }> = {
  BURACO: { color: '#ef4444', letter: 'B' },
  PONTE_QUEBRADA: { color: '#f59e0b', letter: 'P' },
  ALAGAMENTO: { color: '#3b82f6', letter: 'A' },
  QUEDA_ARVORE: { color: '#8b5cf6', letter: 'Q' },
  DESLIZAMENTO: { color: '#ec4899', letter: 'D' },
  OUTROS: { color: '#6b7280', letter: 'O' },
};

const categoryIcon = (category: string) => {
  const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.OUTROS;
  return L.divIcon({
    className: 'zelo-category-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${style.color};color:#fff;font-weight:800;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:11px;">${style.letter}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

const userIcon = L.divIcon({
  className: 'zelo-user-marker',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2F86C9;border:3.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Local da ocorrência informado pelo denunciante (pré-alerta ou aprovado). */
const missingPersonIcon = (preAlert: boolean) => {
  const color = preAlert ? '#d97706' : '#dc2626';
  const ring = preAlert
    ? 'box-shadow:0 0 0 6px rgba(245,158,11,0.25),0 2px 10px rgba(0,0,0,0.4);'
    : 'box-shadow:0 2px 10px rgba(0,0,0,0.4);';
  return L.divIcon({
    className: 'zelo-missing-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${color};color:#fff;font-weight:900;font-size:22px;line-height:1;border:3px solid #fff;${ring}">!</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const hasMapLocation = (alert: MissingPersonReportDTO) =>
  alert.lat != null && alert.lng != null
  && Number.isFinite(alert.lat) && Number.isFinite(alert.lng);

/**
 * O Leaflet repete os tiles do mapa infinitamente ao arrastar na horizontal
 * (world wrap), mas marcadores existem apenas na cópia "canonical" do mundo —
 * sem cópias, a tela fica VAZIA ao rolar para o extremo oposto.
 * Renderizamos cada marcador também em lng±360 para acompanhar o terreno.
 */
const WORLD_COPIES = [-1, 0, 1];

/**
 * Agrupa marcadores de incidentes com leaflet.markercluster:
 * - clusters exibem o CONTADOR de pontos agrupados (cor por faixa de qtd)
 * - clique no cluster aproxima o zoom e desagrupa fluidamente
 * - no zoom máximo (16+) a clusterização é desativada; spiderfy no limite
 * - cópias em lng±360 acompanham o world wrap do Leaflet
 */
const ClusterLayer = ({
  incidents,
  onIncidentClick,
}: {
  incidents: IncidentResponseDTO[];
  onIncidentClick: (inc: IncidentResponseDTO) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 16,
      maxClusterRadius: 60,
      animate: true,
      animateAddingMarkers: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 38 : count < 50 ? 46 : 54;
        const color = count < 10 ? '#2F86C9' : count < 50 ? '#f97316' : '#dc2626';
        return L.divIcon({
          className: 'zelo-cluster-icon',
          html: `<div style="width:100%;height:100%;border-radius:50%;background:${color};color:#fff;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">${count}</div>`,
          iconSize: [size, size],
        });
      },
    });

    const layers: L.Marker[] = [];
    for (const inc of incidents) {
      for (const k of WORLD_COPIES) {
        const marker = L.marker([inc.lat, inc.lng + k * 360], {
          icon: categoryIcon(inc.category),
        });
        marker.on('click', () => onIncidentClick(inc));
        layers.push(marker);
      }
    }
    group.addLayers(layers);
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      group.clearLayers();
    };
  }, [map, incidents, onIncidentClick]);

  return null;
};

/** Captura cliques no mapa (apenas quando o modo de criação está ativo). */
const MapClickHandler = ({ creating, onMapClick }: { creating: boolean; onMapClick: (e: any) => void }) => {
  useMapEvents({
    click: (e: any) => {
      if (creating) onMapClick(e);
    },
  });
  return null;
};

/**
 * Move o mapa quando o centro muda.
 * A prop `center` do MapContainer só vale no 1º render (limitação do react-leaflet),
 * então a geolocalização precisa deste componente para centralizar de verdade.
 *
 * O `zoom` também é aplicado quando muda: sem isso o mapa recentralizava no
 * usuário mas mantinha o zoom afastado do carregamento inicial.
 */
const Recenter = ({ center, zoom }: { center: MapPoint; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
};

/** Botão flutuante para centralizar o mapa na localização do usuário. */
const LocateButton = ({ onClick, hasLocation }: { onClick: () => void; hasLocation: boolean }) => {
  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Sem localização conhecida: solicita a permissão/agora ao usuário
    if (!hasLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => onClick(),
        () => alert('Não foi possível obter sua localização. Verifique a permissão de localização do navegador.'),
        { enableHighAccuracy: true, timeout: 10000 },
      );
      return;
    }
    onClick();
  };
  return (
    <button
      onClick={handleLocate}
      aria-label="Minha localização"
      title="Minha localização"
      // Posicionamento 100% em CSS (.zelo-locate-btn): no celular fica no
      // topo-esquerda do mapa, no desktop no canto inferior direito.
      className="zelo-locate-btn flex items-center justify-center
        w-11 h-11 bg-white rounded-full shadow-xl border border-slate-200
        text-slate-700 hover:bg-slate-50 active:scale-95 transition"
    >
      <Target className="w-5 h-5 text-blue-600" />
    </button>
  );
};

interface MapViewProps {
  center: MapPoint;
  incidents: IncidentResponseDTO[];
  userLocation: MapPoint | null;
  onIncidentClick: (inc: IncidentResponseDTO) => void;
  /** Alertas de desaparecidos com localização pública do denunciante. */
  missingAlerts?: MissingPersonReportDTO[];
  onMissingClick?: (alert: MissingPersonReportDTO) => void;
  creating: boolean;
  pendingLocation: MapPoint | null;
  onMapClick: (e: any) => void;
  createError: string | null;
  onCenterOnUserLocation: () => void;
  /** Lista de pontos críticos aberta? No celular ela cobre a tela toda. */
  panelOpen?: boolean;
}

/** Zoom padrão antes de conhecermos a posição real do usuário. */
const DEFAULT_ZOOM = 15;
/** Zoom aproximado (nível de rua) quando centralizamos no usuário. */
const USER_ZOOM = 17;

export default function MapView({
  center,
  incidents,
  userLocation,
  onIncidentClick,
  missingAlerts = [],
  onMissingClick,
  creating,
  pendingLocation,
  onMapClick,
  createError,
  onCenterOnUserLocation,
  panelOpen = false,
}: MapViewProps) {
  // Enquanto não há localização real do usuário, fica no zoom padrão; assim que
  // ela chega (permissão concedida) aproxima para nível de rua. Também aproxima
  // sempre que o usuário toca em "Minha localização" (userLocation já definida).
  const zoom = userLocation ? USER_ZOOM : DEFAULT_ZOOM;
  // No celular, com a lista de pontos críticos aberta, a tela inteira é do
  // painel — o botão flutuante sairia por cima dele.
  const mobile = useIsMobile();
  const mapCovered = mobile && panelOpen;
  return (
    <div className="absolute inset-0 z-[var(--z-map)]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className={`zelo-map-container z-0${mapCovered ? ' zelo-map-covered' : ''}`}
        zoomControl
        attributionControl={false}
        // Ao cruzar a linha de data, recentraliza automaticamente para a cópia
        // canônica do mundo (visualmente idêntico) — evita "mundo vazio" sem fim.
        worldCopyJump
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        {userLocation && (
          <>
            {WORLD_COPIES.map((k) => (
              <Marker
                key={`user-${k}`}
                position={[userLocation.lat, userLocation.lng + k * 360]}
                icon={userIcon}
              >
                <Popup>Sua localização atual</Popup>
              </Marker>
            ))}
            {creating &&
              WORLD_COPIES.map((k) => (
                <Circle
                  key={`user-circle-${k}`}
                  center={[userLocation.lat, userLocation.lng + k * 360]}
                  radius={500}
                  color="#1B8E5A"
                  weight={2}
                  fillColor="#1B8E5A"
                  fillOpacity={0.1}
                  dashArray="6 8"
                />
              ))}
          </>
        )}
        <ClusterLayer incidents={incidents} onIncidentClick={onIncidentClick} />

        {/* Local público da ocorrência informado pelo denunciante. O marcador
            fica acima dos incidentes e abre o alerta; o círculo mostra o raio
            de 1 km do pré-alerta ou o alcance local depois da aprovação. */}
        {missingAlerts.filter(hasMapLocation).map((alert) => {
          const title = `${alert.preAlert ? 'Pré-alerta' : 'Alerta'} de ${
            alert.kind === 'SEQUESTRO' ? 'sequestro' : 'pessoa desaparecida'
          }: ${alert.personName}`;
          const color = alert.preAlert ? '#d97706' : '#dc2626';
          return WORLD_COPIES.map((k) => (
            <Fragment key={`missing-${alert.id}-${k}`}>
              {typeof alert.radiusMeters === 'number' && alert.radiusMeters > 0 && (
                <Circle
                  center={[alert.lat!, alert.lng! + k * 360]}
                  radius={alert.radiusMeters}
                  pathOptions={{
                    color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 0.12,
                    dashArray: alert.preAlert ? '6 6' : undefined,
                  }}
                  bubblingMouseEvents={false}
                  eventHandlers={{ click: () => onMissingClick?.(alert) }}
                />
              )}
              <Marker
                position={[alert.lat!, alert.lng! + k * 360]}
                icon={missingPersonIcon(!!alert.preAlert)}
                title={title}
                alt={title}
                zIndexOffset={1000}
                bubblingMouseEvents={false}
                eventHandlers={{ click: () => onMissingClick?.(alert) }}
              />
            </Fragment>
          ));
        })}

        {creating && pendingLocation && (
          <Marker
            position={[pendingLocation.lat ?? 0, pendingLocation.lng ?? 0] as [number, number]}
            icon={L.divIcon({
              className: 'zelo-pending-marker',
              html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#f59e0b;color:#fff;font-weight:800;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:11px;">+</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })}
          />
        )}
        <MapClickHandler creating={creating} onMapClick={onMapClick} />
        <Recenter center={center} zoom={zoom} />
      </MapContainer>
      {!mapCovered && (
        <LocateButton onClick={onCenterOnUserLocation} hasLocation={!!userLocation} />
      )}
      {createError && (
        <div
          style={{ top: 'calc(var(--zelo-header-h) + 8px)' }}
          className="absolute left-1/2 -translate-x-1/2 z-[var(--z-map-msg)] max-w-[92vw] bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg shadow-xl text-center text-sm font-medium border border-red-400/30 backdrop-blur-sm"
        >
          {createError}
        </div>
      )}
    </div>
  );
}
