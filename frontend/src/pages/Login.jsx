import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState();
  const [emailInvalido, setEmailInvalido] = useState(false);
  
  const [senha, setSenha] = useState("");
  const [senhaInvalido, setSenhaInvalido] = useState(false);
  
  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      email,
      senha,
    });
  }  
    return (
      <div className="min-h-screen p-[.1rem] relative sm:min-h-[120rem]">
        <video autoPlay loop playsInline muted className="w-full h-full fixed object-cover">Navegador não carrega o vídeo
          <source src="/video/zelo-background.mp4" type="video/mp4"/>
        </video>
        <main className="w-full px-[2rem] relative z-1 sm:max-w-[50rem] sm:rounded-[1rem] sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-y-1/2 sm:-translate-x-1/2 sm:border-t-2 sm:border-t-[var(--cor-de-fundo-da-pagina-login)] sm:border-b-2 sm:border-b-[var(--cor-de-fundo-da-pagina-login)]">
          <h1 className="mt-[2rem] mb-[1rem] font-bold text-[3rem]">Entrar</h1>
          <p className="w-[30rem]">Acesse para denunciar ocorrências e acompanhar sua região</p>
          {/* <img src="../../public/image/zello-image.svg" alt="Imagem do zello" className="block w-[15rem] my-[5rem] mx-auto"/> */}
          <form onSubmit={handleSubmit} className="h-[60rem] mt-[32rem] relative">
            <label className="block font-bold mb-[.5rem]">E-mail</label>
            <input placeholder="Digite seu Email ou CPF" className="border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none" required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)

                setEmailInvalido(!(( event.target.value.length > 0 && event.target.value.includes('@')) && event.target.value.includes('.')))
              }}
              className={(email)? `border 
                ${emailInvalido ? 'w-[100%] mb-[2rem] p-[1.6rem] rounded-[1rem] border-2 outline-none bg-[var(--cor-de-fundo-das-inputs)]' : 'w-[100%] mb-[2rem] p-[1.6rem] rounded-[1rem] border-2 border-[var(--cor-concluido)] outline-none'
              }` :'block w-[100%] mb-[2.4rem] p-[1.6rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none'}
              />

            <label className="block font-bold mb-[.5rem]">Senha</label>
            <input placeholder="* * * * * * * * *" className="w-[100%] p-[1.6rem] rounded-[1rem] placeholder:text-[var(--cor-de-texto)]
              border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box]
              outline-none bg-[url('../../public/image/toggle-eye.svg')] bg-no-repeat bg-right"
              type="password" required
              value={senha}
              onChange={(event) => {
              setSenha(event.target.value)
              
              setSenhaInvalido(event.target.value.length <= 8)
            }}
            className={senha ? `border 
              ${senhaInvalido ? ' block w-[100%] p-[1.6rem] rounded-[1rem] outline-none border-2 bg-[var(--cor-de-fundo-das-inputs)]' : 'block w-[100%] p-[1.6rem] rounded-[1rem] outline-none border-2 border-[var(--cor-concluido)]'
                }`
                :'block w-[100%] p-[1.6rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none'
              }
            />
            <Link className=" block mt-[2rem] text-shadow-[.1rem_.1rem_var(--cor-de-texto)] text-right text-[var(--cor-concluido)]" to='/criarSenha'>Esqueci minha senha</Link>
            <button type="submit" className="w-full mb-[3rem] p-[1.4rem] absolute bottom-[6rem] font-bold text-[1.8rem] rounded-[2rem] cursor-pointer bg-[var(--cor-do-botao)]">Entrar</button>
            <p className="w-full text-center absolute bottom-[4rem]">Ainda não tem possui uma conta?
              <Link className=" text-shadow-[.1rem_.1rem_var(--cor-de-texto)] text-[var(--cor-do-botao)]" to="/cadastro">Cadastre-se</Link>
            </p>
          </form>
        </main>
      </div>
  );
}

export default Login;