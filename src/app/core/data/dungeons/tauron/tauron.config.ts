import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const TauronConfig: DungeonConfig = {
  floorNumber: 9,
  theme: VALKARIA_FLOORS[8],
  layout: {
    floorNumber: 9,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Labirinto',       connections: [1, 2, 3] },
      { id: 1, row: 1, col: 0, type: 'empty',    name: 'Corredor Sem Saída',         connections: [4] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara do Minotauro',        connections: [4, 5] },
      { id: 3, row: 1, col: 4, type: 'trap',     name: 'Paredes Móveis',             connections: [5] },
      { id: 4, row: 2, col: 1, type: 'monster',  name: 'Câmara do Berserker',        connections: [6] },
      { id: 5, row: 2, col: 3, type: 'treasure', name: 'Tesouro do Gladiador',       connections: [6] },
      { id: 6, row: 3, col: 2, type: 'boss',     name: 'Arena do Minotauro Supremo', connections: [] },
    ],
  },
};
