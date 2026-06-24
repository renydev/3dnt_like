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
  effect: 'attack' | 'magic_damage' | 'heal' | 'weaken' | 'pierce' | 'double_attack' | 'holy_strike' | 'rage';
  isRanged?: boolean;
  ignoresArmor?: boolean;
  bonusDice?: number;
}

// Sem classes, não há mais habilidades de combate por classe — todo personagem
// usa apenas Ataque/Defesa básicos (teste de Poder vs Resistência), fiel ao 3DeT Victory.
