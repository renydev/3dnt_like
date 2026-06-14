import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const RagnarConfig: DungeonConfig = {
  floorNumber: 2,
  theme: VALKARIA_FLOORS[1],
  layout: {
    floorNumber: 2,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portão de Batalha',          connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Horda de Goblins',           connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Berserkers Orcs',            connections: [4, 5, 6] },
      { id: 3, row: 1, col: 3, type: 'monster',  name: 'Ogres de Vanguarda',         connections: [5, 6] },
      { id: 4, row: 2, col: 0, type: 'rest',     name: 'Armeiro Abandonado',         connections: [7, 8] },
      { id: 5, row: 2, col: 2, type: 'trap',     name: 'Campo Minado com Estacas',   connections: [7, 8] },
      { id: 6, row: 2, col: 4, type: 'monster',  name: 'Troll da Guerra',            connections: [8] },
      { id: 7, row: 3, col: 1, type: 'treasure', name: 'Tesouro de Batalha',         connections: [9] },
      { id: 8, row: 3, col: 3, type: 'monster',  name: 'Capitão Hobgoblin',          connections: [9] },
      { id: 9, row: 3, col: 2, type: 'boss',     name: 'Forte do Warchief Gromthar', connections: [] },
    ],
  },
};
