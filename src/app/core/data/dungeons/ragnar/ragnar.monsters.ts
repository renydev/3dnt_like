import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros (atributos-base, lore, arquétipo) vivem no bestiário
// central (core/data/bestiario.data.ts) — este arquivo só decide QUAIS monstros
// aparecem em QUAL sala e em QUE quantidade, especificamente para Ragnar.

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
