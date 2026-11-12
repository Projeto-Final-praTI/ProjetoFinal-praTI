// Teste da regra da linha do tempo (duas pontas + resolvidos ocultos no presente).
// Roda com: node scripts/check-resolved-filter.mjs
//
// Regra implementada em isActiveDuring(inc, start, end):
//   aparece <=> createdAt >= start (criado dentro/antes do fim)
//            E createdAt <= end
//            E (nunca resolvido OU resolvido > end)
const resolvedAt = (inc) => {
  if (inc.status !== 'RESOLVIDO') return null;
  const latest = inc.statusHistory?.[0];
  return latest && latest.newStatus === 'RESOLVIDO' ? new Date(latest.createdAt).getTime() : null;
};

const isActiveDuring = (inc, start, end) => {
  const created = new Date(inc.createdAt).getTime();
  if (created > end) return false;
  if (created < start) return false;
  const resolved = resolvedAt(inc);
  return resolved === null || resolved > end;
};

const H = 3600 * 1000;
const now = Date.now();
// mk(id, horasAtrasCriado, horasAtrasResolvido|null)
const mk = (id, createdH, resolvedH = null) => ({
  id,
  createdAt: new Date(now - createdH * H).toISOString(),
  status: resolvedH != null ? 'RESOLVIDO' : 'ABERTO',
  statusHistory:
    resolvedH != null
      ? [{ newStatus: 'RESOLVIDO', createdAt: new Date(now - resolvedH * H).toISOString() }]
      : [],
});

// Sem ambiguidade: cada resolvido é bem mais novo que a criação
const incidents = [
  mk('aberto-10h', 10),
  mk('aberto-1h', 1),
  mk('resolvido-criado10h-feito5h', 10, 5),
];

const visible = (start, end) => incidents.filter((i) => isActiveDuring(i, start, end)).map((i) => i.id);
const presente = visible(Number.NEGATIVE_INFINITY, now);

let failures = 0;
const check = (label, got, expected) => {
  const ok = JSON.stringify([...got].sort()) === JSON.stringify([...expected].sort());
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`      esperado=${JSON.stringify(expected)}  obtido=${JSON.stringify(got)}`);
};

// 1) Presente (janela "tudo até agora"): resolvido fora do mapa
check('presente esconde resolvidos', presente, ['aberto-10h', 'aberto-1h']);

// 2) Marcador de INÍCIO filtra pontos criados antes dele
// Janela cobrindo só a última 2h: o ponto de 10h atrás sai (criado antes do início).
check(
  'início da janela esconde ponto criado antes dele',
  visible(now - 2 * H, now),
  ['aberto-1h'],
);

// 3) Arrastar o início para trás traz o ponto antigo de volta
check(
  'arrastar o início para trás reinclui o ponto antigo',
  visible(now - 11 * H, now),
  ['aberto-10h', 'aberto-1h'],
);

// 4) Rebobinar o FIM para antes da resolução: resolvido reaparece
check(
  'janela terminando ANTES da resolução mostra o resolvido',
  visible(now - 11 * H, now - 6 * H),
  ['aberto-10h', 'resolvido-criado10h-feito5h'],
);

// 5) Janela terminando DEPOIS da resolução esconde o resolvido
check(
  'janela terminando DEPOIS da resolução esconde o resolvido',
  visible(now - 11 * H, now - 2 * H),
  ['aberto-10h'],
);

// 6) Janela anterior à criação não mostra nada
check('janela anterior à criação não mostra nada', visible(now - 20 * H, now - 15 * H), []);

// 7) Garantia dura: nenhum RESOLVIDO visível no presente
const anyResolvedNoPresente = incidents.filter((i) => presente.includes(i.id)).some((i) => resolvedAt(i) !== null);
check('presente não contém nenhum RESOLVIDO', String(anyResolvedNoPresente), 'false');

// 8) Aviso "N resolvidos ocultos" no presente
const hidden = incidents.filter((i) => {
  const r = resolvedAt(i);
  return r !== null && r < now;
}).length;
check('1 resolvido oculto no presente', String(hidden), '1');

console.log(failures === 0 ? '\nTodos os testes passaram.' : `\n${failures} teste(s) falharam.`);
process.exit(failures === 0 ? 0 : 1);
