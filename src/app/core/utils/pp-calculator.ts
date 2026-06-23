import { Character } from '../models/character.model';

/**
 * Custo de PP de um atributo no 3D&T Victory: linear, 1PP por ponto (0–5).
 * Acima de 5 (só possível gastando XP, fora da criação), cada ponto custa 2PP
 * (equivalente a 20XP/ponto, já que 10XP = 1PP).
 */
export function attrPPCost(value: number): number {
  if (value <= 5) return Math.max(0, value);
  return 5 + (value - 5) * 2;
}

/**
 * PP total gasto num personagem: soma de Poder + Habilidade + Resistência.
 * Usa o valor REAL (base + modificador racial) de cada atributo.
 */
export function calcCharacterPP(char: Character): number {
  const p = char.poder.base;
  const h = char.habilidade.base;
  const r = char.resistencia.base;
  return attrPPCost(p) + attrPPCost(h) + attrPPCost(r);
}

/**
 * PP de um inimigo com base nos seus atributos (Poder, Habilidade, Resistência).
 * Resistência estimada a partir do HP quando não informada (HP = R × 5).
 */
export function calcEnemyPP(poder: number, habilidade: number, resistencia?: number): number {
  const r = resistencia ?? 1;
  return attrPPCost(poder) + attrPPCost(habilidade) + attrPPCost(r);
}

/** Faixas de poder do 3D&T Victory, usadas para nomear marcos de campanha. */
export type PowerTier = 'iniciante' | 'heroi' | 'veterano';

export function tierForPP(pp: number): PowerTier {
  if (pp >= 35) return 'veterano';
  if (pp >= 20) return 'heroi';
  return 'iniciante';
}

export const TIER_LABELS: Record<PowerTier, string> = {
  iniciante: 'Iniciante',
  heroi: 'Herói',
  veterano: 'Veterano',
};

/** XP concedido por marco de campanha, de acordo com a faixa de poder do personagem. */
export function milestoneXp(tier: PowerTier): number {
  return tier === 'veterano' ? 30 : tier === 'heroi' ? 20 : 10;
}

export interface CombatXpResult {
  /** XP que cada membro da party recebe */
  xpPerCharacter: number;
  /** Se este combate era o objetivo maior da aventura (chefe) */
  isMajorObjective: boolean;
  /** XP bônus concedido por enfrentar inimigos muito mais fortes */
  bonusXp: number;
  /** PP somado de todos os monstros */
  totalMonsterPP: number;
  /** PP somado de toda a party */
  totalPartyPP: number;
}

/**
 * Calcula a recompensa de XP de um combate, seguindo as regras do 3D&T Victory:
 *   - Inimigos com PP somado ≤ metade do PP da party → 0 XP (longe demais de um desafio).
 *   - Combate comum (objetivo menor) → 1 XP por personagem.
 *   - Combate de chefe (objetivo maior) → 5 XP por personagem.
 *   - Inimigos mais fortes que a party rendem XP bônus: 1 XP a cada 10 pontos de
 *     diferença de PP, até um máximo de +5 (livro limita a 5XP bônus por aventura;
 *     aqui aplicamos o teto por combate como simplificação).
 */
export function calcCombatXp(
  monsterPPs: number[],
  partyPPs: number[],
  isBossFight: boolean,
): CombatXpResult {
  if (partyPPs.length === 0 || monsterPPs.length === 0) {
    return { xpPerCharacter: 0, isMajorObjective: isBossFight, bonusXp: 0, totalMonsterPP: 0, totalPartyPP: 0 };
  }

  const totalPartyPP = partyPPs.reduce((s, p) => s + p, 0);
  const totalMonsterPP = monsterPPs.reduce((s, p) => s + p, 0);

  if (totalMonsterPP <= totalPartyPP * 0.5) {
    return { xpPerCharacter: 0, isMajorObjective: isBossFight, bonusXp: 0, totalMonsterPP, totalPartyPP };
  }

  const base = isBossFight ? 5 : 1;
  const bonusXp = totalMonsterPP > totalPartyPP
    ? Math.min(5, Math.floor((totalMonsterPP - totalPartyPP) / 10))
    : 0;

  return { xpPerCharacter: base + bonusXp, isMajorObjective: isBossFight, bonusXp, totalMonsterPP, totalPartyPP };
}
