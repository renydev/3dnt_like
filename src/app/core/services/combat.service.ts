import { Injectable, inject, signal, computed } from '@angular/core';
import { GameStateService } from './game-state.service';
import { Enemy, CombatLogEntry, CombatPhase, CombatAbility, CLASS_ABILITIES } from '../models/combat.model';
import { Character } from '../models/character.model';
import { getEffectiveStats, ITEM_CATALOG } from '../models/item.model';
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
  /** Aguardando confirmação do jogador antes de ir para game_over */
  pendingDefeat = signal(false);

  readonly abilities = computed<CombatAbility[]>(() => {
    const cls = this.gs.character()?.class;
    return cls ? (CLASS_ABILITIES[cls] ?? []) : [];
  });

  canUseAbility(ab: CombatAbility): boolean {
    const char = this.gs.character();
    if (!char) return false;
    if (char.pontosMana.current < ab.pmCost) return false;
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

  playerRangedAttack(): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemy();
    if (!char || !target) return;
    this.resolveRangedBasic(char, target);
    this.afterPlayerAction();
  }

  playerRangedAttackTarget(targetId: string): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemies().find(e => e.id === targetId && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
    if (!char || !target) return;
    this.resolveRangedBasic(char, target);
    this.afterPlayerAction();
  }

  playerUseAbility(ab: CombatAbility): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemy();
    if (!char || !target) return;
    if (!this.canUseAbility(ab)) return;

    if (ab.pmCost > 0) this.spendPM(ab.pmCost);
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
        const { dmg, str: dmgStr1 } = this.fmtDmg(atkPower - defPower);
        this.addLog(`${ab.icon} ${ab.name} — Atq(${atkPower}) vs Def(${defPower}) = ${dmgStr1} dano!`, 'player');
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

    if (ab.pmCost > 0) this.spendPM(ab.pmCost);
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
        const { dmg, str: dmgStrP } = this.fmtDmg(atkP - defP);
        this.addLog(`${ab.icon} ${ab.name} — Atq(${atkP}) vs Def(${defP}) = ${dmgStrP} dano!`, 'player');
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

    const roll = d6() + getEffectiveStats(char).habilidade;
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

  afterPlayerAction(): void {
    if (this.checkVictory()) return;
    this.phase.set('companion_turn');
    setTimeout(() => this.companionTurn(), 700);
  }

  // ── Turno dos Companheiros (IA) ───────────────────────────────────────────

  private companionTurn(): void {
    const companions = this.gs.companions().filter(c => c.pontosVida.current > 0);
    if (companions.length === 0) {
      this.phase.set('enemy_turn');
      setTimeout(() => this.enemyTurn(), 400);
      return;
    }
    this._processCompanion(companions, 0);
  }

  private _processCompanion(companions: Character[], idx: number): void {
    if (this.checkVictory()) return;
    if (idx >= companions.length) {
      this.phase.set('enemy_turn');
      setTimeout(() => this.enemyTurn(), 600);
      return;
    }
    this._executeCompanionAI(companions[idx]);
    setTimeout(() => this._processCompanion(companions, idx + 1), 750);
  }

  private _executeCompanionAI(companion: Character): void {
    const player = this.gs.character();
    if (!player) return;
    const alive = this.enemies().filter(e => e.hp > 0);
    if (alive.length === 0) return;

    const abilities = CLASS_ABILITIES[companion.class] ?? [];
    const playerHpPct = player.pontosVida.current / player.pontosVida.max;
    const hasBoss = alive.some(e => e.isBoss);

    // Prioridade 1: curar o jogador se HP < 40%
    const healAb = abilities.find(ab => ab.effect === 'heal');
    if (healAb && playerHpPct < 0.4 && companion.pontosMana.current >= healAb.pmCost) {
      this._companionHeal(companion, healAb, player);
      return;
    }

    const target = this._pickTarget(alive);
    const ab = this._pickAbility(companion, abilities, target, hasBoss);
    if (ab) {
      this._companionUseAbility(companion, ab, target);
    } else {
      this._companionMeleeAttack(companion, target, `⚔️ ${companion.name} ataca`);
    }
  }

  /** Prioridade: chefe > maior Força > menor HP > menor Armadura */
  private _pickTarget(alive: Enemy[]): Enemy {
    const boss = alive.find(e => e.isBoss);
    if (boss) return boss;
    return alive.reduce((best, e) => {
      if (e.forca > best.forca) return e;
      if (e.forca === best.forca && e.hp < best.hp) return e;
      if (e.forca === best.forca && e.hp === best.hp && e.armadura < best.armadura) return e;
      return best;
    });
  }

  private _pickAbility(
    companion: Character, abilities: CombatAbility[], target: Enemy, hasBoss: boolean
  ): CombatAbility | null {
    const used = this.companionAbilitiesUsed().get(companion.id) ?? new Set<string>();
    const usable = abilities.filter(ab => {
      if (ab.effect === 'heal') return false;
      if (companion.pontosMana.current < ab.pmCost) return false;
      if (ab.usesPerCombat && used.has(ab.id)) return false;
      return true;
    });
    if (usable.length === 0) return null;
    if (target.isBoss) return usable.reduce((best, ab) => ab.pmCost >= best.pmCost ? ab : best);
    if (hasBoss) {
      const cheap = usable.filter(ab => ab.pmCost <= 1);
      const pool = cheap.length > 0 ? cheap : usable;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return usable[Math.floor(Math.random() * usable.length)];
  }

  private _companionHeal(companion: Character, ab: CombatAbility, player: Character): void {
    this._spendCompanionPM(companion.id, ab.pmCost);
    if (ab.usesPerCombat) this._markCompanionAbilityUsed(companion.id, ab.id);
    let amount: number;
    let formula: string;
    if (ab.id === 'imposicao') {
      amount = companion.resistencia.current * 2;
      formula = `R${companion.resistencia.current}×2=${amount}`;
    } else {
      const dHeal = d6n(ab.bonusDice ?? 1);
      amount = dHeal + companion.habilidade.current;
      formula = `🎲${dHeal}(x${ab.bonusDice ?? 1})+H${companion.habilidade.current}=${amount}`;
    }
    const newPV = Math.min(player.pontosVida.max, player.pontosVida.current + amount);
    const healed = newPV - player.pontosVida.current;
    this.gs.character.update(c => c ? { ...c, pontosVida: { ...c.pontosVida, current: newPV } } : c);
    this.addLog(`${ab.icon} ${companion.name} usa ${ab.name} | CURA: ${formula} → +${healed} PV em ${player.name}!`, 'heal');
  }

  private _companionUseAbility(companion: Character, ab: CombatAbility, target: Enemy): void {
    this._spendCompanionPM(companion.id, ab.pmCost);
    if (ab.usesPerCombat) this._markCompanionAbilityUsed(companion.id, ab.id);
    const label = `${ab.icon} ${companion.name}: ${ab.name}`;
    switch (ab.effect) {
      case 'weaken':
        this.enemyWeakenedTurns.set(3); this.enemyWeakenAmount.set(2);
        this.addLog(`${label} — ${target.name} perde 2 Força por 2 turnos!`, 'player');
        break;
      case 'double_attack': {
        this._companionMeleeAttack(companion, target, `${label} 1`);
        const t2 = this.enemies().find(e => e.id === target.id && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
        if (t2) this._companionMeleeAttack(companion, t2, `${label} 2`);
        break;
      }
      case 'holy_strike': {
        const { hit, roll, threshold } = hitCheck(companion.habilidade.current, target.habilidade);
        if (!hit) {
          this.addLog(`${label} ERROU! 🎯H${companion.habilidade.current}vs${target.habilidade} | 🎲${roll}>${threshold}`, 'miss');
          break;
        }
        const dAtk = d6(); const dBonus = d6n(ab.bonusDice ?? 1);
        const atk = companion.forca.current + companion.habilidade.current + dAtk + dBonus;
        const dDef = d6(); const def = target.armadura + target.habilidade + dDef;
        const { dmg, str: dmgStrH } = this.fmtDmg(atk - def);
        const hitInfo = threshold > 0 ? ` 🎯(🎲${roll}≤${threshold})` : '';
        this.addLog(`${label}${hitInfo} | ATQ: F${companion.forca.current}+H${companion.habilidade.current}+🎲${dAtk}+✝🎲${dBonus}=${atk} vs DEF: A${target.armadura}+H${target.habilidade}+🎲${dDef}=${def} → ${dmgStrH} dano sagrado em ${target.name}!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        break;
      }
      case 'magic_damage':
      case 'pierce':
        if (ab.isRanged) this._companionRangedAttack(companion, ab, target);
        else this._companionMeleeAttack(companion, target, label, ab.bonusDice ?? 0, ab.ignoresArmor);
        break;
      default:
        this._companionMeleeAttack(companion, target, label);
    }
  }

  private _companionMeleeAttack(
    companion: Character, enemy: Enemy, label: string, bonusDice = 0, ignoresArmor = false
  ): void {
    const s = getEffectiveStats(companion);
    const { hit, roll, threshold } = hitCheck(s.habilidade, enemy.habilidade);
    if (!hit) {
      this.addLog(
        `${label} ERROU! 🎯H${s.habilidade}vs${enemy.habilidade} | 🎲${roll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }
    const dAtk = d6();
    const dBonus = d6n(bonusDice);
    const atk = s.forca + s.habilidade + dAtk + dBonus;
    const hitInfo = threshold > 0 ? ` 🎯(🎲${roll}≤${threshold})` : '';
    const bonusPart = bonusDice > 0 ? `+🎲${dBonus}(x${bonusDice})` : '';
    if (ignoresArmor) {
      const dmg = Math.max(1, atk);
      this.addLog(
        `${label}${hitInfo} | ATQ: F${s.forca}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atk} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    } else {
      const dDef = d6();
      const def = enemy.armadura + enemy.habilidade + dDef;
      const { dmg, str: dmgStrM } = this.fmtDmg(atk - def);
      this.addLog(
        `${label}${hitInfo} | ATQ: F${s.forca}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atk} vs DEF: A${enemy.armadura}+H${enemy.habilidade}+🎲${dDef}=${def} → ${dmgStrM} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    }
  }

  private _companionRangedAttack(companion: Character, ab: CombatAbility, enemy: Enemy): void {
    const s = getEffectiveStats(companion);
    const label = `${ab.icon} ${companion.name}: ${ab.name}`;
    const { hit, roll, threshold } = hitCheck(s.habilidade, enemy.habilidade);
    if (!hit) {
      this.addLog(
        `${label} ERROU! 🎯H${s.habilidade}vs${enemy.habilidade} | 🎲${roll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }
    const dAtk = d6();
    const dBonus = d6n(ab.bonusDice ?? 0);
    const atk = s.poderFogo + s.habilidade + dAtk + dBonus;
    const hitInfo = threshold > 0 ? ` 🎯(🎲${roll}≤${threshold})` : '';
    const bonusPart = (ab.bonusDice ?? 0) > 0 ? `+🎲${dBonus}(x${ab.bonusDice})` : '';
    if (ab.ignoresArmor) {
      const dmg = Math.max(1, atk);
      this.addLog(
        `${label}${hitInfo} | ATQ: PF${s.poderFogo}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atk} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    } else {
      const dDef = d6();
      const def = enemy.armadura + enemy.habilidade + dDef;
      const { dmg, str: dmgStrR } = this.fmtDmg(atk - def);
      this.addLog(
        `${label}${hitInfo} | ATQ: PF${s.poderFogo}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atk} vs DEF: A${enemy.armadura}+H${enemy.habilidade}+🎲${dDef}=${def} → ${dmgStrR} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    }
  }

  private _spendCompanionPM(companionId: string, amount: number): void {
    if (amount <= 0) return;
    this.gs.companions.update(list => list.map(c =>
      c.id === companionId
        ? { ...c, pontosMana: { ...c.pontosMana, current: Math.max(0, c.pontosMana.current - amount) } }
        : c
    ));
  }

  private _markCompanionAbilityUsed(companionId: string, abilityId: string): void {
    this.companionAbilitiesUsed.update(m => {
      const next = new Map(m);
      const s = new Set(next.get(companionId) ?? []);
      s.add(abilityId);
      next.set(companionId, s);
      return next;
    });
  }

  // ── Turno do Inimigo ──────────────────────────────────────────────────────

  private enemyTurn(): void {
    const char = this.gs.character();
    if (!char) return;

    const aliveEnemies = this.enemies().filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) { this.checkVictory(); return; }

    if (this.enemyWeakenedTurns() > 0) {
      this.enemyWeakenedTurns.update(n => n - 1);
    }
    const weakened = this.enemyWeakenedTurns() > 0;

    const charStats = getEffectiveStats(char);
    const aliveParty: Array<{ name: string; armadura: number; habilidade: number; isPlayer: boolean; id?: string }> = [
      { name: char.name, armadura: charStats.armadura, habilidade: charStats.habilidade, isPlayer: true },
      ...this.gs.companions().filter(c => c.pontosVida.current > 0).map(c => ({
        name: c.name.split(',')[0],
        armadura: c.armadura,
        habilidade: c.habilidade.current,
        isPlayer: false,
        id: c.id,
      })),
    ];

    // Rastreia quantos ataques cada alvo recebeu nesta rodada (penalidade de H)
    const attacksReceived = new Map<string, number>();

    for (const enemy of aliveEnemies) {
      const effF = Math.max(1, enemy.forca - (weakened ? this.enemyWeakenAmount() : 0));
      const effH = enemy.habilidade;

      const targetMember = aliveParty[Math.floor(Math.random() * aliveParty.length)];
      const targetKey = targetMember.isPlayer ? 'player' : targetMember.id!;
      const hPenalty = attacksReceived.get(targetKey) ?? 0;
      const effTargetH = Math.max(0, targetMember.habilidade - hPenalty);
      attacksReceived.set(targetKey, hPenalty + 1);

      const { hit, roll: hitRoll, threshold } = hitCheck(effH, effTargetH);
      if (!hit) {
        const penaltyNote = hPenalty > 0 ? ` (H-${hPenalty} p/ ${hPenalty} atq. anterior${hPenalty > 1 ? 'es' : ''})` : '';
        this.addLog(
          `${enemy.icon} ${enemy.name} ERRA! 🎯H${effH}vsH${effTargetH}${penaltyNote} | 🎲${hitRoll}>${threshold} — ${targetMember.name} esquivou!`,
          'miss'
        );
        continue;
      }

      const dAtk = d6();
      const dDef = d6();
      const atkPower = effF + effH + dAtk;
      const defPower = targetMember.armadura + effTargetH + dDef;
      const { dmg, str: dmgStrE } = this.fmtDmg(atkPower - defPower);
      const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';
      const weakPart = weakened ? ` [F-${this.enemyWeakenAmount()}]` : '';
      this.addLog(
        `${enemy.icon} ${enemy.name} ataca ${targetMember.name}!${hitInfo}${weakPart} | ATQ: F${effF}+H${effH}+🎲${dAtk}=${atkPower} vs DEF: A${targetMember.armadura}+H${effTargetH}+🎲${dDef}=${defPower} → ${dmgStrE} dano!`,
        'enemy'
      );

      if (targetMember.isPlayer) {
        this.damagePlayer(dmg);
        if (this.checkDefeat()) return;
      } else {
        this.gs.companions.update(list => list.map(c =>
          c.id === targetMember.id
            ? { ...c, pontosVida: { ...c.pontosVida, current: Math.max(0, c.pontosVida.current - dmg) } }
            : c
        ));
        const fallen = this.gs.companions().find(c => c.id === targetMember.id && c.pontosVida.current === 0);
        if (fallen) this.addLog(`💀 ${fallen.name.split(',')[0]} caiu em combate!`, 'system');
      }
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
    const s = getEffectiveStats(char);
    const { hit, roll: hitRoll, threshold } = hitCheck(s.habilidade, enemy.habilidade);
    if (!hit) {
      this.addLog(
        `${label} ERROU! 🎯H${s.habilidade}vs${enemy.habilidade} | 🎲${hitRoll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }

    const dAtk = d6();
    const dBonus = d6n(bonusDice);
    const atkPower = s.forca + s.habilidade + dAtk + dBonus;

    const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';

    if (ignoresArmor) {
      const dmg = Math.max(1, atkPower);
      const bonusPart = bonusDice > 0 ? `+🎲${dBonus}(x${bonusDice})` : '';
      this.addLog(
        `${label}${hitInfo} | ATQ: F${s.forca}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atkPower} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    } else {
      const dDef = d6();
      const defPower = enemy.armadura + enemy.habilidade + dDef;
      const { dmg, str: dmgStrMel } = this.fmtDmg(atkPower - defPower);
      const bonusPart = bonusDice > 0 ? `+🎲${dBonus}(x${bonusDice})` : '';
      this.addLog(
        `${label}${hitInfo} | ATQ: F${s.forca}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atkPower} vs DEF: A${enemy.armadura}+H${enemy.habilidade}+🎲${dDef}=${defPower} → ${dmgStrMel} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    }
  }

  private resolveRangedBasic(char: Character, enemy: Enemy): void {
    const s = getEffectiveStats(char);
    const { hit, roll: hitRoll, threshold } = hitCheck(s.habilidade, enemy.habilidade);
    if (!hit) {
      this.addLog(
        `🏹 Ataque à Distância ERROU! 🎯H${s.habilidade}vs${enemy.habilidade} | 🎲${hitRoll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }
    const dAtk = d6();
    const atkPower = s.poderFogo + s.habilidade + dAtk;
    const dDef = d6();
    const defPower = enemy.armadura + enemy.habilidade + dDef;
    const { dmg, str: dmgStrRB } = this.fmtDmg(atkPower - defPower);
    const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';
    this.addLog(
      `🏹 Ataque à Distância${hitInfo} | ATQ: PF${s.poderFogo}+H${s.habilidade}+🎲${dAtk}=${atkPower} vs DEF: A${enemy.armadura}+H${enemy.habilidade}+🎲${dDef}=${defPower} → ${dmgStrRB} dano em ${enemy.name}!`,
      'player'
    );
    this.applyDamageToEnemy(enemy.id, dmg);
  }

  private resolveRangedAttack(char: Character, enemy: Enemy, ab: CombatAbility): void {
    const s = getEffectiveStats(char);
    const { hit, roll: hitRoll, threshold } = hitCheck(s.habilidade, enemy.habilidade);
    if (!hit) {
      this.addLog(
        `${ab.icon} ${ab.name} ERROU! 🎯H${s.habilidade}vs${enemy.habilidade} | 🎲${hitRoll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }

    const dAtk = d6();
    const dBonus = d6n(ab.bonusDice ?? 0);
    const atkPower = s.poderFogo + s.habilidade + dAtk + dBonus;
    const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';
    const bonusPart = (ab.bonusDice ?? 0) > 0 ? `+🎲${dBonus}(x${ab.bonusDice})` : '';

    if (ab.ignoresArmor) {
      const dmg = Math.max(1, atkPower);
      this.addLog(
        `${ab.icon} ${ab.name}${hitInfo} | ATQ: PF${s.poderFogo}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atkPower} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    } else {
      const dDef = d6();
      const defPower = enemy.armadura + enemy.habilidade + dDef;
      const { dmg, str: dmgStrRA } = this.fmtDmg(atkPower - defPower);
      this.addLog(
        `${ab.icon} ${ab.name}${hitInfo} | ATQ: PF${s.poderFogo}+H${s.habilidade}+🎲${dAtk}${bonusPart}=${atkPower} vs DEF: A${enemy.armadura}+H${enemy.habilidade}+🎲${dDef}=${defPower} → ${dmgStrRA} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    }
  }

  private applyDamageToEnemy(enemyId: string, dmg: number): void {
    this.enemies.update(list =>
      list.map(e => e.id === enemyId ? { ...e, hp: Math.max(0, e.hp - dmg) } : e)
    );
    const killed = this.enemies().find(e => e.id === enemyId && e.hp === 0);
    if (killed) {
      this.addLog(`💀 ${killed.name} foi abatido!`, 'system');
    }
  }

  private damagePlayer(dmg: number): void {
    this.gs.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: Math.max(0, c.pontosVida.current - dmg) }
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

  private spendPM(amount: number): void {
    this.gs.character.update(c => c ? {
      ...c,
      pontosMana: { ...c.pontosMana, current: Math.max(0, c.pontosMana.current - amount) }
    } : c);
  }

  private checkVictory(): boolean {
    const alive = this.enemies().filter(e => e.hp > 0);
    if (alive.length > 0) return false;
    this.phase.set('victory');
    this.addLog('🏆 Todos os inimigos foram derrotados!', 'system');

    // Distribui PE e ouro ao final do combate
    const defeated = this.enemies();
    const totalGold = defeated.reduce((s, e) => s + Math.max(e.goldReward ?? 0, e.pp), 0);
    this.gs.awardCombatPE(defeated, totalGold);

    // Drop de itens: cada inimigo com itemsReward tem 50% de chance de dropar 1 item
    for (const enemy of defeated) {
      if (!enemy.itemsReward?.length) continue;
      if (Math.random() < 0.5) {
        const pool = enemy.itemsReward;
        const id = pool[Math.floor(Math.random() * pool.length)];
        const item = ITEM_CATALOG[id];
        if (item) {
          this.gs.addToInventory(item);
          this.addLog(`🎁 ${enemy.name} deixou: ${item.icon} ${item.name}!`, 'system');
        }
      }
    }

    setTimeout(() => this.gs.resolveEncounter('victory'), 1200);
    return true;
  }

  confirmDefeat(): void {
    this.pendingDefeat.set(false);
    this.gs.resolveEncounter('defeat');
  }

  private checkDefeat(): boolean {
    const char = this.gs.character();
    if (!char || char.pontosVida.current > 0) return false;
    this.phase.set('defeat');
    this.addLog('💀 Você caiu em combate...', 'system');
    setTimeout(() => this.pendingDefeat.set(true), 1200);
    return true;
  }

  /** Formata o dano: se raw < 1 exibe o valor original tachado + o mínimo. */
  private fmtDmg(raw: number): { dmg: number; str: string } {
    const dmg = Math.max(1, raw);
    const str = raw < 1 ? `<s>${raw}</s> ${dmg} (dano mín)` : `${dmg}`;
    return { dmg, str };
  }

  private addLog(text: string, type: CombatLogEntry['type']): void {
    this.log.update(l => [...l.slice(-7), { text, type }]);
    this.gs.appendJournal(this.gs.floorNumber(), text, type);
  }
}
