// Mapa do corpo (frente e costas) com os músculos trabalhados pintados pela
// quantidade de séries: quanto mais séries, mais forte a cor.

import { View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import { Muscle } from '../domain/workout/exercises';
import { colors } from './ui';

type Shape = { kind: 'e'; cx: number; cy: number; rx: number; ry: number } | { kind: 'p'; d: string } | { kind: 'r'; x: number; y: number; w: number; h: number; r: number };

const e = (cx: number, cy: number, rx: number, ry: number): Shape => ({ kind: 'e', cx, cy, rx, ry });
const p = (d: string): Shape => ({ kind: 'p', d });
const r = (x: number, y: number, w: number, h: number, rr = 4): Shape => ({ kind: 'r', x, y, w, h, r: rr });
/** Espelha a forma do lado esquerdo para o direito (o eixo do corpo é x = 50). */
const both = (s: Shape): Shape[] => {
  if (s.kind === 'e') return [s, { ...s, cx: 100 - s.cx }];
  if (s.kind === 'r') return [s, { ...s, x: 100 - s.x - s.w }];
  return [s, p(s.d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${100 - Number(x)} ${y}`))];
};

// Partes sem músculo mapeado (cabeça, mãos, joelhos, pés) ficam sempre na cor de base.
const FRAME: Shape[] = [
  e(50, 13, 8.5, 10.5),
  r(45, 22, 10, 8, 3),
  ...both(e(22.5, 92, 3.5, 4.5)),
  ...both(e(42.5, 136, 5.5, 5)),
  ...both(e(41.5, 184, 5, 3)),
];

const FRONT: [Muscle, Shape[]][] = [
  ['trapezio', both(p('M45 26 L35 33 L45 32 Z'))],
  ['ombros', both(e(31, 38, 7, 7.5))],
  ['peito', both(p('M38 33 Q49 31 49.5 34 L49.5 49 Q43 52 37 47 Q35 40 38 33 Z'))],
  ['biceps', both(e(27.5, 54, 4.8, 10))],
  ['antebraco', both(e(24.5, 75, 4.2, 11))],
  ['abdomen', [r(41.5, 52, 17, 32, 5), ...both(p('M37 50 L41 53 L41 83 L38 80 Q36 66 37 50 Z'))]],
  ['quadriceps', both(e(42.5, 110, 7.8, 21))],
  ['panturrilha', both(e(42, 158, 4.8, 17))],
];

const BACK: [Muscle, Shape[]][] = [
  ['trapezio', [p('M50 23 L37 33 L44 36 L50 54 L56 36 L63 33 Z')]],
  ['ombros', both(e(31, 38, 7, 7.5))],
  ['costas', both(p('M37 37 L45 38 L49 56 L46 70 L40 66 Q36 52 37 37 Z'))],
  ['lombar', [r(44, 66, 12, 18, 4)]],
  ['triceps', both(e(27.5, 54, 4.8, 10))],
  ['antebraco', both(e(24.5, 75, 4.2, 11))],
  ['gluteos', both(e(43.5, 95, 7.5, 9))],
  ['posteriores', both(e(42.5, 118, 7.2, 17))],
  ['panturrilha', both(e(42, 156, 5.6, 15))],
];

function draw(s: Shape, fill: string, key: string | number, opacity = 1) {
  if (s.kind === 'e') return <Ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} fillOpacity={opacity} />;
  if (s.kind === 'r') return <Rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={fill} fillOpacity={opacity} />;
  return <Path key={key} d={s.d} fill={fill} fillOpacity={opacity} />;
}

function Figure({ parts, sets, max, height }: { parts: [Muscle, Shape[]][]; sets: Partial<Record<Muscle, number>>; max: number; height: number }) {
  const base = colors.track;
  return (
    <Svg width={(height * 100) / 190} height={height} viewBox="0 0 100 190">
      <G>
        {FRAME.map((s, i) => draw(s, base, `f${i}`))}
        {parts.flatMap(([m, shapes]) => shapes.map((s, i) => draw(s, base, `${m}b${i}`)))}
        {parts.flatMap(([m, shapes]) => {
          const n = sets[m] ?? 0;
          if (n <= 0) return [];
          const f = Math.min(1, n / max);
          return shapes.map((s, i) => draw(s, colors.primary, `${m}${i}`, 0.3 + 0.7 * f));
        })}
      </G>
    </Svg>
  );
}

export function BodyMap({ sets, height = 240, max }: { sets: Partial<Record<Muscle, number>>; height?: number; max?: number }) {
  const top = max ?? Math.max(1, ...Object.values(sets).map((v) => v ?? 0));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }} accessibilityLabel="Mapa do corpo com os músculos trabalhados">
      <Figure parts={FRONT} sets={sets} max={top} height={height} />
      <Figure parts={BACK} sets={sets} max={top} height={height} />
    </View>
  );
}
