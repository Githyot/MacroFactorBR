import { useMemo } from 'react';

import { colors, isGlass, screenBackground, useTheme } from './ui';

/** Cabeçalho e fundo das telas conforme o tema. Usado pela pilha e pelas abas. */
export function useHeaderOptions() {
  const { def, key } = useTheme();
  return useMemo(() => {
    const glass = isGlass();
    return {
      headerStyle: { backgroundColor: colors.bar, ...(glass ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}) },
      headerTintColor: def.id === 'padrao' ? colors.text : colors.primary,
      headerTitleStyle: { color: colors.text, fontWeight: def.shape.titleWeight },
      headerTitleAlign: def.shape.headerCenter ? ('center' as const) : ('left' as const),
      headerShadowVisible: def.shape.headerBorder,
      // Opaco também no vidro: uma cena transparente mostra as telas de baixo.
      background: screenBackground(),
    };
    // key muda junto com as cores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, def]);
}
