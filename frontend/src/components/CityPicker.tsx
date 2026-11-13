import React from 'react';
import { Loader2, MapPin, Keyboard } from 'lucide-react';
import { UFS, fetchMunicipios, findUfByMunicipio } from '@/services/ibge';

interface CityPickerProps {
  /** Cidade selecionada (nome do município, ex.: "São Paulo"). */
  value: string;
  /** Recebe o nome do município escolhido ('' para limpar). */
  onChange: (city: string) => void;
  /** Texto de ajuda abaixo dos campos. */
  hint?: string;
  /** Classe do input/select (para casar com o formulário que o usa). */
  className?: string;
  labelClassName?: string;
  idPrefix?: string;
}

const DEFAULT_INPUT_CLASS = 'zelo-input';
const DEFAULT_LABEL_CLASS = 'zelo-label';

/**
 * Seletor de cidade via API de Localidades do IBGE: o usuário escolhe a UF e
 * depois o município numa lista, em vez de digitar (evita erro de grafia, que
 * quebraria o RBAC por cidade).
 *
 * - As UFs vêm embutidas; os municípios são buscados ao escolher a UF.
 * - Se a busca falhar (sem rede/bloqueio), cai automaticamente para um campo de
 *   texto livre — o cadastro NUNCA trava por causa da API externa.
 * - Para cidades já salvas (texto livre antigo), tenta descobrir a UF sozinho.
 */
export default function CityPicker({
  value,
  onChange,
  hint,
  className,
  labelClassName,
  idPrefix = 'city',
}: CityPickerProps) {
  const [uf, setUf] = React.useState('');
  const [cities, setCities] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [manual, setManual] = React.useState(false);

  const inputClass = className ?? DEFAULT_INPUT_CLASS;
  const labelClass = labelClassName ?? DEFAULT_LABEL_CLASS;

  // Descobre a UF quando já existe uma cidade salva (perfil/edições).
  React.useEffect(() => {
    let alive = true;
    if (!value || uf) return;
    (async () => {
      const found = await findUfByMunicipio(value);
      if (alive && found) setUf(found);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega os municípios quando a UF muda.
  React.useEffect(() => {
    let alive = true;
    if (!uf) {
      setCities([]);
      return;
    }
    setLoading(true);
    setFailed(false);
    fetchMunicipios(uf)
      .then((lista) => {
        if (!alive) return;
        setCities(lista);
      })
      .catch(() => {
        if (!alive) return;
        // API indisponível: libera digitação para não bloquear o cadastro.
        setFailed(true);
        setManual(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uf]);

  const useManual = manual || failed;

  return (
    <div>
      <label className={labelClass} htmlFor={`${idPrefix}-uf`}>
        Estado (UF) <span className="font-normal text-slate-400">(opcional)</span>
      </label>
      <div className="flex gap-2">
        <select
          id={`${idPrefix}-uf`}
          value={uf}
          onChange={(e) => {
            setUf(e.target.value);
            // Trocar de UF invalida a cidade anterior
            if (e.target.value !== uf) onChange('');
          }}
          disabled={useManual}
          className={`${inputClass} disabled:opacity-50`}
          title="Escolha o estado para listar as cidades"
        >
          <option value="">Selecione...</option>
          {UFS.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.nome} ({u.sigla})
            </option>
          ))}
        </select>

        {/* Município: lista quando temos UF + cidades; texto livre no fallback */}
        {useManual ? (
          <input
            id={`${idPrefix}-city`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            placeholder="Digite o nome da cidade"
            aria-label="Cidade"
          />
        ) : (
          <select
            id={`${idPrefix}-city`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!uf || loading}
            className={`${inputClass} disabled:opacity-50`}
            title={!uf ? 'Escolha primeiro o estado' : 'Escolha o município'}
          >
            <option value="">
              {loading ? 'Carregando cidades...' : !uf ? 'Escolha o estado primeiro' : 'Selecione a cidade...'}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {loading && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Buscando cidades no IBGE...
          </span>
        )}
        {!loading && failed && (
          <span className="text-[10px] text-amber-600 flex items-center gap-1">
            <Keyboard className="w-3 h-3" /> Não foi possível carregar a lista — digite a cidade manualmente.
          </span>
        )}
        {!loading && !failed && value && (
          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {value}
          </span>
        )}
        {!loading && !useManual && (
          <button
            type="button"
            onClick={() => setManual(true)}
            className="text-[10px] text-slate-400 hover:text-zelo-muted underline ml-auto"
          >
            Minha cidade não está na lista
          </button>
        )}
      </div>

      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
