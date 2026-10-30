import { useState } from "react";
import { Link } from "react-router-dom";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [nomeInvalido, setNomeInvalido] = useState(null);
  
  const [email, setEmail] = useState("");
  const [emailInvalido, setEmailInvalido] = useState(null);
  
  const [cep, setCep] = useState('')
  const [cepInvalido, setCepInvalido] = useState(null)
  
  const [senha, setSenha] = useState("");
  const [senhaInvalida, setSenhaInvalida] = useState(null);
  
  console.log(nomeInvalido)

  const [erro, setErro] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!nome || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setErro("");

    console.log({
      nome,
      email,
      senha,
    });
  }

  return (
    <div className="min-h-screen text-[var(--cor-de-fundo-das-inputs))]">
      <video autoPlay loop playsInline muted className="w-full h-full object-cover fixed">
        <source src="/video/zelo-background-radar.mp4"/>  
      </video>
      <main className="min-h-screen p-[2rem] md:flex items-center xl:min-h-[120vh]">
        <section className="max-w-[50rem] p-[2rem] relative z-1">
          {/* <img src="../../public/image/zello-image.svg" alt="Imagem-do-Zello" className="w-[15rem] my-[5rem] mb-[2rem] mx-[auto] " /> */}
          <h1 className="text-[3rem] font-bold uppercase">Cadastrar</h1>
          <p className="mb-[2rem] text-center">Acesse para denunciar ocorrências e acompanhar sua região</p>

          <form onSubmit={handleSubmit} className="py-[5rem] px-[3rem] rounded-[.4rem] border-t border-t-[var(--sombra-de-borda-na-pagina-cadastro)] border-b border-b-[var(--sombra-de-borda-na-pagina-cadastro)]">
            <label className="block mb-[.5rem] text-[var(--cor-de-texto)] text-shadow-[.3rem_.0rem_white] uppercase">Insira seu Nome</label>
            <input placeholder="Digite seu nome"
              type="text"
              value={nome}
              onChange={event => {
                setNome(event.target.value)

                setNomeInvalido(!(event.target.value.length > 2))
              }}
              className={nomeInvalido === null ?'placeholder:text-[var(--cor-de-texto)] w-full mb-[3rem] p-[1.4rem] text-[var(--cor-de-texto)] rounded-[1rem] bg-[var(--cor-de-fundo-das-inputs)]'
                : nomeInvalido ?'block w-full mb-[3rem] p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] border-2 bg-[var(--cor-de-fundo-das-inputs)]'
                :'w-full mb-[3rem] p-[1rem] text-[var(--cor-de-texto)] rounded-[1rem] bg-[var(--cor-de-fundo-das-inputs)] outline-none border-3 border-[var(--cor-concluido)]'}
              />
            <label className=" block mb-[.5rem] text-[var(--cor-de-texto)] text-shadow-[.3rem_.0rem_white] uppercase">Insira seu Email</label>
            <input placeholder="email@example.com" 
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)

                setEmailInvalido(!(event.target.value.includes('@') && event.target.value.includes('.')))
              }}
              className={emailInvalido === null ? 'placeholder:text-[var(--cor-de-texto)] w-full p-[1.4rem] rounded-[1rem]  border-1 bg-[var(--cor-de-fundo-das-inputs)]'
                : emailInvalido ?'w-full p-[1rem] text-[var(--cor-de-texto)] rounded-[1rem] border-2 border-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]' 
                : 'w-full p-[1.4rem] text-[var(--cor-de-texto)] rounded-[1rem] bg-[var(--cor-de-fundo-das-inputs)] outline-none border-3 border-[var(--cor-concluido)]'
              }
            />
            <b className="inline-block mt-[.2rem] mb-[3rem] p-[.3rem] rounded-[.4rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]">Email precisa de @ e .</b>

            <label className="block mb-[.5rem] text-[var(--cor-de-texto)] text-shadow-[.3rem_.0rem_white] uppercase">Insira seu CEP</label>
            <input placeholder="00000-000" 
              type="cep"
              value={cep}
              onChange={(event) => {
                setCep(event.target.value)

                setCepInvalido(event.target.value.length !== 8)
              }}
              className={cepInvalido === null ? 'placeholder:text-[var(--cor-de-texto)] w-full p-[1.4rem] rounded-[1rem] bg-[var(--cor-de-fundo-das-inputs)]'
                : cepInvalido ? 'w-full p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'
                : 'w-full p-[1.4rem] rounded-[1rem] outline-none border-3 border-[var(--cor-concluido)] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]' 
              }
            />
            <b className="inline-block mt-[.2rem] p-[.3rem] mb-[3rem] text-[var(--cor-de-texto)] rounded-[.4rem] bg-[var(--cor-de-fundo-das-inputs)]">Máximo 8 digítos</b>
            <label className="block mb-[.5rem] text-[var(--cor-de-texto)] text-shadow-[.3rem_.0rem_white] uppercase">Senha</label>
            <input placeholder="Digite sua senha"
              type="password"
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value)

                setSenhaInvalida(event.target.value.length < 8)
              }}
              className={senhaInvalida === null ? 'placeholder:text-[var(--cor-de-texto)] block w-full p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'
                : senhaInvalida ? 'w-full p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'
                :'w-full p-[1.4rem] rounded-[1rem] outline-none border-3 text-[var(--cor-de-texto)] border-[var(--cor-concluido)] bg-[var(--cor-de-fundo-das-inputs)]'
              }
              />
            <b className="inline-block mt-[.2rem] mb-[3rem] p-[.3rem] text-[var(--cor-de-texto)] rounded-[.2rem] bg-[var(--cor-de-fundo-das-inputs)]">Mínimo 8 caracteres</b>
            {erro && <p>{erro}</p>}

            <button className="w-full p-[1rem] text-white bg-black rounded-[.4rem] uppercase cursor-pointer border-2 border-[var(--cor-de-fundo-da-pagina-login)]" type="submit">
              <Link to="/login">Cadastrar</Link>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Cadastro;