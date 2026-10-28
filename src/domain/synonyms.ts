// Sinônimos regionais e nomes populares, já sem acento e no singular.
// Cada grupo é tratado como a mesma palavra na busca.

const GROUPS: string[][] = [
  ['mandioca', 'aipim', 'macaxeira'],
  ['abobora', 'jerimum'],
  ['tangerina', 'mexerica', 'bergamota', 'mimosa'],
  ['pao frances', 'pao de sal', 'cacetinho', 'pao careca', 'carioquinha'],
  ['frango', 'galinha'],
  ['batata doce', 'batata-doce'],
  ['carne moida', 'patinho moido', 'moida'],
  ['carne', 'bovina', 'boi'],
  ['bolacha', 'biscoito'],
  ['feijao', 'feijoes'],
  ['refrigerante', 'refri'],
  ['whey', 'proteina do soro', 'soro de leite'],
  ['clara', 'albumina'],
  ['iogurte', 'yogurt', 'iogurt'],
  ['maracuja', 'passiflora'],
  ['cuscuz', 'cuscus'],
  ['tapioca', 'beiju', 'goma'],
  ['milho', 'milho verde'],
  ['amendoim', 'paste de amendoim', 'pasta de amendoim'],
  ['banana', 'banana prata', 'banana nanica'],
  ['acai', 'açai'],
  ['macarrao', 'massa', 'espaguete', 'talharim'],
  ['file', 'bife'],
  ['peito', 'file de peito'],
  ['salsicha', 'hot dog'],
  ['queijo minas', 'minas frescal', 'queijo branco'],
  ['requeijao', 'catupiry'],
  ['pipoca', 'milho de pipoca'],
  ['vagem', 'feijao verde'],
  ['chuchu', 'machucho'],
  ['mamao', 'papaia'],
  ['beterraba', 'beterava'],
];

const INDEX = new Map<string, string[]>();
for (const group of GROUPS) {
  for (const word of group) INDEX.set(word, group);
}

/** Termo de busca e seus sinônimos (sempre inclui o próprio termo). */
export function expandTerm(term: string): string[] {
  const group = INDEX.get(term);
  return group ? Array.from(new Set([term, ...group])) : [term];
}
