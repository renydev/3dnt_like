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
      { id: 0, row: 3, col: 4, type: 'entrance', name: 'Portal de Entrada',              connections: [1] },
      { id: 1, row: 3, col: 2, type: 'monster',  name: 'Câmara I — O Lago',              connections: [0, 2, 3] },
      { id: 2, row: 2, col: 0, type: 'monster',  name: 'Câmara 2 — As Feras Assassinas', connections: [1, 4] },
      { id: 3, row: 2, col: 3, type: 'monster',  name: 'Câmara 2 — As Feras Assassinas', connections: [1, 4] },
      { id: 4, row: 1, col: 1, type: 'monster',  name: 'Câmara 3 — Caverna dos Ursos',   connections: [2, 3, 5, 6] },
      { id: 5, row: 0, col: 0, type: 'monster',  name: 'Câmara 3a — Urso-Coruja Imenso', connections: [4] },
      { id: 6, row: 0, col: 3, type: 'boss',     name: 'Câmara 4 — O Druida Defensor',   connections: [4] },
    ],
  },

  imageMap: {
    url: 'assets/maps/images/1 allihanna.png',
    viewBox: '0 0 712 615',
    hotspots: [
      { roomId: 0, label: '1',  cx: 579, cy: 456, r: 26 },
      { roomId: 1, label: 'I',  cx: 375, cy: 480, r: 57 },
      { roomId: 2, label: '2',  cx:  95, cy: 323, r: 59 },
      { roomId: 3, label: '2',  cx: 477, cy: 261, r: 43 },
      { roomId: 4, label: '3',  cx: 235, cy: 152, r: 50 },
      { roomId: 5, label: '3a', cx: 135, cy:  68, r: 31 },
      { roomId: 6, label: '4',  cx: 527, cy:  70, r: 45 },
    ],
  },

  roomEnemies: ALLIHANNA_ROOM_ENEMIES,
  rollEncounter: rollAllihannaEncounter,
  roomScenarios: ALLIHANNA_SCENARIOS,
};
