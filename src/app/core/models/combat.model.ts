import { CharacterClass } from './character.model';

export interface Enemy {
  id: string;
  name: string;
  icon: string;
  sprite?: string;
  flavorText: string;
  hp: number;
  maxHp: number;
  forca: number;
  habilidade: number;
  armadura: number;
  xpReward: number;
  goldReward: number;
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
  pfCost: number;
  usesPerCombat?: number;
  description: string;
  effect: 'attack' | 'magic_damage' | 'heal' | 'weaken' | 'pierce' | 'double_attack' | 'holy_strike';
  isRanged?: boolean;
  ignoresArmor?: boolean;
  bonusDice?: number;
}

export const CLASS_ABILITIES: Record<CharacterClass, CombatAbility[]> = {
  guerreiro: [
    {
      id: 'ataque_duplo', name: 'Ataque Duplo', icon: '⚔️', pfCost: 0, usesPerCombat: 1,
      description: 'Realiza dois ataques físicos em sequência neste turno.',
      effect: 'double_attack'
    }
  ],
  mago: [
    {
      id: 'bola_fogo', name: 'Bola de Fogo', icon: '🔥', pfCost: 3,
      description: 'Projétil arcano: PF + H + 2d6. Ignora Armadura.',
      effect: 'magic_damage', isRanged: true, ignoresArmor: true, bonusDice: 2
    },
    {
      id: 'raio_arcano', name: 'Raio Arcano', icon: '⚡', pfCost: 1,
      description: 'Raio de energia: PF + H + 1d6. Ignora Armadura.',
      effect: 'pierce', isRanged: true, ignoresArmor: true, bonusDice: 1
    }
  ],
  ladino: [
    {
      id: 'furtivo', name: 'Ataque Furtivo', icon: '🗡️', pfCost: 0, usesPerCombat: 1,
      description: 'Golpe pelas costas: F + H + 2d6. Ignora metade da Armadura.',
      effect: 'pierce', bonusDice: 2
    }
  ],
  clerigo: [
    {
      id: 'cura_divina', name: 'Cura Divina', icon: '✨', pfCost: 2,
      description: 'Canaliza energia divina: recupera 1d6 + H PV.',
      effect: 'heal', bonusDice: 1
    },
    {
      id: 'luz_sagrada', name: 'Luz Sagrada', icon: '🌟', pfCost: 2,
      description: 'Feixe sagrado: PF + H + 2d6. Extra vs mortos-vivos.',
      effect: 'magic_damage', isRanged: true, ignoresArmor: true, bonusDice: 2
    }
  ],
  ranger: [
    {
      id: 'tiro_certeiro', name: 'Tiro Certeiro', icon: '🎯', pfCost: 1,
      description: 'Flecha precisa: PF + H + 1d6. Ignora Armadura.',
      effect: 'pierce', isRanged: true, ignoresArmor: true, bonusDice: 1
    }
  ],
  bardo: [
    {
      id: 'dissonancia', name: 'Dissonância', icon: '🎵', pfCost: 2,
      description: 'Canção que enfraquece: inimigo perde 2 de Força por 2 turnos.',
      effect: 'weaken', bonusDice: 1
    },
    {
      id: 'raio_sonico', name: 'Raio Sônico', icon: '🔊', pfCost: 1,
      description: 'Onda sônica: PF + H + 1d6. Ignora Armadura.',
      effect: 'magic_damage', isRanged: true, ignoresArmor: true, bonusDice: 1
    }
  ],
  druida: [
    {
      id: 'raio_natureza', name: 'Raio Natural', icon: '🌿', pfCost: 2,
      description: 'Energia natural: PF + H + 1d6. Ignora Armadura.',
      effect: 'magic_damage', isRanged: true, ignoresArmor: true, bonusDice: 1
    },
    {
      id: 'forma_animal', name: 'Forma Animal', icon: '🐺', pfCost: 0, usesPerCombat: 1,
      description: 'Transforma-se: F + H + 1d6. Ignora Armadura.',
      effect: 'pierce', bonusDice: 1, ignoresArmor: true
    }
  ],
  paladino: [
    {
      id: 'golpe_divino', name: 'Golpe Divino', icon: '✝️', pfCost: 1,
      description: 'Ataque físico com +1d6 de dano sagrado.',
      effect: 'holy_strike', bonusDice: 1
    },
    {
      id: 'imposicao', name: 'Imposição de Mãos', icon: '🤲', pfCost: 0, usesPerCombat: 1,
      description: 'Cura poderosa: recupera Nível × Resistência PV.',
      effect: 'heal', bonusDice: 0
    }
  ],
  barbaro: [
    {
      id: 'furia', name: 'Fúria Bárbara', icon: '😡', pfCost: 0, usesPerCombat: 1,
      description: 'Entra em fúria: +2 F e +2 R por 3 rodadas.',
      effect: 'double_attack', bonusDice: 1
    }
  ],
  monge: [
    {
      id: 'rajada_golpes', name: 'Rajada de Golpes', icon: '👊', pfCost: 1,
      description: 'Dois ataques desarmados rápidos nesta rodada.',
      effect: 'double_attack', bonusDice: 0
    },
    {
      id: 'ki_defensivo', name: 'Ki Defensivo', icon: '🌀', pfCost: 2,
      description: 'Canaliza Ki: ignora todo dano físico desta rodada.',
      effect: 'pierce', bonusDice: 0, ignoresArmor: false
    }
  ],
};
