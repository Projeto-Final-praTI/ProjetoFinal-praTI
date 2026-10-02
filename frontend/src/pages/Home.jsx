import Header from "../components/Header";
import AlertCard from "../components/AlertCard";

function Home() {
  const avisos = [
    {
      id: 1,
      titulo: "Alerta de chuva",
      descricao: "Possibilidade de chuva forte na região.",
    },
    {
      id: 2,
      titulo: "Alerta de alagamento",
      descricao: "Ocorrência registrada em uma área próxima.",
    },
  ];

  return (
    <main>
      <Header />

      <section>
        <h2>Mapa</h2>

        <div>
          <p>Mapa será exibido aqui.</p>
        </div>
      </section>

      <section>
        <h2>Avisos</h2>

        {avisos.map((aviso) => (
          <AlertCard
            key={aviso.id}
            titulo={aviso.titulo}
            descricao={aviso.descricao}
          />
        ))}
      </section>
    </main>
  );
}

export default Home;