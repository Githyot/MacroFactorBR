// Base inicial do app: TACO completa (597 alimentos) + suplementos e itens que a TACO não tem.

import { Food } from '../domain/foods';
import { Nutrients } from '../domain/nutrients';
import { leucinePer100g } from '../domain/protein';
import { TACO_ROWS } from './tacoFull';

const CREATED = '2026-10-28T00:00:00.000Z';

// Pratos típicos brasileiros presentes na TACO, destacados na busca.
const TYPICAL_DISHES = new Set([
  'taco-540', // Feijoada
  'taco-140', // Pão de queijo assado
  'taco-167', // Açaí com xarope de guaraná
  'taco-168', // Açaí polpa
  'taco-551', // Tapioca com manteiga
  'taco-533', // Cuscuz de milho
  'taco-534', // Cuscuz paulista
  'taco-525', // Acarajé
  'taco-527', // Baião de dois
  'taco-386', // Coxinha de frango
  'taco-56', // Pastel de carne frito
  'taco-58', // Pastel de queijo frito
  'taco-542', // Macarrão à bolonhesa
]);

type Extra = [id: string, name: string, kind: Food['kind'], n: Nutrients, servingGrams?: number, servingDescription?: string];

// Suplementos com valores médios de mercado: o ideal é escanear o rótulo da sua marca.
const EXTRAS: Extra[] = [
  ['generico-whey-concentrado', 'Whey protein concentrado (média de mercado)', 'supplement', { kcal: 400, protein: 78, carbs: 9, fat: 6, sodium: 200, calcium: 400, leucine: 8.6 }, 30, 'scoop'],
  ['generico-whey-isolado', 'Whey protein isolado (média de mercado)', 'supplement', { kcal: 370, protein: 88, carbs: 3, fat: 1, sodium: 250, calcium: 450, leucine: 9.7 }, 30, 'scoop'],
  ['generico-albumina', 'Albumina em pó (clara desidratada)', 'supplement', { kcal: 380, protein: 82, carbs: 5, fat: 0.3, sodium: 1200, leucine: 7.0 }, 30, 'scoop'],
  ['generico-caseina', 'Caseína micelar (média de mercado)', 'supplement', { kcal: 360, protein: 80, carbs: 6, fat: 1.5, calcium: 1200, leucine: 7.6 }, 30, 'scoop'],
  ['generico-hipercalorico', 'Hipercalórico (média de mercado)', 'supplement', { kcal: 380, protein: 15, carbs: 75, fat: 2, sodium: 150 }, 100, '2 scoops'],
  ['generico-creatina', 'Creatina monohidratada', 'supplement', { kcal: 0, protein: 0, carbs: 0, fat: 0 }, 5, 'dose'],
  ['generico-pasta-amendoim', 'Pasta de amendoim integral', 'food', { kcal: 600, protein: 25, carbs: 18, fat: 49, fiber: 8, sodium: 10, magnesium: 170 }, 15, 'colher de sopa'],
  ['generico-tilapia-file', 'Filé de tilápia grelhado (valor médio)', 'food', { kcal: 128, protein: 26, carbs: 0, fat: 2.7, sodium: 56, calcium: 14, iron: 0.6 }, 120, 'filé'],
  ['generico-goma-tapioca', 'Goma de tapioca hidratada', 'food', { kcal: 240, protein: 0, carbs: 59, fat: 0, fiber: 0.5, sodium: 1 }, 50, 'tapioca média'],
  ['generico-iogurte-proteico', 'Iogurte proteico (média de mercado)', 'food', { kcal: 70, protein: 9, carbs: 6, fat: 1, calcium: 150 }, 160, 'pote'],
  // PF montado com TACO: 150 g arroz, 86 g feijão, 100 g bife grelhado, 60 g salada, 100 g batata frita
  ['prato-pf', 'PF (arroz, feijão, bife, salada e fritas)', 'dish', { kcal: 152, protein: 9.9, carbs: 18.4, fat: 4.3, fiber: 2.0, sodium: 45, iron: 1.1 }, 496, 'prato'],
];

function finish(food: Food): Food {
  return { ...food, per100g: { ...food.per100g, leucine: leucinePer100g(food) } };
}

export const TACO_FOODS: Food[] = [
  ...TACO_ROWS.map((r) =>
    finish({
      id: r.id,
      name: r.name,
      category: r.category,
      source: 'taco',
      kind: TYPICAL_DISHES.has(r.id) ? 'dish' : 'food',
      per100g: r.per100g,
      createdAt: CREATED,
    }),
  ),
  ...EXTRAS.map(([id, name, kind, per100g, servingGrams, servingDescription]) =>
    finish({ id, name, kind, source: 'manual', category: kind === 'supplement' ? 'Suplementos' : undefined, per100g, servingGrams, servingDescription, createdAt: CREATED }),
  ),
];
