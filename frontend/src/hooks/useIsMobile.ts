import React from 'react';

/**
 * `true` quando a tela é de celular (largura < 768px).
 *
 * Diferente de `useIsCompact` (que também considera janelas BAIXAS no
 * desktop), aqui a pergunta é "o layout é o de celular?", porque é nele que
 * os painéis viram tela cheia e disputam espaço com a pilha inferior de
 * controles (linha do tempo + botões flutuantes).
 */
export function useIsMobile(): boolean {
  const query = '(max-width: 767px)';
  const [mobile, setMobile] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return mobile;
}
