import { useState } from "react";

function DenunciaModal({ onClose }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (titulo.trim().length < 3) {
      setErro("O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (descricao.trim().length < 10) {
      setErro("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }

    setErro("");

    const denuncia = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    };

    console.log("Nova denúncia:", denuncia);

    setTitulo("");
    setDescricao("");

    onClose();
  }

  return (
    <div>
      <div>
        <h2>Nova denúncia</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Título
            <input
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
            />
          </label>

          <label>
            Descrição
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </label>

          {erro && <p>{erro}</p>}

          <button type="submit">
            Enviar denúncia
          </button>

          <button
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

export default DenunciaModal;