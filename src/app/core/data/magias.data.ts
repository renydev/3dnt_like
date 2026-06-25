import { CombatAbility } from '../models/combat.model';

export type MagiaRarity = 'comum' | 'incomum' | 'rara' | 'lendaria';

export interface MagiaDef {
  id: string;
  name: string;
  icon: string;
  rarity: MagiaRarity;
  pmCost: number;
  /** Habilidade mínima para conjurar. Só vale para Comuns/Incomuns — Raras/Lendárias exigem ser concedida. */
  reqHabilidade: number;
  description: string;
  effect: CombatAbility['effect'];
  bonusDice?: number;
  ignoresArmor?: boolean;
  usesPerCombat?: number;
}

/**
 * Catálogo de magias para quem tem a vantagem Magia (vantagens.data.ts).
 * Comuns e Incomuns: conjuráveis livremente por qualquer personagem com Magia que atinja a
 * Habilidade mínima exigida — não é preciso "aprender" cada uma.
 * Raras e Lendárias: só conjuráveis se o ID estiver em `Character.learnedSpells`, concedido
 * por algum evento da campanha (grimório raro, recompensa, bênção etc).
 */
export const ALL_MAGIAS: MagiaDef[] = [
  // ── Comuns ──────────────────────────────────────────────────────────────
  {
    id: 'bola-de-fogo', name: 'Bola de Fogo', icon: '🔥', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Lança uma explosão de fogo no inimigo. Dano mágico básico.',
    effect: 'magic_damage',
  },
  {
    id: 'toque-curativo', name: 'Toque Curativo', icon: '💚', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Canaliza energia vital para curar 1d6+Habilidade de PV.',
    effect: 'heal', bonusDice: 1,
  },
  {
    id: 'lanca-arcana', name: 'Lança Arcana', icon: '🔮', rarity: 'comum', pmCost: 2, reqHabilidade: 0,
    description: 'Projétil de energia pura que perfura parte da armadura do alvo.',
    effect: 'pierce',
  },

  // ── Incomuns (Habilidade 3+) ──────────────────────────────────────────────
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
    id: 'gelo-paralisante', name: 'Gelo Paralisante', icon: '🥶', rarity: 'incomum', pmCost: 3, reqHabilidade: 3,
    description: 'Congela o inimigo no lugar, paralisando-o até sofrer dano ou resistir.',
    effect: 'paralisia',
  },

  // ── Raras (precisam ser concedidas) ───────────────────────────────────────
  {
    id: 'meteoro-arcano', name: 'Meteoro Arcano', icon: '☄️', rarity: 'rara', pmCost: 5, reqHabilidade: 4,
    description: 'Invoca um meteoro flamejante. Dano mágico massivo que ignora armadura.',
    effect: 'magic_damage', ignoresArmor: true, bonusDice: 2,
  },
  {
    id: 'cura-completa', name: 'Cura Completa', icon: '✨', rarity: 'rara', pmCost: 5, reqHabilidade: 4,
    description: 'Restaura uma quantidade extraordinária de PV de um aliado.',
    effect: 'heal', bonusDice: 3,
  },

  // ── Lendárias (extremamente raras, eventos únicos de campanha) ──────────
  {
    id: 'apocalipse-arcano', name: 'Apocalipse Arcano', icon: '🌌', rarity: 'lendaria', pmCost: 8, reqHabilidade: 5,
    description: 'Desperta um poder cataclísmico, devastando o inimigo com energia pura. Uma vez por combate.',
    effect: 'magic_damage', ignoresArmor: true, bonusDice: 4, usesPerCombat: 1,
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
    return '🔒 Precisa ser concedida (grimório raro, recompensa de campanha ou bênção especial)';
  }
  return m.reqHabilidade > 0 ? `🔒 Requer Habilidade ${m.reqHabilidade}+` : '🔒 Requer a vantagem Magia';
}

export function magiaToAbility(m: MagiaDef): CombatAbility {
  return {
    id: `magia_${m.id}`, name: m.name, icon: m.icon, pmCost: m.pmCost,
    description: m.description, effect: m.effect,
    bonusDice: m.bonusDice, ignoresArmor: m.ignoresArmor, usesPerCombat: m.usesPerCombat,
  };
}
