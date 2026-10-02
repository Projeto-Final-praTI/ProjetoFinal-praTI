import { Link } from "react-router-dom";

function Login() {
  return (
    <main>
      <h1>Login</h1>

      <form>
        <label>
          E-mail
          <input type="email" />
        </label>

        <label>
          Senha
          <input type="password" />
        </label>

        <button type="submit">Entrar</button>
      </form>

      <p>
        Não possui conta?{" "}
        <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </main>
  );
}

export default Login;