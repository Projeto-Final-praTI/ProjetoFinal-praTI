import { useCallback, useEffect, useState } from 'react';

/** Abas da Central de Desaparecidos refletidas na URL. */
export type MissingTab = 'active' | 'report' | 'moderation';

/**
 * Rotas do ZELO.
 *
 * O mapa é a tela-base: as rotas abrem os modais/painéis por cima dele, então
 * um link direto (ex.: `/login`) funciona e o botão "voltar" do navegador
 * fecha o modal em vez de sair do site.
 */
export type Route =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'about' }
  | { name: 'missing'; tab: MissingTab }
  | { name: 'missing-detail'; id: string }
  | { name: 'admin' }
  | { name: 'profile' }
  | { name: 'unknown' };

/** Caminhos canônicos usados pelos links internos. */
export const paths = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  about: '/sobre',
  missing: '/desaparecidos',
  missingReport: '/desaparecidos/denunciar',
  missingModeration: '/desaparecidos/moderacao',
  missingDetail: (id: string) => `/desaparecidos/${encodeURIComponent(id)}`,
  admin: '/admin',
  profile: '/perfil',
};

/** Converte o pathname atual em uma rota tipada. */
export function parsePath(pathname: string): Route {
  // Normaliza barras finais: `/login/` vira `/login`.
  const path = pathname.replace(/\/+$/, '') || '/';

  switch (path) {
    case '/':
      return { name: 'home' };
    case '/login':
      return { name: 'login' };
    case '/cadastro':
      return { name: 'register' };
    case '/sobre':
      return { name: 'about' };
    case '/desaparecidos':
      return { name: 'missing', tab: 'active' };
    case '/desaparecidos/denunciar':
      return { name: 'missing', tab: 'report' };
    case '/desaparecidos/moderacao':
      return { name: 'missing', tab: 'moderation' };
    case '/admin':
      return { name: 'admin' };
    case '/perfil':
      return { name: 'profile' };
  }

  const missingDetail = path.match(/^\/desaparecidos\/([^/]+)$/);
  if (missingDetail) {
    try {
      return { name: 'missing-detail', id: decodeURIComponent(missingDetail[1]) };
    } catch {
      return { name: 'unknown' };
    }
  }

  return { name: 'unknown' };
}

export interface NavigateOptions {
  /** Substitui a entrada atual do histórico (não cria um "voltar" extra). */
  replace?: boolean;
}

/** Marca as entradas criadas pelo app, para saber se dá para voltar. */
const ROUTE_STATE_KEY = '__zeloRoute';

/**
 * Roteador mínimo baseado na History API.
 *
 * Não adiciona dependência: o app tem uma única tela-base (o mapa) e os
 * modais são derivados da rota, então `pushState` + `popstate` bastam.
 */
export function useRoute() {
  const [route, setRoute] = useState<Route>(() =>
    parsePath(window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, opts?: NavigateOptions) => {
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === to) {
      // Mesmo caminho: garante que o estado acompanhe (ex.: hash/estado novo).
      setRoute(parsePath(to));
      return;
    }

    if (opts?.replace) {
      // Preserva o estado atual: um redirecionamento (ex.: `/perfil` sem login
      // → `/login`) não deve fingir que a rota foi aberta pelo app.
      window.history.replaceState(window.history.state || null, '', to);
    } else {
      window.history.pushState(
        { ...(window.history.state || {}), [ROUTE_STATE_KEY]: true },
        '',
        to,
      );
    }

    setRoute(parsePath(to));
  }, []);

  /**
   * Fecha o overlay voltando para a rota anterior. Se a rota atual foi aberta
   * por link direto (sem histórico interno), substitui por `fallback`.
   */
  const back = useCallback(
    (fallback: string = paths.home) => {
      if (window.history.state?.[ROUTE_STATE_KEY]) {
        window.history.back();
      } else {
        navigate(fallback, { replace: true });
      }
    },
    [navigate],
  );

  return { route, navigate, back };
}
