import axios from 'axios';

/**
 * Localidades do IBGE (API oficial e gratuita, com CORS liberado).
 * https://servicodados.ibge.gov.br/api/v1/localidades
 *
 * Usada para o usuário ESCOLHER estado + cidade em vez de digitar — evita
 * grafias divergentes ("São Paulo" vs "sao paulo" vs "São Paulo - SP"), que
 * quebrariam o RBAC por cidade (comparação por texto).
 *
 * As UFs ficam embutidas (lista fixa, não muda) e só os municípios são buscados
 * na rede. Qualquer falha é tratada pelo componente com fallback para texto.
 */
export interface UfOption {
  sigla: string;
  nome: string;
}

/** As 27 unidades federativas (lista estável — evita uma chamada por render). */
export const UFS: UfOption[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

/** Cache em memória por UF — a lista de municípios não muda durante a sessão. */
const municipiosCache = new Map<string, string[]>();

/** Municípios de uma UF, em ordem alfabética. Lança em caso de falha de rede. */
export async function fetchMunicipios(uf: string): Promise<string[]> {
  const cached = municipiosCache.get(uf);
  if (cached) return cached;

  const { data } = await axios.get<Array<{ id: number; nome: string }>>(
    `${IBGE_BASE}/estados/${uf}/municipios`,
    { params: { orderBy: 'nome' }, timeout: 10000 },
  );
  const nomes = (data || []).map((m) => m.nome).filter(Boolean);
  municipiosCache.set(uf, nomes);
  return nomes;
}

/**
 * Descobre a UF de um município já salvo (ex.: usuário antigo com "São Paulo"
 * digitado). Best-effort: devolve null se não achar ou se a rede falhar.
 */
export async function findUfByMunicipio(cidade: string): Promise<string | null> {
  const alvo = cidade.trim().toLowerCase();
  if (!alvo) return null;
  for (const { sigla } of UFS) {
    try {
      const lista = await fetchMunicipios(sigla);
      if (lista.some((n) => n.toLowerCase() === alvo)) return sigla;
    } catch {
      return null; // rede indisponível: não insiste nas outras UFs
    }
  }
  return null;
}
