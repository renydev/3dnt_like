import { CharacterClass } from './character.model';

export interface Enemy {
  name: string;
  icon: string;
  flavorText: string;
  hp: number;
  maxHp: number;
  forca: number;
  armadura: number;
  xpReward: number;
  goldReward: number;
  isBoss: boolean;
  isUndead?: boolean;
}

export type CombatPhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';

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
  effect: 'attack' | 'magic_damage' | 'heal' | 'weaken' | 'pierce' | 'double_attack' | 'holy_strike';
  ignoresArmor?: boolean;
  bonusDice?: number;
}

export const CLASS_ABILITIES: Record<CharacterClass, CombatAbility[]> = {
  guerreiro: [
    {
      id: 'ataque_duplo', name: 'Ataque Duplo', icon: '⚔️', pmCost: 0, usesPerCombat: 1,
      description: 'Realiza dois ataques físicos em sequência neste turno.',
      effect: 'double_attack'
    }
  ],
  mago: [
    {
      id: 'bola_fogo', name: 'Bola de Fogo', icon: '🔥', pmCost: 3,
      description: 'Dano mágico: 2d6 + H. Ignora Armadura.',
      effect: 'magic_damage', ignoresArmor: true, bonusDice: 2
    },
    {
      id: 'raio_arcano', name: 'Raio Arcano', icon: '⚡', pmCost: 1,
      description: 'Dano mágico: 1d6 + H. Ignora Armadura.',
      effect: 'pierce', ignoresArmor: true, bonusDice: 1
    }
  ],
  ladino: [
    {
      id: 'furtivo', name: 'Ataque Furtivo', icon: '🗡️', pmCost: 0, usesPerCombat: 1,
      description: 'Ataque surpresa: +2d6 de dano, ignora metade da Armadura.',
      effect: 'pierce', bonusDice: 2
    }
  ],
  clerigo: [
    {
      id: 'cura_divina', name: 'Cura Divina', icon: '✨', pmCost: 2,
      description: 'Recupera 1d6 + H PV.',
      effect: 'heal', bonusDice: 1
    },
    {
      id: 'luz_sagrada', name: 'Luz Sagrada', icon: '🌟', pmCost: 2,
      description: 'Dano sagrado: 2d6 + H. Extra vs mortos-vivos.',
      effect: 'magic_damage', ignoresArmor: true, bonusDice: 2
    }
  ],
  ranger: [
    {
      id: 'tiro_certeiro', name: 'Tiro Certeiro', icon: '🎯', pmCost: 1,
      description: 'Ataque à distância que ignora Armadura: 1d6 + H de dano.',
      effect: 'pierce', ignoresArmor: true, bonusDice: 1
    }
  ],
  bardo: [
    {
      id: 'dissonancia', name: 'Dissonância', icon: '🎵', pmCost: 2,
      description: 'Canção que enfraquece: inimigo perde 2 de Força por 2 turnos.',
      effect: 'weaken', bonusDice: 1
    },
    {
      id: 'raio_sonico', name: 'Raio Sônico', icon: '🔊', pmCost: 1,
      description: 'Dano sônico: 1d6 + H, ignora Armadura.',
      effect: 'magic_damage', ignoresArmor: true, bonusDice: 1
    }
  ],
  druida: [
    {
      id: 'raio_natureza', name: 'Raio Natural', icon: '🌿', pmCost: 2,
      description: 'Dano natural: 1d6 + H, ignora Armadura.',
      effect: 'magic_damage', ignoresArmor: true, bonusDice: 1
    },
    {
      id: 'forma_animal', name: 'Forma Animal', icon: '🐺', pmCost: 0, usesPerCombat: 1,
      description: 'Transforma-se: ataque poderoso com +1d6 e ignora Armadura.',
      effect: 'pierce', bonusDice: 1, ignoresArmor: true
    }
  ],
  paladino: [
    {
      id: 'golpe_divino', name: 'Golpe Divino', icon: '✝️', pmCost: 1,
      description: 'Ataque físico com +1d6 de dano sagrado.',
      effect: 'holy_strike', bonusDice: 1
    },
    {
      id: 'imposicao', name: 'Imposição de Mãos', icon: '🤲', pmCost: 0, usesPerCombat: 1,
      description: 'Cura poderosa: recupera Nível × Resistência PV.',
      effect: 'heal', bonusDice: 0
    }
  ],
};
