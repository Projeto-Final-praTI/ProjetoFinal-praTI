function AlertCard({ titulo, descricao, horario }) {
  let descricaoComLetraMaiscula = titulo.charAt(0).toUpperCase() + titulo.slice(1)
  let InserindoABordaDoCard = !descricaoComLetraMaiscula.includes("Área liberada")
  return (
    <article className={`mt-[1rem] p-[1rem] rounded-[1rem] bg-[var(--cor-de-fundo-das-inputs)]
    ${InserindoABordaDoCard ? 'border-l-5 border-[var(--cor-risco-de-alagamento)]' 
    : 'border-l-5 border-[var(--cor-concluido)]'
    }`}
    >
      <h3 className="mb-[.5rem] font-bold">{titulo}</h3>
      <p className="mb-[.5rem] text-[var(--cor-de-fonte-do-cards)]">{descricao}</p>
      <span className="m-[1rem]">{horario}</span>
    </article>
  );
}

export default AlertCard;