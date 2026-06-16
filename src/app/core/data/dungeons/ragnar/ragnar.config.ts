import { RoomScenario, VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { RAGNAR_ROOM_ENEMIES, rollRagnarEncounter } from './ragnar.monsters';

const RAGNAR_SCENARIOS: Record<number, RoomScenario> = {
  // id 3 — Câmara I — Portão de Sangue
  3: {
    description: `Uma câmara baixa com paredes enegrecidas por tochas de alcatrão. Cabeças de aventureiros empaladas em estacas ao longo das paredes deixam claro qual é o passatempo favorito dos habitantes deste lugar.

Uma horda de goblins guerreiros monta guarda aqui — barulhentos, covardes e armados com azagaias enferrujadas. Sozinhos, a maioria fugiria. Juntos, com a segurança do número, atacam qualquer um que entre.

O cheiro de sangue seco e palha podre é nauseante. Ao fundo, uma passagem estreita leva mais fundo na fortaleza.`,
    choices: [
      {
        label: 'Atacar a horda de goblins',
        description: 'Entrar em combate direto. Os goblins são fracos individualmente, mas numerosos — e barulhentos o suficiente para alertar os guardas do corredor seguinte.',
        action: 'enter',
      },
      {
        label: 'Intimidar os goblins (Intimidação)',
        description: 'Tentar assustar a horda com ameaças e postura agressiva (H–2). Goblins covardes podem debanddar sem combate.',
        action: 'safe_enter',
        requiresPericia: 'intimidacao',
      },
      {
        label: 'Avançar em silêncio',
        description: 'Tentar atravessar a câmara sem despertar a atenção — difícil com tantos goblins.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Voltar pelo corredor e buscar outra rota.',
        action: 'flee',
      },
    ],
  },

  // id 4 — Câmara 2 — Salão das Batalhas
  4: {
    description: `Esta é a maior câmara da fortaleza — um salão de batalha com teto alto sustentado por pilares de pedra bruta. Estandartes rasgados de clãs vencidos decoram as paredes, troféus de conquistas passadas.

Aqui os orcs treinam e descansam entre as pilhagens. No momento da entrada, um grupo de guerreiros orcs e um berserker em pleno frenesi de treino ocupa o centro da sala. O berserker morde o próprio escudo entre golpes — está prestes a entrar em fúria real.

Uma mesa de madeira grossa ao fundo guarda restos de comida, armas quebradas e, em meio ao caos, alguns itens que podem ser saqueados após o combate.`,
    choices: [
      {
        label: 'Atacar antes que percebam',
        description: 'Aproveitar que os orcs estão treinando para obter a iniciativa — ataque surpresa na primeira rodada.',
        action: 'enter',
      },
      {
        label: 'Entrar de frente',
        description: 'Avançar abertamente para o combate. Sem vantagem, mas sem risco de falha.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Evitar este confronto e buscar outra passagem.',
        action: 'flee',
      },
    ],
  },

  // id 5 — Câmara 3 — Posto de Guarda Norte
  5: {
    description: `Um posto de guarda disciplinado — incomum para goblinóides. Um hobgoblin capitão supervisiona um pelotão de orcs guerreiros com rigor militar, marchando em patrulha pela câmara em rotas predefinidas.

O hobgoblin porta um apito de osso ao pescoço: se soprar, chamará reforços em 1d rodadas. Ele é visivelmente mais competente que o restante da horda — sua espada curta está limpa e bem afiada.

Pela janela de arrow-slit na parede leste pode-se ver o corredor que leva à Torre de Observação. Há uma alavanca na parede norte — provavelmente tranca ou destranca a grade da passagem seguinte.`,
    choices: [
      {
        label: 'Atacar o capitão primeiro',
        description: 'Priorizar o hobgoblin para evitar o apito de reforços. Táticas mais inteligentes prevalecem.',
        action: 'enter',
      },
      {
        label: 'Atacar em formação',
        description: 'Combater o grupo inteiro simultaneamente sem distinção de alvos.',
        action: 'enter',
      },
      {
        label: 'Fingir ser mercenário aliado (Enganação)',
        description: 'Tentar convencer o capitão de que são reforços enviados pelo Warchief (H–3 com Enganação).',
        action: 'safe_enter',
        requiresPericia: 'enganacao',
      },
      {
        label: 'Recuar',
        description: 'Sair antes de ser visto.',
        action: 'flee',
      },
    ],
  },

  // id 6 — Câmara 4 — Torre de Observação
  6: {
    description: `A câmara mais elevada da fortaleza, usada como ponto de observação e depósito de armas. Um ogre de batalha enorme — dois metros e meio de pura violência — usa o espaço como seu quarto pessoal, dormindo em cima de um monte de equipamentos saqueados.

Dois goblins servem de criados, assustados e silenciosos. Quando o ogre acorda para o confronto, os goblins atacam por medo de serem punidos por permitirem uma invasão.

Entre os equipamentos saqueados há armaduras, armas e itens que podem ser úteis. O ogre usa uma viga de madeira reforçada com metal como arma — cada golpe tem potência para quebrar armaduras.`,
    choices: [
      {
        label: 'Atacar o ogre dormindo',
        description: 'Tentar um ataque surpresa enquanto o ogre dorme — H–1 para conseguir. Sucesso dá uma rodada extra de ataque.',
        action: 'enter',
      },
      {
        label: 'Entrar em combate aberto',
        description: 'Acordar o ogre e enfrentá-lo de frente junto com os goblins.',
        action: 'enter',
      },
      {
        label: 'Examinar os saques (furtividade)',
        description: 'Tentar revirar o tesouro do ogre sem acordá-lo (H–2). Falha acorda o ogre imediatamente.',
        action: 'safe_enter',
        requiresPericia: 'furtividade',
      },
      {
        label: 'Recuar',
        description: 'Deixar o ogre em paz e encontrar outra rota.',
        action: 'flee',
      },
    ],
  },

  // id 8 — Câmara 3 — Cruzamento Central
  8: {
    description: `Um cruzamento de corredores no coração da fortaleza, constantemente patrulhado. Quatro direções convergem aqui, tornando este ponto inevitável para qualquer aventureiro que tente alcançar as câmaras internas.

Uma patrulha de orcs guerreiros e um berserker circula neste cruzamento em rodízio. Eles conhecem bem o terreno — usam as colunas de pedra para flanquear e os corredores para emboscadas rápidas.

Na parede leste há marcações de giz com contagens de mortos — os orcs apostam quem abaterá mais intrusos. O número atual é surpreendentemente alto.`,
    choices: [
      {
        label: 'Avançar em combate',
        description: 'Confrontar a patrulha diretamente no cruzamento.',
        action: 'enter',
      },
      {
        label: 'Emboscada pelo corredor',
        description: 'Posicionar o grupo num corredor e atrair a patrulha até lá, combatendo com flancos protegidos.',
        action: 'enter',
      },
      {
        label: 'Recuar',
        description: 'Voltar e tentar outro caminho.',
        action: 'flee',
      },
    ],
  },

  // id 10 — Câmara 1 — Arena de Duelos
  10: {
    description: `Uma arena improvisada — o chão está manchado de sangue de incontáveis duelos. Ganchos nas paredes sustentam as cabeças dos perdedores. Ragnar aprecia este lugar: combate puro, sem estratégia ou trapaça.

Um troll da guerra ocupa o centro da arena, guardado por dois orcs berserkers que servem de juízes improvisados. O troll regenera ferimentos visíveis em segundos — cortes fecham, ossos quebrados estalam de volta ao lugar. Apenas fogo ou ácido impedem essa regeneração.

A saída para o norte — câmaras do Warchief — está trancada com uma corrente de ferro grossa. A chave está pendurada no pescoço do troll.`,
    choices: [
      {
        label: 'Combater o troll e os berserkers',
        description: 'Enfrentar todos os inimigos. Lembre-se: o troll regenera sem fogo ou ácido.',
        action: 'enter',
      },
      {
        label: 'Focar no troll com fogo',
        description: 'Usar tochas, frascos de óleo ou magia de fogo para impedir a regeneração do troll enquanto os outros lidam com os berserkers.',
        action: 'enter',
      },
      {
        label: 'Desafiar para duelo (Intimidação)',
        description: 'Propor um duelo honrado ao troll — os berserkers não interferem se o duelo for aceito (H–2 com Intimidação).',
        action: 'safe_enter',
        requiresPericia: 'intimidacao',
      },
      {
        label: 'Recuar',
        description: 'Sair da arena antes que o troll perceba.',
        action: 'flee',
      },
    ],
  },

  // id 11 — Câmara 3 — Corredor Inferior
  11: {
    description: `Um corredor mais largo que os outros, com nichos nas paredes onde hobgoblins capitães ficam de sobreaviso — a última linha de defesa antes das câmaras do Warchief.

Esses hobgoblins são veteranos. Sem a covardia dos goblins ou o frenesi cego dos berserkers, combatem com táticas coordenadas: dois atacam, um recua e busca reforços, um flanqueia. Trabalham em silêncio.

Na parede há um mapa cru da fortaleza rabiscado em carvão — com isso, os aventureiros entendem melhor o layout das câmaras restantes.`,
    choices: [
      {
        label: 'Combater os hobgoblins',
        description: 'Enfrentar os veteranos em combate tático. Atenção às manobras de flanco.',
        action: 'enter',
      },
      {
        label: 'Examinar o mapa na parede',
        description: 'Estudar o mapa rabiscado antes de avançar — revela a posição exata do Warchief.',
        action: 'safe_enter',
        requiresPericia: 'investigacao',
      },
      {
        label: 'Recuar',
        description: 'Recuar e reagrupar antes do confronto final.',
        action: 'flee',
      },
    ],
  },

  // id 13 — Câmara Final — Gromthar, Warchief de Ragnar
  13: {
    description: `A câmara do trono de batalha — uma sala enorme decorada com os despojos de mil campanhas. No centro, sobre uma plataforma de ossos, o Warchief Gromthar aguarda.

Meio-ogre, meio-orc, completamente brutal. Gromthar empunha um machado de batalha encantado que zumbe baixo ao cortar o ar. Um ogre de batalha e um hobgoblin capitão flanqueiam o trono como guarda de honra.

Gromthar reconhece guerreiros dignos — não por bondade, mas por orgulho. Se o grupo chegou até aqui, ele oferece um desafio: "Derrotem meus guardas primeiro. Se sobreviverem, merecem meu machado."

No fundo da câmara brilha a luz azulada do portal para o próximo andar — inativo até que Gromthar seja vencido. A derrota do Warchief não viola nenhuma Obrigação desta masmorra: Ragnar honra a força acima de tudo.`,
    choices: [
      {
        label: 'Aceitar o desafio de Gromthar',
        description: 'Combater os guardas primeiro, depois o Warchief. Gromthar aguarda — combate honrado, sem interferência.',
        action: 'enter',
      },
      {
        label: 'Atacar Gromthar imediatamente',
        description: 'Ignorar o ritual e partir para cima do Warchief. Os guardas reagem, mas Gromthar ri do ataque direto.',
        action: 'enter',
      },
      {
        label: 'Recuar e preparar',
        description: 'Sair da câmara e reagrupar antes do confronto final.',
        action: 'flee',
      },
    ],
  },
};

export const RagnarConfig: DungeonConfig = {
  floorNumber: 2,
  theme: VALKARIA_FLOORS[1],

  layout: {
    floorNumber: 2,
    rooms: [
      //
      // Salas sem número no mapa = type:'empty' (corredor) → encontro aleatório via rollEncounter
      // Salas numeradas = type:'monster'/'boss' → cenário fixo do manual
      // secretConnections = passagem 'S' (porta secreta): só visível com Investigação/Crime/Sentidos
      //
      { id:  0, row: 0, col: 3, type: 'entrance', name: 'Portal do Andar 1',                 connections: [1, 2] },
      { id:  1, row: 1, col: 2, type: 'empty',    name: 'Corredor Norte',                    connections: [0, 4, 8] },
      { id:  2, row: 1, col: 4, type: 'empty',    name: 'Corredor Nordeste',                 connections: [0, 6] },
      { id:  3, row: 3, col: 0, type: 'monster',  name: 'Câmara I — Portão de Sangue',       connections: [9] },
      { id:  4, row: 2, col: 2, type: 'monster',  name: 'Câmara 2 — Salão das Batalhas',    connections: [1, 8, 9],
        secretConnections: [3] },  // S duplo: corredor oculto entre Sala 2 e Câmara I
      { id:  5, row: 2, col: 5, type: 'monster',  name: 'Câmara 3 — Posto de Guarda Norte', connections: [2, 6] },
      { id:  6, row: 1, col: 6, type: 'monster',  name: 'Câmara 4 — Torre de Observação',  connections: [2, 5] },
      { id:  7, row: 2, col: 3, type: 'empty',    name: 'Corredor Central',                  connections: [1, 4, 8] },
      { id:  8, row: 3, col: 2, type: 'monster',  name: 'Câmara 3 — Cruzamento Central',    connections: [3, 4, 7, 9],
        secretConnections: [10] }, // S simples: porta secreta entre cruzamento e Arena
      { id:  9, row: 4, col: 1, type: 'empty',    name: 'Corredor Inferior Oeste',           connections: [3, 8, 10] },
      { id: 10, row: 4, col: 3, type: 'monster',  name: 'Câmara 1 — Arena de Duelos',       connections: [9, 11, 12] },
      { id: 11, row: 5, col: 2, type: 'monster',  name: 'Câmara 3 — Corredor Inferior',     connections: [10, 13] },
      { id: 12, row: 5, col: 4, type: 'empty',    name: 'Corredor Sul',                      connections: [10, 13] },
      { id: 13, row: 6, col: 3, type: 'boss',     name: 'Câmara Final — Warchief Gromthar', connections: [11, 12] },
    ],
  },

  imageMap: {
    url: 'assets/maps/images/2 ragnar.png',
    viewBox: '0 0 712 712',
    hotspots: [
      { roomId:  0, label: 'Entrada', cx: 355, cy:  28, w:  55, h: 48 }, // Portal do Andar 1
      { roomId:  1, label: '-',       cx: 245, cy: 110, r:  22 },         // Corredor Norte
      { roomId:  2, label: '-',       cx: 455, cy: 110, r:  22 },         // Corredor Nordeste
      { roomId:  3, label: 'I',       cx:  90, cy: 440, w:  70, h: 55 }, // Câmara I — Portão de Sangue
      { roomId:  4, label: '2',       cx: 238, cy: 173, r:  75 },         // Câmara 2 — Salão das Batalhas
      { roomId:  5, label: '3',       cx: 555, cy: 233, r:  33 },         // Câmara 3 — Posto de Guarda Norte
      { roomId:  6, label: '4',       cx: 622, cy: 145, w:  75, h: 58 }, // Câmara 4 — Torre de Observação
      { roomId:  7, label: '-',       cx: 355, cy: 270, r:  22 },         // Corredor Central
      { roomId:  8, label: '3',       cx: 345, cy: 300, r:  30 },         // Câmara 3 — Cruzamento Central
      { roomId:  9, label: '-',       cx: 160, cy: 390, r:  22 },         // Corredor Inferior Oeste
      { roomId: 10, label: '1',       cx: 440, cy: 450, w:  95, h: 80 }, // Câmara 1 — Arena de Duelos
      { roomId: 11, label: '3',       cx: 385, cy: 510, r:  28 },         // Câmara 3 — Corredor Inferior
      { roomId: 12, label: '-',       cx: 500, cy: 560, r:  22 },         // Corredor Sul
      { roomId: 13, label: 'Boss',    cx: 440, cy: 635, w:  90, h: 65 }, // Câmara Final — Warchief Gromthar
    ],
  },

  roomEnemies: RAGNAR_ROOM_ENEMIES,
  rollEncounter: rollRagnarEncounter,
  roomScenarios: RAGNAR_SCENARIOS,
};
