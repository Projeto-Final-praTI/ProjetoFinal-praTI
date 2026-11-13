import { Crosshair, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import type { IncidentResponseDTO, IncidentCategory, IncidentStatus } from '@/types';
import { CATEGORY_STYLE } from './MapView';

/** Rótulos em PT-BR das categorias. */
const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  BURACO: 'Buraco',
  PONTE_QUEBRADA: 'Ponte quebrada',
  ALAGAMENTO: 'Alagamento',
  QUEDA_ARVORE: 'Queda de árvore',
  DESLIZAMENTO: 'Deslizamento',
  OUTROS: 'Outros',
};

const STATUS_STYLE: Record<IncidentStatus, string> = {
  ABERTO: 'bg-red-50 text-red-700 border-red-100',
  EM_ATENDIMENTO: 'bg-amber-50 text-amber-700 border-amber-100',
  RESOLVIDO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

/** Tempo decorrido em PT-BR: "agora", "há 12 min", "há 3 h", "há 2 d". */
const elapsed = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
};

interface CriticalPointsPanelProps {
  incidents: IncidentResponseDTO[];
  open: boolean;
  onToggle: () => void;
  onCenterOnPoint: (inc: IncidentResponseDTO) => void;
  onOpenIncident: (inc: IncidentResponseDTO) => void;
}

/**
 * Barra lateral retrátil com os últimos pontos críticos em ordem
 * cronológica (mais recente primeiro). Cada card mostra título,
 * categoria/gravidade, tempo decorrido e botão para centralizar o mapa
 * no ponto. A lista acompanha os dados em tempo real (App faz polling).
 */
export default function CriticalPointsPanel({
  incidents,
  open,
  onToggle,
  onCenterOnPoint,
  onOpenIncident,
}: CriticalPointsPanelProps) {
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      {/* Véu: só no celular (no desktop o painel é estreito e a lista pode
          ficar aberta junto do mapa). Fecha ao toque. */}
      {open && (
        <div
          className="md:hidden zelo-scrim z-[var(--z-side)]"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        aria-hidden={!open}
        className={`fixed left-0 z-[var(--z-side)] bg-white/95 backdrop-blur-sm
          border-r border-slate-200 shadow-2xl flex flex-col
          w-full md:w-80
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        // No celular o painel ocupa a tela INTEIRA (do header até o rodapé);
        // a linha do tempo e o botão "registrar" são escondidos nesse caso.
        style={{ top: 'calc(var(--zelo-header-h) + (var(--zelo-alert-h, 0px)))', bottom: 0 }}
      >
        {/* Cabeçalho */}
        <div className="pt-4 px-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <h2 className="font-bold text-slate-900 text-sm">Pontos críticos</h2>
          <span className="ml-auto text-xs text-slate-400">
            {sorted.length} {sorted.length === 1 ? 'ponto' : 'pontos'}
          </span>
          {/* Fecha a lista (mesma ação do botão da borda — no celular o botão
              lateral fica fora da tela quando o painel ocupa tudo). */}
          <button
            onClick={onToggle}
            className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Ocultar lista de pontos críticos"
            title="Ocultar lista"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Lista cronológica */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {sorted.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">
              Nenhum ponto crítico registrado por perto ainda.
            </div>
          )}

          {sorted.map((inc) => {
            const style = CATEGORY_STYLE[inc.category] || CATEGORY_STYLE.OUTROS;
            return (
              <div
                key={inc.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenIncident(inc)}
                onKeyDown={(e) => e.key === 'Enter' && onOpenIncident(inc)}
                className="px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold border-2 border-white shadow"
                    style={{ backgroundColor: style.color }}
                  >
                    {style.letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {inc.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        className="px-1.5 py-0.5 rounded-md border font-medium"
                        style={{ backgroundColor: `${style.color}1a`, color: style.color, borderColor: `${style.color}40` }}
                      >
                        {CATEGORY_LABEL[inc.category] || inc.category}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md border font-medium ${STATUS_STYLE[inc.status]}`}>
                        {inc.status.replace('_', ' ').toLowerCase()}
                      </span>
                      <span className="text-slate-400 ml-auto">{elapsed(inc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between pl-9">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {inc.upvotesCount}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCenterOnPoint(inc);
                    }}
                    title="Centralizar o mapa neste ponto"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                      text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Centralizar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Botão flutuante para ABRIR a lista (a borda do painel fecha).
          Fica acima do header no empilhamento para não sumir atrás dele. */}
      {!open && (
        <button
          onClick={onToggle}
          title="Mostrar lista de pontos críticos"
          aria-label="Mostrar lista de pontos críticos"
          className="fixed left-0 z-[var(--z-header)] flex items-center justify-center w-8 h-14
            bg-white border border-slate-200 shadow-xl rounded-r-lg text-slate-500
            hover:text-slate-800 hover:bg-slate-50 transition-all duration-300"
          style={{ top: 'calc(var(--zelo-header-h) + 50%)', transform: 'translateY(-50%)' }}
        >
          <ChevronRight className="w-4 h-4" />
          {sorted.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none">
              {sorted.length}
            </span>
          )}
        </button>
      )}
    </>
  );
}
