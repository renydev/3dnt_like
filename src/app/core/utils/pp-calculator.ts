import { Character } from '../models/character.model';

/**
 * Custo acumulado de PP para um atributo no valor N.
 * Ex: F5 = 5+4+3+2+1 = 15
 */
export function attrPPCost(value: number): number {
  return (value * (value + 1)) / 2;
}

/**
 * PP total gasto num personagem.
 * Usa o valor REAL (base + modificador racial) de cada atributo,
 * pois raças têm custo próprio embutido.
 */
export function calcCharacterPP(char: Character): number {
  const f  = char.forca.base;
  const h  = char.habilidade.base;
  const r  = char.resistencia.base;
  const a  = char.armadura;
  const pf = char.poderFogo.base;
  return attrPPCost(f) + attrPPCost(h) + attrPPCost(r) + attrPPCost(a) + attrPPCost(pf);
}

/**
 * PP de um inimigo com base nos seus atributos.
 * Resistência estimada a partir do HP (HP = R*5).
 */
export function calcEnemyPP(forca: number, habilidade: number, armadura: number, resistencia?: number): number {
  const r = resistencia ?? 1;
  return attrPPCost(forca) + attrPPCost(habilidade) + attrPPCost(armadura) + attrPPCost(r);
}

/**
 * PE que um único monstro vale para um personagem com `charPP` pontos.
 * Regras:
 *   - monsterPP < charPP/2          → 0 PE
 *   - ratio 0.5× a 1.5×             → 1 PE
 *   - ratio 1.5× a 2.5×             → 2 PE
 *   - acima de 2.5×                 → 1 PE por cada metade (floor(ratio*2))
 */
export function monsterPEForChar(monsterPP: number, charPP: number): number {
  if (charPP <= 0) return 0;
  const ratio = monsterPP / charPP;
  if (ratio < 0.5) return 0;
  if (ratio < 1.5) return 1;
  if (ratio < 2.5) return 2;
  return Math.floor(ratio * 2);
}

export interface CombatPEResult {
  /** PE que cada membro da party recebe */
  pePerCharacter: number;
  /** PE total gerado pelo encontro */
  totalPE: number;
  /** PP médio da party usado no cálculo */
  avgCharPP: number;
  /** PP somado de todos os monstros */
  totalMonsterPP: number;
}

/**
 * Calcula a distribuição de PE do combate.
 * - Cada monstro gera PE com base no PP médio da party.
 * - O total é dividido igualmente entre os personagens.
 */
export function calcCombatPE(
  monsterPPs: number[],
  charPPs: number[],
): CombatPEResult {
  if (charPPs.length === 0 || monsterPPs.length === 0) {
    return { pePerCharacter: 0, totalPE: 0, avgCharPP: 0, totalMonsterPP: 0 };
  }

  const avgCharPP = charPPs.reduce((s, p) => s + p, 0) / charPPs.length;
  const totalMonsterPP = monsterPPs.reduce((s, p) => s + p, 0);
  const totalPE = monsterPPs.reduce((s, pp) => s + monsterPEForChar(pp, avgCharPP), 0);
  const pePerCharacter = Math.floor(totalPE / charPPs.length);

  return { pePerCharacter, totalPE, avgCharPP, totalMonsterPP };
}
