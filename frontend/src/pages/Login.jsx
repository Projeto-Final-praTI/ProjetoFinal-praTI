import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      email,
      senha,
    });
  }

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />
        </label>

        <button type="submit">
          Entrar
        </button>
      </form>

      <p>
        Não possui conta?{" "}
        <Link to="/cadastro">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}

export default Login;