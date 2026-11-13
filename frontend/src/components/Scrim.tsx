/**
 * Véu semitransparente sob os modais. Como o header está declarado ACIMA
 * (--z-header > --z-modal) e os modais ficam abaixo, o véu começa no fim do
 * header (--zelo-header-h), então o topo do conteúdo nunca é cortado em
 * telas baixas. Clique fecha o que estiver aberto.
 */
export default function Scrim({ onClick }: { onClick: () => void }) {
  return <div className="zelo-scrim z-[var(--z-modal)]" onClick={onClick} aria-hidden="true" />;
}
