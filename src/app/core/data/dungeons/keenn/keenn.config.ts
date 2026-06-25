import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { KEENN_ROOM_ENEMIES, rollKeennEncounter } from './keenn.monsters';

export const KeennConfig: DungeonConfig = {
  floorNumber: 16,
  theme: VALKARIA_FLOORS[15],
  roomEnemies: KEENN_ROOM_ENEMIES,
  rollEncounter: rollKeennEncounter,
  layout: {
    floorNumber: 16,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Arena de Ferro',    connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Golem de Ferro',     connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara do Paladino Renegado',  connections: [4, 5, 6] },
      { id: 3, row: 1, col: 3, type: 'trap',     name: 'Prensa de Ferro',              connections: [5, 6] },
      { id: 4, row: 2, col: 0, type: 'rest',     name: 'Câmara de Recuperação',        connections: [7] },
      { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Campeão',            connections: [7] },
      { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara das Armaduras Mágicas', connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Arena do Cavaleiro de Ferro',  connections: [] },
    ],
  },
};
