import { describe, expect, it } from '@jest/globals';
import { dayTotals, Food, isValidGtin, proteinPerReal, searchFoods } from '../foods';
import { offToFoodDraft } from '../openFoodFacts';

const frango: Food = { id: 'f', name: 'Peito de frango grelhado', source: 'taco', per100g: { kcal: 159, protein: 32, fat: 2.5, sodium: 50 }, createdAt: '' };
const arroz: Food = { id: 'a', name: 'Arroz branco cozido', source: 'taco', per100g: { kcal: 128, protein: 2.5, carbs: 28.1 }, createdAt: '' };

describe('foods', () => {
  it('soma o dia pelas gramas consumidas', () => {
    const t = dayTotals(
      [ { id: '1', date: '2026-10-28', meal: 'lunch', foodId: 'f', grams: 150 },
        { id: '2', date: '2026-10-28', meal: 'lunch', foodId: 'a', grams: 200 } ],
      { f: frango, a: arroz },
    );
    expect(t.protein).toBeCloseTo(48 + 5);
    expect(t.kcal).toBeCloseTo(238.5 + 256);
    expect(t.carbs).toBeCloseTo(56.2);
  });

  it('valida códigos de barras EAN', () => {
    expect(isValidGtin('7891000100103')).toBe(true);
    expect(isValidGtin('7891000100104')).toBe(false);
    expect(isValidGtin('96385074')).toBe(true);
    expect(isValidGtin('abc')).toBe(false);
  });

  it('busca sem acento', () => {
    expect(searchFoods([frango, arroz], 'FRANGO grelh').map((f) => f.id)).toEqual(['f']);
  });

  it('proteína por real', () => {
    // 900 g de whey com 80% de proteína por R$ 120 = 6 g/R$
    expect(proteinPerReal({ protein: 80 }, 900, 120)).toBeCloseTo(6);
  });
});

describe('offToFoodDraft', () => {
  it('converte unidades da Open Food Facts', () => {
    const d = offToFoodDraft({
      product_name: 'Whey Teste', brands: 'Marca X, Outra',
      serving_quantity: '30',
      nutriments: { 'energy-kcal_100g': 400, proteins_100g: 80, carbohydrates_100g: 8, fat_100g: 6, sodium_100g: 0.2, calcium_100g: 0.4 },
    }, '7890000000000');
    expect(d).toMatchObject({ name: 'Whey Teste', brand: 'Marca X', barcode: '7890000000000', servingGrams: 30 });
    expect(d?.per100g).toMatchObject({ kcal: 400, protein: 80, sodium: 200, calcium: 400 });
  });

  it('descarta produto sem macronutrientes', () => {
    expect(offToFoodDraft({ product_name: 'Sem tabela', nutriments: {} })).toBeUndefined();
  });
});
