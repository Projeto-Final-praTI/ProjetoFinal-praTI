import React from 'react';
import {
  X,
  MapPin,
  Users,
  CloudRain,
  ShieldCheck,
  Lock,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Heart,
  Siren,
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsCompact } from '@/hooks/useIsCompact';
import Scrim from '@/components/Scrim';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  /** Usuário já autenticado: o CTA vira "Explorar o mapa" em vez de login. */
  isAuthenticated?: boolean;
  /** Abre o login/cadastro; a navegação para `/login` fecha o "Sobre". */
  onOpenAuth?: () => void;
}

const STEPS = [
  {
    icon: MapPin,
    title: 'Aponte no mapa',
    text: 'Marque o local exato do problema e envie fotos como evidência.',
  },
  {
    icon: Users,
    title: 'A comunidade confirma',
    text: 'Outras pessoas confirmam, comentam e acompanham cada ocorrência.',
  },
  {
    icon: CloudRain,
    title: 'Receba alertas',
    text: 'Avisos de chuva forte, alagamentos e riscos climáticos na sua região.',
  },
  {
    icon: Siren,
    title: 'Alerta desaparecidos',
    text: 'Denuncie com foto: o pré-alerta de 1 km sai na hora e a moderação amplia o alcance.',
  },
  {
    icon: ShieldCheck,
    title: 'Gestão e resolução',
    text: 'Fiscais e gestores atualizam o status até o problema ser resolvido.',
  },
];

const CATEGORIES = [
  'Buracos',
  'Pontes quebradas',
  'Alagamentos',
  'Quedas de árvore',
  'Deslizamentos',
  'Outros',
];

const ROLES = [
  { name: 'Cidadão', text: 'Registra e acompanha pontos críticos.' },
  { name: 'Fiscal', text: 'Valida e atualiza ocorrências.' },
  { name: 'Gestor', text: 'Administra a cidade e a equipe.' },
  { name: 'Root', text: 'Coordena a plataforma.' },
];

/**
 * "Sobre o ZELO" — apresentação pública da plataforma.
 *
 * Segue o mesmo contrato dos demais modais: véu (Scrim) começando abaixo do
 * header, trava de scroll do fundo e, em telas compactas, ocupação total da
 * área abaixo do header com rolagem interna.
 */
export default function AboutModal({
  open,
  onClose,
  isAuthenticated,
  onOpenAuth,
}: AboutModalProps) {
  const compact = useIsCompact();
  useBodyScrollLock(open);

  // Fecha com ESC (desktop) — no celular o botão X e o véu continuam valendo.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleStart = () => {
    if (isAuthenticated) {
      onClose();
      return;
    }
    onOpenAuth?.();
  };

  return (
    <>
      <Scrim onClick={onClose} />
      <div
        style={{ top: 'var(--zelo-header-h)' }}
        className="fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        <div
          className={`relative w-full bg-white shadow-zelo border border-zelo-mist flex flex-col overflow-hidden
            ${compact ? 'max-w-none rounded-none h-full' : 'max-w-lg mx-4 rounded-2xl max-h-full'}`}
        >
          {/* Cabeçalho */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-zelo-mist bg-white px-5 sm:px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/brand/zelo-icon-96.png"
                alt=""
                aria-hidden="true"
                className="w-10 h-10 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <h2 id="about-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Sobre o ZELO
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  Monitoramento colaborativo da cidade
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 shrink-0 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className={compact ? 'px-5 py-5 pb-8' : 'px-6 py-5'}>
            <p className="text-sm text-slate-600 leading-relaxed">
              O <strong className="text-slate-900">ZELO</strong> é uma plataforma feita para a
              comunidade mapear e acompanhar problemas da infraestrutura urbana, receber
              alertas climáticos da sua região e ajudar a encontrar pessoas desaparecidas.
            </p>

            <h3 className="mt-6 mb-3 text-xs font-bold text-slate-900 uppercase tracking-wide">
              Como funciona
            </h3>
            <div className="space-y-2.5">
              {STEPS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{text}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-6 mb-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              O que você pode registrar
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100"
                >
                  {c}
                </span>
              ))}
            </div>

            <h3 className="mt-6 mb-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              Feito para todos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <div key={r.name} className="p-3 rounded-xl border border-slate-100 bg-white">
                  <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-zelo-green-dark text-white">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">Privacidade e segurança</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                  Seus dados são tratados conforme a LGPD. CPF e senha nunca são exibidos.
                </li>
                <li className="flex items-start gap-1.5">
                  <Navigation className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                  O registro exige que você esteja a até 500 m do local, evitando informações falsas.
                </li>
                <li className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                  Login seguro com token e senha protegida.
                </li>
              </ul>
            </div>

            <div className="mt-5">
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.99] transition"
              >
                {isAuthenticated ? (
                  <>
                    <MapPin className="w-4 h-4" /> Explorar o mapa
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Entrar / Cadastrar
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                Feito com <Heart className="w-3 h-3 text-emerald-300" /> para a comunidade.
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
