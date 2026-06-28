import { CombatAbility } from '../models/combat.model';

export type MagiaRarity = 'comum' | 'incomum' | 'rara' | 'lendaria';

export interface MagiaDef {
  id: string;
  name: string;
  icon: string;
  rarity: MagiaRarity;
  pmCost: number;
  /**
   * Habilidade mínima para conjurar. Para Comuns/Incomuns é a única exigência.
   * Para Raras/Lendárias funciona como uma 2ª via de acesso: liberam por Habilidade alta
   * MESMO sem concessão narrativa (ver isMagiaCastable em combat.service.ts) — assim a
   * progressão de Habilidade sempre desbloqueia magias novas, cedo ou tarde.
   */
  reqHabilidade: number;
  description: string;
  effect: CombatAbility['effect'];
  bonusDice?: number;
  ignoresArmor?: boolean;
  armorPierce?: number;
  /** Atinge todos os inimigos vivos, não só o alvo selecionado. */
  aoe?: boolean;
  usesPerCombat?: number;
}

/**
 * Catálogo de magias para quem tem a vantagem Magia (vantagens.data.ts).
 * Comuns e Incomuns: conjuráveis livremente por qualquer personagem com Magia que atinja a
 * Habilidade mínima exigida — não é preciso "aprender" cada uma.
 * Raras e Lendárias: conjuráveis se concedidas via `Character.learnedSpells` (grimório raro,
 * recompensa de campanha, bênção) OU se a Habilidade do personagem alcançar o requisito alto
 * (6 para Raras, 8 para Lendárias) — o que vier primeiro. Magia de alto nível sempre vira
 * acessível com progressão suficiente, a concessão só antecipa isso.
 *
 * Curva de liberação por Habilidade (3 a 5 magias novas por marco, pra sempre dar a sensação
 * de "subiu Habilidade, ganhei algo novo"): H0 → H1 → H2 → H3 → H4 → H5 → H6 (raras) → H8 (lendárias).
 */
export const ALL_MAGIAS: MagiaDef[] = [
  // ── Comuns (Habilidade 0-2) ────────────────────────────────────────────────
  {
    id: 'bola-de-fogo', name: 'Bola de Fogo', icon: '🔥', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Lança uma explosão de fogo que atinge TODOS os inimigos. Dano mágico em área.',
    effect: 'magic_damage', bonusDice: 2, aoe: true,
  },
  {
    id: 'toque-curativo', name: 'Toque Curativo', icon: '💚', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Canaliza energia vital para curar 1d6+Habilidade de PV.',
    effect: 'heal', bonusDice: 1,
  },
  {
    id: 'lanca-arcana', name: 'Lança Arcana', icon: '🔮', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Projétil de energia pura que perfura parte da armadura do alvo.',
    effect: 'pierce', bonusDice: 1, armorPierce: 2,
  },
  {
    id: 'faisca-arcana', name: 'Faísca Arcana', icon: '✨', rarity: 'comum', pmCost: 1, reqHabilidade: 1,
    description: 'Disparo rápido e barato de energia. Fraco, mas custa quase nada de PM.',
    effect: 'magic_damage', bonusDice: 0,
  },
  {
    id: 'nevoa-curativa', name: 'Névoa Curativa', icon: '🌫️', rarity: 'comum', pmCost: 3, reqHabilidade: 2,
    description: 'Uma névoa revigorante envolve o aliado, curando mais que o Toque Curativo.',
    effect: 'heal', bonusDice: 2,
  },

  // ── Incomuns (Habilidade 3-5) ──────────────────────────────────────────────
  {
    id: 'corrente-eletrica', name: 'Corrente Elétrica', icon: '⚡', rarity: 'incomum', pmCost: 3, reqHabilidade: 3,
    description: 'Choque devastador que enfraquece a resistência do inimigo por 2 turnos.',
    effect: 'weaken',
  },
  {
    id: 'nevoa-confusa', name: 'Névoa Confusa', icon: '🌀', rarity: 'incomum', pmCost: 3, reqHabilidade: 3,
    description: 'Cria uma névoa desorientante; o alvo pode atacar os próprios aliados.',
    effect: 'confusao',
  },
  {
    id: 'gelo-paralisante', name: 'Gelo Paralisante', icon: '🥶', rarity: 'incomum', pmCost: 3, reqHabilidade: 4,
    description: 'Congela o inimigo no lugar, paralisando-o até sofrer dano ou resistir.',
    effect: 'paralisia',
  },
  {
    id: 'tempestade-de-gelo', name: 'Tempestade de Gelo', icon: '❄️', rarity: 'incomum', pmCost: 4, reqHabilidade: 4,
    description: 'Lasca de gelo cortante que se espalha, atingindo todos os inimigos.',
    effect: 'magic_damage', bonusDice: 2, aoe: true,
  },
  {
    id: 'fogo-maior', name: 'Fogo Maior', icon: '🔥', rarity: 'incomum', pmCost: 4, reqHabilidade: 5,
    description: 'Versão mais poderosa da Bola de Fogo — ainda mais devastadora e em área.',
    effect: 'magic_damage', bonusDice: 3, aoe: true,
  },

  // ── Raras (Habilidade 6+, ou concedidas antes disso) ──────────────────────
  {
    id: 'meteoro-arcano', name: 'Meteoro Arcano', icon: '☄️', rarity: 'rara', pmCost: 5, reqHabilidade: 6,
    description: 'Invoca um meteoro flamejante. Dano mágico massivo em área que ignora armadura.',
    effect: 'magic_damage', ignoresArmor: true, bonusDice: 2, aoe: true,
  },
  {
    id: 'cura-completa', name: 'Cura Completa', icon: '✨', rarity: 'rara', pmCost: 5, reqHabilidade: 6,
    description: 'Restaura uma quantidade extraordinária de PV de um aliado.',
    effect: 'heal', bonusDice: 3,
  },

  // ── Lendárias (Habilidade 8+, ou concedidas antes disso) ──────────────────
  {
    id: 'apocalipse-arcano', name: 'Apocalipse Arcano', icon: '🌌', rarity: 'lendaria', pmCost: 8, reqHabilidade: 8,
    description: 'Desperta um poder cataclísmico, devastando todos os inimigos com energia pura. Uma vez por combate.',
    effect: 'magic_damage', ignoresArmor: true, bonusDice: 4, aoe: true, usesPerCombat: 1,
  },
];

export const MAGIA_MAP = new Map<string, MagiaDef>(ALL_MAGIAS.map(m => [m.id, m]));

export const MAGIA_RARITY_LABEL: Record<MagiaRarity, string> = {
  comum: 'Comum', incomum: 'Incomum', rara: 'Rara', lendaria: 'Lendária',
};

export const MAGIA_RARITY_COLOR: Record<MagiaRarity, string> = {
  comum: '#9ca3af', incomum: '#34d399', rara: '#60a5fa', lendaria: '#f5c842',
};

/** Texto de exigência mostrado no card bloqueado do Grimório. */
export function magiaRequirementLabel(m: MagiaDef): string {
  if (m.rarity === 'rara' || m.rarity === 'lendaria') {
    return `🔒 Requer Habilidade ${m.reqHabilidade}+ (ou ser concedida por grimório raro, recompensa de campanha ou bênção especial)`;
  }
  return m.reqHabilidade > 0 ? `🔒 Requer Habilidade ${m.reqHabilidade}+` : '🔒 Requer a vantagem Magia';
}

export function magiaToAbility(m: MagiaDef): CombatAbility {
  return {
    id: `magia_${m.id}`, name: m.name, icon: m.icon, pmCost: m.pmCost,
    description: m.description, effect: m.effect,
    bonusDice: m.bonusDice, ignoresArmor: m.ignoresArmor, armorPierce: m.armorPierce,
    aoe: m.aoe, usesPerCombat: m.usesPerCombat,
  };
}
