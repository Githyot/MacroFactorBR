// Temas no estilo de cada sistema. Só cores, cantos, espaçamento e efeitos:
// nenhuma logo nem fonte proprietária embutida (na web, a lista de fontes usa a do
// próprio aparelho quando existir).

export type ThemeId = 'padrao' | 'pixel' | 'oneui' | 'ios' | 'windows' | 'macos' | 'gnome';
export type ColorMode = 'auto' | 'light' | 'dark';

export type Palette = {
  bg: string;
  card: string;
  /** Superfície secundária: fundo de séries, campos pequenos, pílulas neutras. */
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
  danger: string;
  dangerSoft: string;
  warn: string;
  warnSoft: string;
  inputBg: string;
  track: string;
  /** Barra escura do timer de descanso. */
  inverse: string;
  onInverse: string;
  inverseMuted: string;
  overlay: string;
  /** Cabeçalho e barra de abas. */
  bar: string;
};

export type Shape = {
  radiusCard: number;
  radiusButton: number;
  radiusChip: number;
  radiusInput: number;
  radiusSmall: number;
  cardBorder: number;
  /** Sombra suave nos cartões (Material, GNOME, One UI). */
  cardShadow: boolean;
  buttonPadV: number;
  /** Peso dos títulos de cartão. */
  titleWeight: '600' | '700' | '800';
  titleSize: number;
  headerCenter: boolean;
  headerBorder: boolean;
  inputBorder: boolean;
  gap: number;
  padding: number;
};

export type ThemeDef = {
  id: ThemeId;
  label: string;
  description: string;
  light: Palette;
  dark: Palette;
  shape: Shape;
  /** Lista de fontes na web. No celular fica a fonte do sistema. */
  webFont?: string;
  /** Vidro: cartões translúcidos com desfoque sobre um fundo em degradê (iOS 26, macOS). */
  glass?: { light: [string, string]; dark: [string, string]; blur: number };
};

const base = (p: Partial<Palette> & Pick<Palette, 'bg' | 'card' | 'text' | 'muted' | 'border' | 'primary' | 'primarySoft'>, dark: boolean): Palette => ({
  cardAlt: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  onPrimary: '#FFFFFF',
  onPrimarySoft: p.primary,
  protein: p.primary,
  carbs: dark ? '#F2B94B' : '#B26A00',
  fat: dark ? '#C8A2FF' : '#7A4FB8',
  kcal: dark ? '#7EA6FF' : '#3B6FD8',
  danger: dark ? '#FF8A80' : '#B3261E',
  dangerSoft: dark ? 'rgba(255,138,128,0.16)' : '#FDE7E5',
  warn: dark ? '#FFCC66' : '#8A5A00',
  warnSoft: dark ? 'rgba(255,204,102,0.14)' : '#FFF4D6',
  inputBg: p.card,
  track: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
  inverse: dark ? '#F2F2F2' : '#1C1F1E',
  onInverse: dark ? '#111111' : '#FFFFFF',
  inverseMuted: dark ? '#555555' : '#B5BDB9',
  overlay: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
  bar: p.card,
  ...p,
});

const SYSTEM_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif';

export const THEMES: Record<ThemeId, ThemeDef> = {
  // Padrão: limpo e minimalista, preto e branco com uma cor por macro
  // (calorias azul, proteína coral, gordura amarela, carboidrato verde).
  padrao: {
    id: 'padrao',
    label: 'Padrão',
    description: 'Limpo e minimalista, preto e branco',
    light: base(
      {
        bg: '#F4F4F4', card: '#FFFFFF', cardAlt: '#EFEFEF', text: '#111111', muted: '#6B6B6B', border: '#E8E8E8',
        primary: '#111111', onPrimary: '#FFFFFF', primarySoft: '#E6F4EC', onPrimarySoft: '#1B7A48',
        kcal: '#5B8DEF', protein: '#F0795A', fat: '#EFB233', carbs: '#3DA66B',
        inputBg: '#EFEFEF', track: '#EEEEEE', bar: '#FFFFFF', inverse: '#111111',
      },
      false,
    ),
    dark: base(
      {
        bg: '#000000', card: '#141414', cardAlt: '#222222', text: '#F2F2F2', muted: '#9A9A9A', border: '#262626',
        primary: '#F2F2F2', onPrimary: '#111111', primarySoft: '#14301F', onPrimarySoft: '#6FD39A',
        kcal: '#7EA6FF', protein: '#FF8E6E', fat: '#F5C452', carbs: '#56C285',
        inputBg: '#1E1E1E', track: '#262626', bar: '#0A0A0A',
      },
      true,
    ),
    shape: { radiusCard: 18, radiusButton: 14, radiusChip: 100, radiusInput: 12, radiusSmall: 12, cardBorder: 0, cardShadow: false, buttonPadV: 14, titleWeight: '700', titleSize: 18, headerCenter: false, headerBorder: false, inputBorder: false, gap: 12, padding: 16 },
  },

  // Material You (Material 3): superfícies tonais, cartões preenchidos sem borda,
  // botões em pílula, chips de filtro com canto de 8.
  pixel: {
    id: 'pixel',
    label: 'Pixel',
    description: 'Material You: tons suaves e botões em pílula',
    webFont: '"Google Sans Text", Roboto, "Noto Sans", system-ui, sans-serif',
    light: base(
      {
        bg: '#FEF7FF', card: '#F3EDF7', cardAlt: '#E8DEF8', text: '#1D1B20', muted: '#49454F', border: '#CAC4D0',
        primary: '#6750A4', primarySoft: '#E8DEF8', onPrimarySoft: '#1D192B', protein: '#6750A4', fat: '#7D5260', carbs: '#8B5000',
        inputBg: '#FEF7FF', track: '#E6E0E9', bar: '#F3EDF7', inverse: '#322F35', onInverse: '#F5EFF7', inverseMuted: '#CAC4D0',
      },
      false,
    ),
    dark: base(
      {
        bg: '#141218', card: '#211F26', cardAlt: '#2B2930', text: '#E6E0E9', muted: '#CAC4D0', border: '#49454F',
        primary: '#D0BCFF', onPrimary: '#381E72', primarySoft: '#4A4458', onPrimarySoft: '#E8DEF8', protein: '#D0BCFF', fat: '#EFB8C8', carbs: '#FFB869',
        inputBg: '#141218', track: '#36343B', bar: '#211F26', inverse: '#E6E0E9', onInverse: '#322F35', inverseMuted: '#605D66', danger: '#F2B8B5',
      },
      true,
    ),
    shape: { radiusCard: 16, radiusButton: 100, radiusChip: 8, radiusInput: 4, radiusSmall: 12, cardBorder: 0, cardShadow: false, buttonPadV: 12, titleWeight: '600', titleSize: 20, headerCenter: false, headerBorder: false, inputBorder: true, gap: 12, padding: 16 },
  },

  // One UI: cartões muito arredondados sobre fundo cinza claro (preto no escuro),
  // títulos grandes e azul da marca.
  oneui: {
    id: 'oneui',
    label: 'One UI',
    description: 'Samsung: cartões bem redondos e fundo preto no escuro',
    webFont: SYSTEM_SANS,
    light: base(
      { bg: '#F2F2F2', card: '#FCFCFC', cardAlt: '#EDEDED', text: '#010101', muted: '#6F6F6F', border: '#E3E3E3', primary: '#0072DE', primarySoft: '#DCEBFC', protein: '#0072DE', inputBg: '#F0F0F0', bar: '#F2F2F2' },
      false,
    ),
    dark: base(
      { bg: '#000000', card: '#171717', cardAlt: '#252525', text: '#FAFAFA', muted: '#A0A0A0', border: '#2A2A2A', primary: '#3E91FF', primarySoft: '#10284A', protein: '#3E91FF', inputBg: '#252525', bar: '#000000' },
      true,
    ),
    shape: { radiusCard: 26, radiusButton: 100, radiusChip: 100, radiusInput: 18, radiusSmall: 14, cardBorder: 0, cardShadow: false, buttonPadV: 14, titleWeight: '700', titleSize: 20, headerCenter: false, headerBorder: false, inputBorder: false, gap: 14, padding: 16 },
  },

  // iOS 26: Liquid Glass. Cartões translúcidos com desfoque, cápsulas e azul do sistema.
  ios: {
    id: 'ios',
    label: 'iOS 26',
    description: 'Vidro líquido: cartões translúcidos e cápsulas',
    webFont: '-apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", sans-serif',
    light: base(
      {
        bg: '#F2F2F7', card: 'rgba(255,255,255,0.62)', cardAlt: 'rgba(118,118,128,0.12)', text: '#000000', muted: '#6C6C70', border: 'rgba(255,255,255,0.75)',
        primary: '#007AFF', primarySoft: 'rgba(0,122,255,0.12)', protein: '#007AFF', carbs: '#FF9500', fat: '#AF52DE', danger: '#FF3B30', dangerSoft: 'rgba(255,59,48,0.12)',
        inputBg: 'rgba(118,118,128,0.12)', track: 'rgba(120,120,128,0.16)', bar: 'rgba(249,249,249,0.72)', inverse: 'rgba(30,30,32,0.88)',
      },
      false,
    ),
    dark: base(
      {
        bg: '#000000', card: 'rgba(44,44,46,0.55)', cardAlt: 'rgba(118,118,128,0.24)', text: '#FFFFFF', muted: '#98989F', border: 'rgba(255,255,255,0.14)',
        primary: '#0A84FF', primarySoft: 'rgba(10,132,255,0.22)', onPrimarySoft: '#64B0FF', protein: '#0A84FF', carbs: '#FF9F0A', fat: '#BF5AF2', danger: '#FF453A', dangerSoft: 'rgba(255,69,58,0.2)',
        inputBg: 'rgba(118,118,128,0.24)', track: 'rgba(120,120,128,0.32)', bar: 'rgba(22,22,24,0.72)', inverse: 'rgba(242,242,247,0.9)',
      },
      true,
    ),
    shape: { radiusCard: 26, radiusButton: 100, radiusChip: 100, radiusInput: 12, radiusSmall: 10, cardBorder: 1, cardShadow: true, buttonPadV: 14, titleWeight: '700', titleSize: 20, headerCenter: true, headerBorder: false, inputBorder: false, gap: 12, padding: 16 },
    glass: { light: ['#DCE8FF', '#F6E3F4'], dark: ['#0B1026', '#25102A'], blur: 24 },
  },

  // Windows 11 (Fluent): fundo Mica, cartões de canto 8 com borda fina, controles de canto 4.
  windows: {
    id: 'windows',
    label: 'Windows 11',
    description: 'Fluent: cantos discretos, bordas finas e azul de destaque',
    webFont: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    light: base(
      { bg: '#F3F3F3', card: '#FBFBFB', cardAlt: '#F0F0F0', text: '#1A1A1A', muted: '#5D5D5D', border: '#E5E5E5', primary: '#005FB8', primarySoft: '#E0EEF9', protein: '#005FB8', danger: '#C42B1C', inputBg: '#FFFFFF', bar: '#EEEEEE' },
      false,
    ),
    dark: base(
      { bg: '#202020', card: '#2B2B2B', cardAlt: '#323232', text: '#FFFFFF', muted: '#C5C5C5', border: '#3A3A3A', primary: '#60CDFF', onPrimary: '#000000', primarySoft: '#1D3A4A', protein: '#60CDFF', danger: '#FF99A4', inputBg: '#2D2D2D', bar: '#1C1C1C' },
      true,
    ),
    shape: { radiusCard: 8, radiusButton: 4, radiusChip: 4, radiusInput: 4, radiusSmall: 4, cardBorder: 1, cardShadow: false, buttonPadV: 9, titleWeight: '600', titleSize: 18, headerCenter: false, headerBorder: true, inputBorder: true, gap: 8, padding: 16 },
  },

  // macOS: janela clara, cartões com borda sutil e vidro mais discreto que o do iOS.
  macos: {
    id: 'macos',
    label: 'macOS',
    description: 'Janelas com vidro discreto e controles compactos',
    webFont: '-apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", sans-serif',
    light: base(
      {
        bg: '#ECECEC', card: 'rgba(255,255,255,0.72)', cardAlt: 'rgba(0,0,0,0.05)', text: '#1D1D1F', muted: '#6E6E73', border: 'rgba(0,0,0,0.1)',
        primary: '#007AFF', primarySoft: 'rgba(0,122,255,0.12)', protein: '#007AFF', carbs: '#FF9500', fat: '#AF52DE', danger: '#FF3B30',
        inputBg: '#FFFFFF', bar: 'rgba(236,236,236,0.8)',
      },
      false,
    ),
    dark: base(
      {
        bg: '#1E1E1E', card: 'rgba(50,50,52,0.6)', cardAlt: 'rgba(255,255,255,0.07)', text: '#F5F5F7', muted: '#A1A1A6', border: 'rgba(255,255,255,0.1)',
        primary: '#0A84FF', primarySoft: 'rgba(10,132,255,0.22)', onPrimarySoft: '#64B0FF', protein: '#0A84FF', carbs: '#FF9F0A', fat: '#BF5AF2', danger: '#FF453A',
        inputBg: 'rgba(255,255,255,0.06)', bar: 'rgba(30,30,30,0.8)',
      },
      true,
    ),
    shape: { radiusCard: 12, radiusButton: 7, radiusChip: 7, radiusInput: 7, radiusSmall: 6, cardBorder: 1, cardShadow: true, buttonPadV: 9, titleWeight: '600', titleSize: 17, headerCenter: true, headerBorder: true, inputBorder: true, gap: 12, padding: 18 },
    glass: { light: ['#D9E2F2', '#F1E4E1'], dark: ['#14181F', '#241B29'], blur: 30 },
  },

  // GNOME (libadwaita): cabeçalho da cor da janela, listas em cartões de canto 12,
  // botões de canto 6 e azul Adwaita.
  gnome: {
    id: 'gnome',
    label: 'GNOME',
    description: 'Adwaita: limpo, cantos médios e azul do GNOME',
    webFont: '"Adwaita Sans", Cantarell, Inter, system-ui, sans-serif',
    light: base(
      {
        bg: '#FAFAFB', card: '#FFFFFF', cardAlt: 'rgba(0,0,6,0.06)', text: '#1E1E21', muted: '#68686D', border: 'rgba(0,0,6,0.08)',
        primary: '#3584E4', primarySoft: 'rgba(53,132,228,0.14)', onPrimarySoft: '#1C71D8', protein: '#3584E4', carbs: '#C64600', fat: '#9141AC', danger: '#E01B24',
        inputBg: 'rgba(0,0,6,0.06)', bar: '#EBEBED',
      },
      false,
    ),
    dark: base(
      {
        bg: '#222226', card: '#2E2E32', cardAlt: 'rgba(255,255,255,0.1)', text: '#FFFFFF', muted: '#B0B0B5', border: 'rgba(0,0,6,0.36)',
        primary: '#78AEED', onPrimary: '#0B1F33', primarySoft: 'rgba(120,174,237,0.18)', protein: '#78AEED', carbs: '#FFA348', fat: '#DC8ADD', danger: '#FF7B63',
        inputBg: 'rgba(255,255,255,0.1)', bar: '#2E2E32',
      },
      true,
    ),
    shape: { radiusCard: 12, radiusButton: 6, radiusChip: 6, radiusInput: 6, radiusSmall: 6, cardBorder: 0, cardShadow: true, buttonPadV: 10, titleWeight: '700', titleSize: 17, headerCenter: true, headerBorder: false, inputBorder: false, gap: 12, padding: 16 },
  },
};

export const THEME_ORDER: ThemeId[] = ['padrao', 'pixel', 'oneui', 'ios', 'windows', 'macos', 'gnome'];
