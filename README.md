# MacroFactorBR

App de dieta brasileiro para musculação e ganho de massa magra. Calcula metas de calorias, proteína, carboidratos e gorduras, acompanha micronutrientes e cadastra alimentos pelo código de barras e pela foto da tabela nutricional.

Roda em **Android, iOS e web** a partir de um único código (TypeScript + Expo/React Native).

## O que o MVP faz

- **Perfil e metas**: sexo, idade, altura, peso, % de gordura (opcional), atividade e objetivo (ganho de massa magra, recomposição, definição). Gasto pela fórmula de Mifflin-St Jeor (ou Katch-McArdle com % de gordura).
- **Proteína em primeiro lugar**: meta em g/kg (padrão 2,0), meta por refeição e aviso quando uma refeição fica abaixo de 0,3 g/kg.
- **Gasto adaptativo**: depois de ~2 semanas de pesagens e refeições, o app estima o seu gasto real pela tendência do peso e ajusta as metas sozinho.
- **Diário**: refeições do dia com totais de macros e micronutrientes (%VD pela IN 75/2020 da ANVISA).
- **Código de barras**: lê EAN/UPC pela câmera (ou digitado). Procura primeiro nos alimentos já cadastrados, depois na Open Food Facts.
- **Foto da tabela (OCR)**: se o produto não existir, fotografe a tabela nutricional; o app lê os valores (formato novo RDC 429 e antigo RDC 360), converte para 100 g e liga ao código de barras.
- **Base inicial** com ~40 alimentos brasileiros comuns (valores da TACO).
- **Proteína por real**: compara custo-benefício de whey, carnes e ovos.

## Rodando

```bash
npm install
npm run web        # navegador
npm start          # Expo Go no celular (sem OCR nativo)
npm test           # testes da lógica de cálculo e do leitor de tabela
npm run typecheck
```

O OCR no celular usa o Google ML Kit, que é um módulo nativo e **não roda no Expo Go**. Para testar a foto da tabela no celular, gere um development build:

```bash
npx expo run:android   # ou run:ios num Mac
# ou na nuvem: npx eas-cli@latest build --profile development
```

Na web, o OCR usa Tesseract.js e baixa o modelo em português na primeira leitura.

## Estrutura

```
src/
  app/            telas (Expo Router)
  domain/         lógica pura e testada: metas, TDEE adaptativo, leitor de tabela, Open Food Facts
  data/taco.ts    alimentos iniciais
  services/ocr.*  OCR nativo (ML Kit) e web (Tesseract.js)
  store/          estado salvo no aparelho (zustand + AsyncStorage)
```

## Próximos passos

- Importar a TACO completa e a TBCA (verificar licença comercial da TBCA).
- Login e sincronização entre aparelhos (Supabase).
- Conversão cru ↔ cozido, marmitas por peso e medidas caseiras.
- Base compartilhada de produtos lidos por OCR entre usuários.
