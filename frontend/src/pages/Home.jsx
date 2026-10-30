import Header from "../components/Header";
import AlertCard from "../components/AlertCard";
import { Link } from "react-router-dom";

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
        {
      id: 3,
      titulo: "Queimadas",
      descricao: "Possibilidades de queimadas em algumas região.",
    },
  ];
  return (
    <main className="w-full min-h-[120vh] p-[2rem] relative">
      <Header />

      <section>
        {/* <h2>Mapa</h2> */}
        <div className="h-[20rem] relative rounded-[2rem] bg-[var(--cor-de-fundo-da-pagina-login)]">
          <img src="/image/SVG.svg" alt="Imagem-do-map" className=" w-full h-full rounded-[2rem] object-cover relative"/>
          <p className="inline-block p-[.6rem] absolute left-[1.2rem] bottom-[1rem] border rounded-[2rem] text-[var(--cor-de-fundo-das-inputs)] bg-black">Mapa será exibido aqui.</p>
        </div>
      </section>
      <h2 className="mt-[2rem] mb-[.5rem] font-bold">Avisos</h2>

      <section>

        {avisos.map((aviso) => (
          <AlertCard
            key={aviso.id}
            titulo={aviso.titulo}
            descricao={aviso.descricao}
          />
        ))}        
      </section>
      <nav className="inset-x-0 py-[2rem] flex justify-around absolute bottom-0 text-[var(--cor-de-fonte-do-cards)] bg-[var(--cor-de-fundo-das-inputs)]">
        <div>
          <Link to="/perfil"><img src="/image/Button.svg" alt="icons-de-mapa"/></Link>
        </div>
        <div>
          <Link to="/maps"><img src="/image/Button (1).svg" alt="Icons-de-perfil" /></Link>
        </div>
      </nav>
    </main>
  );
}

export default Home;