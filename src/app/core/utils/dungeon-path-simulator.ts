import { Enemy } from '../models/combat.model';
import { DUNGEON_REGISTRY } from '../data/dungeons/dungeon-registry';
import { RoomType } from '../models/dungeon.model';
import { computeGrowthScale } from './pp-calculator';

/**
 * Simulador de rotas de masmorra: em vez de testar "um andar vs um monstro" isolado
 * (ver balance-analysis.ts), testa um GRUPO percorrendo uma ROTA COMPLETA do início
 * ao chefe — carregando o PV entre salas (sem cura mágica entre combates, exceto em
 * salas de descanso), pra revelar combinações de salas que desgastam o grupo até a
 * morte mesmo que cada sala isolada pareça "equilibrada".
 *
 * Usa as MESMAS funções de spawn do jogo real (config.roomEnemies/rollEncounter,
 * que chamam spawnGrowableMonster) — não uma aproximação estatística — então as
 * vantagens "fora da curva" dos monstros são sorteadas de verdade aqui, igual no jogo.
 */

export interface PathProfile {
  partyPP: number;
  size: number;
  armadura: number;
  avgAttrs?: { poder: number; habilidade: number; resistencia: number };
}

export interface FloorPath {
  /** Sequência de IDs de sala, da entrada até o chefe. */
  roomIds: number[];
  /** Nomes das salas, na mesma ordem (pra exibição). */
  roomNames: string[];
}

export interface PathSimResult extends FloorPath {
  /** Fração de simulações em que o personagem líder (índice 0) chega vivo ao fim da rota. */
  survivalRate: number;
  /** % média de PV do líder restante ao final (0 se morreu antes do fim). */
  avgLeaderHpPct: number;
  /** Sala (id) onde mais simulações falharam — null se não houve falhas. */
  deadliestRoomId: number | null;
}

function d6() { return 1 + Math.floor(Math.random() * 6); }

/** Tipo "representativo" de uma sala — quando o layout permite múltiplos tipos (sorteio
 *  por partida real), usa o primeiro da lista. Simplificação documentada: não enumera
 *  as variações possíveis de cada sala-multitipo, senão o número de rotas explodiria. */
function representativeType(type: RoomType | RoomType[]): RoomType {
  return Array.isArray(type) ? type[0] : type;
}

/**
 * Enumera todas as rotas simples (sem repetir sala) da entrada até qualquer sala de
 * chefe do andar, navegando pelo grafo de `connections` do layout. DFS com poda por
 * "já visitada" — suficiente para os tamanhos de masmorra deste jogo (~9-18 salas).
 */
export function enumerateFloorPaths(floor: number): FloorPath[] {
  const config = DUNGEON_REGISTRY[floor];
  if (!config) return [];
  const rooms = config.layout.rooms;
  const byId = new Map(rooms.map(r => [r.id, r]));
  const entrance = rooms.find(r => representativeType(r.type) === 'entrance');
  const bossIds = new Set(rooms.filter(r => representativeType(r.type) === 'boss').map(r => r.id));
  if (!entrance || bossIds.size === 0) return [];

  const paths: FloorPath[] = [];
  const MAX_PATHS = 200; // teto de segurança contra grafos muito ramificados

  function dfs(currentId: number, visited: Set<number>, trail: number[]) {
    if (paths.length >= MAX_PATHS) return;
    if (bossIds.has(currentId)) {
      paths.push({
        roomIds: [...trail],
        roomNames: trail.map(id => byId.get(id)?.name ?? `Sala ${id}`),
      });
      return;
    }
    const room = byId.get(currentId);
    if (!room) return;
    for (const nextId of room.connections) {
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      trail.push(nextId);
      dfs(nextId, visited, trail);
      trail.pop();
      visited.delete(nextId);
    }
  }

  dfs(entrance.id, new Set([entrance.id]), [entrance.id]);
  return paths;
}

interface SimMember { poder: number; habilidade: number; resistencia: number; maxHp: number; }

/** Resolve um combate de grupo (N personagens vs M monstros), mutando os PVs em `partyHp` no lugar.
 *  Cada rodada: a party foca fogo no monstro com menos PV restante; cada monstro vivo ataca um
 *  membro vivo aleatório. Retorna false se a party inteira (todos os PVs) zerar antes dos monstros. */
function resolveRoomFight(
  members: SimMember[],
  partyHp: number[],
  armadura: number,
  enemies: Enemy[],
): boolean {
  const monsterHp = enemies.map(e => e.hp);
  const maxRounds = 60;
  let rounds = 0;

  while (monsterHp.some(hp => hp > 0) && partyHp.some(hp => hp > 0) && rounds < maxRounds) {
    rounds++;

    // Party ataca o monstro com menos PV restante (foco de fogo).
    for (let i = 0; i < members.length; i++) {
      if (partyHp[i] <= 0) continue;
      let targetIdx = -1, lowestHp = Infinity;
      for (let j = 0; j < monsterHp.length; j++) {
        if (monsterHp[j] > 0 && monsterHp[j] < lowestHp) { lowestHp = monsterHp[j]; targetIdx = j; }
      }
      if (targetIdx === -1) break;
      const atkPower = members[i].poder + d6();
      const defPower = enemies[targetIdx].resistencia + d6();
      monsterHp[targetIdx] -= Math.max(0, atkPower - defPower);
    }
    // Regeneração dos monstros ainda vivos.
    for (let j = 0; j < monsterHp.length; j++) {
      if (monsterHp[j] > 0 && enemies[j].regenPerTurn) monsterHp[j] += enemies[j].regenPerTurn!;
    }
    if (!monsterHp.some(hp => hp > 0)) break;

    // Monstros vivos atacam um membro vivo ao acaso, um ataque cada.
    const aliveParty = partyHp.map((hp, i) => (hp > 0 ? i : -1)).filter(i => i >= 0);
    if (aliveParty.length === 0) break;
    for (let j = 0; j < enemies.length; j++) {
      if (monsterHp[j] <= 0) continue;
      const stillAlive = partyHp.map((hp, i) => (hp > 0 ? i : -1)).filter(i => i >= 0);
      if (stillAlive.length === 0) break;
      const target = stillAlive[Math.floor(Math.random() * stillAlive.length)];
      const atkPower = enemies[j].poder + d6();
      const defPower = members[target].resistencia + armadura + d6();
      partyHp[target] = Math.max(0, partyHp[target] - Math.max(0, atkPower - defPower));
    }
  }

  return partyHp.some(hp => hp > 0);
}

/** Teste de armadilha (mesma fórmula de encounter-screen.component.ts: rollTrap) — só afeta o líder (índice 0). */
function resolveTrap(partyHp: number[], members: SimMember[], floor: number) {
  const diff = 9 + Math.floor(floor / 2);
  const total = d6() + members[0].habilidade;
  if (total < diff) {
    partyHp[0] = Math.max(0, partyHp[0] - d6());
  }
}

/** Descanso (mesma regra de restDeep: cura total de PV em toda a party). */
function resolveRest(partyHp: number[], members: SimMember[]) {
  for (let i = 0; i < members.length; i++) partyHp[i] = members[i].maxHp;
}

/**
 * Simula `trials` percursos de uma rota específica, carregando o PV entre salas.
 * O líder (índice 0) representa o personagem principal — uma rota "falha" quando ele
 * morre em algum ponto do caminho (companheiros caídos não encerram a simulação,
 * só deixam de lutar, espelhando o fato de que game_over está ligado ao protagonista).
 */
export function simulatePath(floor: number, path: FloorPath, profile: PathProfile, trials: number): PathSimResult {
  const config = DUNGEON_REGISTRY[floor];
  const avgAttrs = profile.avgAttrs ?? {
    poder: Math.max(1, Math.round(profile.partyPP / profile.size / 3)),
    habilidade: Math.max(1, Math.round(profile.partyPP / profile.size / 3)),
    resistencia: Math.max(1, Math.round(profile.partyPP / profile.size / 3)),
  };
  const members: SimMember[] = Array.from({ length: profile.size }, () => ({
    ...avgAttrs, maxHp: avgAttrs.resistencia * 5,
  }));
  const scale = computeGrowthScale(profile.partyPP, avgAttrs, profile.size, floor);
  const byId = new Map(config.layout.rooms.map(r => [r.id, r]));

  let survivals = 0, totalHpPct = 0;
  const failuresByRoom = new Map<number, number>();

  for (let t = 0; t < trials; t++) {
    const partyHp = members.map(m => m.maxHp);
    let failedAt: number | null = null;

    for (const roomId of path.roomIds) {
      const room = byId.get(roomId);
      if (!room) continue;
      const type = representativeType(room.type);

      if (type === 'monster' || type === 'boss') {
        const enemies = config.roomEnemies?.[roomId]?.(scale) ?? [];
        if (enemies.length > 0) {
          const survived = resolveRoomFight(members, partyHp, profile.armadura, enemies);
          if (!survived || partyHp[0] <= 0) { failedAt = roomId; break; }
        }
      } else if (type === 'trap') {
        resolveTrap(partyHp, members, floor);
        if (partyHp[0] <= 0) { failedAt = roomId; break; }
      } else if (type === 'rest') {
        resolveRest(partyHp, members);
      }
      // 'treasure'/'puzzle'/'social'/'empty' não afetam PV nesta simulação.
    }

    if (failedAt !== null) {
      failuresByRoom.set(failedAt, (failuresByRoom.get(failedAt) ?? 0) + 1);
    } else {
      survivals++;
    }
    totalHpPct += Math.max(0, partyHp[0]) / members[0].maxHp;
  }

  let deadliestRoomId: number | null = null, worstCount = 0;
  for (const [roomId, count] of failuresByRoom) {
    if (count > worstCount) { worstCount = count; deadliestRoomId = roomId; }
  }

  return {
    ...path,
    survivalRate: survivals / trials,
    avgLeaderHpPct: (totalHpPct / trials) * 100,
    deadliestRoomId,
  };
}

/** Roda simulatePath em TODAS as rotas possíveis do andar, ordenadas da mais arriscada pra mais segura. */
export function simulateAllPaths(floor: number, profile: PathProfile, trials: number): PathSimResult[] {
  const paths = enumerateFloorPaths(floor);
  return paths
    .map(p => simulatePath(floor, p, profile, trials))
    .sort((a, b) => a.survivalRate - b.survivalRate);
}

export function formatPathReportAsMarkdown(floor: number, results: PathSimResult[]): string {
  const lines: string[] = [`# Teste de rotas — Andar ${floor}`, '', `${results.length} rota(s) encontrada(s) entre a entrada e o chefe.`, ''];
  lines.push('| Rota | Sobrevivência | PV líder % (médio) | Sala mais letal |');
  lines.push('|---|---|---|---|');
  for (const r of results) {
    lines.push(
      `| ${r.roomNames.join(' → ')} | ${(r.survivalRate * 100).toFixed(0)}% | ${r.avgLeaderHpPct.toFixed(0)}% | ` +
      `${r.deadliestRoomId !== null ? (r.roomNames[r.roomIds.indexOf(r.deadliestRoomId)] ?? r.deadliestRoomId) : '—'} |`
    );
  }
  return lines.join('\n');
}
