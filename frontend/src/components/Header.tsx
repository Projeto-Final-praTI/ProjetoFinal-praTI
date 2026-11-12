import React from 'react';
import {
  Loader2, CloudRain, ShieldCheck, UserCog, Info, Siren,
  Menu, X, LogIn, LogOut,
} from 'lucide-react';
import type { CurrentWeatherDTO, UserDTO } from '@/types';

interface HeaderProps {
  user: UserDTO | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  weather: CurrentWeatherDTO | null;
  /** Abre o painel administrativo (visível só para GESTOR/ROOT). */
  onOpenAdmin?: () => void;
  /** Abre a edição do próprio perfil (disponível para qualquer usuário logado). */
  onOpenProfile?: () => void;
  /** Abre o modal "Sobre o ZELO" (visível para todos, logados ou não). */
  onOpenAbout?: () => void;
  /** Abre a central de pessoas desaparecidas (visível para todos). */
  onOpenMissing?: () => void;
  /** Volta para o mapa (rota `/`). */
  onHome?: () => void;
  /**
   * Ação de mapa em andamento (criar ponto / escolher local). Enquanto ativa, a
   * barra sobe acima da gaveta de detalhe e do próprio formulário de criação,
   * para o usuário poder sair e voltar ao mapa no celular.
   */
  busy?: boolean;
}

export default function Header({
  user,
  onLogout,
  onOpenAuth,
  weather,
  onOpenAdmin,
  onOpenProfile,
  onOpenAbout,
  onOpenMissing,
  onHome,
  busy,
}: HeaderProps) {
  const ref = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const closeAndRun = (action?: () => void) => {
    setMenuOpen(false);
    action?.();
  };

  const menuItemClass =
    'flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left text-slate-200 hover:bg-white/10 hover:text-white transition';

  // Fecha o menu ao interagir com o mapa/fora do header ou pressionar Esc.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  React.useEffect(() => setMenuOpen(false), [user?.id]);

  // Mede a altura real da barra (ela quebra em 2 linhas no celular) e publica
  // em --zelo-header-h: é o que os painéis, modais e o véu usam como topo.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () =>
      document.documentElement.style.setProperty('--zelo-header-h', `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header
      ref={ref}
      className={`fixed top-0 left-0 right-0 px-3 sm:px-6 py-2 sm:py-3
        backdrop-blur-md bg-zelo-green-dark/90 border-b border-emerald-400/15
        flex items-center justify-between gap-2 text-white
        ${busy ? 'z-[var(--z-header-busy)]' : 'z-[var(--z-header)]'}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => closeAndRun(onHome)}
          aria-label="Ir para o mapa"
          title="Ir para o mapa"
          className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <img
            src="/brand/zelo-wordmark-light.svg"
            alt="ZELO"
            className="h-6 sm:h-7 w-auto select-none"
            draggable={false}
          />
        </button>
        {onOpenMissing && (
          <button
            onClick={() => closeAndRun(onOpenMissing)}
            title="Pessoas desaparecidas"
            aria-label="Pessoas desaparecidas"
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-red-500/25 text-white border border-red-300/40 shadow-sm hover:bg-red-500/40 hover:border-red-200/60 transition"
          >
            <Siren className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Desaparecidos</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 text-sm min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 shrink-0">
          {weather ? (
            <>
              <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium text-xs sm:text-sm">{weather.temperature?.toFixed(1)}°C</span>
            </>
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="zelo-header-menu"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 rounded-md bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition shrink-0"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="hidden sm:inline font-medium">Menu</span>
        </button>
      </div>

      {menuOpen && (
        <div
          id="zelo-header-menu"
          role="menu"
          aria-label="Menu principal"
          className="absolute right-3 sm:right-6 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] p-2 rounded-xl border border-white/10 bg-zelo-green-dark/95 shadow-2xl backdrop-blur-xl"
        >
          {user && (
            <div className="px-3 py-2 mb-1 border-b border-white/10 min-w-0">
              <div className="text-sm font-semibold truncate">{user.fullName}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          )}

          {onOpenAbout && (
            <button
              type="button"
              role="menuitem"
              onClick={() => closeAndRun(onOpenAbout)}
              className={menuItemClass}
            >
              <Info className="w-4 h-4 shrink-0" />
              Sobre o ZELO
            </button>
          )}

          {user ? (
            <>
              {onOpenProfile && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => closeAndRun(onOpenProfile)}
                  className={menuItemClass}
                >
                  <UserCog className="w-4 h-4 shrink-0" />
                  Meu perfil
                </button>
              )}
              {onOpenAdmin && (user.role === 'GESTOR' || user.role === 'ROOT') && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => closeAndRun(onOpenAdmin)}
                  className={menuItemClass}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  Painel administrativo
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => closeAndRun(onLogout)}
                className={`${menuItemClass} text-red-300 hover:bg-red-500/15 hover:text-red-200`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => closeAndRun(onOpenAuth)}
              className={`${menuItemClass} mt-1 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Entrar / Cadastrar
            </button>
          )}
        </div>
      )}
    </header>
  );
}
