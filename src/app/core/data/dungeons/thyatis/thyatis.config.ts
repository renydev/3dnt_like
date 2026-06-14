import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const ThyatisConfig: DungeonConfig = {
  floorNumber: 14,
  theme: VALKARIA_FLOORS[13],
  layout: {
    floorNumber: 14,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal das Chamas',             connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'trap',     name: 'Jato de Chama',                 connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara dos Salamandros',        connections: [4, 5] },
      { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Ífreets',            connections: [5, 6] },
      { id: 4, row: 2, col: 1, type: 'treasure', name: 'Câmara dos Rubis de Fogo',      connections: [7] },
      { id: 5, row: 2, col: 2, type: 'trap',     name: 'Chão de Lava',                  connections: [7] },
      { id: 6, row: 2, col: 4, type: 'rest',     name: 'Câmara Resistente ao Fogo',     connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Núcleo do Elemental Primordial', connections: [] },
    ],
  },
};
