import React from 'react';
import {
  X, MapPin, Clock, ShieldCheck, Send, Loader2, LogIn, MessageCircle,
  ImagePlus, Radio,
} from 'lucide-react';
import type { MissingPersonCommentDTO, MissingPersonReportDTO, UserDTO } from '@/types';
import { addMissingPersonComment, getMissingPersonAlert } from '@/api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsCompact } from '@/hooks/useIsCompact';
import Scrim from '@/components/Scrim';

/** Contador ao vivo do pré-alerta de 1 km / 10 min. */
function PreAlertCountdown({ expiresAt }: { expiresAt?: string | null }) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!expiresAt) return null;
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
      <Radio className="w-3.5 h-3.5 animate-pulse" />
      Pré-alerta 1 km · {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

interface MissingPersonAlertModalProps {
  alert: MissingPersonReportDTO | null;
  user: UserDTO | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onUpdated?: (alert: MissingPersonReportDTO) => void;
}

/**
 * Modal em destaque de uma denúncia de pessoa desaparecida aprovada.
 *
 * Abre automaticamente uma vez por alerta/sessão e fica acessível pela
 * central de desaparecidos. A população pode comentar avistamentos; visitantes
 * sem login recebem o CTA de entrar/cadastrar.
 */
export default function MissingPersonAlertModal({
  alert,
  user,
  onClose,
  onOpenAuth,
  onUpdated,
}: MissingPersonAlertModalProps) {
  const compact = useIsCompact();
  useBodyScrollLock(!!alert);

  const [comments, setComments] = React.useState<MissingPersonCommentDTO[]>([]);
  const [text, setText] = React.useState('');
  const [image, setImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setComments(alert?.comments ?? []);
    setText('');
    setImage(null);
    setError(null);
  }, [alert?.id]);

  React.useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  React.useEffect(() => {
    if (!alert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alert, onClose]);

  // Mantém o chat vivo: busca o alerta de novo enquanto o modal está aberto.
  // Sem isso, um avistamento enviado por outra pessoa só aparecia ao recarregar
  // a página. `onUpdated` fica em ref para o intervalo não ser recriado a cada
  // render (o App recria o callback).
  const onUpdatedRef = React.useRef(onUpdated);
  React.useEffect(() => {
    onUpdatedRef.current = onUpdated;
  }, [onUpdated]);

  const alertId = alert?.id;
  React.useEffect(() => {
    if (!alertId) return;
    let cancelled = false;
    let inFlight = false;

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await getMissingPersonAlert(alertId);
        if (cancelled || !res.data) return;
        setComments(res.data.comments ?? []);
        onUpdatedRef.current?.(res.data);
      } catch {
        // Silencioso: mantém o que já está na tela e tenta de novo no próximo ciclo.
      } finally {
        inFlight = false;
      }
    };

    // 2 s: avistamentos de outras pessoas aparecem quase em tempo real. O
    // `inFlight` acima evita empilhar requisições se a rede estiver lenta.
    const timer = window.setInterval(load, 2000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    // Busca já na abertura para não mostrar comentários desatualizados.
    void load();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [alertId]);

  if (!alert) return null;

  const send = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const content = text.trim();
    if (!content && !image) return;
    setSending(true);
    setError(null);
    try {
      const res = await addMissingPersonComment(alert.id, content, image);
      const next = [...comments, res.data];
      setComments(next);
      setText('');
      setImage(null);
      onUpdated?.({
        ...alert,
        comments: next,
        commentCount: next.length,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível enviar o comentário.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Scrim onClick={onClose} />
      <div
        style={{ top: 'var(--zelo-header-h)' }}
        className="fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="missing-alert-title"
      >
        <div
          className={`relative w-full bg-white shadow-zelo border border-zelo-mist overflow-y-auto overscroll-contain
            ${compact ? 'max-w-none rounded-none h-full' : 'max-w-lg mx-4 rounded-2xl max-h-[92vh]'}`}
        >
          {/* Cabeçalho em destaque */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-red-700 via-red-600 to-orange-500 text-white px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                {alert.preAlert ? 'Pré-alerta imediato' : 'Alerta oficial'} ·{' '}
                {alert.kind === 'SEQUESTRO' ? 'Sequestro' : 'Pessoa desaparecida'}
              </div>
              <h2 id="missing-alert-title" className="font-bold leading-tight truncate">
                {alert.personName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 shrink-0 text-white/80 hover:text-white rounded-lg hover:bg-white/15"
              aria-label="Fechar alerta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={compact ? 'px-4 py-4 pb-8' : 'px-5 py-4'}>
            <img
              src={alert.photoUrl}
              alt={`Foto de ${alert.personName}`}
              className="w-full max-h-72 object-cover rounded-xl border border-slate-200 bg-slate-100"
            />

            {alert.preAlert && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900">
                <b>Alerta preliminar:</b> alcance de 1 km por 10 minutos, disparado no
                envio da denúncia. A moderação vai ampliar o alcance após a aprovação.
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                {alert.preAlert
                  ? 'Raio de 1 km'
                  : alert.scope === 'GLOBAL'
                    ? 'Alcance global'
                    : alert.city}
              </span>
              {alert.preAlert && <PreAlertCountdown expiresAt={alert.preAlertExpiresAt} />}
              {alert.expiresAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Clock className="w-3.5 h-3.5" />
                  Até {new Date(alert.expiresAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
              {alert.description}
            </p>

            {alert.lastSeenInfo && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                  Última informação
                </div>
                <div className="text-sm text-amber-900 mt-0.5 break-words">{alert.lastSeenInfo}</div>
              </div>
            )}

            <div className="mt-3 text-[11px] text-slate-400">
              Denúncia enviada por {alert.submittedByName || 'cidadão'}
              {alert.approvedByName ? ` · aprovada por ${alert.approvedByName}` : ''}
            </div>

            {/* Comentários / avistamentos */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Avistamentos e informações ({comments.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">
                    Nenhum comentário ainda. Se viu a pessoa ou algo suspeito, informe abaixo.
                  </p>
                )}
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={
                      c.reporter
                        ? 'p-2.5 rounded-lg bg-amber-50 border-2 border-amber-300 shadow-sm'
                        : 'p-2.5 rounded-lg bg-slate-50 border border-slate-100'
                    }
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-slate-700 break-words">
                        {c.authorName}
                        {c.reporter && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-amber-300 bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wide">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Denunciante
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {c.content && (
                      <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-line break-words">
                        {c.content}
                      </p>
                    )}
                    {c.imageUrl && (
                      <a href={c.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={c.imageUrl}
                          alt={`Imagem enviada por ${c.authorName}`}
                          className="mt-1.5 max-h-52 w-full rounded-lg object-cover border border-slate-200 bg-slate-100"
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700 break-words">
                  {error}
                </div>
              )}

              {user ? (
                <div className="mt-3 space-y-2">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Prévia da imagem"
                        className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-zelo-green-dark text-white shadow"
                        aria-label="Remover imagem"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <label
                      className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                      title="Anexar imagem"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                      />
                      <ImagePlus className="w-5 h-5" />
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Vi a pessoa em... / Informação suspeita..."
                      className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <button
                      onClick={send}
                      disabled={sending || (!text.trim() && !image)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Enviar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zelo-green-dark text-white text-sm font-semibold hover:bg-zelo-navy transition"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar para comentar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
