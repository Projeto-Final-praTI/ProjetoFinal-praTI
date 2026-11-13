import React from 'react';
import { X, ThumbsUp, MessageCircle, User as UserIcon, Clock, Maximize, History, Send, Trash2 } from 'lucide-react';
import type { IncidentResponseDTO, UserDTO, IncidentCommentDTO, IncidentStatus, IncidentStatusHistoryDTO } from '@/types';

const CATEGORY_LABEL: Record<string, string> = {
  BURACO: 'Buraco',
  PONTE_QUEBRADA: 'Ponte quebrada',
  ALAGAMENTO: 'Alagamento',
  QUEDA_ARVORE: 'Queda de árvore',
  DESLIZAMENTO: 'Deslizamento',
  OUTROS: 'Outros',
};

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDO: 'Resolvido',
};

const STATUS_BADGE: Record<string, string> = {
  ABERTO: 'bg-blue-50 text-blue-700 border-blue-100',
  EM_ATENDIMENTO: 'bg-amber-50 text-amber-700 border-amber-100',
  RESOLVIDO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const STATUS_DOT: Record<string, string> = {
  ABERTO: 'bg-blue-500',
  EM_ATENDIMENTO: 'bg-amber-500',
  RESOLVIDO: 'bg-emerald-500',
};

/** Papéis que operacionalmente mexem no status (RBAC: papel + cidade). */
const OPERATOR_ROLES = ['FISCAL', 'GESTOR', 'ROOT'];

interface IncidentDrawerProps {
  incident: IncidentResponseDTO | null;
  onClose: () => void;
  user: UserDTO | null;
  onUpvote: (id: string) => Promise<void>;
  onAddComment: (id: string, content: string) => Promise<void>;
  onOpenAuth: () => void;
  /** Transição de status + nota (chamado só para operadores habilitados). */
  onUpdateStatus?: (id: string, status: IncidentStatus, note: string) => Promise<void>;
  /** Apaga o ponto crítico (autor, gestor/fiscal da cidade ou root). */
  onDelete?: (id: string) => Promise<void>;
}

export default function IncidentDrawer({
  incident,
  onClose,
  user,
  onUpvote,
  onAddComment,
  onOpenAuth,
  onUpdateStatus,
  onDelete,
}: IncidentDrawerProps) {
  const [comment, setComment] = React.useState('');
  const [commenting, setCommenting] = React.useState(false);
  const [upvoting, setUpvoting] = React.useState(false);
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState('');
  const [newStatus, setNewStatus] = React.useState<IncidentStatus>('EM_ATENDIMENTO');
  const [statusNote, setStatusNote] = React.useState('');
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  if (!incident) return null;

  /** RBAC no cliente (o backend valida de novo): operador da mesma cidade ou root. */
  const sameCity = (a?: string | null, b?: string | null) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
  const canManage =
    !!user &&
    OPERATOR_ROLES.includes(user.role) &&
    (user.role === 'ROOT' || (sameCity(incident.city, user.city) && !!incident.city));

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStatus || savingStatus) return;
    if (newStatus === incident.status && !statusNote.trim()) {
      setStatusError('Escolha um novo status ou escreva uma nota.');
      return;
    }
    setSavingStatus(true);
    setStatusError(null);
    try {
      await onUpdateStatus(incident.id, newStatus, statusNote.trim());
      setStatusNote('');
    } catch (err: any) {
      setStatusError(err?.response?.data?.message || 'Não foi possível salvar a atualização.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || commenting) return;
    if (!user) return;
    setCommenting(true);
    try {
      await onAddComment(incident.id, comment.trim());
      setComment('');
    } finally {
      setCommenting(false);
    }
  };

  const handleUpvote = async () => {
    if (upvoting || !user) return;
    setUpvoting(true);
    try {
      await onUpvote(incident.id);
    } finally {
      setUpvoting(false);
    }
  };

  /** O autor sempre pode apagar o próprio ponto; root/operador local também. */
  const isAuthor = !!user && !!incident.author && incident.author.id === user.id;
  const canDelete =
    !!onDelete &&
    !!user &&
    (isAuthor || user.role === 'ROOT' || (canManage && user.role !== 'USER'));

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    if (!window.confirm('Apagar este ponto crítico? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(incident.id);
      onClose();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Não foi possível apagar o ponto.');
    } finally {
      setDeleting(false);
    }
  };

  const openImageModal = (url: string) => {
    setSelectedImageUrl(url);
    setImageModalOpen(true);
  };

  return (
    <div
      className="fixed top-[var(--zelo-header-h)] right-0 bottom-0 w-full max-w-[460px] bg-white shadow-zelo flex flex-col z-[var(--z-modal)] border-l border-zelo-mist overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-b border-zelo-mist">
        <h2 className="min-w-0 flex-1 text-lg font-bold text-zelo-ink break-words">{incident.title}</h2>
        <button onClick={onClose} className="p-2 shrink-0 text-slate-400 hover:text-zelo-ink hover:bg-zelo-surface rounded transition" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {CATEGORY_LABEL[incident.category] || incident.category}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[incident.status] || 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {STATUS_LABEL[incident.status] || incident.status}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {incident.upvotesCount} confirmações
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed mb-4 whitespace-pre-line break-words">{incident.description}</p>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidências</div>
          <div className="flex gap-2 flex-wrap">
            {incident.images.length > 0 ? (
              incident.images.map((url, i) => (
                <div key={i} className="relative group cursor-pointer" onClick={() => openImageModal(url)}>
                  <img src={url} alt="evidência" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                    <Maximize className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400">Sem imagens</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-1 text-sm text-slate-500 flex-wrap">
          <UserIcon className="w-4 h-4 shrink-0" />
          <span className="min-w-0 break-words">{incident.author.fullName}</span>
          <Clock className="w-3 h-3 shrink-0" />
          <span className="shrink-0">{new Date(incident.createdAt).toLocaleString('pt-BR')}</span>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            Comentários da comunidade ({incident.comments.length})
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
            {incident.comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhum comentário ainda.</p>
            ) : (
              incident.comments.map((c: IncidentCommentDTO) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 break-words">{c.authorName}</div>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">{c.content}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(c.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {user ? (
            <form onSubmit={handleComment} className="mt-4 pt-4 border-t border-zelo-mist flex gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="zelo-input flex-1 resize-none"
                disabled={commenting}
                rows={2}
              ></textarea>
              <button
                type="submit"
                disabled={!comment.trim() || commenting || !user}
                className="zelo-btn-primary"
              >
                {commenting ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          ) : (
            <div className="mt-4 pt-4 border-t border-zelo-mist flex items-center justify-center gap-2 text-sm">
              <span className="text-slate-500">Faça login para</span>
              <button onClick={onOpenAuth} className="text-emerald-700 font-semibold underline hover:text-emerald-800 transition">comentar ou confirmar</button>
            </div>
          )}
        </div>

        {/* Linha do tempo: histórico de status + notas dos operadores */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <History className="w-4 h-4" />
            Linha do tempo
            {incident.city && (
              <span className="ml-auto normal-case tracking-normal font-medium text-slate-400">
                {incident.city}
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {(incident.statusHistory || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Sem atualizações registradas.</p>
            ) : (
              (incident.statusHistory as IncidentStatusHistoryDTO[]).map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[h.newStatus] || 'bg-slate-400'}`} />
                    <span className="w-px flex-1 bg-slate-200 mt-1" />
                  </div>
                  <div className="pb-1 min-w-0">
                    <div className="text-xs text-slate-700">
                      <span className="font-bold">
                        {h.previousStatus
                          ? `${STATUS_LABEL[h.previousStatus] || h.previousStatus} → `
                          : ''}
                        {STATUS_LABEL[h.newStatus] || h.newStatus}
                      </span>
                      {h.authorName && <span className="text-slate-400"> · {h.authorName}</span>}
                    </div>
                    {h.note && (
                      <div className="text-sm text-slate-600 leading-snug mt-0.5 whitespace-pre-line break-words">"{h.note}"</div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(h.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form de atualização — apenas fiscal/gestor/root da mesma cidade (ou root) */}
          {canManage && onUpdateStatus && (
            <form onSubmit={handleStatusSubmit} className="mt-4 pt-4 border-t border-zelo-mist space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Registrar atualização
              </div>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                  disabled={savingStatus}
                  className="zelo-input flex-1"
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ATENDIMENTO">Em atendimento</option>
                  <option value="RESOLVIDO">Resolvido</option>
                </select>
                <button
                  type="submit"
                  disabled={savingStatus || (newStatus === incident.status && !statusNote.trim())}
                  className="zelo-btn-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  {savingStatus ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={'Nota opcional, ex.: "Equipe da prefeitura acionada às 14:30"'}
                rows={2}
                disabled={savingStatus}
                className="zelo-input resize-none"
              />
              {statusError && <p className="text-xs text-red-600">{statusError}</p>}
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zelo-mist">
          <button
            onClick={user ? handleUpvote : onOpenAuth}
            disabled={upvoting}
            className="zelo-btn-secondary"
            title={user ? 'Confirmar problema' : 'Faça login para confirmar'}
          >
            {upvoting ? (
              <svg className="w-4 h-4 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.941l3-2.647z"></path></svg>
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            <span className={upvoting ? 'text-slate-400' : 'text-slate-700'}>
              Confirmar problema ({incident.upvotesCount})
            </span>
          </button>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100 transition"
              title={isAuthor ? 'Apagar o ponto que você registrou' : 'Apagar ponto crítico'}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Apagando...' : 'Apagar'}
            </button>
          )}
          {!user && (
            <span className="text-xs text-slate-400">Faça login para confirmar</span>
          )}
        </div>
        {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
      </div>

      {/* Modal de imagem em tela cheia dentro do drawer */}
      {imageModalOpen && selectedImageUrl && (
        <div className="fixed inset-0 z-[var(--z-modal-top)] flex items-center justify-center bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setImageModalOpen(false)}>
          <div className="absolute top-4 right-4 z-[var(--z-modal-top)]">
            <button onClick={() => setImageModalOpen(false)} className="p-2 text-white hover:text-slate-200 hover:bg-white/20 rounded"><X className="w-6 h-6" /></button>
          </div>
          <img src={selectedImageUrl} alt="evidência" className="max-w-[90vw] max-h-[85vh] object-contain border-4 border-white rounded-lg shadow-2xl" />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[var(--z-modal-top)] text-white text-sm bg-black/60 px-3 py-1 rounded backdrop-blur">
            Clique fora para fechar
          </p>
        </div>
      )}
    </div>
  );
}
