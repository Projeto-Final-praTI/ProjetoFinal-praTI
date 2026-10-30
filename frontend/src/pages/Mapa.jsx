import { useState } from "react";
import { Link } from "react-router-dom";
import DenunciaModal from "../components/DenunciaModal.jsx";

function Mapa() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main>
      <h1>Mapa</h1>

      <p>O mapa expandido será exibido aqui.</p>

      <button
        onClick={() => setModalAberto(true)}
      >
        Fazer denúncia
      </button>

      <Link to="/denuncias/1">
      Visualizar denúncia
      </Link>

      {modalAberto && (
        <DenunciaModal
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}


export default Mapa;