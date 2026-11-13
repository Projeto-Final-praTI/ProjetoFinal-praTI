import React from 'react';
import { fetchMunicipios } from '@/services/ibge';

/**
 * Carrega os municípios de TODAS as UFs (uma vez, em paralelo) para alimentar
 * o autocomplete de cidade no painel admin — o root edita a cidade de atuação
 * de vários usuários ao mesmo tempo e não cabe um seletor de 2 campos por linha.
 *
 * Best-effort: se a rede falhar, devolve lista vazia e o campo segue aceitando
 * texto livre.
 */
export function useAllMunicipios(): { cities: string[]; loading: boolean } {
  const [cities, setCities] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    const UFS_SIGLAS = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
      'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ];
    (async () => {
      try {
        const listas = await Promise.all(UFS_SIGLAS.map((uf) => fetchMunicipios(uf)));
        if (!alive) return;
        // Remove duplicatas (há nomes de município repetidos entre estados)
        setCities([...new Set(listas.flat())].sort((a, b) => a.localeCompare(b, 'pt-BR')));
      } catch {
        if (alive) setCities([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { cities, loading };
}
