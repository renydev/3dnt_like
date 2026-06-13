import { Injectable } from '@angular/core';
import { Character } from '../../core/models/character.model';
import { DungeonRoom, DungeonTheme } from '../../core/models/dungeon.model';

export interface ThreatContext {
  room: DungeonRoom;
  theme: DungeonTheme;
  character: Character;
  floorNumber: number;
}

export interface GeneratedEnemy {
  nome: string;
  hp: number;
  hpAtual: number;
  forca: number;
  habilidade: number;
  armadura: number;
  xpRecompensa: number;
  ouroRecompensa: number;
  isBoss: boolean;
}

export interface GeneratedThreat {
  type: DungeonRoom['type'];
  enemy?: GeneratedEnemy;
  trapSeverity?: 'leve' | 'moderada' | 'grave';
  trapDamage?: number;
  treasureGold?: number;
  treasureXp?: number;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ThreatGeneratorService {
  private powerScore(character: Character): number {
    return (
      character.forca.current +
      character.habilidade.current +
      character.resistencia.current +
      character.armadura
    );
  }

  generate(ctx: ThreatContext): GeneratedThreat {
    const power = this.powerScore(ctx.character);
    const scale = 1 + (ctx.floorNumber - 1) * 0.15;

    switch (ctx.room.type) {
      case 'monster': return this.generateMonster(ctx, power, scale);
      case 'boss':    return this.generateBoss(ctx, power, scale);
      case 'trap':    return this.generateTrap(ctx, power, scale);
      case 'treasure': return this.generateTreasure(ctx, power, scale);
      default: return { type: ctx.room.type, description: ctx.room.description ?? '' };
    }
  }

  private generateMonster(ctx: ThreatContext, power: number, scale: number): GeneratedThreat {
    const base = Math.max(1, Math.round(power * 0.6 * scale));
    const pool = ctx.theme.monsterTypes;
    const nome = pool[Math.floor(Math.random() * pool.length)];
    const enemy: GeneratedEnemy = {
      nome, isBoss: false,
      hp: base * 3, hpAtual: base * 3,
      forca: base,
      habilidade: Math.max(1, Math.round(base * 0.8)),
      armadura: Math.max(0, Math.round(base * 0.4)),
      xpRecompensa: Math.round(base * 1.5),
      ouroRecompensa: Math.round(base * 0.8),
    };
    return { type: 'monster', enemy, description: `Um ${nome} bloqueia o caminho.` };
  }

  private generateBoss(ctx: ThreatContext, power: number, scale: number): GeneratedThreat {
    const base = Math.max(2, Math.round(power * 1.2 * scale));
    const enemy: GeneratedEnemy = {
      nome: ctx.theme.guardianName, isBoss: true,
      hp: base * 5, hpAtual: base * 5,
      forca: base + 2, habilidade: base,
      armadura: Math.round(base * 0.6),
      xpRecompensa: base * 5,
      ouroRecompensa: base * 3,
    };
    return { type: 'boss', enemy, description: ctx.theme.guardianDesc ?? `O guardião ${ctx.theme.guardianName} aguarda.` };
  }

  private generateTrap(ctx: ThreatContext, power: number, scale: number): GeneratedThreat {
    const dmg = Math.max(1, Math.round(power * 0.4 * scale));
    const severity: GeneratedThreat['trapSeverity'] = dmg <= 2 ? 'leve' : dmg <= 5 ? 'moderada' : 'grave';
    const trap = ctx.theme.trapTypes?.[0] ?? 'armadilha';
    return { type: 'trap', trapSeverity: severity, trapDamage: dmg,
      description: `Uma ${trap} ${severity} foi ativada! (${dmg} de dano)` };
  }

  private generateTreasure(ctx: ThreatContext, power: number, scale: number): GeneratedThreat {
    const gold = Math.round(power * 1.5 * scale);
    const xp = Math.round(power * 2 * scale);
    const treasure = ctx.theme.treasureTypes?.[0] ?? 'tesouro';
    return { type: 'treasure', treasureGold: gold, treasureXp: xp,
      description: `Você encontrou ${treasure}: ${gold} de ouro e ${xp} XP.` };
  }
}
