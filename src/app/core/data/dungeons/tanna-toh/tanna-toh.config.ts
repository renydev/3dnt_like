import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { TANNA_TOH_ROOM_ENEMIES } from './tanna-toh.monsters';

export const TannaTohConfig: DungeonConfig = {
  floorNumber: 10,
  theme: VALKARIA_FLOORS[9],
  roomEnemies: TANNA_TOH_ROOM_ENEMIES,
  layout: {
    floorNumber: 10,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Biblioteca',      connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Câmara do Primeiro Enigma',  connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'puzzle',   name: 'Câmara do Segundo Enigma',   connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Seção de Pergaminhos Raros', connections: [6] },
      { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Terceiro Enigma',  connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'monster',  name: 'Guardião de Biblioteca',     connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Meditação',        connections: [8] },
      { id: 7, row: 3, col: 3, type: 'trap',     name: 'Paradoxo Temporal',          connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Golem do Saber',   connections: [] },
    ],
  },
};
