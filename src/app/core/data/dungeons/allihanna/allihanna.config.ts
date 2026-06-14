import { RoomScenario, VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { ALLIHANNA_ROOM_ENEMIES, rollAllihannaEncounter } from './allihanna.monsters';

const ALLIHANNA_SCENARIOS: Record<number, RoomScenario> = {
  1: {
    description: `O cheiro de água atinge os aventureiros muito antes que cheguem a esta clareira, ocupada quase inteiramente por um lago — que precisa ser atravessado para que se possa alcançar a trilha no lado oposto.

O lago é raso; mesmo um halfling pode atravessar com água pela cintura sem testes de Natação. No entanto, uma manada de elefantes está na margem oposta, bebendo, banhando-se e cuidando dos filhotes. Estas criaturas se assustam facilmente com invasores e tornam-se hostis caso qualquer criatura entre no lago.`,
    choices: [
      {
        label: 'Atravessar o lago (Animais)',
        description: 'Usar sua perícia com animais para acalmar os elefantes e atravessar sem incidentes.',
        action: 'safe_enter',
        requiresPericia: 'animais',
      },
      {
        label: 'Atravessar o lago',
        description: 'Entrar no lago e tentar passar — os elefantes ficarão agitados.',
        action: 'enter',
      },
      {
        label: 'Atacar os elefantes',
        description: 'Partir para o combate diretamente.',
        action: 'enter',
      },
      {
        label: 'Descansar e aguardar',
        description: 'Esperar pacientemente. Após algum tempo os elefantes se afastam por conta própria.',
        action: 'rest_wait',
      },
      {
        label: 'Voltar',
        description: 'Recuar e não atravessar o lago agora.',
        action: 'flee',
      },
    ],
  },
};

export const AllihannaConfig: DungeonConfig = {
  floorNumber: 1,
  theme: VALKARIA_FLOORS[0],

  layout: {
    floorNumber: 1,
    rooms: [
      { id:  0, row: 5, col: 5, type: 'monster', name: 'Câmara I — O Lago', connections: [1, 5, 14] },
      { id:  1, row: 5, col: 3, type: 'entrance', name: 'Portal de Entrada (Sala 1)', connections: [0, 2, 6] },
      { id:  2, row: 4, col: 3, type: 'empty', name: 'Túnel Intermediário Central', connections: [1, 3] },
      { id:  3, row: 3, col: 3, type: 'monster', name: 'Câmara 2 — As Feras (Centro)', connections: [2, 4, 5, 10] },
      { id:  4, row: 4, col: 2, type: 'treasure', name: 'Caverna Oculta ao Sul', connections: [3] },
      { id:  5, row: 3, col: 5, type: 'empty', name: 'Salão Balão Lateral', connections: [0, 3, 14] },
      { id:  6, row: 4, col: 0, type: 'monster', name: 'Câmara 2 — As Feras (Esquerda)', connections: [1, 7] },
      { id:  7, row: 2, col: 1, type: 'monster', name: 'Câmara 3 — Caverna dos Ursos', connections: [6, 8, 10] },
      { id:  8, row: 1, col: 0, type: 'monster', name: 'Câmara 3a — Urso-Coruja Imenso', connections: [7] },
      { id:  9, row: 0, col: 2, type: 'monster', name: 'Câmara Dupla do Norte (Ninho)', connections: [10] },
      { id: 10, row: 1, col: 2, type: 'empty', name: 'Bifurcação Superior', connections: [3, 7, 9, 11, 12] },
      { id: 11, row: 1, col: 4, type: 'trap', name: 'Antecâmara do Druida (Pré-Boss)', connections: [10, 12, 13] },
      { id: 12, row: 2, col: 4, type: 'treasure', name: 'Gruta Isolada do Sudeste', connections: [11, 10, 13] },
      { id: 13, row: 0, col: 5, type: 'boss', name: 'Câmara 4 — O Druida Defensor', connections: [11, 12] },
      { id: 14, row: 0, col: 5, type: 'empty', name: 'Câmara do lago', connections: [5, 0] },
    ],
  },
  imageMap: {
    url: 'assets/maps/images/1 allihanna.png',
    viewBox: '0 0 712 615',
    hotspots: [
      { roomId:  0, label: 'O Lago', cx: 608, cy: 503, w: 104, h: 71 }, // Câmara I — O Lago
      { roomId:  1, label: 'Entrada', cx: 389, cy: 536, w: 126, h: 74 }, // Portal de Entrada (Sala 1)
      { roomId:  2, label: '-', cx: 257, cy: 437, r: 32 }, // Túnel Intermediário Central
      { roomId:  3, label: '2', cx: 329, cy: 307, r: 43 }, // Câmara 2 — As Feras (Centro)
      { roomId:  4, label: '-', cx: 209, cy: 377, r: 30 }, // Caverna Oculta ao Sul
      { roomId:  5, label: '-', cx: 521, cy: 326, w: 63, h: 43 }, // Salão Balão Lateral
      { roomId:  6, label: '2', cx:  97, cy: 388, w: 99, h: 118 }, // Câmara 2 — As Feras (Esquerda)
      { roomId:  7, label: '3', cx: 205, cy: 158, w: 89, h: 62 }, // Câmara 3 — Caverna dos Ursos
      { roomId:  8, label: '3a', cx: 133, cy:  87, r: 31 }, // Câmara 3a — Urso-Coruja Imenso
      { roomId:  9, label: '-', cx: 274, cy:  95, r: 30 }, // Câmara Dupla do Norte (Ninho)
      { roomId: 10, label: '-', cx: 358, cy:  74, r: 25 }, // Bifurcação Superior
      { roomId: 11, label: '-', cx: 382, cy: 213, r: 28 }, // Antecâmara do Druida (Pré-Boss)
      { roomId: 12, label: '-', cx: 439, cy:  55, r: 25 }, // Gruta Isolada do Sudeste
      { roomId: 13, label: '4', cx: 527, cy:  70, r: 45 }, // Câmara 4 — O Druida Defensor
      { roomId: 14, label: '-', cx: 560, cy: 415, r: 30 }, // Câmara do lago
    ],
  },
  roomEnemies: ALLIHANNA_ROOM_ENEMIES,
  rollEncounter: rollAllihannaEncounter,
  roomScenarios: ALLIHANNA_SCENARIOS,
};