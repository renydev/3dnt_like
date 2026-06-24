import { RoomScenario, VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { ALLIHANNA_ROOM_ENEMIES, rollAllihannaEncounter } from './allihanna.monsters';

const ALLIHANNA_SCENARIOS: Record<number, RoomScenario> = {
  // Câmara I — O Lago
  0: {
    description: `O cheiro de água atinge os aventureiros muito antes que cheguem a esta clareira, ocupada quase inteiramente por um lago — que precisa ser atravessado para que se possa alcançar a trilha no lado oposto. O lago é abastecido por um rio que passa através das árvores; seguir o rio apenas leva de volta à mesma clareira.

O lago é raso; mesmo um halfling pode atravessar com água pela cintura sem testes de Natação. No entanto, uma manada de elefantes (3d+2, sendo 1d+2 filhotes) está na margem oposta, bebendo, banhando-se e cuidando dos filhotes. Estas criaturas se assustam facilmente com invasores e tornam-se hostis caso qualquer criatura entre no lago.

Em caso de combate, os filhotes fogem para fora da clareira enquanto os adultos lutam até a morte para proteger sua fuga. Apenas quando os filhotes estão seguros os adultos começam a recuar.`,
    choices: [
      {
        label: 'Acalmar os elefantes (Animais)',
        description: 'Usar Perícia Animais (H–3) para acalmar a manada e atravessar sem incidentes. A alta dificuldade se deve à presença dos filhotes e ao fato de os elefantes não terem por onde fugir.',
        action: 'safe_enter',
        requiresPericia: 'animais',
      },
      {
        label: 'Entrar no lago',
        description: 'Entrar na água e tentar atravessar — os elefantes ficam agitados e partem para o ataque.',
        action: 'enter',
      },
      {
        label: 'Atacar os elefantes',
        description: 'Partir para o combate diretamente antes de entrar no lago.',
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

  // Câmara 2 — As Feras Assassinas (sala central)
  3: {
    description: `Nesta clareira o sol brilha mais que nas demais. Não há árvores, apenas grama alta, como se o lugar fosse um pedaço de planície no meio da selva. Essa vegetação possibilita às criaturas aqui escondidas emboscar suas presas.

A clareira é habitada por assassinos da savana — criaturas semelhantes a grandes onças-pintadas, mas com quatro pares de patas. São animais muito velozes e ágeis, capazes de atacar simultaneamente com quatro garras e uma mordida.

Ao entrar na clareira os aventureiros devem ter sucesso em testes de H–2 (ou apenas Habilidade com Visão Aguçada) para notar os assassinos. Caso todos falhem, as feras recebem uma rodada de ataque gratuita durante a qual os aventureiros estarão Surpresos.`,
    choices: [
      {
        label: 'Avançar com cautela',
        description: 'Cruzar a clareira devagar, olhando para os lados — chance de perceber os assassinos antes que ataquem.',
        action: 'enter',
      },
      {
        label: 'Correr pela clareira',
        description: 'Atravessar rapidamente sem se preocupar com o que está na grama. Risco alto de emboscada.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Voltar pela trilha e tentar outra rota.',
        action: 'flee',
      },
    ],
  },

  // Câmara 2 — As Feras Assassinas (sala oeste)
  6: {
    description: `Outra clareira aberta, novamente sem árvores — apenas grama alta ondulando sem vento. A sensação de ser observado é imediata.

Assassinos da savana espreitam entre as hastes. Suas quatro patas os tornam invisíveis na vegetação até o momento do bote. Ao entrar, os aventureiros devem ter sucesso em testes de H–2 para notar as feras; caso todos falhem, a primeira rodada é de ataque gratuito com os heróis Surpresos.`,
    choices: [
      {
        label: 'Avançar com cautela',
        description: 'Mover-se devagar inspecionando a grama — chance de perceber os predadores antes do ataque.',
        action: 'enter',
      },
      {
        label: 'Correr pela clareira',
        description: 'Atravessar a toda velocidade — maior chance de emboscada.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Voltar e procurar outro caminho.',
        action: 'flee',
      },
    ],
  },

  // Câmara 3 — Caverna dos Ursos
  7: {
    description: `Nesta pequena clareira há duas trilhas e uma entrada escura para uma caverna. Do interior ecoa um pio gutural grave — algo vivo e territorial aguarda lá dentro.

A caverna desce até uma vasta câmara subterrânea que serve de moradia para uma matilha de ursos-coruja. São criaturas extremamente territoriais e agressivas que atacam qualquer um que entre em seu esconderijo. Normalmente não podem ser atraídos para fora e só perseguem inimigos até os limites da clareira.

Além desta câmara existe uma passagem que leva a um ninho mais profundo — mas os ursos-coruja não se aventuram até lá.`,
    choices: [
      {
        label: 'Entrar na caverna',
        description: 'Adentrar o esconderijo dos ursos-coruja e enfrentá-los no território deles.',
        action: 'enter',
      },
      {
        label: 'Tentar atrair os ursos para fora',
        description: 'Fazer barulho ou jogar comida na entrada para atrair as feras à clareira antes de combater.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Não entrar na caverna e buscar outro caminho pela clareira.',
        action: 'flee',
      },
    ],
  },

  // Câmara 3a — Urso-Coruja Imenso
  8: {
    description: `A câmara mais profunda da caverna é o ninho e esconderijo de um urso-coruja imenso — talvez o maior que qualquer outro existente em Arton. A escuridão aqui é quase total; o cheiro de musgo e penas velhas é sufocante.

Confrontado por intrusos, o monstro luta até a morte. No entanto, as Obrigações e Restrições do desafio de Allihanna exigem que os heróis passem por ele sem o matar — apenas assim receberão a recompensa extra da deusa.

No fundo da câmara há um túnel secreto estreito que leva diretamente à saída. Personagens de tamanho humano ou menor passam sem testes. Os ursos-coruja não entram neste túnel e não perseguem personagens até ali.`,
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
        label: 'Recuar para a câmara dos ursos',
        description: 'Sair do ninho e voltar pelo caminho que vieram.',
        action: 'flee',
      },
    ],
  },

  // Câmara 4 — Tesouro (Gruta Isolada)
  12: {
    description: `Uma gruta isolada e silenciosa, escondida entre as pedras. Nenhuma criatura parece ter passado por aqui recentemente — mas alguém deixou algo de valor para trás.

Entre raízes e musgo você encontra um pequeno esconderijo com mantimentos e equipamentos de aventureiro.`,
    choices: [
      {
        label: 'Examinar o esconderijo',
        description: 'Investigar o conteúdo da gruta e pegar o que for útil.',
        action: 'enter',
      },
      {
        label: 'Ignorar e seguir em frente',
        description: 'Não vale o risco de perder tempo aqui.',
        action: 'flee',
      },
    ],
  },

  // Câmara 4 — O Druida Defensor (boss)
  13: {
    description: `Esta clareira marca o fim da masmorra. É relativamente ampla, com árvores e arbustos esparsos, cercada por dólmens — monumentos druídicos formados por uma pedra achatada deitada sobre duas pedras verticais. Os dólmens formam um semicírculo no lado oposto à trilha de entrada.

Sob um dos dólmens, ao fundo, brilha uma luz azulada: o círculo místico que ativa o portal para a próxima masmorra. Está desativado — o Guardião ainda não foi vencido.

Fallandi, meio humano e meio dríade, designado por Allihanna como seu defensor, aguarda na clareira acompanhado por um leão maior que o normal e por um urso feito de matéria vegetal (criado pela magia Criatura Mágica). Ele argumenta que a Deusa da Ambição não poderá ser salva por heróis fracos detidos neste primeiro desafio.

Personagens com Lábia ou Manipulação podem tentar um teste de H–3 para convencê-lo a propor um duelo individual não-letal (dano por Contusão). Se Fallandi perder o duelo, reconhece os heróis como dignos e libera a passagem. Se detectar que as Obrigações e Restrições foram violadas, recusa qualquer diálogo e ataca imediatamente.`,
    choices: [
      {
        label: 'Combater Fallandi e seus companheiros',
        description: 'Lutar contra o druida, o leão e o urso vegetal. Destruí-los não viola as Obrigações e Restrições.',
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

export const AllihannaConfig: DungeonConfig = {
  floorNumber: 1,
  theme: VALKARIA_FLOORS[0],

  layout: {
    floorNumber: 1,
    rooms: [
      { id:  0, row: 0, col: 2, type: 'entrance', name: 'Entrada Principal', connections: [1, 2, 3, 4] },
      { id:  1, row: 1, col: 0, type: 'monster', name: 'Covil dos Monstros', connections: [0, 5, 6] },
      { id:  2, row: 1, col: 1, type: 'monster', name: 'Salão das Bestas', connections: [0, 5] },
      { id:  3, row: 1, col: 2, type: 'treasure', name: 'Câmara do Ouro', connections: [0, 6, 7] },
      { id:  4, row: 1, col: 3, type: 'treasure', name: 'Câmara do Tesouro', connections: [0, 9, 8] },
      { id:  5, row: 2, col: 0, type: 'monster', name: 'Câmara dos Guardas', connections: [1, 2, 10] },
      { id:  6, row: 2, col: 1, type: 'trap', name: 'Corredor Armado', connections: [1, 3, 11] },
      { id:  7, row: 2, col: 2, type: 'trap', name: 'Câmara Maldita', connections: [3, 12] },
      { id:  8, row: 2, col: 3, type: 'monster', name: 'Câmara Infestada', connections: [4, 14, 12] },
      { id:  9, row: 2, col: 4, type: 'monster', name: 'Passagem Perigosa', connections: [4, 13, 14] },
      { id: 10, row: 3, col: 0, type: 'monster', name: 'Câmara dos Guardas', connections: [5, 16] },
      { id: 11, row: 3, col: 1, type: 'trap', name: 'Sala das Armadilhas', connections: [6, 15] },
      { id: 12, row: 3, col: 2, type: 'monster', name: 'Salão das Bestas', connections: [7, 8, 15] },
      { id: 13, row: 3, col: 3, type: 'puzzle', name: 'Câmara dos Mistérios', connections: [9, 15] },
      { id: 14, row: 3, col: 4, type: 'trap', name: 'Sala das Armadilhas', connections: [8, 9, 16] },
      { id: 15, row: 4, col: 1, type: 'social', name: 'Os Sobreviventes', connections: [11, 12, 13, 18, 17] },
      { id: 16, row: 4, col: 3, type: 'social', name: 'O Comerciante Misterioso', connections: [10, 14, 19] },
      { id: 17, row: 5, col: 0, type: 'rest', name: 'Fogueira Sagrada', connections: [15, 21] },
      { id: 18, row: 5, col: 2, type: 'monster', name: 'Câmara Infestada', connections: [15, 20] },
      { id: 19, row: 5, col: 4, type: 'monster', name: 'Passagem Perigosa', connections: [16, 20, 21] },
      { id: 20, row: 6, col: 3, type: 'monster', name: 'Câmara dos Guardas', connections: [18, 19, 22] },
      { id: 21, row: 6, col: 1, type: 'trap', name: 'Corredor Armado', connections: [17, 19, 22] },
      { id: 22, row: 7, col: 2, type: 'puzzle', name: 'Câmara dos Mistérios', connections: [20, 21, 23] },
      { id: 23, row: 8, col: 2, type: 'boss', name: 'Câmara do Guardião Final', connections: [22] },
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
      { roomId: 11, label: '-', cx: 461, cy: 225, r: 28 }, // Antecâmara do Druida (Pré-Boss)
      { roomId: 12, label: '-', cx: 439, cy:  55, r: 25 }, // Gruta Isolada do Sudeste
      { roomId: 13, label: '4', cx: 527, cy:  70, r: 45 }, // Câmara 4 — O Druida Defensor
      { roomId: 14, label: '-', cx: 560, cy: 415, r: 30 }, // Câmara do lago
    ],
  },
  roomEnemies: ALLIHANNA_ROOM_ENEMIES,
  rollEncounter: rollAllihannaEncounter,
  roomScenarios: ALLIHANNA_SCENARIOS,
};

