import React from 'react';
import { Siren } from 'lucide-react';
import type { MissingPersonReportDTO, WeatherAlertDTO } from '@/types';

const SEVERITY_STYLE: Record<string, { bg: string; border: string }> = {
  AMARELO: { bg: 'bg-yellow-500/90', border: 'border-yellow-400/60' },
  LARANJA: { bg: 'bg-orange-500/90', border: 'border-orange-400/60' },
  VERMELHO: { bg: 'bg-red-600/90', border: 'border-red-400/60' },
};

const SEVERITY_LABEL: Record<string, string> = {
  AMARELO: 'Atenção',
  LARANJA: 'Alerta',
  VERMELHO: 'Perigo',
};

interface AlertBannerProps {
  alerts: WeatherAlertDTO[];
  /** Denúncias de pessoa desaparecida/sequestro aprovadas e ativas. */
  missingAlerts?: MissingPersonReportDTO[];
  onOpenDetail: (alert: WeatherAlertDTO) => void;
  onOpenMissing?: (alert: MissingPersonReportDTO) => void;
}

/**
 * Banner fixo abaixo do cabeçalho. Mostra TODOS os alertas ativos (clima +
 * oficiais + pessoas desaparecidas) empilhados, em vez de esconder os demais
 * atrás do primeiro.
 */
export default function AlertBanner({
  alerts,
  missingAlerts = [],
  onOpenDetail,
  onOpenMissing,
}: AlertBannerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const total = alerts.length + missingAlerts.length;

  React.useEffect(() => {
    const el = ref.current;
    if (el) {
      document.documentElement.style.setProperty('--zelo-alert-h', `${el.offsetHeight + 4}px`);
    } else {
      document.documentElement.style.setProperty('--zelo-alert-h', '0px');
    }
    if (!el) return;
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--zelo-alert-h', `${el.offsetHeight + 4}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);

  if (total === 0) return null;

  return (
    <div
      ref={ref}
      style={{ top: 'calc(var(--zelo-header-h) + 4px)' }}
      className="fixed left-0 right-0 z-[var(--z-alert)] flex flex-col"
    >
      {/* Pessoas desaparecidas: prioridade máxima, visual próprio */}
      {missingAlerts.map((alert, index) => (
        <div
          key={`missing-${alert.id}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onOpenMissing?.(alert)}
          onClick={() => onOpenMissing?.(alert)}
          className={`alert-banner bg-gradient-to-r from-red-700 via-red-600 to-orange-500 border-red-400/60 text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-xl cursor-pointer border-t ${
            index === 0 ? 'border-t-0' : ''
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Siren className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="font-semibold shrink-0">
              {alert.kind === 'SEQUESTRO' ? 'Sequestro' : 'Desaparecido'}
            </span>
            {alert.preAlert && (
              <span className="shrink-0 px-1.5 py-0.5 rounded border border-white/50 bg-white/20 text-[10px] font-bold uppercase tracking-wide">
                Pré-alerta 1 km
              </span>
            )}
            <span className="text-xs opacity-90 truncate">• {alert.personName}</span>
            <span className="hidden md:inline text-[11px] opacity-75 shrink-0">
              {alert.preAlert
                ? '· 10 min'
                : alert.scope === 'GLOBAL'
                  ? '· Global'
                  : alert.city
                    ? `· ${alert.city}`
                    : ''}
            </span>
          </div>
          <span className="text-xs font-medium underline underline-offset-4 shrink-0">
            {alert.preAlert ? 'Ver pré-alerta' : 'Ver alerta'}
          </span>
        </div>
      ))}

      {/* Clima + alertas oficiais */}
      {alerts.map((alert, index) => {
        const style = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.AMARELO;
        return (
          <div
            key={alert.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenDetail(alert)}
            onClick={() => onOpenDetail(alert)}
            className={`alert-banner ${style.bg} ${style.border} text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-xl cursor-pointer border-t ${
              index === 0 && missingAlerts.length === 0 ? 'border-t-0' : ''
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <span className="font-semibold shrink-0">{SEVERITY_LABEL[alert.severity]}</span>
              {alert.custom && (
                <span className="hidden sm:inline shrink-0 px-1.5 py-0.5 rounded border border-white/40 bg-white/15 text-[10px] font-bold uppercase tracking-wide">
                  Oficial
                </span>
              )}
              <span className="text-xs opacity-90 truncate">• {alert.title}</span>
              {alert.custom && (
                <span className="hidden md:inline text-[11px] opacity-75 shrink-0">
                  {alert.scope === 'GLOBAL' ? '· Global' : alert.city ? `· ${alert.city}` : ''}
                </span>
              )}
            </div>
            <span className="text-xs font-medium underline underline-offset-4 shrink-0">
              Ver detalhes
            </span>
          </div>
        );
      })}
    </div>
  );
}
