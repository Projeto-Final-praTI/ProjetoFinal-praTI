import React from 'react';

/**
 * `true` quando a janela é "compacta" (largura OU altura pequenas).
 *
 * No celular (e em janelas baixas) os painéis de tela cheia e os modais
 * precisam ocupar tudo, enquanto no desktop ficam como cartões centralizados.
 * Usamos `matchMedia`, que reage a rotação do aparelho.
 */
export function useIsCompact(): boolean {
  const query = '(max-width: 767px), (max-height: 620px)';
  const [compact, setCompact] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setCompact(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return compact;
}
