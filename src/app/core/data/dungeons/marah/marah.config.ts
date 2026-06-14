import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const MarahConfig: DungeonConfig = {
  floorNumber: 6,
  theme: VALKARIA_FLOORS[5],
  layout: {
    floorNumber: 6,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal das Flores',              connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'social',   name: 'Jardim das Ninfas',               connections: [4] },
      { id: 2, row: 1, col: 2, type: 'social',   name: 'Fonte das Fadas',                 connections: [4, 5] },
      { id: 3, row: 1, col: 3, type: 'trap',     name: 'Encantamento de Sono',            connections: [5] },
      { id: 4, row: 2, col: 1, type: 'treasure', name: 'Câmara das Rosas',                connections: [6] },
      { id: 5, row: 2, col: 3, type: 'rest',     name: 'Antecâmara Perfumada',            connections: [6] },
      { id: 6, row: 3, col: 2, type: 'boss',     name: 'Trono de Ninfa Rainha Aelindra',  connections: [] },
    ],
  },
};
