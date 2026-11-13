import React from 'react';
import { X, User as UserIcon, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserDTO } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { updateProfile } from '@/api';
import CityPicker from '@/components/CityPicker';

interface ProfileModalProps {
  open: boolean;
  user: UserDTO;
  onClose: () => void;
  /** Chamado com o usuário atualizado (para sincronizar Header/App/localStorage). */
  onUpdated: (u: UserDTO) => void;
}

/**
 * Edição do próprio perfil — disponível para QUALQUER usuário logado
 * (cidadão, fiscal, gestor e root).
 *
 * Alteráveis: nome completo, cidade de atuação e senha (opcional, exige a
 * senha atual). E-mail, CPF e cargo NÃO são alteráveis aqui: cargo só muda
 * pelo painel administrativo (RBAC) e e-mail/CPF são identificadores de login.
 */
export default function ProfileModal({ open, user, onClose, onUpdated }: ProfileModalProps) {
  const [fullName, setFullName] = React.useState(user.fullName);
  const [city, setCity] = React.useState(user.city ?? '');
  const [showPassword, setShowPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  useBodyScrollLock(open);

  // Recarrega os campos sempre que o modal abre (ou o usuário muda)
  React.useEffect(() => {
    if (open) {
      setFullName(user.fullName);
      setCity(user.city ?? '');
      setCurrentPassword('');
      setNewPassword('');
      setShowPassword(false);
      setError(null);
      setSuccess(false);
    }
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!fullName.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword && !currentPassword) {
      setError('Informe a senha atual para definir uma nova senha.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        city: city.trim() || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      localStorage.setItem('zelo_user', JSON.stringify(res.data));
      onUpdated(res.data);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Não foi possível salvar o perfil.',
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel: Record<string, string> = {
    USER: 'Cidadão',
    FISCAL: 'Fiscal',
    GESTOR: 'Gestor',
    ROOT: 'Root',
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-zelo-green-dark/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-4 sm:p-6 bg-white rounded-2xl shadow-zelo border border-zelo-mist">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-zelo-ink flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-700" />
            Meu perfil
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-zelo-ink hover:bg-zelo-surface transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-5 break-words">
          {user.email} · {roleLabel[user.role] || user.role}
          {user.city ? ` · ${user.city}` : ''}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Perfil atualizado com sucesso.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="zelo-label">Nome completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="zelo-input"
              placeholder="Seu nome"
            />
          </div>

          <CityPicker
            value={city}
            onChange={setCity}
            labelClassName="zelo-label"
            className="zelo-input"
            hint="Define o escopo de gestão (fiscais/gestores). Registrar pontos críticos funciona em qualquer cidade, limitado apenas ao GPS de 500 m."
            idPrefix="profile"
          />

          <div className="pt-1 border-t border-zelo-mist">
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition mt-3"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showPassword ? 'Cancelar troca de senha' : 'Alterar senha'}
            </button>

            {showPassword && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="zelo-label">Senha atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="zelo-input"
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="zelo-label">
                    Nova senha <span className="font-normal text-slate-400">(mín. 6 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="zelo-input"
                    placeholder="••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="zelo-btn-primary w-full py-3"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
