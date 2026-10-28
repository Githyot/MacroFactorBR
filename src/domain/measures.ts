// Medidas caseiras em gramas, por tipo de alimento (valores usuais das tabelas de medidas
// caseiras brasileiras). O usuário pode cadastrar as suas por alimento.

import { Food, Measure, normalizeSearch } from './foods';

type Rule = { match: RegExp; exclude?: RegExp; measures: Measure[] };

const RULES: Rule[] = [
  { match: /^arroz.*cozid/, measures: [{ label: 'colher de sopa', grams: 25 }, { label: 'escumadeira', grams: 90 }, { label: 'prato raso (porção)', grams: 150 }] },
  { match: /^feijao.*cozid|^feijoada/, measures: [{ label: 'concha', grams: 86 }, { label: 'colher de sopa', grams: 17 }] },
  { match: /^macarrao.*cozid|^espaguete/, measures: [{ label: 'pegador', grams: 110 }, { label: 'prato raso', grams: 220 }] },
  { match: /^ovo.*(inteiro|cozid|frit|mexid)|^ovo de galinha/, exclude: /clara|gema|codorna|po/, measures: [{ label: 'unidade', grams: 50 }] },
  { match: /clara/, measures: [{ label: 'clara', grams: 33 }] },
  { match: /^frango.*(peito|file)/, measures: [{ label: 'filé médio', grams: 100 }, { label: 'filé grande', grams: 150 }] },
  { match: /^frango.*coxa/, measures: [{ label: 'coxa', grams: 70 }] },
  { match: /^carne|patinho|alcatra|contra file|file mignon|maminha|picanha|acem|coxao/, measures: [{ label: 'bife médio', grams: 100 }, { label: 'colher de sopa (moída)', grams: 25 }] },
  { match: /^pao.*frances|pao de sal/, measures: [{ label: 'unidade', grams: 50 }] },
  { match: /^pao.*forma|pao.*integral/, measures: [{ label: 'fatia', grams: 25 }] },
  { match: /pao de queijo/, measures: [{ label: 'unidade média', grams: 40 }] },
  { match: /^banana/, measures: [{ label: 'unidade média', grams: 70 }] },
  { match: /^maca/, measures: [{ label: 'unidade média', grams: 130 }] },
  { match: /^laranja/, measures: [{ label: 'unidade', grams: 140 }] },
  { match: /^mamao/, measures: [{ label: 'fatia', grams: 170 }] },
  { match: /^batata.*doce/, measures: [{ label: 'unidade média', grams: 150 }, { label: 'colher de sopa', grams: 40 }] },
  { match: /^batata/, measures: [{ label: 'unidade média', grams: 130 }] },
  { match: /^mandioca.*cozid/, measures: [{ label: 'pedaço', grams: 100 }] },
  { match: /^aveia/, measures: [{ label: 'colher de sopa', grams: 15 }] },
  { match: /^leite.*(integral|desnatado|semidesnatado|vaca)/, exclude: /po|condensado/, measures: [{ label: 'copo (200 ml)', grams: 200 }, { label: 'xícara', grams: 240 }] },
  { match: /^leite.*po/, measures: [{ label: 'colher de sopa', grams: 16 }] },
  { match: /^iogurte/, measures: [{ label: 'pote', grams: 170 }] },
  { match: /^queijo/, measures: [{ label: 'fatia', grams: 30 }] },
  { match: /^requeijao/, measures: [{ label: 'colher de sopa', grams: 30 }] },
  { match: /^azeite|^oleo/, measures: [{ label: 'colher de sopa', grams: 13 }, { label: 'fio (colher de chá)', grams: 4 }] },
  { match: /^manteiga|^margarina/, measures: [{ label: 'ponta de faca', grams: 5 }, { label: 'colher de chá', grams: 8 }] },
  { match: /^acucar/, measures: [{ label: 'colher de chá', grams: 5 }, { label: 'colher de sopa', grams: 12 }] },
  { match: /amendoim|castanha|nozes|amendoa/, measures: [{ label: 'punhado', grams: 30 }, { label: 'colher de sopa', grams: 15 }] },
  { match: /^cuscuz/, measures: [{ label: 'fatia', grams: 135 }] },
  { match: /tapioca/, measures: [{ label: 'unidade', grams: 50 }] },
  { match: /^alface|^rucula|^agriao/, measures: [{ label: 'prato de sobremesa', grams: 30 }] },
  { match: /^tomate/, measures: [{ label: 'unidade média', grams: 100 }] },
  { match: /^brocolis/, measures: [{ label: 'ramo', grams: 20 }] },
  { match: /^acai/, measures: [{ label: 'tigela 300 ml', grams: 300 }, { label: 'tigela 500 ml', grams: 500 }] },
  { match: /whey|albumina|caseina|proteina isolada|hipercalorico/, measures: [{ label: 'scoop', grams: 30 }] },
  { match: /creatina/, measures: [{ label: 'dose', grams: 5 }] },
];

/** Medidas do alimento: as do usuário, a porção do rótulo e as caseiras padrão. */
export function measuresFor(food: Food): Measure[] {
  const out: Measure[] = [...(food.measures ?? [])];
  if (food.servingGrams) {
    out.push({ label: food.servingDescription || 'porção', grams: food.servingGrams });
  }
  const name = normalizeSearch(food.name);
  for (const rule of RULES) {
    if (rule.match.test(name) && !rule.exclude?.test(name)) {
      out.push(...rule.measures);
      break;
    }
  }
  // Sem repetir a mesma medida.
  const seen = new Set<string>();
  return out.filter((m) => {
    const key = `${normalizeSearch(m.label)}:${m.grams}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Acha a medida pelo nome digitado ("concha", "colheres de sopa", "scoops"). */
export function findMeasure(food: Food, unit: string): Measure | undefined {
  const u = normalizeSearch(unit).replace(/s\b/g, '');
  if (!u) return undefined;
  return measuresFor(food).find((m) => {
    const label = normalizeSearch(m.label).replace(/s\b/g, '');
    return label === u || label.startsWith(u) || u.startsWith(label.split(' ')[0]);
  });
}
