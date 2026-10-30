import { useState } from "react";
import { Link } from "react-router-dom";

function Perfil(){
    const [email, setEmail] = useState()
    const [nome, setnome] = useState()    
    const [telefone, setTelefone] = useState()    
    const [endereco, setEndereco] = useState()    
    const [cidade, setCidade] = useState()    
    const [estado, setEstado] = useState()
    
    return(
        <div className="w-full relative min-h-screen sm:min-h-[120rem]">
            <main className=" w-full p-[3rem] bg-[var(--cor-de-fundo-da-50rem] sm:w-[50rem] sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-y-1/2 sm:-translate-x-1/2 sm:border-1 sm:border-[var(--cor-de-fonte-do-cards)]">
                <img className="block w-[15rem] m-auto" src="/image/zello-image.svg" alt="Imagem-do-Zelo" />
                <input className="block w-[14rem] h-[14rem] p-[.5rem] m-auto rounded-[50%] text-transparent bg-[url('/image/avatar-com-camera.png')] bg-cover" type="file" />

                <b className="my-[3rem] uppercase text-[var(--cor-de-perfil)]">Perfil</b>

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">E-mail</label>
                <input className=" w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-de-fundo-das-inputs)]" type="text" />

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">Nome</label>
                <input className="w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-de-fundo-das-inputs)]" type="text" />

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">Telefone</label>
                <input className="w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-de-fundo-das-inputs)]" type="text" />

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">Endereço</label>
                <input className="w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-de-fundo-das-inputs)]" type="text" />

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">Cidade</label>
                <input className="w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-de-fundo-das-inputs)]" type="text" />

                <label className="block mt-[2rem] mb-[1rem] font-bold" htmlFor="">Estado</label>
                <input className="w-full p-[1rem] rounded-[1rem] border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(100deg,#3E93C9_0%,#1B6B3E_100%)_border-box] outline-none bg-[var(--cor-d-fundo-das-inputs)]" type="text" />

                <div className="flex gap-[.5rem]">
                    <botton className="mt-[2.6rem] mb-[1rem] p-[2rem] w-[50%] text-center rounded-[2rem] font-bold text-[var(--cor-de-fundo-das-inputs)] bg-linear-to-r from-[#1B6B3E] to-[#3E93C9]">
                        <Link To='/home'>Salvar</Link>
                    </botton>
                    <botton className="mt-[2.6rem] mb-[1rem] p-[2rem] w-[50%] text-center rounded-[2rem] font-bold text-[var(--cor-de-fundo-das-inputs)] bg-linear-to-r from-[#1B6B3E] to-[#3E93C9]">
                        <Link to='/home'>Voltar</Link>
                    </botton>
                </div>   
            </main>
        </div>
    )
}
export default Perfil