import { Enemy } from '../../../models/combat.model';
import { calcEnemyPP } from '../../../utils/pp-calculator';

export interface MonsterTemplate {
  name: string;
  icon: string;
  flavorText: string;
  forca: number;
  habilidade: number;
  resistencia: number;
  armadura: number;
  poderFogo: number;
  hp?: number;
  xpReward: number;
  goldReward: number;
}

export const RAGNAR_MONSTERS: Record<string, MonsterTemplate> = {
  goblin_guerreiro: {
    name: 'Goblin Guerreiro', icon: '👺',
    flavorText: 'Pequeno e covarde, mas perigoso em grupo. Porta uma azagaia enferrujada e grita ao atacar para compensar o tamanho.',
    forca: 1, habilidade: 2, resistencia: 1, armadura: 0, poderFogo: 0,
    hp: 5,
    xpReward: 4, goldReward: 2,
  },
  orc_guerreiro: {
    name: 'Orc Guerreiro', icon: '👹',
    flavorText: 'Cinza e musculoso, treinado desde o nascimento para matar. Carrega machado de guerra com braço forte demais.',
    forca: 3, habilidade: 2, resistencia: 2, armadura: 1, poderFogo: 0,
    hp: 10,
    xpReward: 8, goldReward: 5,
  },
  orc_berserker: {
    name: 'Orc Berserker', icon: '😡',
    flavorText: 'Ao entrar em fúria, ignora a dor. Cada ferimento parece apenas aumentar sua brutalidade e velocidade de ataque.',
    forca: 4, habilidade: 2, resistencia: 3, armadura: 1, poderFogo: 0,
    hp: 15,
    xpReward: 12, goldReward: 5,
  },
  hobgoblin_capitao: {
    name: 'Hobgoblin Capitão', icon: '🪖',
    flavorText: 'Mais alto que um orc, mais disciplinado que um goblin. Comanda pelotões com voz de trovão e espada curta de qualidade.',
    forca: 4, habilidade: 3, resistencia: 3, armadura: 2, poderFogo: 0,
    hp: 15,
    xpReward: 15, goldReward: 10,
  },
  ogre_batalha: {
    name: 'Ogre de Batalha', icon: '🗿',
    flavorText: 'Três metros de músculo e raiva. Usa um tronco de árvore como clava. Um único golpe pode derrubar um guerreiro de armadura pesada.',
    forca: 5, habilidade: 1, resistencia: 4, armadura: 2, poderFogo: 0,
    hp: 20,
    xpReward: 18, goldReward: 8,
  },
  troll_guerra: {
    name: 'Troll da Guerra', icon: '🟢',
    flavorText: 'Verde, imundo e com regeneração sobrenatural. Cortes e perfurações fecham em segundos — apenas fogo e ácido evitam a cura.',
    forca: 5, habilidade: 2, resistencia: 4, armadura: 3, poderFogo: 0,
    hp: 25,
    xpReward: 22, goldReward: 6,
  },
  gromthar: {
    name: 'Warchief Gromthar', icon: '⚔️',
    flavorText: 'Meio-ogre, meio-orc, completamente brutal. Lidera a horda com um machado de batalha encantado que zumbe ao cortar o ar.',
    forca: 6, habilidade: 3, resistencia: 5, armadura: 4, poderFogo: 0,
    hp: 30,
    xpReward: 50, goldReward: 30,
  },
};

export function spawnMonster(key: string, isBoss = false): Enemy {
  const tpl = RAGNAR_MONSTERS[key];
  const hp = tpl.hp ?? tpl.resistencia * 5;
  return {
    id: `${key}_${Math.random().toString(36).slice(2, 7)}`,
    name: tpl.name,
    icon: tpl.icon,
    flavorText: tpl.flavorText,
    hp,
    maxHp: hp,
    forca: tpl.forca,
    habilidade: tpl.habilidade,
    resistencia: tpl.resistencia,
    armadura: tpl.armadura,
    pp: calcEnemyPP(tpl.forca, tpl.habilidade, tpl.armadura, tpl.resistencia),
    xpReward: tpl.xpReward,
    goldReward: tpl.goldReward,
    isBoss,
  };
}

export type RoomEnemyGroup = () => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const RAGNAR_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  // id 3 — Câmara I — Portão de Sangue: horda de goblins (2d6, máx 6)
  3: () => {
    const count = Math.min(6, d(6) + d(6));
    return Array.from({ length: count }, () => spawnMonster('goblin_guerreiro'));
  },
  // id 4 — Câmara 2 — Salão das Batalhas: orcs + 1 berserker
  4: () => {
    const count = Math.min(4, d(6) + 2);
    return [
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro')),
      spawnMonster('orc_berserker'),
    ];
  },
  // id 5 — Câmara 3 — Posto de Guarda Norte: hobgoblin capitão + orcs
  5: () => {
    const count = Math.max(1, d(4));
    return [
      spawnMonster('hobgoblin_capitao'),
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro')),
    ];
  },
  // id 6 — Câmara 4 — Torre de Observação: ogre + goblins de escolta
  6: () => [
    spawnMonster('ogre_batalha'),
    spawnMonster('goblin_guerreiro'),
    spawnMonster('goblin_guerreiro'),
  ],
  // id 8 — Câmara 3 — Cruzamento Central: patrulha mista
  8: () => {
    const count = Math.max(1, d(4));
    return [
      ...Array.from({ length: count }, () => spawnMonster('orc_guerreiro')),
      spawnMonster('orc_berserker'),
    ];
  },
  // id 10 — Câmara 1 — Arena de Duelos: troll + berserkers
  10: () => [
    spawnMonster('troll_guerra'),
    spawnMonster('orc_berserker'),
    spawnMonster('orc_berserker'),
  ],
  // id 11 — Câmara 3 — Corredor Inferior: patrulha de hobgoblins
  11: () => {
    const count = Math.max(1, d(4));
    return Array.from({ length: count }, () => spawnMonster('hobgoblin_capitao'));
  },
  // id 13 — Boss — Warchief Gromthar
  13: () => [
    spawnMonster('gromthar', true),
    spawnMonster('ogre_batalha'),
    spawnMonster('hobgoblin_capitao'),
  ],
};

export function rollRagnarEncounter(): Enemy[] {
  const roll = d(6);
  if (roll <= 2) return Array.from({ length: d(4) + 1 }, () => spawnMonster('goblin_guerreiro'));
  if (roll <= 4) return [spawnMonster('orc_guerreiro'), spawnMonster('orc_berserker')];
  return [spawnMonster('hobgoblin_capitao'), spawnMonster('orc_guerreiro')];
}
