import { Injectable, inject, signal, computed } from '@angular/core';
import { GameStateService } from './game-state.service';
import { Enemy, CombatLogEntry, CombatPhase, CombatAbility, CLASS_ABILITIES } from '../models/combat.model';
import { Character } from '../models/character.model';
import { generateEnemy } from '../data/enemies.data';

function d6() { return Math.ceil(Math.random() * 6); }
function d6n(n: number) { let t = 0; for (let i = 0; i < n; i++) t += d6(); return t; }

@Injectable({ providedIn: 'root' })
export class CombatService {
  private gs = inject(GameStateService);

  enemy = signal<Enemy | null>(null);
  phase = signal<CombatPhase>('player_turn');
  log = signal<CombatLogEntry[]>([]);
  abilitiesUsed = signal<Set<string>>(new Set());
  enemyWeakenedTurns = signal(0);
  enemyWeakenAmount = signal(0);

  readonly abilities = computed<CombatAbility[]>(() => {
    const cls = this.gs.character()?.class;
    return cls ? (CLASS_ABILITIES[cls] ?? []) : [];
  });

  canUseAbility(ab: CombatAbility): boolean {
    const char = this.gs.character();
    if (!char) return false;
    if (char.pontosMagia.current < ab.pmCost) return false;
    if (ab.usesPerCombat && this.abilitiesUsed().has(ab.id)) return false;
    return true;
  }

  initCombat(floor: number, isBoss: boolean): void {
    const e = generateEnemy(floor, isBoss);
    this.enemy.set(e);
    this.phase.set('player_turn');
    this.log.set([{ text: `${e.name} surge das sombras!`, type: 'system' }]);
    this.abilitiesUsed.set(new Set());
    this.enemyWeakenedTurns.set(0);
    this.enemyWeakenAmount.set(0);
  }

  // ── Ações do Jogador ──────────────────────────────────────────────────────

  playerAttack(): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const enemy = this.enemy();
    if (!char || !enemy) return;

    const dmg = this.calcPhysicalDamage(char.forca.current, enemy.armadura);
    this.applyDamageToEnemy(dmg, char.forca.current, enemy.armadura, false);
    this.afterPlayerAction();
  }

  playerUseAbility(ab: CombatAbility): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const enemy = this.enemy();
    if (!char || !enemy) return;
    if (!this.canUseAbility(ab)) return;

    if (ab.pmCost > 0) this.spendPM(ab.pmCost, char);
    if (ab.usesPerCombat) {
      this.abilitiesUsed.update(s => new Set([...s, ab.id]));
    }

    switch (ab.effect) {
      case 'heal': {
        const h = this.healPlayer(ab, char);
        this.addLog(`${ab.icon} ${char.name} usa ${ab.name} — recupera ${h} PV!`, 'heal');
        this.afterPlayerAction();
        return;
      }
      case 'weaken': {
        const amt = 2;
        this.enemyWeakenedTurns.set(3);
        this.enemyWeakenAmount.set(amt);
        this.addLog(`${ab.icon} ${ab.name} — ${enemy.name} perde ${amt} de Força por 2 turnos!`, 'player');
        this.afterPlayerAction();
        return;
      }
      case 'double_attack': {
        const dmg1 = this.calcPhysicalDamage(char.forca.current, enemy.armadura);
        const dmg2 = this.calcPhysicalDamage(char.forca.current, enemy.armadura);
        this.addLog(`${ab.icon} ${ab.name} — Ataque 1: ${dmg1} dano!`, 'player');
        this.applyDamageToEnemyRaw(dmg1);
        if (!this.checkVictory()) {
          this.addLog(`⚔️ Ataque 2: ${dmg2} dano!`, 'player');
          this.applyDamageToEnemyRaw(dmg2);
        }
        this.afterPlayerAction();
        return;
      }
      case 'holy_strike': {
        const physDmg = this.calcPhysicalDamage(char.forca.current, enemy.armadura);
        const holyDmg = d6n(ab.bonusDice ?? 1);
        const total = physDmg + holyDmg;
        this.addLog(`${ab.icon} ${ab.name} — ${physDmg} físico + ${holyDmg} sagrado = ${total} dano!`, 'player');
        this.applyDamageToEnemyRaw(total);
        this.afterPlayerAction();
        return;
      }
      case 'magic_damage':
      case 'pierce': {
        const stat = char.habilidade.current;
        const bonus = d6n(ab.bonusDice ?? 1);
        const rawDmg = bonus + stat;
        const armor = ab.ignoresArmor ? 0 : Math.floor(enemy.armadura / 2);
        const dmg = Math.max(1, rawDmg - armor);
        this.addLog(`${ab.icon} ${ab.name} — ${bonus}+H(${stat})=${rawDmg} vs A(${armor}) = ${dmg} dano!`, 'player');
        this.applyDamageToEnemyRaw(dmg);
        this.afterPlayerAction();
        return;
      }
    }
  }

  playerFlee(): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const enemy = this.enemy();
    if (!char || !enemy) return;
    const roll = d6() + char.habilidade.current;
    const diff = 6 + (enemy.isBoss ? 3 : 0);
    if (roll >= diff) {
      this.addLog(`🏃 ${char.name} foge com sucesso! (${roll} vs ${diff})`, 'system');
      this.phase.set('player_turn');
      setTimeout(() => this.gs.resolveEncounter('flee'), 600);
    } else {
      this.addLog(`🚫 Fuga falhou! (${roll} vs ${diff}) — o inimigo ataca!`, 'system');
      this.enemyTurn();
    }
  }

  // ── Turno do Inimigo ──────────────────────────────────────────────────────

  private afterPlayerAction(): void {
    if (this.checkVictory()) return;
    this.phase.set('enemy_turn');
    setTimeout(() => this.enemyTurn(), 900);
  }

  private enemyTurn(): void {
    const char = this.gs.character();
    const enemy = this.enemy();
    if (!char || !enemy) return;

    if (this.enemyWeakenedTurns() > 0) {
      this.enemyWeakenedTurns.update(n => n - 1);
    }

    const effectiveF = Math.max(1, enemy.forca - (this.enemyWeakenedTurns() > 0 ? this.enemyWeakenAmount() : 0));
    const attackRoll = d6() + effectiveF;
    const defenseRoll = d6() + char.armadura;
    const dmg = Math.max(1, attackRoll - defenseRoll);

    this.addLog(
      `${enemy.icon} ${enemy.name} ataca! [${attackRoll}] vs defesa [${defenseRoll}] → ${dmg} dano!`,
      'enemy'
    );
    this.damagePlayer(dmg, char);

    if (this.checkDefeat()) return;
    this.phase.set('player_turn');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private calcPhysicalDamage(forca: number, armor: number): number {
    const atk = d6() + forca;
    const def = d6() + armor;
    return Math.max(1, atk - def);
  }

  private applyDamageToEnemy(dmg: number, forca: number, armor: number, ignoresArmor: boolean): void {
    const enemy = this.enemy();
    if (!enemy) return;
    const char = this.gs.character();
    const atkRoll = d6() + forca;
    const defRoll = ignoresArmor ? 0 : (d6() + armor);
    const finalDmg = ignoresArmor ? Math.max(1, forca + d6()) : Math.max(1, atkRoll - defRoll);
    this.addLog(
      `⚔️ Você ataca! [${atkRoll}] vs defesa [${defRoll}] → ${finalDmg} dano em ${enemy.name}!`,
      'player'
    );
    this.applyDamageToEnemyRaw(finalDmg);
  }

  private applyDamageToEnemyRaw(dmg: number): void {
    this.enemy.update(e => e ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
  }

  private damagePlayer(dmg: number, char: Character): void {
    const newPV = Math.max(0, char.pontosVida.current - dmg);
    this.gs.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: newPV }
    } : c);
  }

  private healPlayer(ab: CombatAbility, char: Character): number {
    let amount: number;
    if (ab.id === 'imposicao') {
      amount = char.level * char.resistencia.current;
    } else {
      amount = d6n(ab.bonusDice ?? 1) + char.habilidade.current;
    }
    const newPV = Math.min(char.pontosVida.max, char.pontosVida.current + amount);
    const healed = newPV - char.pontosVida.current;
    this.gs.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: newPV }
    } : c);
    return healed;
  }

  private spendPM(amount: number, char: Character): void {
    this.gs.character.update(c => c ? {
      ...c,
      pontosMagia: { ...c.pontosMagia, current: Math.max(0, c.pontosMagia.current - amount) }
    } : c);
  }

  private checkVictory(): boolean {
    const enemy = this.enemy();
    if (!enemy || enemy.hp > 0) return false;
    this.phase.set('victory');
    this.addLog(`🏆 ${enemy.name} foi derrotado!`, 'system');
    this.gs.addLog(`✅ Derrotou ${enemy.name} (+${enemy.xpReward} XP, +${enemy.goldReward} PO)`);
    this.gs.character.update(c => c ? { ...c, gold: c.gold + enemy.goldReward } : c);
    setTimeout(() => this.gs.resolveEncounter('victory'), 1200);
    return true;
  }

  private checkDefeat(): boolean {
    const char = this.gs.character();
    if (!char || char.pontosVida.current > 0) return false;
    this.phase.set('defeat');
    this.addLog('💀 Você caiu em combate...', 'system');
    setTimeout(() => this.gs.resolveEncounter('defeat'), 1500);
    return true;
  }

  private addLog(text: string, type: CombatLogEntry['type']): void {
    this.log.update(l => [...l.slice(-7), { text, type }]);
  }
}
