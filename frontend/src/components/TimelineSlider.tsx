import React from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import type { IncidentResponseDTO } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

/** Intervalo de tempo [início, fim] em ms. null = período completo (sem filtro). */
export interface TimeRange {
  start: number;
  end: number;
}

interface TimelineSliderProps {
  /** Incidentes sem filtro (para calcular o intervalo e a contagem). */
  incidents: IncidentResponseDTO[];
  /** Intervalo selecionado; null = período completo (comportamento atual, sem filtro). */
  timeRange: TimeRange | null;
  onChange: (range: TimeRange | null) => void;
  /** Sidebar lateral aberta? (no desktop desloca a barra para não cobrir a lista) */
  panelOpen?: boolean;
}

/** Timestamp em que o incidente foi resolvido (primeira entrada da lista = evento mais recente). */
const resolvedAt = (inc: IncidentResponseDTO): number | null => {
  if (inc.status !== 'RESOLVIDO') return null;
  const latest = inc.statusHistory?.[0];
  return latest && latest.newStatus === 'RESOLVIDO'
    ? new Date(latest.createdAt).getTime()
    : null;
};

/**
 * "Ativo durante a janela [start, end]".
 *
 * Regra (as DUAS pontas contam):
 * - tem de JÁ EXISTIR no início da janela (`createdAt <= end` é o limite superior
 *   de exibição, e `createdAt >= start` garante que pontos criados antes do
 *   marcador de INÍCIO saiam do mapa — o usuário quer um recorte real do período);
 * - se foi RESOLVIDO, a resolução tem de ser POSTERIOR a `end` — senão ele já
 *   estava fora de operação quando a janela terminou.
 *
 * Consequência importante: como a janela padrão termina no PRESENTE (`end = agora`),
 * pontos RESOLVIDOS desaparecem do mapa. Eles só reaparecem quando o usuário
 * puxa o marcador de fim para ANTES do instante da resolução (ver histórico).
 */
export const isActiveDuring = (inc: IncidentResponseDTO, start: number, end: number): boolean => {
  const created = new Date(inc.createdAt).getTime();
  // Criado depois do fim da janela: ainda não existia.
  if (created > end) return false;
  // Criado antes do início da janela: fora do recorte escolhido.
  // (start = -Infinity no "período completo" ⇒ esta linha não filtra nada.)
  if (created < start) return false;
  const resolved = resolvedAt(inc);
  return resolved === null || resolved > end;
};

const formatMoment = (ms: number): string => {
  const d = new Date(ms);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Linha do tempo / playback do mapa com DOIS marcadores (início e fim):
 * arraste cada um para definir a janela de tempo em que se quer ver os pontos.
 * Um ponto aparece se estava ativo em algum momento da janela. Botão ▶ reproduz
 * a janela até o presente em ~6s. "Período completo" limpa o filtro.
 */
export default function TimelineSlider({ incidents, timeRange, onChange, panelOpen }: TimelineSliderProps) {
  const [playing, setPlaying] = React.useState(false);
  const mobile = useIsMobile();
  // Ref via estado (e não useRef): no celular a barra pode ser desmontada
  // quando a lista lateral abre (tela cheia) e remontada depois. Com useRef o
  // efeito rodaria uma única vez, ainda sem o elemento na DOM, e a medição
  // --zelo-timeline-h nunca seria atualizada → o botão "registrar" acabaria
  // sobre a linha do tempo.
  const [card, setCard] = React.useState<HTMLDivElement | null>(null);

  // Publica a altura REAL da linha do tempo em --zelo-timeline-h, para que o
  // botão "registrar" e o "minha localização" fiquem sempre ACIMA dela (a
  // barra muda de altura conforme os contadores/avisos que aparecem).
  React.useEffect(() => {
    if (!card) return;
    const apply = () => {
      // + 8px do padding inferior do container (respiro sobre a borda)
      document.documentElement.style.setProperty(
        '--zelo-timeline-h',
        `${card.offsetHeight + 8}px`,
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(card);
    return () => ro.disconnect();
  }, [card]);

  const range = React.useMemo(() => {
    const now = Date.now();
    if (incidents.length === 0) return { min: now - 24 * 3600 * 1000, max: now };
    const min = Math.min(...incidents.map((i) => new Date(i.createdAt).getTime()));
    return { min, max: now };
  }, [incidents]);

  const selected: TimeRange = timeRange ?? { start: range.min, end: range.max };
  const filterActive = timeRange !== null;
  const span = Math.max(1, range.max - range.min);
  const startPct = ((selected.start - range.min) / span) * 100;
  const endPct = ((selected.end - range.min) / span) * 100;

  // Mesma regra do App: sem filtro a janela vai do começo até "agora", então
  // resolvidos não contam (a contagem precisa bater com o que está no mapa).
  const visibleCount = incidents.filter((i) =>
    isActiveDuring(
      i,
      filterActive ? selected.start : Number.NEGATIVE_INFINITY,
      filterActive ? selected.end : Date.now(),
    ),
  ).length;

  // Resolvidos ocultos pela regra do "presente": foram resolvidos ANTES do fim
  // da janela (por isso não aparecem) — é o aviso "N resolvidos ocultos".
  const hiddenResolvedCount = incidents.filter((i) => {
    const resolved = resolvedAt(i);
    if (resolved === null) return false;
    const windowEnd = filterActive ? selected.end : Date.now();
    return resolved < windowEnd;
  }).length;

  // Criados antes do marcador de INÍCIO: também saem do recorte, mas por tempo
  // de criação (não por resolução). Aviso separado para o usuário entender.
  const hiddenBeforeStartCount = filterActive
    ? incidents.filter(
        (i) =>
          new Date(i.createdAt).getTime() < selected.start &&
          !(resolvedAt(i) !== null && resolvedAt(i)! < selected.end),
      ).length
    : 0;

  const commit = (start: number, end: number) => {
    // Extremos = período completo (equivale a "sem filtro")
    if (start <= range.min && end >= range.max - 60000) {
      onChange(null);
      return;
    }
    onChange({ start, end });
  };

  const handleStart = (v: number) => {
    setPlaying(false);
    // Não deixa o início ultrapassar o fim
    commit(Math.min(v, selected.end - 60000), Math.max(v, selected.end));
  };

  const handleEnd = (v: number) => {
    setPlaying(false);
    commit(Math.min(selected.start, v), Math.max(v, selected.start + 60000));
  };

  // Playback: a janela avança (início e fim juntos) até o fim alcançar o presente
  React.useEffect(() => {
    if (!playing) return;
    const step = Math.max(60000, span / 100);
    const id = setInterval(() => {
      const nextEnd = selected.end + step;
      if (nextEnd >= range.max) {
        onChange(null); // chega ao presente e para
        setPlaying(false);
        return;
      }
      onChange({ start: selected.start + step, end: nextEnd });
    }, 60);
    return () => clearInterval(id);
  }, [playing, range.max, span, selected.start, selected.end, onChange]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // No período completo, reinicia do começo com uma janela pequena
    if (!filterActive) {
      const windowSize = Math.max(60000, span * 0.1);
      onChange({ start: range.min, end: range.min + windowSize });
    }
    setPlaying(true);
  };

  // No celular a lista de pontos críticos vira tela cheia: a linha do tempo
  // some junto com o botão "registrar" para não sobrar nada por cima dela.
  if (mobile && panelOpen) return null;

  return (
    <div
      // O padding extra de baixo (safe area do iPhone) é CSS puro: classe
      // arbitrária do Tailwind com `env()` não é gerada pelo Tailwind.
      style={{ paddingBottom: 'calc(8px + var(--zelo-safe-bottom))' }}
      className={`fixed inset-x-0 bottom-0 z-[var(--z-float)] pointer-events-none px-2 sm:bottom-4 sm:px-4 ${
        panelOpen ? 'md:pl-[356px]' : 'md:pl-4'
      } pr-2 md:pr-[220px]`}
    >
      <div className="pointer-events-none w-full max-w-[560px] mx-auto">
        <div
          ref={setCard}
          className="pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5
          flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center sm:gap-3"
        >
          {/* Linha 1: título + contagem (no celular o play fica ao lado do título) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={togglePlay}
              title={playing ? 'Pausar reprodução' : 'Reproduzir o período'}
              aria-label={playing ? 'Pausar reprodução' : 'Reproduzir o período'}
              className="shrink-0 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-px" />}
            </button>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Linha do tempo
            </span>
            <button
              onClick={() => {
                setPlaying(false);
                onChange(null);
              }}
              title="Mostrar o período completo (todos os pontos)"
              className={`ml-auto sm:hidden shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Tudo
            </button>
          </div>

          {/* Linha 2: período + contagens */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[11px] text-slate-500 tabular-nums truncate">
                {formatMoment(selected.start)} – {formatMoment(selected.end)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                {visibleCount} {visibleCount === 1 ? 'ponto' : 'pontos'}
                {hiddenResolvedCount > 0 && (
                  <span
                    className="text-emerald-600"
                    title="Pontos resolvidos ficam fora do mapa no presente — rebobine a linha do tempo para vê-los"
                  >
                    {' '}
                    · {hiddenResolvedCount} resolvido{hiddenResolvedCount === 1 ? '' : 's'}
                  </span>
                )}
                {hiddenBeforeStartCount > 0 && (
                  <span
                    className="text-amber-600"
                    title="Pontos registrados antes do marcador de início da janela — arraste o início para a esquerda para incluí-los"
                  >
                    {' '}
                    · {hiddenBeforeStartCount} anterior{hiddenBeforeStartCount === 1 ? '' : 'es'}
                  </span>
                )}
              </span>
            </div>

            {/* Trilha com dois marcadores (início e fim) — alvo de toque maior no celular */}
            <div className="zelo-dual-range relative h-9 sm:h-5 flex items-center">
              <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-200" />
              <div
                className="absolute h-1.5 rounded-full bg-blue-500"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
              />
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={60000}
                value={selected.start}
                onChange={(e) => handleStart(Number(e.target.value))}
                className="zelo-range zelo-range-start absolute inset-x-0 w-full h-9 sm:h-5 cursor-pointer bg-transparent"
                aria-label="Início do período"
                title={`Início: ${formatMoment(selected.start)}`}
              />
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={60000}
                value={selected.end}
                onChange={(e) => handleEnd(Number(e.target.value))}
                className="zelo-range zelo-range-end absolute inset-x-0 w-full h-9 sm:h-5 cursor-pointer bg-transparent"
                aria-label="Fim do período"
                title={`Fim: ${formatMoment(selected.end)}`}
              />
            </div>
          </div>

          {/* "Período completo" — no desktop fica ao lado da trilha */}
          <button
            onClick={() => {
              setPlaying(false);
              onChange(null);
            }}
            title="Mostrar o período completo (todos os pontos)"
            className={`hidden sm:flex shrink-0 items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filterActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Período completo</span>
            <span className="md:hidden">Tudo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
