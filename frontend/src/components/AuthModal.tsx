import React from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { UserDTO } from '@/types';
import { authRegister, authLogin } from '@/api';
import CityPicker from '@/components/CityPicker';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsCompact } from '@/hooks/useIsCompact';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: UserDTO) => void;
  /** Modo inicial definido pela rota (`/login` ou `/cadastro`). */
  initialMode?: 'login' | 'register';
  /** Avisa o App para manter a URL sincronizada ao alternar login/cadastro. */
  onModeChange?: (mode: 'login' | 'register') => void;
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  initialMode = 'login',
  onModeChange,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const compact = useIsCompact();
  useBodyScrollLock(open);

  // A URL manda no modo: abrir `/cadastro` já mostra o formulário de cadastro
  // e alternar login/cadastro atualiza a rota (sem recarregar a página).
  React.useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const [form, setForm] = React.useState({
    fullName: '',
    email: '',
    cpf: '',
    password: '',
    city: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await authLogin({ email: form.email, password: form.password });
        localStorage.setItem('zelo_token', res.data.token);
        localStorage.setItem('zelo_user', JSON.stringify(res.data.user));
        onSuccess(res.data.user);
      } else {
        const cleanCpf = form.cpf.replace(/\D/g, '');
        const res = await authRegister({
          fullName: form.fullName,
          email: form.email,
          cpf: cleanCpf,
          password: form.password,
          city: form.city.trim() || undefined,
        });
        localStorage.setItem('zelo_token', res.data.token);
        localStorage.setItem('zelo_user', JSON.stringify(res.data.user));
        onSuccess(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isLogin = mode === 'login';

  // Campos e rótulos no mesmo estilo dos demais formulários do ZELO:
  // borda em gradiente azul→verde (`.zelo-field`) e rótulos em caixa alta.
  const fieldCls =
    'zelo-field w-full rounded-xl px-4 py-3 text-sm text-zelo-ink placeholder:text-slate-400';
  const labelCls = 'block text-[11px] font-bold uppercase tracking-wide text-zelo-muted mb-1.5';

  // Feedback visual: borda verde quando válido e vermelha quando inválido,
  // seguindo as regras reais do backend (senha mínima de 6 caracteres).
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const cpfValid = form.cpf.replace(/\D/g, '').length === 11;
  const passwordValid = isLogin ? form.password.length > 0 : form.password.length >= 6;
  const fieldState = (value: string, valid: boolean) =>
    !value ? '' : valid ? ' is-valid' : ' is-invalid';

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      {/* Fundo: vídeo de fundo + véu verde para garantir contraste do cartão. */}
      <div
        className="fixed inset-0 overflow-hidden bg-zelo-green-dark"
        onClick={onClose}
        aria-hidden="true"
      >
        <video
          key={mode}
          className="w-full h-full object-cover opacity-80"
          autoPlay
          loop
          playsInline
          muted
        >
          <source
            src={isLogin ? '/video/zelo-background.mp4' : '/video/zelo-background-radar.mp4'}
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-zelo-green-dark/85 via-zelo-green-dark/45 to-zelo-green-dark/85" />
      </div>

      <div
        className={`relative min-h-dvh flex items-center p-0 sm:p-6 ${
          // No desktop login e cadastro ficam à direita para não cobrir o logo
          // do vídeo de fundo; abaixo de lg seguem centralizados.
          compact ? 'justify-center' : 'justify-center lg:justify-end lg:pr-16 xl:pr-24'
        }`}
      >
        <div
          className={`relative w-full bg-white/95 backdrop-blur-md shadow-2xl animate-[fadeIn_0.3s_ease-out]
            ${compact
              ? 'max-w-none min-h-dvh rounded-none'
              : 'max-w-md rounded-2xl border-y-2 border-zelo-mist'}`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-full text-slate-400 hover:text-zelo-ink hover:bg-slate-100 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-5 sm:px-8 py-8 sm:py-9">
            <div className="flex flex-col items-center text-center mb-7">
              <img
                src="/brand/zelo-wordmark.svg"
                alt="ZELO"
                className="h-8 w-auto select-none"
                draggable={false}
              />
              <h2
                id="auth-title"
                className={`mt-5 text-2xl sm:text-3xl font-bold text-zelo-ink ${!isLogin ? 'uppercase' : ''}`}
              >
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </h2>
              <p className="mt-2 text-sm text-zelo-muted max-w-xs leading-relaxed">
                Acesse para denunciar ocorrências e acompanhar sua região.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`space-y-4 ${!isLogin ? 'border-y border-zelo-mist py-6' : ''}`}
            >
              {!isLogin && (
                <div>
                  <label className={labelCls}>Nome completo</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className={fieldCls + fieldState(form.fullName, form.fullName.trim().length > 0)}
                    placeholder="João da Silva"
                    autoComplete="name"
                    maxLength={150}
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>E-mail</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={fieldCls + fieldState(form.email, emailValid)}
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-invalid={form.email ? !emailValid : undefined}
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className={labelCls}>CPF</label>
                  <input
                    value={form.cpf}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      let masked = raw;
                      if (raw.length > 3) masked = raw.slice(0, 3) + '.' + raw.slice(3);
                      if (raw.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
                      if (raw.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11);
                      setForm({ ...form, cpf: masked.slice(0, 14) });
                    }}
                    className={`${fieldCls}${fieldState(form.cpf, cpfValid)} cp-mask-input`}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    minLength={14}
                    inputMode="numeric"
                    pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
                    title="Digite os 11 dígitos do CPF"
                    aria-invalid={form.cpf ? !cpfValid : undefined}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    O CPF será armazenado sem máscara (LGPD).
                  </p>
                </div>
              )}

              {!isLogin && (
                <CityPicker
                  value={form.city}
                  onChange={(city) => setForm({ ...form, city })}
                  labelClassName={labelCls}
                  className={fieldCls}
                  hint="Define sua área de atuação (fiscal/gestor). Não restringe onde você pode registrar pontos."
                  idPrefix="register"
                />
              )}

              <div>
                <label className={labelCls}>Senha</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`${fieldCls}${fieldState(form.password, passwordValid)} pr-12`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={!isLogin ? 6 : undefined}
                    aria-invalid={form.password ? !passwordValid : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-zelo-green transition"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-[11px] text-slate-400 mt-1.5">Mínimo de 6 caracteres.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-3.5 text-white font-bold text-sm uppercase tracking-wide shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition ${
                  isLogin
                    ? 'rounded-full bg-emerald-600 shadow-emerald-700/20 hover:bg-emerald-700'
                    : 'rounded-md bg-zelo-ink shadow-slate-900/20 hover:bg-black'
                }`}
              >
                {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zelo-muted">
              {isLogin ? 'Ainda não possui uma conta?' : 'Já possui uma conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  const next = isLogin ? 'register' : 'login';
                  setMode(next);
                  setError('');
                  onModeChange?.(next);
                }}
                className="font-bold text-emerald-700 hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
