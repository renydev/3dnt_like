import { Injectable, inject, signal, computed } from '@angular/core';
import { GameStateService, CombatRewardSummary } from './game-state.service';
import { Enemy, CombatLogEntry, CombatPhase, CombatAbility } from '../models/combat.model';
import { Character } from '../models/character.model';
import { getEffectiveStats, ITEM_CATALOG } from '../models/item.model';
import { generateEnemy } from '../data/enemies.data';
import { d6, d6n, rollPerda } from '../utils/dice';
import { ALL_MAGIAS, MagiaDef, magiaToAbility } from '../data/magias.data';

/**
 * Habilidades de combate concedidas por Vantagens oficiais (vantagens.data.ts) cujo efeito
 * no manual mapeia sem ambiguidade para um efeito de combate já resolvido por este serviço.
 * Vantagens com sub-escolha (ex.: "Ataque Especial" tem 12 variantes) ou que exigem um
 * subsistema novo (Anulação, Acumulador, Golpe Final) ficam de fora por ora — precisam de
 * UI de escolha ou de status effects que ainda não existem.
 */
const VANTAGEM_ABILITIES: Record<string, CombatAbility> = {
  'Cura': {
    id: 'vantagem_cura', name: 'Cura', icon: '💚', pmCost: 2,
    description: 'Gasta 2PM para curar 1d6+Habilidade de PV.',
    effect: 'heal', bonusDice: 1,
  },
  'Confusão': {
    id: 'vantagem_confusao', name: 'Confusão', icon: '🌀', pmCost: 2,
    description: 'Ataca e gasta 2PM; vencendo a defesa, o alvo fica confuso (ataca outro inimigo ao acaso) até sofrer dano ou resistir.',
    effect: 'confusao',
  },
  'Paralisia': {
    id: 'vantagem_paralisia', name: 'Paralisia', icon: '🥶', pmCost: 2,
    description: 'Ataca e gasta 2PM; vencendo a defesa, o alvo fica paralisado (perde o turno) até sofrer dano ou resistir.',
    effect: 'paralisia',
  },
};

/**
 * Magias conjuráveis por um personagem com a vantagem Magia: Comuns/Incomuns liberam
 * sozinhas ao atingir a Habilidade mínima; Raras/Lendárias só entram se concedidas
 * explicitamente em `Character.learnedSpells` (ver magias.data.ts).
 */
function isMagiaCastable(m: MagiaDef, char: Character, learned: Set<string>): boolean {
  if (m.rarity === 'rara' || m.rarity === 'lendaria') return learned.has(m.id);
  return char.habilidade.current >= m.reqHabilidade;
}

function castableMagias(char: Character | null | undefined): MagiaDef[] {
  if (!char || !char.vantagens.includes('Magia')) return [];
  const learned = new Set(char.learnedSpells ?? []);
  return ALL_MAGIAS.filter(m => isMagiaCastable(m, char, learned));
}

/** Usado pela IA dos companheiros, que escolhe entre Vantagens de combate e Magias igual ao jogador. */
function castableAbilities(char: Character | null | undefined): CombatAbility[] {
  return castableMagias(char).map(magiaToAbility);
}

/** Teto de PA ganho por 6s num combate: metade (arredondado p/ cima) de Poder+Resistência. */
function paGainCap(poder: number, resistencia: number): number {
  return Math.ceil((poder + resistencia) / 2);
}

/** Todo ataque sempre acerta — não há teste de esquiva. */
function hitCheck(_atkH: number, _defH: number): { hit: boolean; roll: number; threshold: number } {
  return { hit: true, roll: 0, threshold: 0 };
}

/**
 * Resistir com Armadura:
 * Se A_defensor > P_atacante → defensor vence: recebe dano mínimo (1) e
 * a armadura é reduzida por P_atacante para o próximo teste no mesmo turno.
 * Quando P_atacante >= A_efetiva, a armadura é tratada normalmente no cálculo de FD.
 * Retorna { resisted, effectiveArmor }.
 */
function armorResistCheck(
  baseArmor: number,
  currentReduction: number,
  attackerPoder: number
): { resisted: boolean; effectiveArmor: number; newReduction: number } {
  const effArmor = Math.max(0, baseArmor - currentReduction);
  if (effArmor > attackerPoder) {
    return { resisted: true, effectiveArmor: effArmor, newReduction: currentReduction + attackerPoder };
  }
  return { resisted: false, effectiveArmor: effArmor, newReduction: currentReduction };
}

/** Uma "porrada" pendente de animação contra um inimigo — uma entrada por dado que causou dano. */
export interface HitEvent {
  enemyId: string;
  amounts: number[];
}

/** Mesma ideia de HitEvent, mas pro lado da party (jogador ou companheiro) sofrendo dano. */
export interface PartyHitEvent {
  /** 'player' ou o id do companheiro. */
  targetId: string;
  amounts: number[];
}

/** Um ataque que errou (alvo esquivou) — só pra animação, sem dano nenhum envolvido. */
export interface MissEvent {
  /** 'enemy' = um inimigo esquivou de um ataque da party; 'party' = a party esquivou de um inimigo. */
  side: 'enemy' | 'party';
  targetId: string;
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
  /** Confuso (vantagem Confusão): enemyId → DC de Resistência (9+Poder do conjurador) para se livrar. */
  private confusedEnemies = new Map<string, number>();
  /** Paralisado (vantagem Paralisia): enemyId → DC de Resistência (6+Poder do conjurador) para se livrar. */
  private paralyzedEnemies = new Map<string, number>();
  /** Fúria Bárbara: rodadas restantes do buff de +2P/+2R do jogador */
  playerRageTurns = signal(0);
  readonly playerRageAmount = 2;
  /** Aguardando confirmação do jogador antes de ir para game_over */
  pendingDefeat = signal(false);
  /** Resumo de XP/ouro do combate, exibido no overlay de vitória até o jogador confirmar. */
  victorySummary = signal<CombatRewardSummary | null>(null);

  // ── PA (Pontos de Ação — 3D&T Victory) ──────────────────────────────────────
  /** PA disponíveis do jogador neste combate (pool inicial = Poder; reseta a cada combate). */
  playerPA = signal(0);
  private playerPAGainCap = 0;
  private playerPAGained = 0;
  /** PA disponíveis de cada companheiro neste combate. */
  companionPA = signal<Map<string, number>>(new Map());
  private companionPAGainCap = new Map<string, number>();
  private companionPAGained = new Map<string, number>();
  /** Garante que a pool de PA comece preenchida na primeiríssima luta. */
  private paInitialized = false;

  /** Inimigo selecionado como alvo — escrito tanto pela CombatScene (clique no canvas) quanto por menus Angular */
  selectedEnemyId = signal<string | null>(null);

  /**
   * Fila de "porradas" pendentes de animação (consumida pela CombatScene): cada ataque com
   * múltiplos dados de dano (Luta, perícia, PAs gastos) gera uma entrada por dado que "passou"
   * da defesa, em vez de um único número fundido — visualmente é como se fosse um golpe por dado.
   */
  hitEvents = signal<HitEvent[]>([]);

  /** Mesma fila, mas pro lado da party sofrendo dano (jogador ou companheiro). */
  partyHitEvents = signal<PartyHitEvent[]>([]);

  /** Fila de esquivas (ataques que erraram) — só pra animação de "desvio", sem dano. */
  missEvents = signal<MissEvent[]>([]);

  /** Fila de bloqueios totais por Armadura (defesa absorve o golpe inteiro) — animação de escudo. */
  shieldEvents = signal<{ targetId: string; isEnemy: boolean }[]>([]);

  // ── Estado de rodada ──────────────────────────────────────────────────────

  /** Penalidade de H por desvio bem-sucedido de inimigos (reseta a cada turno do jogador) */
  private enemyDodgePenalties = new Map<string, number>();
  /** Redução acumulada de armadura de inimigos por Resistir com Armadura (reseta a cada turno do jogador) */
  private enemyArmorReductions = new Map<string, number>();
  /** Penalidade de H por desvio bem-sucedido de membros do grupo (reseta a cada turno inimigo) */
  private partyDodgePenalties = new Map<string, number>();
  /** Redução acumulada de armadura do grupo por Resistir com Armadura (reseta a cada turno inimigo) */
  private partyArmorReductions = new Map<string, number>();
  /** Fúria Bárbara de companheiros: rodadas restantes de buff por companionId */
  private companionRageTurns = new Map<string, number>();

  private resetPlayerRoundState(): void {
    this.enemyDodgePenalties.clear();
    this.enemyArmorReductions.clear();
  }

  private resetEnemyRoundState(): void {
    this.partyDodgePenalties.clear();
    this.partyArmorReductions.clear();
  }

  // ── Rolagem de dados com PA (3D&T Victory) ──────────────────────────────────
  // Regra: ao tirar 6, se ainda não atingiu o teto de PA ganho neste combate, o
  // personagem ganha +1 PA. Se já atingiu o teto, o 6 "explode": rola +1d6 e soma
  // ao resultado (podendo encadear se o novo dado também sair 6).

  /** Rola 1d6 para o jogador, aplicando ganho de PA / explosão em 6. */
  private rollPlayerDie(): number {
    let total = d6();
    let roll = total;
    while (roll === 6) {
      if (this.playerPAGained < this.playerPAGainCap) {
        this.playerPAGained++;
        this.playerPA.update(n => n + 1);
        break;
      }
      roll = d6();
      total += roll;
    }
    return total;
  }

  /** Rola 1d6 para um companheiro, aplicando ganho de PA / explosão em 6. */
  private rollCompanionDie(companionId: string): number {
    let total = d6();
    let roll = total;
    while (roll === 6) {
      const gained = this.companionPAGained.get(companionId) ?? 0;
      const cap = this.companionPAGainCap.get(companionId) ?? 0;
      if (gained < cap) {
        this.companionPAGained.set(companionId, gained + 1);
        this.companionPA.update(m => {
          const next = new Map(m);
          next.set(companionId, (next.get(companionId) ?? 0) + 1);
          return next;
        });
        break;
      }
      roll = d6();
      total += roll;
    }
    return total;
  }

  /** Soma N rolagens via roller (jogador/companheiro). */
  private rollDiceWith(n: number, roller: () => number): number {
    let t = 0;
    for (let i = 0; i < n; i++) t += roller();
    return t;
  }

  /** Rola N dados via roller e retorna cada resultado individual (1 dado por PA gasto, sempre). */
  private rollDiceListWith(n: number, roller: () => number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < n; i++) rolls.push(roller());
    return rolls;
  }

  private hasLuta(char: Character): boolean {
    return !!char.pericias?.includes('luta');
  }

  // ── Vantagens "fora da curva" de monstros usadas ativamente em combate ──────
  // (ver monster-vantagens.data.ts) — os bônus passivos de atributo já estão
  // assados no spawn; aqui resolvemos as que mudam o COMPORTAMENTO da luta:
  // golpe de abertura (Ataque Furtivo/Mira Perfeita/Tiro Certeiro), postura
  // defensiva (Defesa Especial) e aura de grupo (Aura de Proteção).

  private hasVantagem(e: Enemy, name: string): boolean {
    return !!e.bonusVantagens?.includes(name);
  }

  /** Bônus de defesa de um inimigo vindo de vantagens ativas (postura defensiva + aura do grupo). */
  private enemyDefenseBonus(enemy: Enemy): number {
    let bonus = 0;
    if (this.hasVantagem(enemy, 'Defesa Especial') || this.hasVantagem(enemy, 'Defesa Especial (Provocação)')) bonus += 2;
    if (this.enemies().some(e => e.hp > 0 && e.id !== enemy.id && this.hasVantagem(e, 'Aura de Proteção'))) bonus += 1;
    return bonus;
  }

  /** IDs de inimigos que já usaram seu golpe de abertura (Ataque Furtivo/Mira Perfeita/Tiro Certeiro) neste combate. */
  private enemyFirstStrikeUsed = new Set<string>();

  /** Bônus de ataque de abertura: só na primeira vez que o inimigo ataca no combate. */
  private enemySurpriseBonus(enemy: Enemy): number {
    const hasSurprise = this.hasVantagem(enemy, 'Ataque Furtivo')
      || this.hasVantagem(enemy, 'Mira Perfeita')
      || this.hasVantagem(enemy, 'Tiro Certeiro');
    if (!hasSurprise || this.enemyFirstStrikeUsed.has(enemy.id)) return 0;
    this.enemyFirstStrikeUsed.add(enemy.id);
    return 2;
  }

  /** Quantos PA o jogador pode gastar agora (clampado ao disponível). Cada PA = +1d6 em FA/FD. */
  spendPlayerPA(requested: number): number {
    const avail = this.playerPA();
    const spend = Math.max(0, Math.min(requested, avail));
    if (spend > 0) this.playerPA.update(n => n - spend);
    return spend;
  }

  /**
   * Habilidades de combate vêm das Vantagens compradas na criação (não de classe/kit —
   * 3D&T Victory não tem classes; Kits são só profissão narrativa). Mapeamento por nome
   * de vantagem; cobre por ora só as que têm efeito de combate inequívoco no manual.
   */
  /** Habilidades de combate vindas de Vantagens (Cura/Confusão/Paralisia) — magias ficam no Grimório, à parte. */
  readonly abilities = computed<CombatAbility[]>(() => {
    const names = this.gs.character()?.vantagens ?? [];
    return names
      .map(name => VANTAGEM_ABILITIES[name])
      .filter((ab): ab is CombatAbility => !!ab);
  });

  /** Magias que o jogador já pode conjurar agora (Comuns/Incomuns na Habilidade, ou Raras/Lendárias concedidas). */
  readonly availableMagias = computed<MagiaDef[]>(() => castableMagias(this.gs.character()));

  /** Magias que o jogador ainda não pode conjurar — mostradas no Grimório como bloqueadas. */
  readonly lockedMagias = computed<MagiaDef[]>(() => {
    const available = new Set(this.availableMagias().map(m => m.id));
    return ALL_MAGIAS.filter(m => !available.has(m.id));
  });

  /** Se o personagem tem a vantagem Magia (controla se o botão Grimório aparece). */
  readonly hasMagia = computed(() => !!this.gs.character()?.vantagens.includes('Magia'));

  canCastMagia(m: MagiaDef): boolean { return this.canUseAbility(magiaToAbility(m)); }

  castMagiaTarget(m: MagiaDef, targetId: string, paSpend = 0): void {
    this.playerUseAbilityTarget(magiaToAbility(m), targetId, paSpend);
  }

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
    this.selectedEnemyId.set(group.find(e => e.hp > 0)?.id ?? null);

    const char = this.gs.character();
    const names = group.map(e => e.name).join(', ');
    this.abilitiesUsed.set(new Set());
    this.companionAbilitiesUsed.set(new Map());
    this.enemyWeakenedTurns.set(0);
    this.confusedEnemies.clear();
    this.paralyzedEnemies.clear();
    this.enemyFirstStrikeUsed.clear();
    this.playerRageTurns.set(0);
    this.companionRageTurns.clear();
    this.resetPlayerRoundState();
    this.resetEnemyRoundState();

    // PA: a pool NÃO reseta aqui — ela persiste entre combates e só é realimentada
    // (refillPA) ao fim de cada luta. Na primeiríssima luta (pool nunca preenchida),
    // preenchemos uma vez para não começar com PA zerado.
    if (!this.paInitialized) {
      this.refillPA();
      this.paInitialized = true;
    }
    // Aqui só recalculamos o teto de ganho por 6s (pode ter mudado com level up)
    // e zeramos o contador de ganho desta luta.
    if (char) {
      this.playerPAGainCap = paGainCap(char.poder.current, char.resistencia.current);
      this.playerPAGained = 0;
    }
    this.companionPAGainCap.clear();
    this.companionPAGained.clear();
    for (const c of this.gs.companions()) {
      this.companionPAGainCap.set(c.id, paGainCap(c.poder.current, c.resistencia.current));
      this.companionPAGained.set(c.id, 0);
    }

    // Iniciativa (3D&T Victory): cada combatente rola 1d6+Habilidade individualmente
    // (não um valor agregado do grupo). Se QUALQUER um do grupo superar o melhor
    // resultado dos inimigos, o grupo não é surpreendido — só a comparação dos
    // melhores de cada lado decide; a ordem de turnos em si (jogador→companheiros→
    // inimigos, ou inimigos primeiro em caso de surpresa) é definida depois disso.
    // Ágil (+2 no teste, "incluso iniciativa") e Lento (Perda na iniciativa) entram por personagem.
    const party = [char, ...this.gs.companions()].filter((c): c is Character => !!c);
    const partyRolls = party.map(c => {
      const agil = c.vantagens.includes('Ágil');
      const lento = c.desvantagens.includes('Lento');
      return (lento ? rollPerda() : d6()) + c.habilidade.current + (agil ? 2 : 0);
    });
    const enemyRolls = group.map(e => d6() + e.habilidade);
    const bestPartyRoll = Math.max(0, ...partyRolls);
    const bestEnemyRoll = Math.max(...enemyRolls);
    const enemiesFirst = bestPartyRoll <= bestEnemyRoll;

    const initialLog: CombatLogEntry[] = [
      { text: `${names} surgem das sombras!`, type: 'system' },
    ];
    for (const e of group) {
      if (e.bonusVantagens?.length) {
        initialLog.push({ text: `⚠️ ${e.name} manifesta: ${e.bonusVantagens.join(', ')}!`, type: 'system' });
      }
    }
    initialLog.push({
      text: enemiesFirst
        ? `⚡ Iniciativa: inimigos surpreendem o grupo! (🎲${bestEnemyRoll} vs 🎲${bestPartyRoll})`
        : `▶ Iniciativa: o grupo age primeiro! (🎲${bestPartyRoll} vs 🎲${bestEnemyRoll})`,
      type: 'system',
    });
    this.log.set(initialLog);

    if (enemiesFirst) {
      this.phase.set('enemy_turn');
      setTimeout(() => this.enemyTurn(), 700);
    } else {
      this.phase.set('player_turn');
    }
  }

  /** Realimenta a pool de PA (= Poder) de jogador e companheiros. Chamado ao FIM de cada combate
   *  (vitória, derrota ou fuga) — assim o PA dura até a próxima luta em vez de ser zerado no início. */
  private refillPA(): void {
    const char = this.gs.character();
    if (char) this.playerPA.set(char.poder.current);
    const paMap = new Map<string, number>();
    for (const c of this.gs.companions()) paMap.set(c.id, c.poder.current);
    this.companionPA.set(paMap);
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
        this.enemyWeakenedTurns.set(3);
        this.addLog(`${ab.icon} ${ab.name} — ${target.name} sofre Perda nos ataques por 2 turnos!`, 'player');
        this.afterPlayerAction();
        return;
      }
      case 'confusao': {
        this.resolveStatusAttack(char.poder.current, target, `${ab.icon} ${ab.name}`, () => this.applyConfusao(char.poder.current, target));
        this.afterPlayerAction();
        return;
      }
      case 'paralisia': {
        this.resolveStatusAttack(char.poder.current, target, `${ab.icon} ${ab.name}`, () => this.applyParalisia(char.poder.current, target));
        this.afterPlayerAction();
        return;
      }
      case 'rage': {
        this.activatePlayerRage(char, ab);
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
        const hPenalty = this.enemyDodgePenalties.get(target.id) ?? 0;
        const effTargetH = Math.max(0, target.habilidade - hPenalty);
        const { hit, roll, threshold } = hitCheck(char.habilidade.current, effTargetH);
        if (!hit) {
          this.enemyDodgePenalties.set(target.id, hPenalty + 1);
          this.addLog(`${ab.icon} ${ab.name} — ERROU! (1d6=${roll} > ${threshold}) ${target.name} esquivou!`, 'miss');
          this.afterPlayerAction();
          return;
        }
        // Resistir com Armadura
        const armorRed = this.enemyArmorReductions.get(target.id) ?? 0;
        let { resisted, effectiveArmor, newReduction } = armorResistCheck(target.armadura, armorRed, char.poder.current);
        this.enemyArmorReductions.set(target.id, newReduction);
        if (resisted) {
          this.addLog(`${ab.icon} ${ab.name} | 🛡️ Armadura resiste! A${effectiveArmor} > P${char.poder.current} → 1 dano sagrado!`, 'player');
          this.applyDamageToEnemy(target.id, 1);
          this.afterPlayerAction();
          return;
        }
        effectiveArmor += this.enemyDefenseBonus(target);
        const lutaBonusHS = this.hasLuta(char) ? 1 : 0;
        const dAtk = this.rollPlayerDie();
        const dBonus = this.rollDiceWith((ab.bonusDice ?? 1) + lutaBonusHS, () => this.rollPlayerDie());
        const atkPower = char.poder.current + dAtk + dBonus;
        const dDef = d6();
        const defPower = target.resistencia + effectiveArmor + dDef;
        const { dmg, str: dmgStr1 } = this.fmtDmg(atkPower - defPower);
        this.addLog(`${ab.icon} ${ab.name} — FA(P${char.poder.current}+🎲${dAtk}+✝${dBonus}=${atkPower}) vs FD(R${target.resistencia}+A${effectiveArmor}+🎲${dDef}=${defPower}) = ${dmgStr1} dano sagrado!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        this.afterPlayerAction();
        return;
      }
      case 'magic_damage':
      case 'pierce': {
        this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name}`, ab.bonusDice ?? 0, ab.ignoresArmor);
        this.afterPlayerAction();
        return;
      }
    }
  }

  /** Ataca um inimigo específico (pelo id). Fallback para o primeiro vivo.
   *  paSpend = quantos PA o jogador quer gastar nesse ataque (cada um = +1d6 em FA). */
  playerAttackTarget(targetId: string, paSpend = 0): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemies().find(e => e.id === targetId && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
    if (!char || !target) return;
    const spent = this.spendPlayerPA(paSpend);
    this.resolveMeleeAttack(char, target, undefined, spent);
    this.afterPlayerAction();
  }

  /** Usa habilidade em um inimigo específico.
   *  paSpend = quantos PA o jogador quer gastar (cada um = +1d6 na FA da habilidade, quando aplicável). */
  playerUseAbilityTarget(ab: CombatAbility, targetId: string, paSpend = 0): void {
    if (this.phase() !== 'player_turn') return;
    const char = this.gs.character();
    const target = this.enemies().find(e => e.id === targetId && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
    if (!char || !target) return;
    if (!this.canUseAbility(ab)) return;

    if (ab.pmCost > 0) this.spendPM(ab.pmCost);
    if (ab.usesPerCombat) this.abilitiesUsed.update(s => new Set([...s, ab.id]));
    const spent = this.spendPlayerPA(paSpend);

    switch (ab.effect) {
      case 'heal': {
        const h = this.healPlayer(ab, char);
        this.addLog(`${ab.icon} ${char.name} usa ${ab.name} — recupera ${h} PV!`, 'heal');
        this.afterPlayerAction(); return;
      }
      case 'weaken': {
        this.enemyWeakenedTurns.set(3);
        this.addLog(`${ab.icon} ${ab.name} — ${target.name} sofre Perda nos ataques por 2 turnos!`, 'player');
        this.afterPlayerAction(); return;
      }
      case 'confusao': {
        this.resolveStatusAttack(char.poder.current, target, `${ab.icon} ${ab.name}`, () => this.applyConfusao(char.poder.current, target));
        this.afterPlayerAction(); return;
      }
      case 'paralisia': {
        this.resolveStatusAttack(char.poder.current, target, `${ab.icon} ${ab.name}`, () => this.applyParalisia(char.poder.current, target));
        this.afterPlayerAction(); return;
      }
      case 'rage': {
        this.activatePlayerRage(char, ab);
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
        const hPenalty = this.enemyDodgePenalties.get(target.id) ?? 0;
        const effTargetH = Math.max(0, target.habilidade - hPenalty);
        const { hit, roll, threshold } = hitCheck(char.habilidade.current, effTargetH);
        if (!hit) {
          this.enemyDodgePenalties.set(target.id, hPenalty + 1);
          this.addLog(`${ab.icon} ${ab.name} — ERROU!`, 'miss');
          this.afterPlayerAction(); return;
        }
        const armorRed = this.enemyArmorReductions.get(target.id) ?? 0;
        let { resisted, effectiveArmor, newReduction } = armorResistCheck(target.armadura, armorRed, char.poder.current);
        this.enemyArmorReductions.set(target.id, newReduction);
        if (resisted) {
          this.addLog(`${ab.icon} ${ab.name} | 🛡️ A${effectiveArmor}>P${char.poder.current} → 1 dano sagrado!`, 'player');
          this.applyDamageToEnemy(target.id, 1);
          this.afterPlayerAction(); return;
        }
        effectiveArmor += this.enemyDefenseBonus(target);
        const lutaBonusHS2 = this.hasLuta(char) ? 1 : 0;
        const dAtk = this.rollPlayerDie();
        const dBonus = this.rollDiceWith((ab.bonusDice ?? 1) + lutaBonusHS2 + spent, () => this.rollPlayerDie());
        const atkP = char.poder.current + dAtk + dBonus;
        const dDef = d6(); const defP = target.resistencia + effectiveArmor + dDef;
        const { dmg, str: dmgStrP } = this.fmtDmg(atkP - defP);
        this.addLog(`${ab.icon} ${ab.name} — FA(${atkP}) vs FD(${defP}) = ${dmgStrP} dano sagrado!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        this.afterPlayerAction(); return;
      }
      case 'magic_damage':
      case 'pierce': {
        this.resolveMeleeAttack(char, target, `${ab.icon} ${ab.name}`, (ab.bonusDice ?? 0) + spent, ab.ignoresArmor);
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
      this.clearPlayerRageIfActive();
      this.refillPA();
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

    const abilities: CombatAbility[] = [
      ...(companion.vantagens ?? [])
        .map(name => VANTAGEM_ABILITIES[name])
        .filter((ab): ab is CombatAbility => !!ab),
      ...castableAbilities(companion),
    ];
    const hasBoss = alive.some(e => e.isBoss);

    const target = this._pickTarget(alive);
    const ab = this._pickAbility(companion, abilities, target, hasBoss);
    if (ab) {
      this._companionUseAbility(companion, ab, target);
    } else {
      this._companionMeleeAttack(companion, target, `⚔️ ${companion.name} ataca`);
    }
  }

  /** Prioridade: chefe > maior Poder > menor HP > menor Armadura */
  private _pickTarget(alive: Enemy[]): Enemy {
    const boss = alive.find(e => e.isBoss);
    if (boss) return boss;
    return alive.reduce((best, e) => {
      if (e.poder > best.poder) return e;
      if (e.poder === best.poder && e.hp < best.hp) return e;
      if (e.poder === best.poder && e.hp === best.hp && e.armadura < best.armadura) return e;
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
        this.enemyWeakenedTurns.set(3);
        this.addLog(`${label} — ${target.name} sofre Perda nos ataques por 2 turnos!`, 'player');
        break;
      case 'confusao':
        this.resolveStatusAttack(companion.poder.current, target, label, () => this.applyConfusao(companion.poder.current, target));
        break;
      case 'paralisia':
        this.resolveStatusAttack(companion.poder.current, target, label, () => this.applyParalisia(companion.poder.current, target));
        break;
      case 'rage':
        this.activateCompanionRage(companion, ab);
        break;
      case 'double_attack': {
        this._companionMeleeAttack(companion, target, `${label} 1`);
        const t2 = this.enemies().find(e => e.id === target.id && e.hp > 0)
                ?? this.enemies().find(e => e.hp > 0);
        if (t2) this._companionMeleeAttack(companion, t2, `${label} 2`);
        break;
      }
      case 'holy_strike': {
        const hPenalty = this.enemyDodgePenalties.get(target.id) ?? 0;
        const effTargetH = Math.max(0, target.habilidade - hPenalty);
        const { hit, roll, threshold } = hitCheck(companion.habilidade.current, effTargetH);
        if (!hit) {
          this.enemyDodgePenalties.set(target.id, hPenalty + 1);
          this.addLog(`${label} ERROU! 🎯H${companion.habilidade.current}vs${effTargetH} | 🎲${roll}>${threshold}`, 'miss');
          break;
        }
        const armorRed = this.enemyArmorReductions.get(target.id) ?? 0;
        let { resisted, effectiveArmor, newReduction } = armorResistCheck(target.armadura, armorRed, companion.poder.current);
        this.enemyArmorReductions.set(target.id, newReduction);
        if (resisted) {
          this.addLog(`${label} | 🛡️ A${effectiveArmor}>P${companion.poder.current} → 1 dano sagrado em ${target.name}!`, 'player');
          this.applyDamageToEnemy(target.id, 1);
          break;
        }
        effectiveArmor += this.enemyDefenseBonus(target);
        const lutaBonusC = this.hasLuta(companion) ? 1 : 0;
        const dAtk = this.rollCompanionDie(companion.id);
        const dBonus = this.rollDiceWith((ab.bonusDice ?? 1) + lutaBonusC, () => this.rollCompanionDie(companion.id));
        const atk = companion.poder.current + dAtk + dBonus;
        const dDef = d6(); const def = target.resistencia + effectiveArmor + dDef;
        const { dmg, str: dmgStrH } = this.fmtDmg(atk - def);
        const hitInfo = threshold > 0 ? ` 🎯(🎲${roll}≤${threshold})` : '';
        this.addLog(`${label}${hitInfo} | FA: P${companion.poder.current}+🎲${dAtk}+✝${dBonus}=${atk} vs FD: R${target.resistencia}+A${effectiveArmor}+🎲${dDef}=${def} → ${dmgStrH} dano sagrado em ${target.name}!`, 'player');
        this.applyDamageToEnemy(target.id, dmg);
        break;
      }
      case 'magic_damage':
      case 'pierce':
        this._companionMeleeAttack(companion, target, label, ab.bonusDice ?? 0, ab.ignoresArmor);
        break;
      default:
        this._companionMeleeAttack(companion, target, label);
    }
  }

  private _companionMeleeAttack(
    companion: Character, enemy: Enemy, label: string, bonusDice = 0, ignoresArmor = false
  ): void {
    const s = getEffectiveStats(companion);
    const hPenalty = this.enemyDodgePenalties.get(enemy.id) ?? 0;
    const effEnemyH = Math.max(0, enemy.habilidade - hPenalty);
    const { hit, roll, threshold } = hitCheck(s.habilidade, effEnemyH);
    if (!hit) {
      this.enemyDodgePenalties.set(enemy.id, hPenalty + 1);
      this.addLog(
        `${label} ERROU! 🎯H${s.habilidade}vs${effEnemyH}${hPenalty > 0 ? `(-${hPenalty})` : ''} | 🎲${roll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }
    const lutaBonus = this.hasLuta(companion) ? 1 : 0;
    const totalBonusDice = bonusDice + lutaBonus;
    const dAtk = this.rollCompanionDie(companion.id);
    const bonusRolls = this.rollDiceListWith(totalBonusDice, () => this.rollCompanionDie(companion.id));
    const dBonus = bonusRolls.reduce((a, b) => a + b, 0);
    const atkPower = s.poder + dAtk + dBonus;
    const hitInfo = threshold > 0 ? ` 🎯(🎲${roll}≤${threshold})` : '';
    // Cada dado mostrado separadamente (não um único 🎲 somado) — com Luta/PA gasto
    // a soma pode passar de 6, o que pareceria um dado "impossível" se fundido num só.
    const bonusPart = bonusRolls.length > 0
      ? `+${bonusRolls.map(r => `🎲${r}`).join('+')}${lutaBonus ? '(🥊Luta)' : ''}`
      : '';
    if (ignoresArmor) {
      const dmg = Math.max(1, atkPower);
      this.addLog(
        `${label}${hitInfo} | FA: P${s.poder}+🎲${dAtk}${bonusPart}=${atkPower} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
    } else {
      const armorRed = this.enemyArmorReductions.get(enemy.id) ?? 0;
      let { resisted, effectiveArmor, newReduction } = armorResistCheck(enemy.armadura, armorRed, s.poder);
      this.enemyArmorReductions.set(enemy.id, newReduction);
      if (resisted) {
        this.addLog(
          `${label}${hitInfo} | 🛡️ Armadura resiste! A${effectiveArmor}>P${s.poder} → 1 dano em ${enemy.name}!`,
          'player'
        );
        this.shieldEvents.update(q => [...q, { targetId: enemy.id, isEnemy: true }]);
        this.applyDamageToEnemy(enemy.id, 1);
        return;
      }
      effectiveArmor += this.enemyDefenseBonus(enemy);
      const dDef = d6();
      const defPower = enemy.resistencia + effectiveArmor + dDef;
      const { dmg, str: dmgStrM } = this.fmtDmg(atkPower - defPower);
      const armorNote = armorRed > 0 ? `(A-${armorRed})` : '';
      this.addLog(
        `${label}${hitInfo} | FA: P${s.poder}+🎲${dAtk}${bonusPart}=${atkPower} vs FD: R${enemy.resistencia}+A${effectiveArmor}${armorNote}+🎲${dDef}=${defPower} → ${dmgStrM} dano em ${enemy.name}!`,
        'player'
      );
      const hits = this.splitDamageByDice(s.poder, defPower, [dAtk, ...bonusRolls]);
      this.applyDamageToEnemy(enemy.id, dmg, hits);
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

    // Novo turno inimigo: reseta estado de armadura e esquiva do grupo
    this.resetEnemyRoundState();

    // Regeneração (vantagem "fora da curva" de monstros): cura no início do turno do inimigo.
    for (const e of aliveEnemies) {
      if (e.regenPerTurn && e.hp < e.maxHp) {
        const healed = Math.min(e.regenPerTurn, e.maxHp - e.hp);
        this.enemies.update(list => list.map(x => x.id === e.id ? { ...x, hp: x.hp + healed } : x));
        this.addLog(`💚 ${e.name} regenera ${healed} PV.`, 'system');
      }
    }

    if (this.enemyWeakenedTurns() > 0) {
      this.enemyWeakenedTurns.update(n => n - 1);
    }
    const weakened = this.enemyWeakenedTurns() > 0;

    if (this.playerRageTurns() > 0) {
      this.playerRageTurns.update(n => n - 1);
      if (this.playerRageTurns() === 0) this.expirePlayerRage();
    }
    for (const [companionId, turns] of [...this.companionRageTurns]) {
      const left = turns - 1;
      if (left <= 0) this.expireCompanionRage(companionId);
      else this.companionRageTurns.set(companionId, left);
    }

    const charStats = getEffectiveStats(char);
    const aliveParty: Array<{ name: string; armadura: number; resistencia: number; habilidade: number; isPlayer: boolean; id?: string; hasLuta: boolean }> = [
      { name: char.name, armadura: charStats.armadura, resistencia: charStats.resistencia, habilidade: charStats.habilidade, isPlayer: true, hasLuta: this.hasLuta(char) },
      ...this.gs.companions().filter(c => c.pontosVida.current > 0).map(c => ({
        name: c.name.split(',')[0],
        armadura: getEffectiveStats(c).armadura,
        resistencia: c.resistencia.current,
        habilidade: c.habilidade.current,
        isPlayer: false,
        id: c.id,
        hasLuta: this.hasLuta(c),
      })),
    ];

    for (const enemy of aliveEnemies) {
      // Paralisia/Confusão (3D&T Victory): tenta resistir (R+1d6 vs DC) antes de agir.
      const paralyzeDc = this.paralyzedEnemies.get(enemy.id);
      if (paralyzeDc !== undefined) {
        const resistRoll = d6() + enemy.resistencia;
        if (resistRoll >= paralyzeDc) {
          this.paralyzedEnemies.delete(enemy.id);
          this.addLog(`${enemy.icon} ${enemy.name} resiste à paralisia! (🎲${resistRoll} vs ${paralyzeDc})`, 'system');
        } else {
          this.addLog(`${enemy.icon} ${enemy.name} está paralisado e não pode agir!`, 'miss');
          continue;
        }
      }
      const confuseDc = this.confusedEnemies.get(enemy.id);
      if (confuseDc !== undefined) {
        const resistRoll = d6() + enemy.resistencia;
        if (resistRoll >= confuseDc) {
          this.confusedEnemies.delete(enemy.id);
          this.addLog(`${enemy.icon} ${enemy.name} resiste à confusão! (🎲${resistRoll} vs ${confuseDc})`, 'system');
        } else {
          const otherEnemies = aliveEnemies.filter(e => e.id !== enemy.id && e.hp > 0);
          if (otherEnemies.length === 0) {
            this.addLog(`${enemy.icon} ${enemy.name} está confuso e não acha um alvo!`, 'miss');
            continue;
          }
          const victim = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
          const dAtk = d6();
          const atkPower = enemy.poder + dAtk;
          const dDef = d6();
          const defPower = victim.resistencia + victim.armadura + dDef;
          const { dmg, str: dmgStrC } = this.fmtDmg(atkPower - defPower);
          this.addLog(`${enemy.icon} ${enemy.name} está confuso e ataca ${victim.name}! FA(${atkPower}) vs FD(${defPower}) → ${dmgStrC} dano!`, 'enemy');
          this.applyDamageToEnemy(victim.id, dmg);
          continue;
        }
      }

      const effP = enemy.poder;
      const effH = enemy.habilidade;

      const targetMember = aliveParty[Math.floor(Math.random() * aliveParty.length)];
      const targetKey = targetMember.isPlayer ? 'player' : targetMember.id!;

      // Esquiva: H defensor com penalidade por desvios anteriores
      const hPenalty = this.partyDodgePenalties.get(targetKey) ?? 0;
      const effTargetH = Math.max(0, targetMember.habilidade - hPenalty);
      const { hit, roll: hitRoll, threshold } = hitCheck(effH, effTargetH);
      if (!hit) {
        this.partyDodgePenalties.set(targetKey, hPenalty + 1);
        const penaltyNote = hPenalty > 0 ? ` (H-${hPenalty} p/ desvio anterior)` : '';
        this.addLog(
          `${enemy.icon} ${enemy.name} ERRA! 🎯H${effH}vsH${effTargetH}${penaltyNote} | 🎲${hitRoll}>${threshold} — ${targetMember.name} esquivou!`,
          'miss'
        );
        this.missEvents.update(q => [...q, { side: 'party', targetId: targetKey }]);
        continue;
      }

      // Resistir com Armadura
      const armorRed = this.partyArmorReductions.get(targetKey) ?? 0;
      const { resisted, effectiveArmor, newReduction } = armorResistCheck(targetMember.armadura, armorRed, effP);
      this.partyArmorReductions.set(targetKey, newReduction);

      const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';
      const weakPart = weakened ? ' [Perda — enfraquecido]' : '';

      if (resisted) {
        this.addLog(
          `${enemy.icon} ${enemy.name} ataca ${targetMember.name}!${hitInfo}${weakPart} | 🛡️ Armadura resiste! A${effectiveArmor}>P${effP} → 1 dano!`,
          'enemy'
        );
        this.shieldEvents.update(q => [...q, { targetId: targetKey, isEnemy: false }]);
        if (targetMember.isPlayer) {
          this.damagePlayer(1);
          if (this.checkDefeat()) return;
        } else {
          this.gs.companions.update(list => list.map(c =>
            c.id === targetMember.id
              ? { ...c, pontosVida: { ...c.pontosVida, current: Math.max(0, c.pontosVida.current - 1) } }
              : c
          ));
          this.partyHitEvents.update(q => [...q, { targetId: targetMember.id!, amounts: [1] }]);
        }
        continue;
      }

      // Dano normal: FA = P+1d6, FD = R+A+1d6 (+1d6 se defensor tiver perícia Luta)
      // Enfraquecido (vantagem "weaken"): Perda no dado de ataque (2d6, pior) em vez de penalidade fixa em Poder.
      const surpriseBonus = this.enemySurpriseBonus(enemy);
      const dAtk = weakened ? rollPerda() : d6();
      const defRoller = targetMember.isPlayer
        ? () => this.rollPlayerDie()
        : () => this.rollCompanionDie(targetMember.id!);
      const defRolls = this.rollDiceListWith(1 + (targetMember.hasLuta ? 1 : 0), defRoller);
      const dDef = defRolls.reduce((a, b) => a + b, 0);
      const atkPower = effP + dAtk + surpriseBonus;
      const defPower = targetMember.resistencia + effectiveArmor + dDef;
      const { dmg, str: dmgStrE } = this.fmtDmg(atkPower - defPower);
      const armorNote = armorRed > 0 ? `(A-${armorRed})` : '';
      const surpriseNote = surpriseBonus > 0 ? ' 🗡️ golpe de abertura certeiro!' : '';
      // Cada dado é mostrado separadamente (em vez da soma num só 🎲) — com Perícia
      // Luta a defesa rola 2d6, e um único ícone somado parecia um dado "de 7+".
      const defDiceStr = defRolls.map(r => `🎲${r}`).join('+') + (targetMember.hasLuta ? '(🥊Luta)' : '');
      this.addLog(
        `${enemy.icon} ${enemy.name} ataca ${targetMember.name}!${hitInfo}${weakPart}${surpriseNote} | FA: P${effP}+🎲${dAtk}${surpriseBonus ? `+${surpriseBonus}` : ''}=${atkPower} vs FD: R${targetMember.resistencia}+A${effectiveArmor}${armorNote}+${defDiceStr}=${defPower} → ${dmgStrE} dano!`,
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

    // Um inimigo confuso pode ter abatido outro por fogo amigo — checa vitória antes de devolver o turno.
    if (this.checkVictory()) return;

    // Reseta estado de esquiva/armadura de inimigos para próximo turno do jogador
    this.resetPlayerRoundState();
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
    const hPenalty = this.enemyDodgePenalties.get(enemy.id) ?? 0;
    const effEnemyH = Math.max(0, enemy.habilidade - hPenalty);
    const { hit, roll: hitRoll, threshold } = hitCheck(s.habilidade, effEnemyH);
    if (!hit) {
      this.enemyDodgePenalties.set(enemy.id, hPenalty + 1);
      this.addLog(
        `${label} ERROU! 🎯H${s.habilidade}vs${effEnemyH}${hPenalty > 0 ? `(-${hPenalty})` : ''} | 🎲${hitRoll}>${threshold} — ${enemy.name} esquivou!`,
        'miss'
      );
      return;
    }

    const lutaBonus = this.hasLuta(char) ? 1 : 0;
    const totalBonusDice = bonusDice + lutaBonus;
    const dAtk = this.rollPlayerDie();
    const bonusRolls = this.rollDiceListWith(totalBonusDice, () => this.rollPlayerDie());
    const dBonus = bonusRolls.reduce((a, b) => a + b, 0);
    const atkPower = s.poder + dAtk + dBonus;
    const hitInfo = threshold > 0 ? ` 🎯(🎲${hitRoll}≤${threshold})` : '';
    // Cada PA gasto sempre rola seu próprio d6 — mostramos cada dado em vez de um total fundido,
    // para deixar claro que não é "1 dado vezes N", e sim N dados somados.
    const bonusPart = bonusRolls.length > 0
      ? `+${bonusRolls.map(r => `🎲${r}`).join('+')}${lutaBonus ? '(🥊Luta)' : ''}`
      : '';

    if (ignoresArmor) {
      const dmg = Math.max(1, atkPower);
      this.addLog(
        `${label}${hitInfo} | FA: P${s.poder}+🎲${dAtk}${bonusPart}=${atkPower} (ignora A) → ${dmg} dano em ${enemy.name}!`,
        'player'
      );
      this.applyDamageToEnemy(enemy.id, dmg);
      return;
    }

    // Resistir com Armadura
    const armorRed = this.enemyArmorReductions.get(enemy.id) ?? 0;
    let { resisted, effectiveArmor, newReduction } = armorResistCheck(enemy.armadura, armorRed, s.poder);
    this.enemyArmorReductions.set(enemy.id, newReduction);
    if (resisted) {
      this.addLog(
        `${label}${hitInfo} | 🛡️ Armadura resiste! A${effectiveArmor}>P${s.poder} → 1 dano em ${enemy.name}!`,
        'player'
      );
      this.shieldEvents.update(q => [...q, { targetId: enemy.id, isEnemy: true }]);
      this.applyDamageToEnemy(enemy.id, 1);
      return;
    }
    effectiveArmor += this.enemyDefenseBonus(enemy);

    const dDef = d6();
    const defPower = enemy.resistencia + effectiveArmor + dDef;
    const { dmg, str: dmgStrMel } = this.fmtDmg(atkPower - defPower);
    const armorNote = armorRed > 0 ? `(A-${armorRed})` : '';
    this.addLog(
      `${label}${hitInfo} | FA: P${s.poder}+🎲${dAtk}${bonusPart}=${atkPower} vs FD: R${enemy.resistencia}+A${effectiveArmor}${armorNote}+🎲${dDef}=${defPower} → ${dmgStrMel} dano em ${enemy.name}!`,
      'player'
    );
    const hits = this.splitDamageByDice(s.poder, defPower, [dAtk, ...bonusRolls]);
    this.applyDamageToEnemy(enemy.id, dmg, hits);
  }

  /**
   * Ataque de Confusão/Paralisia (3D&T Victory): FA = Poder+1d6 vs FD = R+A+1d6 do alvo;
   * vencendo, aplica o status (em vez de dano) via `apply`.
   */
  private resolveStatusAttack(casterPoder: number, target: Enemy, label: string, apply: () => void): void {
    const dAtk = d6();
    const atkPower = casterPoder + dAtk;
    const dDef = d6();
    const defPower = target.resistencia + target.armadura + dDef;
    if (atkPower > defPower) {
      apply();
      this.addLog(`${label} — FA(P${casterPoder}+🎲${dAtk}=${atkPower}) vs FD(R${target.resistencia}+A${target.armadura}+🎲${dDef}=${defPower}) → vence a defesa!`, 'player');
    } else {
      this.addLog(`${label} — FA(${atkPower}) vs FD(${defPower}) → não vence a defesa.`, 'miss');
    }
  }

  private applyConfusao(casterPoder: number, target: Enemy): void {
    this.confusedEnemies.set(target.id, 9 + casterPoder);
  }

  private applyParalisia(casterPoder: number, target: Enemy): void {
    this.paralyzedEnemies.set(target.id, 6 + casterPoder);
  }

  /**
   * Divide o dano total em "porradas" — uma por dado de dano do atacante (1d6 base +
   * bônus de Luta/perícia/PA gasto), na ordem em que foram rolados. A defesa (fd) é
   * tratada como um orçamento que absorve os primeiros dados por completo; o dado que
   * finalmente ultrapassa esse orçamento mostra só a sobra, e os dados seguintes contam
   * o valor cheio. A soma das porradas sempre fecha com max(0, poder+Σdados-fd) — o
   * dano real do combate não muda, só a forma de mostrar/animar.
   */
  private splitDamageByDice(poder: number, fd: number, dice: number[]): number[] {
    let running = poder - fd;
    const hits: number[] = [];
    for (const die of dice) {
      const before = running;
      running += die;
      if (running > 0) hits.push(before > 0 ? die : running);
    }
    return hits;
  }

  applyDamageToEnemy(enemyId: string, dmg: number, hits?: number[]): void {
    this.enemies.update(list =>
      list.map(e => e.id === enemyId ? { ...e, hp: Math.max(0, e.hp - dmg) } : e)
    );
    if (dmg > 0) {
      // Confusão/Paralisia (3D&T Victory) terminam ao sofrer dano.
      this.confusedEnemies.delete(enemyId);
      this.paralyzedEnemies.delete(enemyId);
      const amounts = hits && hits.length > 0 ? hits : [dmg];
      this.hitEvents.update(q => [...q, { enemyId, amounts }]);
    }
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
    if (dmg > 0) this.partyHitEvents.update(q => [...q, { targetId: 'player', amounts: [dmg] }]);
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

  /** Fúria Bárbara: aplica +2P/+2R por 3 rodadas (atributo, não PM). */
  private activatePlayerRage(char: Character, ab: CombatAbility): void {
    const amt = this.playerRageAmount;
    this.playerRageTurns.set(3);
    this.gs.character.update(c => c ? {
      ...c,
      poder: { ...c.poder, current: c.poder.current + amt },
      resistencia: { ...c.resistencia, current: c.resistencia.current + amt },
    } : c);
    this.addLog(`${ab.icon} ${char.name} entra em ${ab.name}! +${amt} P e +${amt} R por 3 rodadas!`, 'player');
  }

  /** Remove o buff de Fúria Bárbara ao expirar (chamado quando playerRageTurns chega a 0). */
  private expirePlayerRage(): void {
    const amt = this.playerRageAmount;
    this.gs.character.update(c => c ? {
      ...c,
      poder: { ...c.poder, current: c.poder.current - amt },
      resistencia: { ...c.resistencia, current: c.resistencia.current - amt },
    } : c);
    this.addLog('😡 A fúria se dissipa — P e R voltam ao normal.', 'system');
  }

  /** Garante que o buff de Fúria não "vaze" para o próximo combate se este terminar com ele ainda ativo. */
  private clearPlayerRageIfActive(): void {
    if (this.playerRageTurns() <= 0) return;
    this.playerRageTurns.set(0);
    this.expirePlayerRage();
    for (const id of [...this.companionRageTurns.keys()]) this.expireCompanionRage(id);
    this.companionRageTurns.clear();
  }

  private activateCompanionRage(companion: Character, ab: CombatAbility): void {
    const amt = this.playerRageAmount;
    this.companionRageTurns.set(companion.id, 3);
    this.gs.companions.update(list => list.map(c => c.id === companion.id ? {
      ...c,
      poder: { ...c.poder, current: c.poder.current + amt },
      resistencia: { ...c.resistencia, current: c.resistencia.current + amt },
    } : c));
    this.addLog(`${ab.icon} ${companion.name} entra em ${ab.name}! +${amt} P e +${amt} R por 3 rodadas!`, 'player');
  }

  private expireCompanionRage(companionId: string): void {
    const amt = this.playerRageAmount;
    this.companionRageTurns.delete(companionId);
    this.gs.companions.update(list => list.map(c => c.id === companionId ? {
      ...c,
      poder: { ...c.poder, current: c.poder.current - amt },
      resistencia: { ...c.resistencia, current: c.resistencia.current - amt },
    } : c));
  }

  checkVictory(): boolean {
    const alive = this.enemies().filter(e => e.hp > 0);
    if (alive.length > 0) return false;
    this.phase.set('victory');
    this.clearPlayerRageIfActive();
    this.refillPA();
    this.addLog('🏆 Todos os inimigos foram derrotados!', 'system');

    // Distribui XP e ouro ao final do combate
    const defeated = this.enemies();
    const totalGold = defeated.reduce((s, e) => s + Math.max(e.goldReward ?? 0, e.pp), 0);
    const isBossFight = defeated.some(e => e.isBoss);
    const summary = this.gs.awardCombatXp(defeated, totalGold, isBossFight);

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

    this.victorySummary.set(summary);
    return true;
  }

  /** Chamado pelo overlay de vitória quando o jogador clica em "Prosseguir". */
  confirmVictory(): void {
    this.victorySummary.set(null);
    this.gs.resolveEncounter('victory');
  }

  confirmDefeat(): void {
    this.pendingDefeat.set(false);
    this.gs.resolveEncounter('defeat');
  }

  private checkDefeat(): boolean {
    const char = this.gs.character();
    if (!char || char.pontosVida.current > 0) return false;
    this.phase.set('defeat');
    this.clearPlayerRageIfActive();
    this.refillPA();
    this.addLog('💀 Você caiu em combate...', 'system');
    setTimeout(() => this.pendingDefeat.set(true), 1200);
    return true;
  }

  /** Formata o dano: defesa pode anular o ataque por completo (dano mínimo 0, regra oficial). */
  private fmtDmg(raw: number): { dmg: number; str: string } {
    const dmg = Math.max(0, raw);
    const str = dmg === 0 ? `<s>${raw}</s> 0 (defesa anula!)` : `${dmg}`;
    return { dmg, str };
  }

  private addLog(text: string, type: CombatLogEntry['type']): void {
    this.log.update(l => [...l.slice(-7), { text, type }]);
    this.gs.appendJournal(this.gs.floorNumber(), text, type);
  }
}
