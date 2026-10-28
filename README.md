# MacroFactorBR

App de dieta brasileiro para musculação e ganho de massa magra. Calcula metas de calorias, proteína, carboidratos e gorduras, acompanha micronutrientes e cadastra alimentos pelo código de barras, pela foto da tabela nutricional, por texto, por voz ou pela foto do prato.

Roda em **Android, iOS e web** a partir de um único código (TypeScript + Expo/React Native).

## O que o app faz

**Metas e progresso**
- Perfil com sexo, idade, altura, peso, % de gordura, atividade, objetivo, nível de treino e dias de treino.
- Proteína em primeiro lugar: meta em g/kg (padrão 2,0), meta por refeição, leucina por refeição (≥ 2,5 g) e qualidade da proteína (DIAAS).
- Superávit pelo nível de treino (iniciante 1–1,5 %/mês, intermediário 0,5–1 %, avançado 0,25–0,5 %), explicado número a número.
- Gasto adaptativo pela tendência do peso e check-in semanal que ajusta as calorias em passos de até 250 kcal e avisa bulking sujo.
- Ciclo de carboidrato opcional (dia de treino × descanso, mesma média semanal).
- Medidas corporais (cintura, quadril, peito, ombros, pescoço, braços e coxas dos dois lados, antebraço, panturrilha, % de gordura), fotos de progresso (ficam só no aparelho) e gráfico de tendência.

**Registro de alimentos**
- Base TACO completa (597 alimentos) + suplementos e pratos típicos, com busca por sinônimos regionais (aipim/macaxeira/mandioca).
- Medidas caseiras (concha, escumadeira, colher, unidade, scoop) e conversão cru ↔ cozido pelo rendimento.
- Código de barras: procura nos seus alimentos, na base da comunidade e na Open Food Facts; se não achar, foto da tabela (OCR) com leitura do formato novo (RDC 429) e antigo (RDC 360). Foto da frente sugere nome e lê os selos "ALTO EM".
- Texto livre e voz ("2 ovos, 150 g de arroz cozido e 1 concha de feijão"), interpretado no aparelho, com a IA como reserva.
- Foto do prato com IA (3 por dia no grátis).
- Receitas e marmitas pelo peso pronto, com código para compartilhar.
- Favoritos, recentes, refeições salvas, copiar refeição de ontem.
- Custo por 30 g de proteína para comparar marcas.

**Treino (no estilo Hevy)**
- Biblioteca com mais de 280 exercícios em português (máquinas articuladas e de placa, polias, Smith, barra W, elástico, kettlebell, TRX e funcional), filtro por músculo e por equipamento, e exercícios personalizados.
- Programas prontos para hipertrofia: Full body 3x, Superior/Inferior 4x, Push/Pull/Legs 6x, ABC, Só máquinas 4x e Glúteos e pernas 4x.
- Rotinas editáveis (séries, faixa de repetições, descanso) organizadas em pastas.
- Treino ao vivo: coluna "Anterior", séries de aquecimento, falha e drop, RPE opcional, timer de descanso com vibração.
- Progressão dupla automática (sugere quando subir carga), recordes (carga, 1RM estimado, volume, melhor carga por repetição) e gráfico de evolução.
- Séries semanais por músculo comparadas com a faixa de 10–20, sequência semanal e calculadora de anilhas.
- Ligado à dieta: terminar o treino marca o dia de treino (ciclo de carboidrato) e lembra da proteína pós-treino.

**Planejamento e dados**
- Cardápio automático da semana com comida brasileira e lista de compras em quantidades cruas.
- Painel de micronutrientes com alvos por sexo e idade (DRIs) e sugestões de alimentos.
- Exportação em PDF e CSV para o nutricionista.
- Conta por e-mail (código, sem senha), sincronização entre aparelhos, Health Connect e Apple Saúde.
- LGPD: consentimento, exportar tudo e excluir conta.
- Plano Pro (R$ 14,90/mês ou R$ 99/ano) por RevenueCat. Enquanto `EXPO_PUBLIC_PAYWALL_ENABLED` não for `true`, tudo fica liberado.

## Rodando

```bash
npm install
npm run web        # navegador
npm start          # Expo Go no celular (sem OCR, Saúde e pagamentos)
npm test           # testes da lógica
npm run typecheck
```

Sem `.env` o app funciona 100% offline. OCR nativo (ML Kit), Health Connect, Apple Saúde e RevenueCat são módulos nativos e **não rodam no Expo Go**: gere um development build.

```bash
npx expo run:android   # ou run:ios num Mac
# ou na nuvem: npx eas-cli@latest build --profile development
```

Na web, o OCR usa Tesseract.js e a voz usa o reconhecimento de fala do navegador (Chrome/Edge).

## Configurando o servidor (Supabase)

1. Crie um projeto em supabase.com e copie a URL e a chave `anon` para `.env` (veja `.env.example`).
2. Aplique o banco e publique as funções com a [CLI do Supabase](https://supabase.com/docs/guides/cli):
   ```bash
   npx supabase link --project-ref <seu-projeto>
   npx supabase db push
   npx supabase secrets set ANTHROPIC_API_KEY=<sua-chave>
   npx supabase functions deploy ai
   npx supabase functions deploy delete-account
   ```
3. Em Authentication › Providers, deixe o login por e-mail ativo. No template "Magic Link", inclua `{{ .Token }}` para o e-mail trazer o código de 6 dígitos.

O banco tem as tabelas do estado do usuário (sincronização), da base compartilhada de alimentos (um produto vira "conferido" com 2 confirmações), dos relatórios de erro e do uso da IA, todas com RLS. A função `ai` usa o Claude e nunca expõe a chave no app.

## Pagamentos (RevenueCat)

Crie os produtos mensal e anual nas lojas, um entitlement `pro` e uma offering padrão no RevenueCat. Coloque as chaves públicas em `.env` e ligue `EXPO_PUBLIC_PAYWALL_ENABLED=true` quando quiser cobrar.

## Estrutura

```
src/
  app/            telas (Expo Router)
  domain/         lógica pura e testada: metas, check-in, TDEE adaptativo, leitor de tabela, receitas,
                  medidas, cru/cozido, micros, cardápio, relatórios, treino (domain/workout)
  data/           TACO completa (gerada por scripts/import-taco.mjs) e suplementos
  services/       Supabase, sincronização, IA, OCR, Saúde, pagamentos, arquivos, voz
  store/          estado salvo no aparelho (zustand + AsyncStorage)
supabase/         banco (migrations) e funções (ai, delete-account)
```

## Créditos

Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/UNICAMP. Dados em CSV via [raulfdm/taco-api](https://github.com/raulfdm/taco-api). Produtos industrializados via [Open Food Facts](https://world.openfoodfacts.org) (ODbL).
