import { BESTIARIO, MonsterTemplate } from '../data/bestiario.data';
import { applyFloorBonus, growthScale } from './pp-calculator';

/** Média de 1d6 — usado para estimar FA/FD/dano sem precisar rodar combate. */
const D6_AVG = 3.5;

export interface PartyProfile {
  /** PP total do grupo (soma de todos os personagens). */
  partyPP: number;
  /** Quantos personagens compõem o grupo (default 4). */
  size: number;
  /** Armadura média de equipamento por personagem (default 0 — pior caso, sem itens). */
  armadura: number;
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
}

export interface FloorBalanceReport {
  floor: number;
  partyPP: number;
  scale: number;
  monsters: MonsterBalanceRow[];
}

function verdictFor(ratio: number): MonsterBalanceRow['verdict'] {
  if (ratio >= 2.5) return 'trivial';
  if (ratio >= 1.2) return 'equilibrado';
  if (ratio >= 0.7) return 'arriscado';
  return 'mortal';
}

/**
 * Estima os atributos de UM personagem "médio" do grupo a partir do PP total da
 * party, distribuindo igualmente entre Poder/Habilidade/Resistência (aproximação
 * razoável — a criação real pode desviar disso, mas serve como linha de base
 * para detectar andares fora da curva sem precisar simular escolhas reais).
 */
function representativePartyMember(partyPP: number, size: number) {
  const perCharacterPP = partyPP / Math.max(1, size);
  const perAttr = Math.max(1, Math.round(perCharacterPP / 3));
  return { poder: perAttr, habilidade: perAttr, resistencia: perAttr };
}

/**
 * Aplica a mesma regra de escala usada em spawnGrowableMonster (core/data/dungeons/shared/monster-growth.ts),
 * mas sem instanciar vantagens/bônus aleatórios — só os atributos base, para manter a análise determinística.
 */
function scaledAttrs(tpl: MonsterTemplate, scale: number, isBoss: boolean) {
  const effectiveScale = isBoss ? Math.min(scale * 1.1, 2.6) : scale;
  return {
    poder: Math.max(1, Math.round(tpl.poder * effectiveScale)),
    habilidade: Math.max(1, Math.round(tpl.habilidade * effectiveScale)),
    resistencia: Math.max(1, Math.round(tpl.resistencia * effectiveScale)),
    hp: tpl.hp ? Math.round(tpl.hp * effectiveScale) : Math.max(1, Math.round(tpl.resistencia * effectiveScale)) * 5,
  };
}

/**
 * Analisa o balanceamento de todos os monstros cadastrados para um andar, para
 * um determinado PP de party — sem rodar combate real. Usa o valor esperado do
 * 1d6 (3.5) em vez de Monte Carlo: rápido, determinístico, e suficiente para
 * detectar andares "fora da curva" (monstro deveria ser inofensivo e não é, ou
 * vice-versa).
 */
export function analyzeFloorBalance(floor: number, profile: PartyProfile): FloorBalanceReport {
  const scale = applyFloorBonus(growthScale(profile.partyPP), floor);
  const member = representativePartyMember(profile.partyPP, profile.size);

  const playerFA = member.poder + D6_AVG;
  const playerFD = member.resistencia + profile.armadura + D6_AVG;
  const playerHp = member.resistencia * 5;

  const monsters = Object.entries(BESTIARIO)
    .filter(([, tpl]) => tpl.floor === floor)
    .map(([id, tpl]) => {
      const isBoss = id.includes('boss') || false; // heurística leve; o nome do template não marca isBoss diretamente
      const attrs = scaledAttrs(tpl, scale, isBoss);

      const monsterFA = attrs.poder + D6_AVG;
      const monsterFD = attrs.resistencia + D6_AVG; // monstros não têm armadura própria no bestiário (armadura: 0 em spawnGrowableMonster)

      const expectedDmgPartyToMonster = Math.max(0, playerFA - monsterFD);
      const expectedDmgMonsterToParty = Math.max(0, monsterFA - playerFD);

      const roundsToKillMonster = expectedDmgPartyToMonster > 0
        ? attrs.hp / (expectedDmgPartyToMonster * profile.size)
        : Infinity;
      const roundsToKillPartyMember = expectedDmgMonsterToParty > 0
        ? playerHp / expectedDmgMonsterToParty
        : Infinity;

      const riskRatio = roundsToKillMonster === 0 ? Infinity : roundsToKillPartyMember / roundsToKillMonster;

      return {
        id, name: tpl.name,
        poder: attrs.poder, habilidade: attrs.habilidade, resistencia: attrs.resistencia, hp: attrs.hp,
        expectedDmgPartyToMonster, expectedDmgMonsterToParty,
        roundsToKillMonster, roundsToKillPartyMember,
        riskRatio,
        verdict: verdictFor(riskRatio),
      };
    })
    .sort((a, b) => a.riskRatio - b.riskRatio);

  return { floor, partyPP: profile.partyPP, scale, monsters };
}

/** Analisa todos os 20 andares de uma vez, com um PP de party estimado por andar (curva linear simples). */
export function analyzeAllFloors(profileForFloor: (floor: number) => PartyProfile): FloorBalanceReport[] {
  const reports: FloorBalanceReport[] = [];
  for (let floor = 1; floor <= 20; floor++) {
    reports.push(analyzeFloorBalance(floor, profileForFloor(floor)));
  }
  return reports;
}

/** PP de party "esperado" num andar — curva simples de 10 (andar 1) a 31 (andar 20), igual à citada no livro para Khalmyr/Valkaria. */
export function defaultExpectedPartyPP(floor: number): number {
  return Math.round(10 + (floor - 1) * (21 / 19));
}

export function formatReportAsMarkdown(reports: FloorBalanceReport[]): string {
  const lines: string[] = ['# Relatório de Balanceamento — Bestiário', ''];
  for (const r of reports) {
    lines.push(`## Andar ${r.floor} (PP esperado: ${r.partyPP}, escala: ${r.scale.toFixed(2)})`);
    lines.push('');
    lines.push('| Monstro | P | H | R | PV | Dano→Monstro | Dano→Grupo | Risco | Veredito |');
    lines.push('|---|---|---|---|---|---|---|---|---|');
    for (const m of r.monsters) {
      lines.push(
        `| ${m.name} | ${m.poder} | ${m.habilidade} | ${m.resistencia} | ${m.hp} | ` +
        `${m.expectedDmgPartyToMonster.toFixed(1)} | ${m.expectedDmgMonsterToParty.toFixed(1)} | ` +
        `${m.riskRatio === Infinity ? '∞' : m.riskRatio.toFixed(2)} | ${m.verdict} |`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
