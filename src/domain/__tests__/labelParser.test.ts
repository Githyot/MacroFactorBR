import { describe, expect, it } from '@jest/globals';
import { linesFromWords, parseNutritionLabel } from '../labelParser';

const NEW_FORMAT = `INFORMAÇÃO NUTRICIONAL
Porções por embalagem: 10
Porção: 30 g (1 xícara)
100 g 30 g %VD*
Valor energético (kcal) 386 116 6
Carboidratos totais (g) 67 20 7
Açúcares totais (g) 10 3,0
Açúcares adicionados (g) 8,0 2,4 5
Proteínas (g) 12 3,6 7
Gorduras totais (g) 7,5 2,3 3
Gorduras saturadas (g) 1,2 0,4 2
Gorduras trans (g) 0 0 0
Fibras alimentares (g) 6,0 1,8 7
Sódio (mg) 200 60 3
*Percentual de valores diários fornecidos pela porção.`;

const OLD_FORMAT = `INFORMAÇÃO NUTRICIONAL
Porção de 40 g (2 fatias)
Quantidade por porção %VD(*)
Valor energético 116 kcal = 487 kJ 6%
Carboidratos 20 g 7%
Proteínas 4,0 g 5%
Gorduras totais 2,0 g 4%
Gorduras saturadas 0,4 g 2%
Gorduras trans 0 g **
Fibra alimentar 1,8 g 7%
Sódio 60 mg 3%
Não contém quantidade significativa de colesterol.
* % Valores Diários com base em uma dieta de 2.000 kcal`;

describe('parseNutritionLabel', () => {
  it('lê o formato novo da ANVISA usando a coluna de 100 g', () => {
    const r = parseNutritionLabel(NEW_FORMAT);
    expect(r.format).toBe('per100');
    expect(r.serving).toEqual({ amount: 30, unit: 'g', description: '1 xicara' });
    expect(r.per100g).toMatchObject({
      kcal: 386, carbs: 67, sugars: 10, addedSugars: 8, protein: 12,
      fat: 7.5, saturatedFat: 1.2, transFat: 0, fiber: 6, sodium: 200,
    });
    expect(r.warnings).toEqual([]);
  });

  it('converte o formato antigo (por porção) para 100 g', () => {
    const r = parseNutritionLabel(OLD_FORMAT);
    expect(r.format).toBe('perServing');
    expect(r.per100g.kcal).toBe(290);
    expect(r.per100g.protein).toBe(10);
    expect(r.per100g.carbs).toBe(50);
    expect(r.per100g.fat).toBe(5);
    expect(r.per100g.sodium).toBe(150);
    expect(r.per100g.cholesterol).toBeUndefined();
  });

  it('aguenta OCR sem acentos e com O no lugar de zero', () => {
    const r = parseNutritionLabel(`PORCAO 25g\n100g 25g\nValor energetico (kcal) 380 95\nProteinas (g) 8o 20\nCarboidratos (g) 6,O 1,5\nGorduras totais (g) 6,4 1,6\nSodio (mg) 1OO 25`);
    expect(r.per100g).toMatchObject({ kcal: 380, protein: 80, carbs: 6, fat: 6.4, sodium: 100 });
  });

  it('estima calorias quando o OCR não lê a linha de energia', () => {
    const r = parseNutritionLabel(`Porção 100 g\nProteínas 20 g\nCarboidratos 10 g\nGorduras totais 5 g`);
    expect(r.per100g.kcal).toBe(165);
    expect(r.warnings.some((w) => w.includes('estimei'))).toBe(true);
  });

  it('lê micronutrientes e vitamina B12 sem confundir o 12 com valor', () => {
    const r = parseNutritionLabel(`100 g 30 g\nValor energético (kcal) 400 120\nProteínas (g) 80 24\nCarboidratos (g) 8 2,4\nGorduras totais (g) 6 1,8\nCálcio (mg) 400 120 12\nVitamina B12 (µg) 2,0 0,6 25`);
    expect(r.per100g.calcium).toBe(400);
    expect(r.per100g.vitaminB12).toBe(2);
  });

  it('avisa quando os números não fazem sentido', () => {
    const r = parseNutritionLabel(`100 g\nValor energético (kcal) 100\nProteínas (g) 60\nCarboidratos (g) 50\nGorduras totais (g) 10`);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('linesFromWords', () => {
  it('reconstrói linhas da tabela a partir de colunas separadas', () => {
    const w = (text: string, left: number, top: number) => ({ text, left, top, width: 40, height: 20 });
    const text = linesFromWords([
      w('Proteínas', 0, 100), w('Valor', 0, 50), w('energético', 50, 52),
      w('12', 300, 102), w('386', 300, 49), w('3,6', 400, 98), w('116', 400, 51),
    ]);
    expect(text.split('\n')).toEqual(['Valor energético 386 116', 'Proteínas 12 3,6']);
  });
});
