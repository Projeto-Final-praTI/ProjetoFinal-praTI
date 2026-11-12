import React from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import type { IncidentCategory, MapPoint } from '@/types';
import { createIncident } from '@/api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsCompact } from '@/hooks/useIsCompact';

const CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'BURACO', label: 'Buraco' },
  { value: 'PONTE_QUEBRADA', label: 'Ponte quebrada' },
  { value: 'ALAGAMENTO', label: 'Alagamento' },
  { value: 'QUEDA_ARVORE', label: 'Queda de árvore' },
  { value: 'DESLIZAMENTO', label: 'Deslizamento' },
  { value: 'OUTROS', label: 'Outros' },
];

interface IncidentFormProps {
  open: boolean;
  onClose: () => void;
  userLocation: MapPoint | null;
  pendingLocation: MapPoint | null;
  onSuccess: () => void;
}

export default function IncidentForm({
  open,
  onClose,
  userLocation,
  pendingLocation,
  onSuccess,
}: IncidentFormProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<IncidentCategory>('BURACO');
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const compact = useIsCompact();
  useBodyScrollLock(open);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const nextFiles = [...files, ...selected];
    if (nextFiles.length > 5) {
      setError('Máximo de 5 imagens.');
      return;
    }
    setFiles(nextFiles);
    setPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ]);
    setError('');
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Preencha título e descrição.');
      return;
    }
    if (!userLocation || !pendingLocation) {
      setError('Localização indisponível.');
      return;
    }
    if (files.length === 0) {
      setError('No mínimo 1 imagem é obrigatória.');
      return;
    }

    setSubmitting(true);
    try {
      await createIncident(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          incidentLat: pendingLocation.lat,
          incidentLng: pendingLocation.lng,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
        },
        files
      );
      onSuccess();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Erro ao registrar incidente.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{ top: 'var(--zelo-header-h)' }}
      className="fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-zelo-green-dark/55 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full bg-white shadow-zelo border border-zelo-mist animate-[fadeIn_0.3s_ease-out]
          overflow-y-auto overscroll-contain
          ${compact
            ? 'max-w-none rounded-none h-full'
            : 'max-w-md rounded-2xl p-6 max-h-[90vh]'}`}
      >
        <div className={`flex justify-between items-center mb-5 ${compact ? 'px-5 pt-5 sticky top-0 bg-white z-10 pb-3 border-b border-zelo-mist' : ''}`}>
          <h2 className="text-xl font-bold text-zelo-ink">Registrar ponto crítico</h2>
          <button onClick={onClose} className="p-2 -mr-1 text-slate-400 hover:text-zelo-ink rounded-lg hover:bg-zelo-surface" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>

        <div className={compact ? 'px-5 pb-6' : ''}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="zelo-label">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="zelo-input"
              placeholder="Ex: Buraco grande na av. principal"
            />
          </div>
          <div>
            <label className="zelo-label">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="zelo-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="zelo-label">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="zelo-input"
              rows={3}
              placeholder="Descreva o problema..."
            />
          </div>
          <div>
            <label className="zelo-label">Imagens (mín. 1, máx. 5)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {previews.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute -right-1 -top-1 bg-red-600 text-white rounded-full p-[1px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-zelo-mist flex items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition group">
                <Plus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            {files.length === 0 && (
              <p className="text-xs text-red-600">Selecione pelo menos 1 foto do problema.</p>
            )}
          </div>
          <div className="pt-3 text-xs text-slate-500">
            O incidente será registrado a <b>no máximo 500 m</b> da sua localização atual (GPS).
            A cidade do ponto é identificada automaticamente pela localização.
          </div>
          <button
            type="submit"
            disabled={submitting || files.length === 0}
            className="zelo-btn-primary w-full py-3"
          >
            {submitting ? 'Enviando...' : 'Registrar ponto crítico'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
