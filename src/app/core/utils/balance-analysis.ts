import { BESTIARIO, MonsterTemplate } from '../data/bestiario.data';
import { ALL_DESVANTAGENS } from '../data/desvantagens.data';
import { DUNGEON_REGISTRY } from '../data/dungeons/dungeon-registry';
import { MONSTER_VANTAGEM_POOLS, MonsterArchetype } from '../data/monster-vantagens.data';
import { ALL_VANTAGENS } from '../data/vantagens.data';
import { ITEM_CATALOG, ItemSlot } from '../models/item.model';
import {
  calcCombatXp, calcEnemyPP, computeGrowthScale, GrowthScale, parseCostValue, vantagemSlotsFor,
} from './pp-calculator';

/** Slots de equipamento que podem conceder bônus de Armadura. */
const ARMOR_SLOTS: ItemSlot[] = ['armor', 'offhand', 'head', 'gloves', 'boots'];

/**
 * Estima a Armadura média de equipamento esperada num personagem naquele andar,
 * somando — por slot (armadura, escudo/offhand, cabeça, luvas, botas) — a média
 * de bônus de Armadura entre os itens do ITEM_CATALOG cujo floorRange cobre o
 * andar. Um personagem só pode equipar 1 item por slot, então a soma entre
 * slots (não a soma de TODOS os itens) é o valor correto a comparar.
 */
export function estimateExpectedArmor(floor: number): number {
  let total = 0;
  for (const slot of ARMOR_SLOTS) {
    const itemsAtFloor = Object.values(ITEM_CATALOG).filter(it =>
      it.slot === slot && (it.statBonus?.armadura ?? 0) > 0 &&
      (!it.floorRange || (floor >= it.floorRange[0] && floor <= it.floorRange[1])));
    if (itemsAtFloor.length === 0) continue;
    const avg = itemsAtFloor.reduce((s, it) => s + (it.statBonus!.armadura ?? 0), 0) / itemsAtFloor.length;
    total += avg;
  }
  return Math.round(total * 10) / 10;
}

/** Média de 1d6 — usado para estimar FA/FD/dano sem precisar rodar combate. */
const D6_AVG = 3.5;

/**
 * Quais IDs do bestiário são chefes de sala (`type: 'boss'`) naquele andar — spawna
 * cada sala de chefe uma vez (scale=1, sem efeito na identidade) e casa o nome do
 * Enemy resultante com o template do bestiário, já que roomEnemies só expõe Enemy[]
 * prontos, não o id do template usado internamente.
 */
function bossIdsForFloor(floor: number): Set<string> {
  const config = DUNGEON_REGISTRY[floor];
  const ids = new Set<string>();
  if (!config?.roomEnemies) return ids;
  const bossRoomIds = config.layout.rooms
    .filter(r => r.type === 'boss' || (Array.isArray(r.type) && r.type.includes('boss')))
    .map(r => r.id);
  const namesByFloor = new Map(
    Object.entries(BESTIARIO).filter(([, tpl]) => tpl.floor === floor).map(([id, tpl]) => [tpl.name, id]));
  const neutralScale = { overall: 1, poder: 1, resistencia: 1, habilidade: 1 };
  for (const roomId of bossRoomIds) {
    const enemies = config.roomEnemies[roomId]?.(neutralScale) ?? [];
    for (const e of enemies) {
      const id = namesByFloor.get(e.name);
      if (id) ids.add(id);
    }
  }
  return ids;
}

/**
 * Valor esperado do bônus de atributos/PV/regeneração concedido pelas vantagens
 * "fora da curva" (ver monster-vantagens.data.ts) para um dado arquétipo e número
 * de slots. Como o sorteio é sem reposição num pool de tamanho fixo, a esperança
 * de uma soma de k itens distintos sorteados uniformemente é k vezes a média de
 * TODO o pool — não precisamos enumerar combinações.
 */
function expectedVantagemBonus(archetype: MonsterArchetype | undefined, slots: number) {
  const pool = MONSTER_VANTAGEM_POOLS[archetype ?? 'generico'] ?? MONSTER_VANTAGEM_POOLS.generico;
  const k = Math.min(slots, pool.length);
  if (k <= 0 || pool.length === 0) return { poder: 0, habilidade: 0, resistencia: 0, hp: 0, regenPerTurn: 0 };

  const zero = { poder: 0, habilidade: 0, resistencia: 0 };
  const avgDelta = pool.reduce((acc, v) => {
    const applied = v.apply(zero);
    return {
      poder: acc.poder + applied.poder, habilidade: acc.habilidade + applied.habilidade,
      resistencia: acc.resistencia + applied.resistencia,
    };
  }, { poder: 0, habilidade: 0, resistencia: 0 });
  const avgHp = pool.reduce((s, v) => s + (v.hpBonus ?? 0), 0);
  const avgRegen = pool.reduce((s, v) => s + (v.regenPerTurn ?? 0), 0);
  const n = pool.length;

  return {
    poder: (avgDelta.poder / n) * k,
    habilidade: (avgDelta.habilidade / n) * k,
    resistencia: (avgDelta.resistencia / n) * k,
    hp: (avgHp / n) * k,
    regenPerTurn: (avgRegen / n) * k,
  };
}

export interface PartyProfile {
  /**
   * PP médio POR PERSONAGEM do grupo (mesmas âncoras de tierForPP/growthScale —
   * 10/20/35 = Iniciante/Herói/Veterano). NÃO é a soma da party: growthScale() é
   * calibrado por personagem, somar aqui satura a escala no teto pra qualquer
   * grupo com mais de 1 membro (era um bug real, já corrigido em game-state.service).
   */
  partyPP: number;
  /** Quantos personagens compõem o grupo (default 4). */
  size: number;
  /** Armadura média de equipamento por personagem (default 0 — pior caso, sem itens). */
  armadura: number;
  /**
   * Distribuição REAL de atributos por personagem (média). Se omitido, assume o
   * split "equilibrado" P=H=R=PP/3 — o mesmo comportamento de antes desta opção
   * existir. Preencha para simular builds assimétricas (glass cannon, tanque...)
   * e ver como o monstro reage (ver GrowthScale em pp-calculator.ts).
   */
  avgAttrs?: { poder: number; habilidade: number; resistencia: number };
}

// ── 5. Auditoria de custo de Vantagens/Desvantagens ────────────────────────

export interface CostAuditIssue {
  id: string;
  name: string;
  kind: 'vantagem' | 'desvantagem';
  issue: string;
}

/**
 * Sanity-check estático da lista oficial de Vantagens/Desvantagens: garante que
 * toda Vantagem custa PP positivo, toda Desvantagem devolve PP negativo (refund),
 * e que nenhum id é reaproveitado entre as duas listas (o que indicaria dado
 * duplicado/colado errado). Não valida o efeito mecânico em si — isso exigiria
 * entender texto livre — só a coerência numérica do custo declarado.
 */
export function auditVantagemCosts(): CostAuditIssue[] {
  const issues: CostAuditIssue[] = [];

  for (const v of ALL_VANTAGENS) {
    const cost = parseCostValue(v.cost);
    if (cost <= 0) {
      issues.push({ id: v.id, name: v.name, kind: 'vantagem', issue: `custo não-positivo: "${v.cost}" → ${cost}pt` });
    }
  }
  for (const d of ALL_DESVANTAGENS) {
    const refund = parseCostValue(d.refund);
    if (refund >= 0) {
      issues.push({ id: d.id, name: d.name, kind: 'desvantagem', issue: `reembolso não-negativo: "${d.refund}" → ${refund}pt` });
    }
  }

  const vantagemIds = new Set(ALL_VANTAGENS.map(v => v.id));
  for (const d of ALL_DESVANTAGENS) {
    if (vantagemIds.has(d.id)) {
      issues.push({ id: d.id, name: d.name, kind: 'desvantagem', issue: `id "${d.id}" também existe em ALL_VANTAGENS (colisão)` });
    }
  }

  return issues;
}

// ── 5. Coerência entre a curva de XP por combate e a curva de PP esperado ──

export interface XpPpCoherenceRow {
  floor: number;
  partyPP: number;
  partyPPNext: number;
  /** PP que cada personagem precisa ganhar para a party acompanhar a curva esperada do próximo andar. */
  ppGapPerCharacter: number;
  /** XP equivalente ao ppGapPerCharacter (10XP = 1PP, ver game-state.service.ts). */
  xpNeededPerCharacter: number;
  /** PP médio dos monstros comuns (não-chefe) deste andar, já escalados. */
  avgMonsterPP: number;
  /** XP que CADA combate comum (não-chefe) deste andar rende por personagem, pela regra oficial (calcCombatXp). */
  xpPerCommonCombat: number;
  /** Quantos combates comuns nesse andar seriam necessários para fechar o ppGap até o próximo andar. */
  combatsNeeded: number;
  flag: 'ok' | 'poucos_combates' | 'muitos_combates' | 'sem_xp';
}

/**
 * Confere se a curva de XP por combate (calcCombatXp, regra oficial: 1XP combate
 * comum / 5XP chefe / bônus por PP de diferença) é capaz de levar a party da
 * curva de PP esperada num andar até a do andar seguinte (defaultExpectedPartyPP)
 * em uma quantidade razoável de combates — nem tão poucos que o andar fique
 * trivial de più, nem tantos que vire grind. Sem isso, a análise de monstros por
 * si só não revela se a PROGRESSÃO entre andares está bem calibrada.
 */
export function auditXpPpCoherence(size = 4): XpPpCoherenceRow[] {
  const rows: XpPpCoherenceRow[] = [];

  for (let floor = 1; floor < 20; floor++) {
    const partyPP = defaultExpectedPartyPP(floor);
    const partyPPNext = defaultExpectedPartyPP(floor + 1);
    const ppGapPerCharacter = (partyPPNext - partyPP) / size;
    const xpNeededPerCharacter = ppGapPerCharacter * 10;

    const evenSplit = representativePartyMember(partyPP, size);
    const scale = computeGrowthScale(partyPP, evenSplit, size, floor);
    const bossIds = bossIdsForFloor(floor);
    const commonMonsterPPs = Object.entries(BESTIARIO)
      .filter(([id, tpl]) => tpl.floor === floor && !bossIds.has(id))
      .map(([, tpl]) => {
        const attrs = scaledAttrs(tpl, scale, false);
        return calcEnemyPP(attrs.poder, attrs.habilidade, attrs.resistencia);
      });

    const avgMonsterPP = commonMonsterPPs.length > 0
      ? commonMonsterPPs.reduce((s, p) => s + p, 0) / commonMonsterPPs.length
      : 0;

    const partyPPsArray = Array.from({ length: size }, () => partyPP / size);
    const xpPerCommonCombat = commonMonsterPPs.length > 0
      ? calcCombatXp([avgMonsterPP], partyPPsArray, false).xpPerCharacter
      : 0;

    const combatsNeeded = xpPerCommonCombat > 0 ? xpNeededPerCharacter / xpPerCommonCombat : Infinity;

    let flag: XpPpCoherenceRow['flag'] = 'ok';
    if (xpPerCommonCombat <= 0) flag = 'sem_xp';
    else if (combatsNeeded > 15) flag = 'muitos_combates';
    else if (combatsNeeded < 2) flag = 'poucos_combates';

    rows.push({
      floor, partyPP, partyPPNext, ppGapPerCharacter, xpNeededPerCharacter,
      avgMonsterPP, xpPerCommonCombat, combatsNeeded, flag,
    });
  }

  return rows;
}

export interface MonsterBalanceRow {
  id: string;
  name: string;
  /** Atributos já escalados pelo growthScale/applyFloorBonus do andar. */
  poder: number;
  habilidade: number;
  resistencia: number;
  hp: number;
  /** Dano médio esperado por ataque de UM personagem do grupo contra este monstro. */
  expectedDmgPartyToMonster: number;
  /** Dano médio esperado por ataque do monstro contra UM personagem do grupo. */
  expectedDmgMonsterToParty: number;
  /** Quantos turnos o grupo (todos atacando) leva para derrubar o monstro. */
  roundsToKillMonster: number;
  /** Quantos turnos o monstro leva para derrubar UM personagem médio do grupo. */
  roundsToKillPartyMember: number;
  /** Proporção roundsToKillPartyMember / roundsToKillMonster — >1.5 = fácil, <0.8 = perigoso. */
  riskRatio: number;
  verdict: 'trivial' | 'equilibrado' | 'arriscado' | 'mortal';
  /** Presente só quando a análise foi rodada com monteCarloTrials > 0 (ver analyzeFloorBalance). */
  monteCarlo?: MonteCarloResult;
}

// ── Monte Carlo: combate simulado com RNG real, em vez de valor esperado ───

export interface MonteCarloResult {
  /** Fração de simulações em que o grupo derrota o monstro antes de ser totalmente derrubado. */
  winRate: number;
  /** Rodadas médias até o combate terminar (vitória ou derrota). */
  avgRounds: number;
  /** % média de PV do grupo (soma de todos os personagens) restante ao fim do combate. */
  avgPartyHpRemainingPct: number;
}

/**
 * Simula N combates "grupo vs 1 monstro" com dados reais (Math.random()), seguindo
 * a mesma fórmula do jogo (FA = Atributo+1d6, FD = Resistência(+Armadura)+1d6,
 * dano = max(0, FA-FD)) — todo personagem do grupo ataca o monstro a cada rodada,
 * e o monstro ataca um membro vivo escolhido ao acaso. Não modela habilidades,
 * vantagens do jogador, fuga ou itens — é o "pior caso" de combate só com ataques
 * básicos, o que é conservador (a party real tende a ter ainda mais ferramentas).
 */
function simulateCombat(
  member: { poder: number; habilidade: number; resistencia: number },
  armadura: number,
  size: number,
  monsterAttrs: { poder: number; resistencia: number },
  monsterHp: number,
  monsterRegenPerTurn: number,
  trials: number,
): MonteCarloResult {
  const playerHp = member.resistencia * 5;
  const maxRounds = 60;
  let wins = 0, totalRounds = 0, totalHpPct = 0;

  for (let t = 0; t < trials; t++) {
    const partyHp = new Array(size).fill(playerHp);
    let monsterHpLeft = monsterHp;
    let rounds = 0;

    while (monsterHpLeft > 0 && partyHp.some(hp => hp > 0) && rounds < maxRounds) {
      rounds++;

      for (let i = 0; i < size && monsterHpLeft > 0; i++) {
        if (partyHp[i] <= 0) continue;
        const atkPower = member.poder + (1 + Math.floor(Math.random() * 6));
        const defPower = monsterAttrs.resistencia + (1 + Math.floor(Math.random() * 6));
        monsterHpLeft -= Math.max(0, atkPower - defPower);
      }
      monsterHpLeft += monsterRegenPerTurn;
      if (monsterHpLeft <= 0) break;

      const aliveIdx = partyHp.map((hp, i) => (hp > 0 ? i : -1)).filter(i => i >= 0);
      if (aliveIdx.length === 0) break;
      const target = aliveIdx[Math.floor(Math.random() * aliveIdx.length)];
      const atkPower = monsterAttrs.poder + (1 + Math.floor(Math.random() * 6));
      const defPower = member.resistencia + armadura + (1 + Math.floor(Math.random() * 6));
      partyHp[target] = Math.max(0, partyHp[target] - Math.max(0, atkPower - defPower));
    }

    if (monsterHpLeft <= 0) wins++;
    totalRounds += rounds;
    totalHpPct += partyHp.reduce((s, hp) => s + hp, 0) / (playerHp * size);
  }

  return {
    winRate: wins / trials,
    avgRounds: totalRounds / trials,
    avgPartyHpRemainingPct: (totalHpPct / trials) * 100,
  };
}

export interface FloorBalanceReport {
  floor: number;
  partyPP: number;
  /** Escala espelhada por atributo (ver GrowthScale em pp-calculator.ts) — não mais um único número. */
  scale: GrowthScale;
  monsters: MonsterBalanceRow[];
}

function verdictFor(ratio: number): MonsterBalanceRow['verdict'] {
  if (ratio >= 2.5) return 'trivial';
  if (ratio >= 1.2) return 'equilibrado';
  if (ratio >= 0.7) return 'arriscado';
  return 'mortal';
}

/**
 * Estima os atributos de UM personagem "médio" do grupo a partir do PP médio por
 * personagem, distribuindo igualmente entre Poder/Habilidade/Resistência (aproximação
 * razoável — a criação real pode desviar disso, mas serve como linha de base
 * para detectar andares fora da curva sem precisar simular escolhas reais).
 */
function representativePartyMember(partyPP: number) {
  const perAttr = Math.max(1, Math.round(partyPP / 3));
  return { poder: perAttr, habilidade: perAttr, resistencia: perAttr };
}

/**
 * Aplica a mesma regra de escala usada em spawnGrowableMonster (core/data/dungeons/shared/monster-growth.ts):
 * GrowthScale espelhado por atributo (Poder do monstro reage à Resistência real
 * da party, Resistência do monstro reage ao Poder real da party — ver
 * computeGrowthScale em pp-calculator.ts), incluindo o valor ESPERADO das
 * vantagens "fora da curva" (vantagemSlotsFor + MONSTER_VANTAGEM_POOLS) — não o
 * sorteio real (que é aleatório), mas a média estatística.
 */
function scaledAttrs(tpl: MonsterTemplate, scale: GrowthScale, isBoss: boolean) {
  const bossMul = isBoss ? 1.1 : 1;
  const poderScale       = Math.min(2.6, scale.poder       * bossMul);
  const resistenciaScale = Math.min(2.6, scale.resistencia * bossMul);
  const habilidadeScale  = Math.min(2.6, scale.habilidade  * bossMul);
  const overallScale     = Math.min(2.6, scale.overall     * bossMul);

  const poder = Math.max(1, Math.round(tpl.poder * poderScale));
  const habilidade = Math.max(1, Math.round(tpl.habilidade * habilidadeScale));
  const resistencia = Math.max(1, Math.round(tpl.resistencia * resistenciaScale));
  const baseHp = tpl.hp ? Math.round(tpl.hp * overallScale) : resistencia * 5;

  const baseSlots = vantagemSlotsFor(overallScale);
  const slots = isBoss ? Math.max(1, baseSlots) : baseSlots;
  const bonus = expectedVantagemBonus(tpl.archetype, slots);

  // Os bônus de vantagem são uma ESPERANÇA estatística (sorteio sem reposição num
  // pool), então ficam fracionários — arredonda só para exibição/relatório.
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    poder: round1(poder + bonus.poder),
    habilidade: round1(habilidade + bonus.habilidade),
    resistencia: round1(resistencia + bonus.resistencia),
    hp: round1(baseHp + bonus.hp),
    regenPerTurn: round1(bonus.regenPerTurn),
  };
}

/**
 * Analisa o balanceamento de todos os monstros cadastrados para um andar, para
 * um determinado PP de party. Por padrão usa o valor esperado do 1d6 (3.5) —
 * rápido e determinístico. Se `monteCarloTrials > 0`, cada monstro também é
 * simulado N vezes com RNG real (ver simulateCombat) para validar se a média
 * estatística não está escondendo variância perigosa.
 */
export function analyzeFloorBalance(floor: number, profile: PartyProfile, monteCarloTrials = 0): FloorBalanceReport {
  const member = profile.avgAttrs ?? representativePartyMember(profile.partyPP, profile.size);
  const scale = computeGrowthScale(profile.partyPP, member, profile.size, floor);

  const playerHp = member.resistencia * 5;

  const bossIds = bossIdsForFloor(floor);

  const monsters = Object.entries(BESTIARIO)
    .filter(([, tpl]) => tpl.floor === floor)
    .map(([id, tpl]) => {
      const isBoss = bossIds.has(id);
      const attrs = scaledAttrs(tpl, scale, isBoss);

      // monstros não têm armadura própria no bestiário (armadura: 0 em spawnGrowableMonster)
      const expectedDmgPartyToMonster = expectedDamage(member.poder - attrs.resistencia);
      const expectedDmgMonsterToParty = expectedDamage(attrs.poder - (member.resistencia + profile.armadura));

      const expectedDmgPartyToMonster = Math.max(0, playerFA - monsterFD);
      const expectedDmgMonsterToParty = Math.max(0, monsterFA - playerFD);

      // Regeneração esperada do monstro reduz o dano efetivo do grupo por rodada
      // (ele cura de volta uma fração do dano sofrido a cada turno em que sobrevive).
      const netPartyDps = expectedDmgPartyToMonster * profile.size - attrs.regenPerTurn;
      const roundsToKillMonster = netPartyDps > 0 ? attrs.hp / netPartyDps : Infinity;
      const roundsToKillPartyMember = expectedDmgMonsterToParty > 0
        ? playerHp / expectedDmgMonsterToParty
        : Infinity;

      // Grupo nunca causa dano médio no monstro → combate nunca termina nesse modelo (softlock).
      // Pior caso possível, mesmo que o monstro também não consiga ferir o grupo (Infinity/Infinity = NaN).
      const riskRatio = expectedDmgPartyToMonster === 0 ? 0 : roundsToKillPartyMember / roundsToKillMonster;

      const monteCarlo = monteCarloTrials > 0
        ? simulateCombat(member, profile.armadura, profile.size, attrs, attrs.hp, attrs.regenPerTurn, monteCarloTrials)
        : undefined;

      return {
        id, name: tpl.name,
        poder: attrs.poder, habilidade: attrs.habilidade, resistencia: attrs.resistencia, hp: attrs.hp,
        expectedDmgPartyToMonster, expectedDmgMonsterToParty,
        roundsToKillMonster, roundsToKillPartyMember,
        riskRatio,
        verdict: verdictFor(riskRatio),
        monteCarlo,
      };
    })
    .sort((a, b) => a.riskRatio - b.riskRatio);

  return { floor, partyPP: profile.partyPP, scale, monsters };
}

/**
 * Analisa todos os 20 andares de uma vez, com um PP de party estimado por andar
 * (curva linear simples). `monteCarloTrials` > 0 ativa a simulação real em cada
 * monstro de cada andar — mais lento (20 andares × ~10 monstros × N trials), mas
 * ainda roda em bem menos de 1s para N=300.
 */
export function analyzeAllFloors(
  profileForFloor: (floor: number) => PartyProfile,
  monteCarloTrials = 0,
): FloorBalanceReport[] {
  const reports: FloorBalanceReport[] = [];
  for (let floor = 1; floor <= 20; floor++) {
    reports.push(analyzeFloorBalance(floor, profileForFloor(floor), monteCarloTrials));
  }
  return reports;
}

/** PP médio por personagem "esperado" num andar — curva simples de 10 (andar 1) a 31 (andar 20), igual à citada no livro para Khalmyr/Valkaria. */
export function defaultExpectedPartyPP(floor: number): number {
  return Math.round(10 + (floor - 1) * (21 / 19));
}

export function formatReportAsMarkdown(
  reports: FloorBalanceReport[],
  costIssues?: CostAuditIssue[],
  xpCoherence?: XpPpCoherenceRow[],
): string {
  const lines: string[] = ['# Relatório de Balanceamento — Bestiário', ''];

  const hasMonteCarlo = reports.some(r => r.monsters.some(m => m.monteCarlo));

  for (const r of reports) {
    lines.push(
      `## Andar ${r.floor} (PP esperado: ${r.partyPP}, escala geral: ${r.scale.overall.toFixed(2)} — ` +
      `Poder do monstro ×${r.scale.poder.toFixed(2)}, Resistência do monstro ×${r.scale.resistencia.toFixed(2)})`
    );
    lines.push('');
    const header = hasMonteCarlo
      ? '| Monstro | P | H | R | PV | Dano→Monstro | Dano→Grupo | Risco | Veredito | Vitória% (MC) | Rodadas (MC) | PV grupo% (MC) |'
      : '| Monstro | P | H | R | PV | Dano→Monstro | Dano→Grupo | Risco | Veredito |';
    lines.push(header);
    lines.push(hasMonteCarlo ? '|---|---|---|---|---|---|---|---|---|---|---|---|' : '|---|---|---|---|---|---|---|---|---|');
    for (const m of r.monsters) {
      let row = `| ${m.name} | ${m.poder} | ${m.habilidade} | ${m.resistencia} | ${m.hp} | ` +
        `${m.expectedDmgPartyToMonster.toFixed(1)} | ${m.expectedDmgMonsterToParty.toFixed(1)} | ` +
        `${m.riskRatio === Infinity ? '∞' : m.riskRatio.toFixed(2)} | ${m.verdict} |`;
      if (hasMonteCarlo) {
        row += m.monteCarlo
          ? ` ${(m.monteCarlo.winRate * 100).toFixed(0)}% | ${m.monteCarlo.avgRounds.toFixed(1)} | ${m.monteCarlo.avgPartyHpRemainingPct.toFixed(0)}% |`
          : ' — | — | — |';
      }
      lines.push(row);
    }
    lines.push('');
  }

  if (costIssues && costIssues.length > 0) {
    lines.push('## Auditoria de custo de Vantagens/Desvantagens');
    lines.push('');
    lines.push('| Tipo | Nome | Problema |');
    lines.push('|---|---|---|');
    for (const i of costIssues) lines.push(`| ${i.kind} | ${i.name} | ${i.issue} |`);
    lines.push('');
  }

  if (xpCoherence && xpCoherence.length > 0) {
    lines.push('## Coerência XP × curva de PP esperado');
    lines.push('');
    lines.push('| Andar | PP atual→próximo | PP/personagem a ganhar | XP necessário | XP/combate comum | Combates necessários | Flag |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const x of xpCoherence) {
      lines.push(
        `| ${x.floor} | ${x.partyPP}→${x.partyPPNext} | ${x.ppGapPerCharacter.toFixed(1)} | ${x.xpNeededPerCharacter.toFixed(0)} | ` +
        `${x.xpPerCommonCombat.toFixed(2)} | ${x.combatsNeeded === Infinity ? '∞' : x.combatsNeeded.toFixed(1)} | ${x.flag} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
