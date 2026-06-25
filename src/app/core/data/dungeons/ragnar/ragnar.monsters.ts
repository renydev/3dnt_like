import { Enemy } from '../../../models/combat.model';
import { GrowableMonsterTemplate, spawnGrowableMonster } from '../shared/monster-growth';

export type MonsterTemplate = GrowableMonsterTemplate;

// Armadura foi absorvida em Resistência (defesa = Resistência + Armadura + 1d6 já
// somava as duas, então a fusão é direta: resistencia_nova = resistencia + armadura).
export const RAGNAR_MONSTERS: Record<string, MonsterTemplate> = {
  goblin_guerreiro: {
    name: 'Goblin Guerreiro', icon: '👺', sprite: 'goblin-engenhoqueiro.png', archetype: 'furtivo',
    flavorText: 'Pequeno e covarde, mas perigoso em grupo. Porta uma azagaia enferrujada e grita ao atacar para compensar o tamanho.',
    poder: 1, habilidade: 2, resistencia: 1,
    hp: 5,
    xpReward: 4, goldReward: 2,
  },
  orc_guerreiro: {
    name: 'Orc Guerreiro', icon: '👹', sprite: 'orc.png', archetype: 'dps',
    flavorText: 'Cinza e musculoso, treinado desde o nascimento para matar. Carrega machado de guerra com braço forte demais.',
    poder: 3, habilidade: 2, resistencia: 3,
    hp: 10,
    xpReward: 8, goldReward: 5,
  },
  orc_berserker: {
    name: 'Orc Berserker', icon: '😡', sprite: 'orc.png', archetype: 'dps',
    flavorText: 'Ao entrar em fúria, ignora a dor. Cada ferimento parece apenas aumentar sua brutalidade e velocidade de ataque.',
    poder: 4, habilidade: 2, resistencia: 4,
    hp: 15,
    xpReward: 12, goldReward: 5,
  },
  hobgoblin_capitao: {
    name: 'Hobgoblin Capitão', icon: '🪖', sprite: 'hobgoblin-soldado.png', archetype: 'defensor',
    flavorText: 'Mais alto que um orc, mais disciplinado que um goblin. Comanda pelotões com voz de trovão e espada curta de qualidade.',
    poder: 4, habilidade: 3, resistencia: 5,
    hp: 15,
    xpReward: 15, goldReward: 10,
  },
  ogre_batalha: {
    name: 'Ogre de Batalha', icon: '🗿', sprite: 'ogro.png', archetype: 'paquiderme',
    flavorText: 'Três metros de músculo e raiva. Usa um tronco de árvore como clava. Um único golpe pode derrubar um guerreiro de armadura pesada.',
    poder: 5, habilidade: 1, resistencia: 6,
    hp: 20,
    xpReward: 18, goldReward: 8,
  },
  troll_guerra: {
    name: 'Troll da Guerra', icon: '🟢', sprite: 'troll.png', archetype: 'reptiliano',
    flavorText: 'Verde, imundo e com regeneração sobrenatural. Cortes e perfurações fecham em segundos — apenas fogo e ácido evitam a cura.',
    poder: 5, habilidade: 2, resistencia: 7,
    hp: 25,
    xpReward: 22, goldReward: 6,
  },
  gromthar: {
    name: 'Warchief Gromthar', icon: '⚔️', sprite: 'orc-chefe.png', archetype: 'paquiderme',
    flavorText: 'Meio-ogre, meio-orc, completamente brutal. Lidera a horda com um machado de batalha encantado que zumbe ao cortar o ar.',
    poder: 6, habilidade: 3, resistencia: 9,
    hp: 30,
    xpReward: 50, goldReward: 30,
  },
};

export function spawnMonster(key: string, scale: number, isBoss = false): Enemy {
  return spawnGrowableMonster(RAGNAR_MONSTERS[key], key, isBoss, scale);
}

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const RAGNAR_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  // id 3 — Câmara I — Portão de Sangue: horda de goblins (2d6, máx 6)
  3: (scale) => {
    const count = Math.min(6, d(6) + d(6));
    return Array.from({ length: count }, () => spawnMonster('goblin_guerreiro', scale));
  },
  // id 4 — Câmara 2 — Salão das Batalhas: orcs + 1 berserker
  4: (scale) => {
    const count = Math.min(4, d(6) + 2);
    return [
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro', scale)),
      spawnMonster('orc_berserker', scale),
    ];
  },
  // id 5 — Câmara 3 — Posto de Guarda Norte: hobgoblin capitão + orcs
  5: (scale) => {
    const count = Math.max(1, d(4));
    return [
      spawnMonster('hobgoblin_capitao', scale),
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro', scale)),
    ];
  },
  // id 6 — Câmara 4 — Torre de Observação: ogre + goblins de escolta
  6: (scale) => [
    spawnMonster('ogre_batalha', scale),
    spawnMonster('goblin_guerreiro', scale),
    spawnMonster('goblin_guerreiro', scale),
  ],
  // id 8 — Câmara 3 — Cruzamento Central: patrulha mista
  8: (scale) => {
    const count = Math.max(1, d(4));
    return [
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro', scale)),
      spawnMonster('orc_berserker', scale),
    ];
  },
  // id 10 — Câmara 1 — Arena de Duelos: troll + berserkers
  10: (scale) => [
    spawnMonster('troll_guerra', scale),
    spawnMonster('orc_berserker', scale),
    spawnMonster('orc_berserker', scale),
  ],
  // id 11 — Câmara 3 — Corredor Inferior: patrulha de hobgoblins
  11: (scale) => {
    const count = Math.max(1, d(4));
    return Array.from({ length: count }, () => spawnMonster('hobgoblin_capitao', scale));
  },
  // id 13 — Boss — Warchief Gromthar
  13: (scale) => [
    spawnMonster('gromthar', scale, true),
    spawnMonster('ogre_batalha', scale),
    spawnMonster('hobgoblin_capitao', scale),
  ],
};

export function rollRagnarEncounter(scale: number): Enemy[] {
  const roll = d(6);
  if (roll <= 2) return Array.from({ length: d(4) + 1 }, () => spawnMonster('goblin_guerreiro', scale));
  if (roll <= 4) return [spawnMonster('orc_guerreiro', scale), spawnMonster('orc_berserker', scale)];
  return [spawnMonster('hobgoblin_capitao', scale), spawnMonster('orc_guerreiro', scale)];
}
