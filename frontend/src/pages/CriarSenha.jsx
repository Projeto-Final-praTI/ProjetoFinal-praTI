import { useState } from 'react';
import { Link } from 'react-router-dom';

function CriarSenha(event){
    // event.preventDefault();

    let [email, setEmail] = useState()
    let [emailInvalido, setEmailInvalido] = useState(null)

    let [novaSenha, setNovaSenha] = useState()
    let [novaSenhaInvalida, setNovaSenhaInvalida] = useState(null)
    
    console.log(emailInvalido)

    return(
        <div className='min-h-screen flex items-center justify-center'>
            <video autoPlay loop playsInline muted className='w-full h-full inset-0 fixed object-cover object-[25%_center] md:object-[40%_center] lg:object-[38%_center]'>
                <source src="/video/zelo-background-nova-senha-chave.mp4" type="video/mp4"/>
            </video>
            <main className='mx-[2rem] relative sm:w-[94%] md:w-[92%] lg:w-[90%] xl:w-[64%]'>
                <section className='w-full max-w-[50rem] my-[2rem] ml-auto p-[3rem] rounded-[.6rem] text-[var(--cor-de-fundo-das-inputs)] border-1 border-[var(--cor-concluido)]'>
                    <img className='block w-[15rem] m-auto p-[1rem] rounded-[50%] bg-[var(--cor-de-fundo-das-inputs)]' src="image/zello-image.svg" alt="Imagem-Zello" />
                    <h1 className='my-[2rem] text-bold text-center'>Cria senha</h1>
                    <p>Acesse para denunciar ocorrências e acompanhar sua região</p>
                    <form>
                        <label htmlFor="email" className='block mt-[2rem] mb-[1rem] uppercase'>Insira seu Email:</label>
                        <input require placeholder="Insira sua a nova senha" type="text" value={email} onChange={(event) => {
                            email = event.target.value

                            setEmailInvalido(event.target.value.includes('@') && event.target.value.includes('.'))
                        }}
                        className={emailInvalido === null || emailInvalido === false ?'placeholder:text-[var(--cor-de-texto)] w-full p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'
                            :'w-full p-[1.4rem] rounded-[1rem] outline-none text-[var(--cor-de-texto)] border-3 border-[var(--cor-concluido)] bg-[var(--cor-de-fundo-das-inputs)]'
                        }
                        />
                        <b className=' inline-block m-[.2rem] p-[.2rem] rounded-[.4rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'>Email precisa de @ e .</b>

                        <label htmlFor="password" className='block mt-[2rem] mb-[1rem] uppercase'>Confirme a nova senha</label>
                        <input require placeholder='Confirme sua senha:' type="password" value={novaSenha} onChange={(event) => {
                            event.target.value
                            setNovaSenhaInvalida(event.target.value.length >= 8)
                        }}
                        className={novaSenhaInvalida === null || novaSenhaInvalida === false ?'placeholder:text-[var(--cor-de-texto)] w-full p-[1.4rem] rounded-[1rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'
                            :'w-full p-[1.4rem] rounded-[1rem] outline-none text-[var(--cor-de-texto)] border-3 border-[var(--cor-concluido)] bg-[var(--cor-de-fundo-das-inputs)]'
                        }
                        />
                        <b className='inline-block m-[.2rem] p-[.2rem] rounded-[.4rem] text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'>Mínimo 8 caracteres</b>
                        <button className='block w-full mt-[2rem] p-[1.4rem] rounded-[.6rem] uppercase cursor-pointer bg-[var(--cor-do-botao)]'>
                            <Link to='/login'>Criar</Link>
                        </button>
                        <p className='hidden mt-[1rem] p-[.2rem] rounded-[.4rem] font-bold text-center text-[var(--cor-de-texto)] bg-[var(--cor-de-fundo-das-inputs)]'></p>
                    </form>
                </section>
            </main>        
        </div>
)
}

export default CriarSenha