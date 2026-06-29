/**
 * Escalas de Poder do 3D&T: cada atributo cruzando uma ordem de grandeza
 * passa para uma escala dez vezes mais poderosa, com símbolo próprio.
 *   Ningen  ("humano")  0–9      — escala normal, sem símbolo
 *   Sugoi   ("incrível") 10–99   — ⭐ dez vezes mais poderoso
 *   Kiodai  ("gigante")  100–999 — ☁️ cem vezes mais poderoso
 *   Kami    ("deus")     1000+   — 👑 mil vezes mais poderoso
 */
export type PowerScale = 'ningen' | 'sugoi' | 'kiodai' | 'kami';

export const POWER_SCALE_LABEL: Record<PowerScale, string> = {
  ningen: 'Ningen',
  sugoi: 'Sugoi',
  kiodai: 'Kiodai',
  kami: 'Kami',
};

/** Símbolo exibido ao lado do atributo/nome ao alcançar a escala (vazio para Ningen). */
export const POWER_SCALE_SYMBOL: Record<PowerScale, string> = {
  ningen: '',
  sugoi: '⭐',
  kiodai: '☁️',
  kami: '👑',
};

export function getPowerScale(value: number): PowerScale {
  if (value >= 1000) return 'kami';
  if (value >= 100) return 'kiodai';
  if (value >= 10) return 'sugoi';
  return 'ningen';
}

export function powerScaleSymbol(value: number): string {
  return POWER_SCALE_SYMBOL[getPowerScale(value)];
}

export function powerScaleLabel(value: number): string {
  return POWER_SCALE_LABEL[getPowerScale(value)];
}
