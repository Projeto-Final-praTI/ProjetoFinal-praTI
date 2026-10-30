import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="mb-[1rem]">
      {/* <h1>Zelo</h1> */}
      <nav className="flex items-center justify-between">
        <img src="/image/menu.svg" alt="imagem-do-menu" />
        <Link to="/login"><img src="/image/Zelo.svg" alt="Imagem-do-zelo"/></Link>
        {/* <button>Menu</button> */}
        <Link className="font-bold p-[.6rem] rounded-[2rem] text-[var(--cor-do-botao)] border border-[var(--cor-concluido)]" to="/login">Login</Link>
      </nav>
    </header>
  );
}

export default Header;