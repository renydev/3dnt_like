import { Injectable, inject, signal, computed } from '@angular/core';
import { GameStateService } from './game-state.service';
import { Enemy, CombatLogEntry, CombatPhase, CombatAbility, CLASS_ABILITIES } from '../models/combat.model';
import { Character } from '../models/character.model';
import { generateEnemy } from '../data/enemies.data';

function d6() { return Math.ceil(Math.random() * 6); }
function d6n(n: number) { let t = 0; for (let i = 0; i < n; i++) t += d6(); return t; }

/**
 * Teste de acerto 3D&T:
 * Se H_atk >= H_def → acerto automático.
 * Caso contrário rola 1d6; acerta se resultado <= max(1, 6 - diferença).
 * 1 é sempre um acerto.
 */
function hitCheck(atkH: number, defH: number): { hit: boolean; roll: number; threshold: number } {
  const diff = Math.max(0, defH - atkH);
  if (diff === 0) return { hit: true, roll: 0, threshold: 0 };
  const threshold = Math.max(1, 6 - diff);
  const roll = d6();
  return { hit: roll <= threshold, roll, threshold };
}

@Injectable({ providedIn: 'root' })
export class CombatService {
  private gs = inject(GameStateService);

  /** Lista de todos os inimigos do combate atual (até 4) */
  enemies = signal<Enemy[]>([]);

  /** Inimigo alvo atual = primeiro vivo da lista */
  enemy = computed<Enemy | null>(() => this.enemies().find(e => e.hp > 0) ?? null);

  phase = signal<CombatPhase>('player_turn');
  log = signal<CombatLogEntry[]>([]);
  abilitiesUsed = signal<Set<string>>(new Set());
  /** Habilidades usadas por cada companheiro neste combate (id → set de ability ids) */
  companionAbilitiesUsed = signal<Map<string, Set<string>>>(new Map());
  enemyWeakenedTurns = signal(0);
  enemyWeakenAmount = signal(0);

  readonly abilities = computed<CombatAbility[]>(() => {
    const cls = this.gs.character()?.class;
    return cls ? (CLASS_ABILITIES[cls] ?? []) : [];
  });

  canUseAbility(ab: CombatAbility): boolean {
    const char = this.gs.character();
    if (!char) return false;
    if (char.poderFogo.current < ab.pfCost) return false;
    if (ab.usesPerCombat && this.abilitiesUsed().has(ab.id)) return false;
    return true;
  }

  initCombat(floor: number, isBoss: boolean, enemyGroup?: Enemy[]): void {
    let group: Enemy[];
    if (enemyGroup && enemyGroup.length > 0) {
      group = enemyGroup;
    } else {
      group = [generateEnemy(floor, isBoss)];
    }
    this.enemies.set(group);
    this.phase.set('player_turn');

    const names = group.map(e => e.name).join(', ');
    this.log.set([{ text: `${names} surgem das sombras!`, type: 'system' }]);
    this.abilitiesUsed.set(new Set());
    this.companionAbilitiesUsed.set(new Map());
    this.enemyWeakenedTurns.set(0);
    this.enemyWeakenAmount.set(0);
  }

  // ── Ações do Jogador ──────────────────────────────────────────────────────

  playerAttack(): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemy();
    if (!char || !target) return;

    this.resolveMeleeAttack(char, target);
    this.afterPlayerAction();
  }

  playerUseAbility(ab: CombatAbility): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemy();
    if (!char || !target) return;
    if (!this.canUseAbility(ab)) return;

    if (ab.pfCost > 0) this.spendPF(ab.pfCost, char);
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
        this.addLog(`${ab.icon} ${ab.name} — ${target.name} perde ${amt} de Força por 2 turnos!`, 'player');
        this.afterPlayerAction();
        return;
      }
      case 'double_attack': {
        this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name} — Ataque 1`);
        const stillAlive = this.enemy();
        if (stillAlive) {
          this.resolveMeleeAttack(char, stillAlive, `${ab.icon} Ataque 2`);
        }
        this.afterPlayerAction();
        return;
      }
      case 'holy_strike': {
        const { hit, roll, threshold } = hitCheck(char.habilidade.current, target.habilidade);
        if (!hit) {
          this.addLog(`${ab.icon} ${ab.name} — ERROU! (1d6=${roll} > ${threshold}) ${target.name} esquivou!`, 'miss');
          this.afterPlayerAction();
          return;
        }
        const atkPower = char.forca.current + char.habilidade.current + d6() + d6n(ab.bonusDice ?? 1);
        const defPower = target.armadura + target.habilidade + d6();
        const dmg = Math.max(1, atkPower - defPower);
        this.addLog(`${ab.icon} ${ab.name} — Atq(${atkPower}) vs Def(${defPower}) = ${dmg} dano!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        this.afterPlayerAction();
        return;
      }
      case 'magic_damage':
      case 'pierce': {
        if (ab.isRanged) {
          this.resolveRangedAttack(char, target, ab);
        } else {
          this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name}`, ab.bonusDice ?? 0, ab.ignoresArmor);
        }
        this.afterPlayerAction();
        return;
      }
    }
  }

  /** Ataca um inimigo específico (pelo id). Fallback para o primeiro vivo. */
  playerAttackTarget(targetId: string): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemies().find(e => e.id === targetId && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
    if (!char || !target) return;
    this.resolveMeleeAttack(char, target);
    this.afterPlayerAction();
  }

  /** Usa habilidade em um inimigo específico. */
  playerUseAbilityTarget(ab: CombatAbility, targetId: string): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemies().find(e => e.id === targetId && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
    if (!char || !target) return;
    if (!this.canUseAbility(ab)) return;

    if (ab.pfCost > 0) this.spendPF(ab.pfCost, char);
    if (ab.usesPerCombat) this.abilitiesUsed.update(s => new Set([...s, ab.id]));

    switch (ab.effect) {
      case 'heal': {
        const h = this.healPlayer(ab, char);
        this.addLog(`${ab.icon} ${char.name} usa ${ab.name} — recupera ${h} PV!`, 'heal');
        this.afterPlayerAction(); return;
      }
      case 'weaken': {
        this.enemyWeakenedTurns.set(3); this.enemyWeakenAmount.set(2);
        this.addLog(`${ab.icon} ${ab.name} — ${target.name} perde 2 de Força por 2 turnos!`, 'player');
        this.afterPlayerAction(); return;
      }
      case 'double_attack': {
        this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name} — Ataque 1`);
        const still = this.enemies().find(e => e.id === targetId && e.hp > 0)
                   ?? this.enemies().find(e => e.hp > 0);
        if (still) this.resolveMeleeAttack(char, still, `${ab.icon} Ataque 2`);
        this.afterPlayerAction(); return;
      }
      case 'holy_strike': {
        const { hit, roll, threshold } = hitCheck(char.habilidade.current, target.habilidade);
        if (!hit) { this.addLog(`${ab.icon} ${ab.name} — ERROU!`, 'miss'); this.afterPlayerAction(); return; }
        const atkP = char.forca.current + char.habilidade.current + d6() + d6n(ab.bonusDice ?? 1);
        const defP = target.armadura + target.habilidade + d6();
        const dmg  = Math.max(1, atkP - defP);
        this.addLog(`${ab.icon} ${ab.name} — Atq(${atkP}) vs Def(${defP}) = ${dmg} dano!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        this.afterPlayerAction(); return;
      }
      case 'magic_damage':
      case 'pierce': {
        if (ab.isRanged) this.resolveRangedAttack(char, target, ab);
        else this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name}`, ab.bonusDice ?? 0, ab.ignoresArmor);
        this.afterPlayerAction(); return;
      }
    }
  }

  playerFlee(): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const enemies = this.enemies();
    if (!char || enemies.length === 0) return;

    // Não é possível fugir de combates com boss
    if (enemies.some(e => e.isBoss)) {
      this.addLog('🚫 Não é possível fugir de um Chefão!', 'system');
      return;
    }

    const roll = d6() + char.habilidade.current;
    const diff = 6;
    if (roll >= diff) {
      this.addLog(`🏃 ${char.name} foge com sucesso! (${roll} vs ${diff})`, 'system');
      this.phase.set('player_turn');
      setTimeout(() => this.gs.resolveEncounter('flee'), 600);
    } else {
      this.addLog(`🚫 Fuga falhou! (${roll} vs ${diff}) — os inimigos atacam!`, 'system');
      this.enemyTurn();
    }
  }

  // ── Turno do Inimigo ──────────────────────────────────────────────────────

  private afterPlayerAction(): void {
    if (this.checkVictory()) return;
    this.phase.set('companion_turn');
    setTimeout(() => this.companionTurn(), 700);
  }

  private enemyTurn(): void {
    const char = this.gs.character();
    if (!char) return;

    const aliveEnemies = this.enemies().filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) { this.checkVictory(); return; }

    if (this.enemyWeakenedTurns() > 0) {
      this.enemyWeakenedTurns.update(n => n - 1);
    }
    const weakened = this.enemyWeakenedTurns() > 0;

    for (const enemy of aliveEnemies) {
      const effF = Math.max(1, enemy.forca - (weakened ? this.enemyWeakenAmount() : 0));
      const effH = enemy.habilidade;

      const { hit, roll: hitRoll, threshold } = hitCheck(effH, char.habilidade.current);
      if (!hit) {
        this.addLog(
          `${enemy.icon} ${enemy.name} ataca mas ERRA! (1d6=${hitRoll} > ${threshold}) — ${char.name} esquivou!`,
          'miss'
        );
        continue;
      }

      const atkPower = effF + effH + d6();
      const defPower = char.armadura + char.habilidade.current + d6();
      const dmg = Math.max(1, atkPower - defPower);

      const hitInfo = threshold > 0 ? ` (1d6=${hitRoll}≤${threshold})` : '';
      this.addLog(
        `${enemy.icon} ${enemy.name} ataca!${hitInfo} Atq(${atkPower}) vs Def(${defPower}) → ${dmg} dano!`,
        'enemy'
      );
      this.damagePlayer(dmg, char);

      if (this.checkDefeat()) return;
    }

    this.phase.set('player_turn');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private resolveMeleeAttack(
    char: Character,
    enemy: Enemy,
    label = '⚔️ Ataque',
    bonusDice = 0,
    ignoresArmor = false
  ): void {
    const { hit, roll: hitRoll, threshold } = hitCheck(char.habilidade.current, enemy.habilidade);
    if (!hit) {
      this.addLog(`${label} — ERROU! (1d6=${hitRoll} > ${threshold}) ${enemy.name} esquivou!`, 'miss');
      return;
    }

    const atkPower = char.forca.current + char.habilidade.current + d6() + d6n(bonusDice);
    const defPower = ignoresArmor ? 0 : (enemy.armadura + enemy.habilidade + d6());
    const dmg = Math.max(1, ignoresArmor ? atkPower : atkPower - defPower);

    const hitInfo = threshold > 0 ? ` (1d6=${hitRoll}≤${threshold})` : '';
    if (ignoresArmor) {
      this.addLog(`${label}${hitInfo} — F+H+d6=${atkPower} (ignora armadura) = ${dmg} dano em ${enemy.name}!`, 'player');
    } else {
      this.addLog(`${label}${hitInfo} — Atq(${atkPower}) vs Def(${defPower}) = ${dmg} dano em ${enemy.name}!`, 'player');
    }
    this.applyDamageToEnemy(enemy.id, dmg);
  }

  private resolveRangedAttack(char: Character, enemy: Enemy, ab: CombatAbility): void {
    const { hit, roll: hitRoll, threshold } = hitCheck(char.habilidade.current, enemy.habilidade);
    if (!hit) {
      this.addLog(`${ab.icon} ${ab.name} — ERROU! (1d6=${hitRoll} > ${threshold}) ${enemy.name} esquivou!`, 'miss');
      return;
    }

    const atkPower = char.poderFogo.current + char.habilidade.current + d6() + d6n(ab.bonusDice ?? 0);
    const defPower = ab.ignoresArmor ? 0 : (enemy.armadura + enemy.habilidade + d6());
    const dmg = Math.max(1, ab.ignoresArmor ? atkPower : atkPower - defPower);

    const hitInfo = threshold > 0 ? ` (1d6=${hitRoll}≤${threshold})` : '';
    if (ab.ignoresArmor) {
      this.addLog(`${ab.icon} ${ab.name}${hitInfo} — PF+H+d6=${atkPower} (ignora armadura) = ${dmg} dano em ${enemy.name}!`, 'player');
    } else {
      this.addLog(`${ab.icon} ${ab.name}${hitInfo} — Atq(${atkPower}) vs Def(${defPower}) = ${dmg} dano em ${enemy.name}!`, 'player');
    }
    this.applyDamageToEnemy(enemy.id, dmg);
  }

  private applyDamageToEnemy(enemyId: string, dmg: number): void {
    this.enemies.update(list =>
      list.map(e => e.id === enemyId ? { ...e, hp: Math.max(0, e.hp - dmg) } : e)
    );
    // Verificar se esse inimigo morreu e conceder XP/ouro
    const killed = this.enemies().find(e => e.id === enemyId && e.hp === 0);
    if (killed) {
      this.addLog(`💀 ${killed.name} foi abatido! (+${killed.xpReward} XP, +${killed.goldReward} PO)`, 'system');
      this.gs.addXp(killed.xpReward, killed.goldReward);
    }
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
      amount = char.resistencia.current * 2;
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

  private spendPF(amount: number, char: Character): void {
    this.gs.character.update(c => c ? {
      ...c,
      poderFogo: { ...c.poderFogo, current: Math.max(0, c.poderFogo.current - amount) }
    } : c);
  }

  private checkVictory(): boolean {
    const alive = this.enemies().filter(e => e.hp > 0);
    if (alive.length > 0) return false;
    this.phase.set('victory');
    this.addLog('🏆 Todos os inimigos foram derrotados!', 'system');
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
