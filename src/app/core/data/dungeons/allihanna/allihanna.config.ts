import { RoomScenario, VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { ALLIHANNA_ROOM_ENEMIES, rollAllihannaEncounter } from './allihanna.monsters';

const ALLIHANNA_SCENARIOS: Record<number, RoomScenario> = {
  // Cela dos Cativos (id 7, fileira 3 — pico) — resgate de refém.
  7: {
    description: `Gritos sufocados vêm de uma toca entre as raízes. Uma matilha de lobos-das-cavernas cerca um viajante amarrado contra uma pedra — capturado vivo, talvez como isca ou diversão para a matilha.

O viajante ainda respira, mas não vai durar muito se os lobos decidirem atacar antes de qualquer resgate.`,
    choices: [
      {
        label: 'Atacar a matilha',
        description: 'Lutar contra os lobos para libertar o cativo. Vencer liberta o refém, que se junta à aventura.',
        action: 'enter',
      },
      {
        label: 'Ignorar e seguir em frente',
        description: 'Não vale o risco — deixar o cativo à própria sorte.',
        action: 'flee',
      },
    ],
  },

  // O Lago (id 10, fileira 4 — arriscado) — manada de elefantes.
  10: {
    description: `O cheiro de água atinge os aventureiros muito antes que cheguem a esta clareira, ocupada quase inteiramente por um lago — que precisa ser atravessado para que se possa alcançar a trilha no lado oposto.

O lago é raso; mesmo um halfling pode atravessar com água pela cintura sem testes de Natação. No entanto, uma manada de elefantes (3d+2, sendo 1d+2 filhotes) está na margem oposta, bebendo, banhando-se e cuidando dos filhotes. Estas criaturas se assustam facilmente com invasores e tornam-se hostis caso qualquer criatura entre no lago.`,
    choices: [
      {
        label: 'Acalmar os elefantes (Animais)',
        description: 'Usar Perícia Animais (H–3) para acalmar a manada e atravessar sem incidentes.',
        action: 'safe_enter',
        requiresPericia: 'animais',
      },
      {
        label: 'Entrar no lago',
        description: 'Entrar na água e tentar atravessar — os elefantes ficam agitados e partem para o ataque.',
        action: 'enter',
      },
      {
        label: 'Esperar e observar',
        description: 'Aguardar pacientemente na margem. Após algum tempo a manada se afasta e a travessia fica livre.',
        action: 'rest_wait',
      },
      {
        label: 'Recuar',
        description: 'Voltar pela trilha e buscar outro caminho.',
        action: 'flee',
      },
    ],
  },

  // Ninho do Urso-Coruja Imenso (id 13, fileira 5 — a única trilha mortal do andar).
  13: {
    description: `A câmara mais profunda da caverna é o ninho e esconderijo de um urso-coruja imenso — talvez o maior que qualquer outro existente em Arton. A escuridão aqui é quase total; o cheiro de musgo e penas velhas é sufocante.

Confrontado por intrusos, o monstro luta até a morte. No entanto, as Obrigações e Restrições do desafio de Allihanna exigem que os heróis passem por ele sem o matar — apenas assim receberão a recompensa extra da deusa.

No fundo da câmara há um túnel secreto estreito que leva diretamente à saída. Os ursos-coruja não entram neste túnel e não perseguem personagens até ali.`,
    choices: [
      {
        label: 'Combater o urso-coruja imenso',
        description: 'Lutar contra o guardião do ninho. Vitória abre o caminho — mas viola as Obrigações e Restrições.',
        action: 'enter',
      },
      {
        label: 'Desviar pelo túnel secreto',
        description: 'Procurar e usar a passagem estreita no fundo da câmara para escapar sem matar o monstro. Cumpre as Obrigações e Restrições.',
        action: 'safe_enter',
      },
      {
        label: 'Recuar',
        description: 'Sair do ninho e voltar pelo caminho que vieram.',
        action: 'flee',
      },
    ],
  },

  // Câmara do Guardião Final (id 15, chefe).
  15: {
    description: `Esta clareira marca o fim da masmorra. Dólmens druídicos formam um semicírculo no lado oposto à trilha de entrada — sob um deles brilha o círculo místico que ativa o portal para a próxima masmorra. Está desativado: o Guardião ainda não foi vencido.

Fallandi, meio humano e meio dríade, designado por Allihanna como seu defensor, aguarda na clareira acompanhado por um leão maior que o normal e por um urso feito de matéria vegetal.

Personagens com Lábia ou Manipulação podem tentar um teste de H–3 para convencê-lo a propor um duelo individual não-letal.`,
    choices: [
      {
        label: 'Combater Fallandi e seus companheiros',
        description: 'Lutar contra o druida, o leão e o urso vegetal.',
        action: 'enter',
      },
      {
        label: 'Propor diálogo (Lábia/Manipulação)',
        description: 'Tentar convencer Fallandi a aceitar um duelo individual não-letal (H–3). Requer Lábia ou Manipulação.',
        action: 'safe_enter',
        requiresPericia: 'labia',
      },
      {
        label: 'Recuar',
        description: 'Sair da clareira e reagrupar antes de enfrentar o guardião.',
        action: 'flee',
      },
    ],
  },
};

// ── Layout em losango compacto ────────────────────────────────────────────────
// Trilhas por fileira: entrada(1) -> 2 -> 3 -> 4 -> 3 -> 2 -> chefe(1) — 16 salas.
// Veredito por fileira (ver relatório de balanceamento, debug panel):
//   fileira 1 (2 trilhas): -1, +1   — 1 monstro trivial
//   fileira 2 (3 trilhas): -2,0,+2  — 1 monstro trivial
//   fileira 3 (4 trilhas): -3,-1,+1,+3 — 1 monstro equilibrado + 1 resgate de refém
//                                        (refém só nos andares "a cada 5": 1, 6, 11, 16)
//   fileira 4 (3 trilhas): -2,0,+2  — 1 monstro arriscado (O Lago — elefantes)
//   fileira 5 (2 trilhas): -1,+1    — 1 monstro mortal (Urso-Coruja Imenso)
//   chefe (1 trilha): 0
export const AllihannaConfig: DungeonConfig = {
  floorNumber: 1,
  theme: VALKARIA_FLOORS[0],

  layout: {
    floorNumber: 1,
    rooms: [
      { id: 0, row: 0, col: 0, type: 'entrance', name: 'Entrada Principal', connections: [1, 2] },

      // Fileira 1 — trivial
      { id: 1, row: 1, col: -1, type: 'monster', name: 'Trilha da Dríade', connections: [0, 3] },
      { id: 2, row: 1, col: 1, type: 'trap', name: 'Corredor Armado', connections: [0, 4] },

      // Fileira 2 — trivial
      { id: 3, row: 2, col: -2, type: 'monster', name: 'Covil dos Lobos', connections: [1, 6] },
      { id: 4, row: 2, col: 0, type: 'treasure', name: 'Câmara do Ouro', connections: [2, 5] },
      { id: 5, row: 2, col: 2, type: 'trap', name: 'Sala das Armadilhas', connections: [4, 9] },

      // Fileira 3 (pico) — equilibrado + resgate de refém
      { id: 6, row: 3, col: -3, type: 'monster', name: 'Caverna dos Ursos', connections: [3, 7] },
      { id: 7, row: 3, col: -1, type: 'hostage', name: 'Cela dos Cativos', connections: [6, 10] },
      { id: 8, row: 3, col: 1, type: 'treasure', name: 'Câmara do Tesouro', connections: [9, 12] },
      { id: 9, row: 3, col: 3, type: 'puzzle', name: 'Câmara dos Mistérios', connections: [5, 8] },

      // Fileira 4 — arriscado
      { id: 10, row: 4, col: -2, type: 'monster', name: 'O Lago', connections: [7, 13] },
      { id: 11, row: 4, col: 0, type: 'merchant', name: 'O Comerciante Misterioso', connections: [12, 14] },
      { id: 12, row: 4, col: 2, type: 'social', name: 'Os Sobreviventes', connections: [8, 11] },

      // Fileira 5 — 1 trilha mortal
      { id: 13, row: 5, col: -1, type: 'monster', name: 'Ninho do Urso-Coruja Imenso', connections: [10, 15] },
      { id: 14, row: 5, col: 1, type: 'rest', name: 'Fogueira Final', connections: [11, 15] },

      // Chefe
      { id: 15, row: 6, col: 0, type: 'boss', name: 'Câmara do Guardião Final', connections: [13, 14] },
    ],
  },
  roomEnemies: ALLIHANNA_ROOM_ENEMIES,
  rollEncounter: rollAllihannaEncounter,
  roomScenarios: ALLIHANNA_SCENARIOS,
};
