/** Rola 1d6. */
export function d6(): number {
  return Math.ceil(Math.random() * 6);
}

/** Soma N rolagens independentes de 1d6. */
export function d6n(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += d6();
  return total;
}

/** Ganho (3D&T Victory): rola 2d6 e usa o maior — concedido por vantagens e situações favoráveis. */
export function rollGanho(): number {
  return Math.max(d6(), d6());
}

/** Perda (3D&T Victory): rola 2d6 e usa o menor — imposta por desvantagens e efeitos de debuff. */
export function rollPerda(): number {
  return Math.min(d6(), d6());
}

export type RollMode = 'normal' | 'ganho' | 'perda';

/** Rola 1d6 aplicando Ganho ou Perda conforme o modo (3D&T Victory). */
export function rollD6(mode: RollMode = 'normal'): number {
  if (mode === 'ganho') return rollGanho();
  if (mode === 'perda') return rollPerda();
  return d6();
}
