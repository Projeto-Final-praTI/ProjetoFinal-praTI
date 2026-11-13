import React from 'react';

/**
 * Trava o scroll do fundo enquanto `active` for true (modais, gaveta, painel)
 * e devolve a rolagem anterior ao desativar.
 *
 * Usa a classe `zelo-scroll-lock` (position: fixed + top negativo), que
 * preserva a posição sem causar o "salto" típico de apenas `overflow: hidden`
 * no celular — importante porque o app é um mapa em tela cheia.
 */
export function useBodyScrollLock(active: boolean): void {
  React.useEffect(() => {
    if (!active) return;
    const y = window.scrollY;
    const body = document.body;
    body.style.top = `-${y}px`;
    body.classList.add('zelo-scroll-lock');
    return () => {
      body.classList.remove('zelo-scroll-lock');
      body.style.top = '';
      window.scrollTo(0, y);
    };
  }, [active]);
}
