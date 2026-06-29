export interface Enemy {
  id: string;
  name: string;
  icon: string;
  sprite?: string;
  flavorText: string;
  hp: number;
  maxHp: number;
  poder: number;
  habilidade: number;
  resistencia: number;
  armadura: number;
  /** Pontos de Personagem calculados com base nos atributos */
  pp: number;
  xpReward: number;
  goldReward: number;
  itemsReward?: string[];  // IDs de itens que podem dropar (1 sorteado aleatoriamente)
  isBoss: boolean;
  isUndead?: boolean;
  /** Vantagens "fora da curva" manifestadas por escala de dificuldade (ver monster-vantagens.data.ts). */
  bonusVantagens?: string[];
  /** PV recuperados no início de cada turno do inimigo (vantagem Regeneração). */
  regenPerTurn?: number;
}

export type CombatPhase = 'player_turn' | 'companion_turn' | 'enemy_turn' | 'victory' | 'defeat';

export type LogEntryType = 'player' | 'enemy' | 'system' | 'heal' | 'miss';

export interface CombatLogEntry {
  text: string;
  type: LogEntryType;
}

export interface CombatAbility {
  id: string;
  name: string;
  icon: string;
  pmCost: number;
  usesPerCombat?: number;
  description: string;
  effect: 'attack' | 'magic_damage' | 'heal' | 'weaken' | 'pierce' | 'double_attack' | 'holy_strike' | 'rage' | 'confusao' | 'paralisia';
  isRanged?: boolean;
  ignoresArmor?: boolean;
  bonusDice?: number;
  /** Reduz a armadura efetiva do alvo nesta defesa (não persiste como a redução normal por acerto). */
  armorPierce?: number;
  /** Atinge todos os inimigos vivos (cada um com sua própria rolagem de ataque/defesa), não só o alvo selecionado. */
  aoe?: boolean;
}

// Sem classes — habilidades de combate vêm das Vantagens compradas (não de classe/kit),
// fiel ao 3DeT Victory. Ver VANTAGEM_ABILITIES em combat.service.ts.
