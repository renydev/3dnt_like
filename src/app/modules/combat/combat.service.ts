import { Injectable } from '@angular/core';
import { Character } from '../../core/models/character.model';
import { Enemy } from '../../core/models/combat.model';

export interface CombatConfig {
  character: Character;
  enemy: Enemy;
  onResult: (result: CombatResult) => void;
}

export interface CombatResult {
  outcome: 'victory' | 'defeat' | 'fled';
  xpGained: number;
  goldGained: number;
  characterHpRemaining: number;
  characterPmRemaining: number;
}

/**
 * Ponte entre Angular e a cena Phaser.
 * Guarda a config do combate atual e expõe o resultado via callback.
 */
@Injectable({ providedIn: 'root' })
export class CombatService {
  private config: CombatConfig | null = null;

  startCombat(config: CombatConfig): void {
    this.config = config;
  }

  getConfig(): CombatConfig | null {
    return this.config;
  }

  resolveCombat(result: CombatResult): void {
    this.config?.onResult(result);
    this.config = null;
  }

  /** Rola Nd6 (padrão 3D&T = 1d6) */
  static roll(dice = 1, sides = 6): number {
    let total = 0;
    for (let i = 0; i < dice; i++) total += Math.floor(Math.random() * sides) + 1;
    return total;
  }

  /** Dano físico: Força do atacante vs Armadura do defensor, mínimo 1 */
  static physicalDamage(forca: number, armadura: number): number {
    return Math.max(1, forca + CombatService.roll() - armadura);
  }

  /** Dano mágico: Habilidade vs metade da Armadura */
  static magicDamage(habilidade: number, armadura: number): number {
    return Math.max(1, habilidade + CombatService.roll() - Math.floor(armadura / 2));
  }

  /** Iniciativa: Habilidade + d6 */
  static initiative(habilidade: number): number {
    return habilidade + CombatService.roll();
  }
}
