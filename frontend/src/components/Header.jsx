import { Link } from "react-router-dom";

function Header() {
  return (
    <header>
      <h1>Zelo</h1>

      <nav>
        <button>Menu</button>

        <Link to="/login">
          Login / Cadastro
        </Link>
      </nav>
    </header>
  );
}

export default Header;