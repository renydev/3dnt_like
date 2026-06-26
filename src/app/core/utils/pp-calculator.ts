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
 * Extrai o custo numérico (em PP) de um texto de custo do manual oficial
 * (ex.: "1pt" → 1, "1-2pt" → 1, "2, 4 ou 6pt" → 2, "-1pt" → -1, "-1 ou -2pt" → -1).
 * Sempre usa o menor valor absoluto citado, como custo/reembolso de criação —
 * variações maiores (comprar de novo, escolher tier maior) ficam para escolhas futuras.
 */
export function parseCostValue(cost: string): number {
  const match = cost.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
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

/**
 * Fator de escala de dificuldade dos monstros curados, derivado do PP da party.
 * Interpola entre âncoras conhecidas (mesmos pontos dos tiers de personagem:
 * 10/Iniciante, 20/Herói, 35/Veterano) e satura fora desse intervalo.
 * Determinístico: o mesmo PP de party sempre gera o mesmo scale.
 */
const GROWTH_ANCHORS: ReadonlyArray<readonly [pp: number, scale: number]> = [
  [10, 1.0],
  [20, 1.5],
  [35, 2.2],
];
const GROWTH_MIN = 0.7;
export const GROWTH_MAX = 2.6;

export function growthScale(partyPP: number): number {
  const anchors = GROWTH_ANCHORS;
  if (partyPP <= anchors[0][0]) {
    // Extrapola para baixo do primeiro ponto até o piso.
    const [pp0, s0] = anchors[0];
    const [pp1, s1] = anchors[1];
    const slope = (s1 - s0) / (pp1 - pp0);
    return Math.max(GROWTH_MIN, s0 + slope * (partyPP - pp0));
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const [pp0, s0] = anchors[i];
    const [pp1, s1] = anchors[i + 1];
    if (partyPP <= pp1) {
      const t = (partyPP - pp0) / (pp1 - pp0);
      return s0 + (s1 - s0) * t;
    }
  }
  // Acima da última âncora: extrapola com a mesma inclinação até o teto.
  const [ppN1, sN1] = anchors[anchors.length - 2];
  const [ppN, sN] = anchors[anchors.length - 1];
  const slope = (sN - sN1) / (ppN - ppN1);
  return Math.min(GROWTH_MAX, sN + slope * (partyPP - ppN));
}

/**
 * Pequeno reforço de dificuldade por profundidade do andar, aplicado por cima do
 * growthScale (que já é 100% baseado no PP da party do confronto). Sem isso, uma
 * party que não evolui sente a masmorra igualmente perigosa do andar 1 ao 20 —
 * o bônus (+2%/andar) dá uma sensação de progressão sem desbalancear o teto.
 * O resultado combinado ainda satura em GROWTH_MAX — o teto do monstro vale sempre.
 */
const FLOOR_BONUS_PER_LEVEL = 0.02;

export function applyFloorBonus(scale: number, floor: number): number {
  const withBonus = scale * (1 + Math.max(0, floor - 1) * FLOOR_BONUS_PER_LEVEL);
  return Math.min(GROWTH_MAX, withBonus);
}

/**
 * Quantas vantagens "fora da curva" um monstro curado pode manifestar,
 * de acordo com o quão acima do esperado a party está.
 */
export function vantagemSlotsFor(scale: number): number {
  if (scale < 1.3) return 0;
  if (scale < 1.8) return 1;
  return 2;
}

/**
 * Escala "espelhada" por atributo — em vez de um único multiplicador aplicado
 * igualmente a Poder/Habilidade/Resistência do monstro (que ignora COMO a party
 * gastou seu PP), cada atributo do monstro reage ao atributo OPOSTO da party real:
 *
 *   - Poder do monstro (seu dano) reage à Resistência média real da party — uma
 *     party "tanque" (R alto) enfrenta golpes mais fortes; uma party "vidro"
 *     (R baixo) enfrenta golpes mais fracos, mesmo com o mesmo PP total.
 *   - Resistência do monstro (sua sobrevivência) reage ao Poder médio real da
 *     party — uma party "dano" (P alto) enfrenta monstros mais resistentes; uma
 *     party fraca em ataque enfrenta monstros mais fáceis de derrubar.
 *
 * Isso resolve o caso em que duas parties com o MESMO PP total, mas distribuições
 * de atributo opostas (ex.: glass cannon vs. tanque), recebiam o monstro idêntico
 * — o que ou esmagava a glass cannon (R baixo + monstro com P "médio" inflado)
 * ou deixava o tanque entediado (R alto contra um monstro que não precisa acertar
 * tão forte). Habilidade segue a escala geral, sem espelhamento (não há um par
 * ofensivo/defensivo direto pra ela nas fórmulas de combate atuais).
 */
export interface GrowthScale {
  /** Escala "geral" — usada para PV, slots de vantagem e o teto de chefes. Equivale ao antigo `growthScale` único. */
  overall: number;
  /** Multiplicador do Poder do monstro (seu ataque) — reage à Resistência real média da party. */
  poder: number;
  /** Multiplicador da Resistência do monstro (sua defesa) — reage ao Poder real médio da party. */
  resistencia: number;
  /** Multiplicador da Habilidade do monstro — segue a escala geral. */
  habilidade: number;
}

/**
 * Constrói o GrowthScale a partir do PP total da party (magnitude geral) e da
 * distribuição REAL de atributos (não um split assumido) — ver documentação de
 * GrowthScale. `avgAttrs` deve ser a média de Poder/Habilidade/Resistência por
 * personagem da party (current, com equipamento e vantagens já refletidos se
 * disponível); `size` é o número de personagens.
 */
export function computeGrowthScale(
  partyPP: number,
  avgAttrs: { poder: number; habilidade: number; resistencia: number },
  size: number,
  floor: number,
): GrowthScale {
  const overall = applyFloorBonus(growthScale(partyPP), floor);

  // Baseline "equilibrado": o que cada atributo teria se o PP fosse dividido
  // igualmente entre Poder/Habilidade/Resistência — mesma suposição usada antes
  // de termos os atributos reais, agora só como referência de desvio.
  const expectedAttr = Math.max(1, Math.round(partyPP / Math.max(1, size) / 3));

  const clamp = (n: number) => Math.min(1.8, Math.max(0.5, n));
  const rPoder       = clamp(avgAttrs.poder       / expectedAttr);
  const rResistencia = clamp(avgAttrs.resistencia / expectedAttr);
  const rHabilidade  = clamp(avgAttrs.habilidade  / expectedAttr);

  return {
    overall,
    poder:       Math.min(GROWTH_MAX, overall * rResistencia),
    resistencia: Math.min(GROWTH_MAX, overall * rPoder),
    habilidade:  Math.min(GROWTH_MAX, overall * rHabilidade),
  };
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
