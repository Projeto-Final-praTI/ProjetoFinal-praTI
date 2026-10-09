import { useState } from "react";
import { Link, useParams } from "react-router-dom";

function DenunciaDetalhes() {
  const { id } = useParams();

  const usuarioLogado = false;

  const denuncia = {
    id,
    titulo: "Alagamento",
    descricao: "Rua alagada após fortes chuvas na região.",
    localizacao: "Centro",
    data: "08/10/2026",
  };

  const [comentarios, setComentarios] = useState([
    {
      id: 1,
      autor: "Usuário 1",
      texto: "A água continua subindo.",
    },
    {
      id: 2,
      autor: "Usuário 2",
      texto: "Evitem passar por essa rua.",
    },
  ]);

  const [novoComentario, setNovoComentario] = useState("");
  const [erro, setErro] = useState("");

  function handleComentario(event) {
    event.preventDefault();

    if (!novoComentario.trim()) {
      setErro("Digite um comentário.");
      return;
    }

    const comentario = {
      id: Date.now(),
      autor: "Usuário",
      texto: novoComentario.trim(),
    };

    setComentarios((comentariosAtuais) => [
      ...comentariosAtuais,
      comentario,
    ]);

    setNovoComentario("");
    setErro("");
  }

  return (
    <main>
      <Link to="/mapa">← Voltar para o mapa</Link>

      <h1>{denuncia.titulo}</h1>

      <section>
        <h2>Informações da denúncia</h2>

        <p>
          <strong>ID:</strong> {denuncia.id}
        </p>

        <p>
          <strong>Descrição:</strong> {denuncia.descricao}
        </p>

        <p>
          <strong>Localização:</strong> {denuncia.localizacao}
        </p>

        <p>
          <strong>Data:</strong> {denuncia.data}
        </p>
      </section>

      <section>
        <h2>Comentários</h2>

        {comentarios.map((comentario) => (
          <article key={comentario.id}>
            <strong>{comentario.autor}</strong>
            <p>{comentario.texto}</p>
          </article>
        ))}

        {usuarioLogado ? (
          <form onSubmit={handleComentario}>
            <label>
              Novo comentário
              <textarea
                value={novoComentario}
                onChange={(event) =>
                  setNovoComentario(event.target.value)
                }
              />
            </label>

            {erro && <p>{erro}</p>}

            <button type="submit">
              Comentar
            </button>
          </form>
        ) : (
          <p>
            Faça login para adicionar comentários.
          </p>
        )}
      </section>
    </main>
  );
}

export default DenunciaDetalhes;