// Alimentos básicos brasileiros com valores por 100 g baseados na Tabela TACO (NEPA/Unicamp, 4ª ed.).
// Lista inicial para o MVP: a importação completa da TACO e da TBCA é o próximo passo.

import { Food } from '../domain/foods';
import { Nutrients } from '../domain/nutrients';

type Seed = [id: string, name: string, n: Nutrients, servingGrams?: number, servingDescription?: string];

const SEEDS: Seed[] = [
  ['taco-arroz-branco-cozido', 'Arroz branco cozido', { kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 1.6, sodium: 1, calcium: 4, iron: 0.1 }, 100, '4 colheres de sopa'],
  ['taco-arroz-integral-cozido', 'Arroz integral cozido', { kcal: 124, protein: 2.6, carbs: 25.8, fat: 1.0, fiber: 2.7, sodium: 1, calcium: 5, iron: 0.3, magnesium: 59 }, 100, '4 colheres de sopa'],
  ['taco-feijao-carioca-cozido', 'Feijão carioca cozido', { kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, sodium: 2, calcium: 27, iron: 1.3, magnesium: 42, potassium: 255 }, 86, '1 concha'],
  ['taco-feijao-preto-cozido', 'Feijão preto cozido', { kcal: 77, protein: 4.5, carbs: 14.0, fat: 0.5, fiber: 8.4, sodium: 2, calcium: 29, iron: 1.5, magnesium: 40, potassium: 256 }, 86, '1 concha'],
  ['taco-frango-peito-grelhado', 'Peito de frango sem pele grelhado', { kcal: 159, protein: 32.0, carbs: 0, fat: 2.5, sodium: 50, calcium: 5, iron: 0.3, zinc: 0.9 }, 100, '1 filé médio'],
  ['taco-frango-peito-cru', 'Peito de frango sem pele cru', { kcal: 119, protein: 21.5, carbs: 0, fat: 3.0, sodium: 56, calcium: 7, iron: 0.4, zinc: 0.7 }],
  ['taco-patinho-grelhado', 'Patinho bovino sem gordura grelhado', { kcal: 219, protein: 35.9, carbs: 0, fat: 7.3, sodium: 60, calcium: 5, iron: 3.0, zinc: 8.6 }, 100, '1 bife médio'],
  ['taco-ovo-cozido', 'Ovo de galinha inteiro cozido', { kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, sodium: 146, calcium: 49, iron: 1.5, zinc: 1.2, cholesterol: 397, vitaminB12: 1.0 }, 50, '1 unidade'],
  ['taco-clara-ovo-crua', 'Clara de ovo crua', { kcal: 59, protein: 13.4, carbs: 0, fat: 0.1, sodium: 157, calcium: 6 }, 33, '1 clara'],
  ['generico-tilapia-file', 'Filé de tilápia grelhado (valor médio)', { kcal: 128, protein: 26.0, carbs: 0, fat: 2.7, sodium: 56, calcium: 14, iron: 0.6 }, 120, '1 filé'],
  ['taco-atum-conserva', 'Atum em conserva (em óleo, drenado)', { kcal: 166, protein: 26.2, carbs: 0, fat: 6.0, sodium: 362, calcium: 7, iron: 1.2 }, 60, '1/2 lata'],
  ['taco-sardinha-conserva', 'Sardinha em conserva (óleo)', { kcal: 285, protein: 15.9, carbs: 0, fat: 24.0, sodium: 666, calcium: 550, iron: 3.5 }, 60, '1/2 lata'],
  ['taco-batata-doce-cozida', 'Batata-doce cozida', { kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, fiber: 2.2, sodium: 3, calcium: 17, potassium: 148 }, 150, '1 unidade média'],
  ['taco-batata-inglesa-cozida', 'Batata inglesa cozida', { kcal: 52, protein: 1.2, carbs: 11.9, fat: 0, fiber: 1.3, sodium: 2, potassium: 161 }, 150, '1 unidade média'],
  ['taco-mandioca-cozida', 'Mandioca (aipim) cozida', { kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3, fiber: 1.6, sodium: 1, calcium: 19 }, 100],
  ['taco-cuscuz-milho', 'Cuscuz de milho cozido com sal', { kcal: 113, protein: 2.2, carbs: 25.3, fat: 0.7, fiber: 2.1, sodium: 247, iron: 0.2 }, 135, '1 fatia'],
  ['taco-tapioca-goma', 'Goma de tapioca (hidratada)', { kcal: 240, protein: 0, carbs: 59.0, fat: 0, fiber: 0.5, sodium: 1 }, 50, '1 tapioca média'],
  ['taco-pao-frances', 'Pão francês', { kcal: 300, protein: 8.0, carbs: 58.6, fat: 3.1, fiber: 2.3, sodium: 648, calcium: 16, iron: 1.0 }, 50, '1 unidade'],
  ['taco-pao-forma-integral', 'Pão de forma integral', { kcal: 253, protein: 9.4, carbs: 49.9, fat: 3.7, fiber: 6.9, sodium: 506, calcium: 132, iron: 3.0 }, 50, '2 fatias'],
  ['taco-aveia-flocos', 'Aveia em flocos', { kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1, sodium: 5, calcium: 48, iron: 4.4, magnesium: 119, zinc: 2.6 }, 30, '3 colheres de sopa'],
  ['taco-macarrao-cru', 'Macarrão de trigo (cru)', { kcal: 371, protein: 10.0, carbs: 77.9, fat: 1.3, fiber: 2.9, sodium: 7, iron: 0.9 }, 80, '1 porção (cru)'],
  ['taco-banana-prata', 'Banana prata', { kcal: 98, protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0, potassium: 358, magnesium: 26, calcium: 8, vitaminC: 21.6 }, 70, '1 unidade média'],
  ['taco-maca-fuji', 'Maçã fuji com casca', { kcal: 56, protein: 0.3, carbs: 15.2, fat: 0, fiber: 1.3, potassium: 75, vitaminC: 2.4 }, 130, '1 unidade média'],
  ['taco-mamao-papaia', 'Mamão papaia', { kcal: 40, protein: 0.5, carbs: 10.4, fat: 0.1, fiber: 1.0, potassium: 126, vitaminC: 82.2, calcium: 22 }, 150, '1/2 unidade'],
  ['taco-laranja-pera', 'Laranja pera', { kcal: 37, protein: 1.0, carbs: 8.9, fat: 0.1, fiber: 0.8, vitaminC: 53.7, calcium: 22, potassium: 163 }, 140, '1 unidade'],
  ['taco-abacate', 'Abacate', { kcal: 96, protein: 1.2, carbs: 6.0, fat: 8.4, fiber: 6.3, potassium: 206, magnesium: 15 }, 100],
  ['taco-brocolis-cozido', 'Brócolis cozido', { kcal: 25, protein: 2.1, carbs: 4.4, fat: 0.5, fiber: 3.4, calcium: 51, iron: 0.5, vitaminC: 42.0 }, 60, '3 ramos'],
  ['taco-alface-crespa', 'Alface crespa', { kcal: 11, protein: 1.3, carbs: 1.7, fat: 0.2, fiber: 1.8, calcium: 38, vitaminC: 15.6 }, 30, '1 prato de sobremesa'],
  ['taco-tomate', 'Tomate com semente', { kcal: 15, protein: 1.1, carbs: 3.1, fat: 0.2, fiber: 1.2, potassium: 222, vitaminC: 21.2 }, 80, '1/2 unidade'],
  ['taco-cenoura-crua', 'Cenoura crua', { kcal: 34, protein: 1.3, carbs: 7.7, fat: 0.2, fiber: 3.2, potassium: 315, calcium: 23 }, 50, '1/2 unidade'],
  ['taco-leite-integral', 'Leite de vaca integral', { kcal: 61, protein: 2.9, carbs: 4.3, fat: 3.2, sodium: 64, calcium: 123, potassium: 133 }, 200, '1 copo (200 ml)'],
  ['taco-leite-desnatado', 'Leite de vaca desnatado', { kcal: 35, protein: 3.4, carbs: 4.9, fat: 0, sodium: 51, calcium: 134 }, 200, '1 copo (200 ml)'],
  ['taco-iogurte-natural', 'Iogurte natural', { kcal: 51, protein: 4.1, carbs: 1.9, fat: 3.0, sodium: 52, calcium: 143 }, 170, '1 pote'],
  ['taco-queijo-minas-frescal', 'Queijo minas frescal', { kcal: 264, protein: 17.4, carbs: 3.2, fat: 20.2, sodium: 31, calcium: 579 }, 30, '1 fatia'],
  ['taco-requeijao-cremoso', 'Requeijão cremoso', { kcal: 257, protein: 9.6, carbs: 2.4, fat: 23.4, sodium: 558, calcium: 259 }, 30, '1 colher de sopa'],
  ['taco-amendoim-torrado', 'Amendoim torrado salgado', { kcal: 606, protein: 22.5, carbs: 18.7, fat: 54.0, fiber: 7.8, sodium: 376, magnesium: 176 }, 30, '1 punhado'],
  ['taco-castanha-para', 'Castanha-do-pará crua', { kcal: 643, protein: 14.5, carbs: 15.1, fat: 63.5, fiber: 7.9, magnesium: 365, calcium: 146 }, 10, '2 unidades'],
  ['taco-azeite', 'Azeite de oliva extra virgem', { kcal: 884, protein: 0, carbs: 0, fat: 100, saturatedFat: 14.9 }, 13, '1 colher de sopa'],
  ['generico-whey-concentrado', 'Whey protein concentrado (genérico)', { kcal: 400, protein: 80, carbs: 8, fat: 6, sodium: 200, calcium: 400 }, 30, '1 scoop (confira o rótulo)'],
  ['generico-creatina', 'Creatina monohidratada', { kcal: 0, protein: 0, carbs: 0, fat: 0 }, 3, '1 dose'],
];

export const TACO_FOODS: Food[] = SEEDS.map(([id, name, per100g, servingGrams, servingDescription]) => ({
  id,
  name,
  source: id.startsWith('taco-') ? 'taco' : 'manual',
  per100g,
  servingGrams,
  servingDescription,
  createdAt: '2026-10-28T00:00:00.000Z',
}));
