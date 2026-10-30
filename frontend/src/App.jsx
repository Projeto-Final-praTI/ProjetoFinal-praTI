import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import CriarSenha from './pages/CriarSenha.jsx';
import Mapa from "./pages/Mapa.jsx";
import Perfil from './pages/Perfil.jsx';
import DenunciaDetalhes from "./pages/DenunciaDetalhes.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/criarSenha" element={<CriarSenha />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route
        path="/denuncias/:id"
        element={<DenunciaDetalhes />}
      />
    </Routes>
  );
}

export default App;