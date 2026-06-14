export type RoomType = 'entrance' | 'monster' | 'trap' | 'treasure' | 'rest' | 'boss' | 'empty' | 'puzzle' | 'social';

export type RoomChoiceAction = 'enter' | 'flee' | 'safe_enter' | 'rest_wait';

export interface RoomChoice {
  label: string;
  description?: string;
  action: RoomChoiceAction;
  requiresPericia?: string; // ID da perícia exigida (oculta se party não tiver)
}

export interface RoomScenario {
  description: string;
  choices: RoomChoice[];
}

export interface DungeonRoom {
  id: number;
  type: RoomType;
  name: string;
  description: string;
  cleared: boolean;
  locked: boolean;
  connections: number[];
  col: number;
  row: number;
  isCurrent?: boolean;
  isVisible?: boolean;
  entered?: boolean;
  scenario?: RoomScenario;
}

export interface MapHotspot {
  roomId: number;
  label: string;
  cx: number;
  cy: number;
  r: number;
}

export interface ImageMapConfig {
  url: string;
  viewBox: string;
  hotspots: MapHotspot[];
}

export interface DungeonFloor {
  floorNumber: number;
  theme: DungeonTheme;
  rooms: DungeonRoom[];
  totalRooms: number;
  bossRoom: number;
  imageMap?: ImageMapConfig;
}

export interface DungeonTheme {
  id: string;
  floorNumber: number;           // 1-20
  godName: string;               // Nome do deus
  godDomain: string;             // Domínio/título
  godAlignment: 'bem' | 'neutro' | 'mal' | 'caos';
  name: string;                  // Nome da masmorra
  description: string;           // Descrição temática
  guardianName: string;          // Nome do guardião final
  guardianDesc: string;          // Descrição do guardião
  specialRule: string;           // Regra especial da masmorra
  icon: string;
  palette: string;
  monsterTypes: string[];
  trapTypes: string[];
  treasureTypes: string[];
  challengeType: 'combat' | 'stealth' | 'social' | 'puzzle' | 'survival' | 'darkness' | 'mixed';
  flavorTexts: string[];
}

// Os 20 Desafios — baseados em "A Libertação de Valkaria" (Jambô, 2004)
export const VALKARIA_FLOORS: DungeonTheme[] = [
  {
    id: 'allihanna',
    floorNumber: 1,
    godName: 'Allihanna',
    godDomain: 'Deusa da Natureza e das Feras',
    godAlignment: 'neutro',
    name: 'Masmorra de Allihanna',
    description: 'Uma floresta selvagem com clareiras interligadas por trilhas. Animais de grande porte protegem cada câmara — elefantes no lago, assassinos da savana nas clareiras abertas e ursos-coruja nas cavernas.',
    guardianName: 'Fallandi',
    guardianDesc: 'Meio humano, meio dríade — designado por Allihanna como seu defensor. Acompanhado por um leão e um urso vegetal, luta com todas as forças. Pode propor duelo individual a aventureiros com Lábia (H–3).',
    specialRule: 'Obrigações e Restrições: não destruir o urso-coruja imenso (câmara 3a) para receber a recompensa extra. Fallandi detecta automaticamente violações.',
    icon: '🌿',
    palette: 'forest',
    challengeType: 'combat',
    monsterTypes: ['Elefante', 'Assassino da Savana', 'Urso-Coruja', 'Urso-Coruja Imenso'],
    trapTypes: ['Emboscada na grama alta (surpresa automática se falhar em H–2)', 'Filhotes de elefante provocando a manada'],
    treasureTypes: ['Anel de Proteção (FD+1)', 'Vestimenta de Druida', 'Itens de Cura Menor', 'Pergaminhos de Paralisia'],
    flavorTexts: [
      'O cheiro de água atinge os aventureiros muito antes de chegarem à clareira do lago.',
      'A grama alta da clareira se move levemente — mas não há vento.',
      'Do fundo da caverna ecoa um pio grave e gutural. Algo muito grande está acordado lá dentro.',
      'Dólmens formam um semicírculo ao fundo da clareira. Sob um deles brilha uma luz azulada.'
    ]
  },
  {
    id: 'ragnar',
    floorNumber: 2,
    godName: 'Ragnar',
    godDomain: 'Deus da Guerra e das Batalhas',
    godAlignment: 'neutro',
    name: 'Fortaleza Bárbara de Ragnar',
    description: 'Hordas de goblinóides, orcs e ogres infestam esta masmorra. Um campo de batalha perpétuo em honra ao Deus da Guerra.',
    guardianName: 'Warchief Gromthar',
    guardianDesc: 'Meio-ogre guerreiro, F6 H3 R5 A4. Empunha um machado de batalha encantado.',
    specialRule: 'Os inimigos vêm em grupos grandes (3d6 goblins, 2d4 orcs). Nunca estão sozinhos.',
    icon: '⚔️',
    palette: 'battle',
    challengeType: 'combat',
    monsterTypes: ['Goblin Guerreiro', 'Orc Berserker', 'Ogre de Batalha', 'Hobgoblin Capitão', 'Troll da Guerra'],
    trapTypes: ['Canhão Improvisado', 'Campo Minado com Estacas', 'Portão Guilhotina'],
    treasureTypes: ['Arma Orcish +1', 'Escudo de Batalha', 'Troféu de Guerra'],
    flavorTexts: [
      'O barulho de tambores de guerra nunca para. Os goblinóides marcham em formação.',
      'Cabeças de aventureiros menos sortudos decoram as paredes.',
      'O cheiro de sangue e fumaça de tocha é constante. Ragnar aprova.'
    ]
  },
  {
    id: 'glorienn',
    floorNumber: 3,
    godName: 'Glórienn',
    godDomain: 'Deusa dos Elfos e da Magia',
    godAlignment: 'bem',
    name: 'Labirinto Élfigo de Glórienn',
    description: 'Arqueiros, magos e rangers élficos de elite defendem este labirinto de beleza e morte. A precisão élfica é mortal.',
    guardianName: 'Arqueiro Arcano Élfico',
    guardianDesc: 'Elfo de alto nível combinando magia e arco. H6 F2, conjura e atira simultaneamente.',
    specialRule: 'Inimigos atacam de longe e fogem do combate corpo a corpo. Perseguição é difícil.',
    icon: '🏹',
    palette: 'elven',
    challengeType: 'mixed',
    monsterTypes: ['Arqueiro Élfico de Elite', 'Mago Élfico', 'Ranger das Sombras', 'Druida Élfico', 'Centauro Guardião'],
    trapTypes: ['Runa Élfica Explosiva', 'Rede de Vento', 'Flechas Automáticas'],
    treasureTypes: ['Arco Longo Élfigo', 'Grimório Arcano', 'Capa de Invisibilidade'],
    flavorTexts: [
      'A masmorra exibe uma beleza perturbadora: paredes de mármore branco entalhadas com runas.',
      'Você ouve o silvo de uma flecha antes mesmo de ver o arqueiro.',
      'Glórienn valoriza a perfeição. Seus defensores miram dois vezes, atiram uma.'
    ]
  },
  {
    id: 'lena',
    floorNumber: 4,
    godName: 'Lena',
    godDomain: 'Deusa da Morte e do Destino',
    godAlignment: 'neutro',
    name: 'Câmaras do Além de Lena',
    description: 'As criaturas desta masmorra não sofrem dano por ataques e magias normais. Apenas estratégias especiais podem vencê-las.',
    guardianName: 'A Ceifadora',
    guardianDesc: 'Avatar da morte com imunidade a dano físico. Só pode ser derrotada por magia sagrada ou enigma.',
    specialRule: '⚠️ ESPECIAL: Criaturas imunes a dano normal. Requer magia especial, itens sagrados ou persuasão.',
    icon: '💀',
    palette: 'death',
    challengeType: 'puzzle',
    monsterTypes: ['Espectro Eterno', 'Banshee da Morte', 'Fantasma Anciã', 'Liche Menor', 'Sombra Vivente'],
    trapTypes: ['Toque da Morte Instantânea', 'Drenagem de Vida', 'Maldição do Envelhecimento'],
    treasureTypes: ['Amuleto Anti-Morte', 'Água Benta Concentrada', 'Símbolo Sagrado de Khalmyr'],
    flavorTexts: [
      'Sua espada atravessa o inimigo sem causar dano. A criatura ri de você.',
      'Sussurros dos mortos ecoam: "Você já pertence a Lena."',
      'O destino de todos leva a este lugar. Poucos retornam.'
    ]
  },
  {
    id: 'hyninn',
    floorNumber: 5,
    godName: 'Hyninn',
    godDomain: 'Deus dos Ladrões e da Esperteza',
    godAlignment: 'neutro',
    name: 'Covil das Armadilhas de Hyninn',
    description: 'Quase sem monstros, mas infestada de armadilhas mortais. Algumas criaturas camufladas aguardam os incautos.',
    guardianName: 'O Mestre das Ilusões',
    guardianDesc: 'Ladrão mestre, H6 F2. Invisível, repleto de armadilhas pessoais, foge e retorna.',
    specialRule: '⚠️ ESPECIAL: Toda sala tem 70% de chance de armadilha oculta. Teste H-2 para detectar.',
    icon: '🗡️',
    palette: 'rogue',
    challengeType: 'stealth',
    monsterTypes: ['Assassino Sombrio', 'Construto-Armadilha', 'Imitador (Mimic)', 'Ilusão Guardiã'],
    trapTypes: ['Dardos Envenenados', 'Lâminas Giratórias', 'Poço Sem Fundo', 'Chão Falso', 'Câmara de Gás', 'Raio Mágico Automático'],
    treasureTypes: ['Ferramentas de Ladrão +2', 'Botas do Silêncio', 'Anel de Detecção'],
    flavorTexts: [
      'O corredor parece seguro demais. É exatamente por isso que não é.',
      'Hyninn ri de aventureiros confiantes. A risada ecoa nestes túneis há séculos.',
      'Cada passo pode ser o último. Seja lento. Seja esperto.'
    ]
  },
  {
    id: 'marah',
    floorNumber: 6,
    godName: 'Marah',
    godDomain: 'Deusa do Amor e da Cura',
    godAlignment: 'bem',
    name: 'Jardins Encantados de Marah',
    description: 'Fadas, ninfas e clérigas de Marah. Esta masmorra não pode ser vencida pela simples violência — o amor e a diplomacia são a chave.',
    guardianName: 'Ninfa Rainha Aelindra',
    guardianDesc: 'Não pode ser combatida. Deve ser convencida por palavras, presentes ou atos de bondade.',
    specialRule: '⚠️ ESPECIAL: Atacar criaturas desta masmorra faz o portal nunca abrir. Use diplomacia e presentes.',
    icon: '🌸',
    palette: 'love',
    challengeType: 'social',
    monsterTypes: ['Ninfa Guardiã', 'Fada Mensageira', 'Clérigo de Marah', 'Pixie Travessa'],
    trapTypes: ['Encantamento de Amor', 'Sono Mágico', 'Confusão Emocional'],
    treasureTypes: ['Rosa Eterna', 'Poção de Charme', 'Amuleto de Cura'],
    flavorTexts: [
      'O ar cheira a rosas e mel. As criaturas aqui sorriam — até você aparecer armado.',
      'Uma ninfa oferece flores. Recusar pode ser seu maior erro.',
      'Marah julga os corações, não as espadas. O que há no seu?'
    ]
  },
  {
    id: 'tenebra',
    floorNumber: 7,
    godName: 'Tenebra',
    godDomain: 'Deusa das Trevas e dos Mortos-Vivos',
    godAlignment: 'mal',
    name: 'Abismo Eterno de Tenebra',
    description: 'Nenhum tipo de iluminação, natural ou mágica, funciona aqui. Mortos-vivos e licantropos infestam a escuridão total.',
    guardianName: 'Vampiro Ancião das Trevas',
    guardianDesc: 'F5 R6, regeneração, imunidade a magia de luz. Só pode ser combatido no escuro por tato.',
    specialRule: '⚠️ ESPECIAL: Escuridão total e absoluta. Magias de luz são suprimidas. Navegue pelo tato e audição.',
    icon: '🌑',
    palette: 'darkness',
    challengeType: 'darkness',
    monsterTypes: ['Vampiro Menor', 'Zumbi Veloz', 'Licantropo Lobo', 'Sombra Assassina', 'Wight Guerreiro'],
    trapTypes: ['Fossa Oculta na Escuridão', 'Corrente Sonora', 'Toque Drenador'],
    treasureTypes: ['Óculos de Visão no Escuro', 'Estaca de Prata', 'Amuleto Anti-Vampiro'],
    flavorTexts: [
      'Você não vê nada. Absolutamente nada. Apenas sente o ar frio e ouve respirações que não são suas.',
      'Tenebra não precisa de luz para ver você. Mas você precisa de muito mais que coragem.',
      'Um uivo de lobo ecoa. Está mais perto do que parece.'
    ]
  },
  {
    id: 'azgher',
    floorNumber: 8,
    godName: 'Azgher',
    godDomain: 'Deus do Sol e do Deserto',
    godAlignment: 'neutro',
    name: 'Câmaras Ardentes de Azgher',
    description: 'Banhada de luz ofuscante, esta masmorra é habitada por múmias, esfinges e enxames assassinos do deserto.',
    guardianName: 'Grande Esfinge de Azgher',
    guardianDesc: 'Esfinge solar com F6 H5. Propõe um enigma — falhar significa combate com -2 em todos os atributos pela luz.',
    specialRule: '⚠️ ESPECIAL: Luz intensa ofusca a visão (-1 H em combate). Criaturas do deserto têm +1 F aqui.',
    icon: '☀️',
    palette: 'solar',
    challengeType: 'mixed',
    monsterTypes: ['Múmia Guerreira', 'Esfinge Menor', 'Escorpião Gigante', 'Enxame de Besouros', 'Djinn do Deserto'],
    trapTypes: ['Areia Movediça', 'Câmara de Calor Extremo', 'Runa Solar Explosiva'],
    treasureTypes: ['Amuleto do Sol', 'Ouro Desértico', 'Pergaminho de Azgher'],
    flavorTexts: [
      'A luz aqui é sobrenatural — vem de todos os lados, não tem sombra.',
      'A esfinge observa cada movimento. Ela está avaliando se você merece viver.',
      'O calor é sufocante. Suas provisões de água acabam mais rápido aqui.'
    ]
  },
  {
    id: 'tauron',
    floorNumber: 9,
    godName: 'Tauron',
    godDomain: 'Deus dos Bárbaros e dos Minotauros',
    godAlignment: 'neutro',
    name: 'Labirinto dos Minotauros de Tauron',
    description: 'Um labirinto extremamente complexo, muito difícil de mapear. Minotauros gladiadores infestam seus corredores interminávies.',
    guardianName: 'Minotauro Gladiador Supremo',
    guardianDesc: 'F8 R5, imune à desorientação. Conhece cada centímetro do labirinto. Nunca se perde.',
    specialRule: '⚠️ ESPECIAL: Magias de orientação falham (H-4 para usar). Risco de se perder a cada sala.',
    icon: '🐂',
    palette: 'labyrinth',
    challengeType: 'mixed',
    monsterTypes: ['Minotauro Gladiador', 'Minotauro Berserker', 'Gnoll Caçador', 'Bárbaro Possuído'],
    trapTypes: ['Paredes que se movem', 'Labirinto dentro do Labirinto', 'Corredor sem Saída'],
    treasureTypes: ['Machado Gladiador +2', 'Fio de Ariadne', 'Troféu de Minotauro'],
    flavorTexts: [
      'Os corredores parecem mudar. Você tem certeza de que passou aqui antes.',
      'O mugido ressoa de todos os lados. O minotauro está em toda parte — ou em lugar nenhum.',
      'Tauron aprecia coragem e força. Foragidos são tratados com desprezo eterno.'
    ]
  },
  {
    id: 'tanna-toh',
    floorNumber: 10,
    godName: 'Tanna-Toh',
    godDomain: 'Deusa do Conhecimento e da Sabedoria',
    godAlignment: 'bem',
    name: 'Biblioteca Proibida de Tanna-Toh',
    description: 'Vencer esta masmorra envolve testes de inteligência e conhecimento. Combate é ineficaz; a mente é a arma aqui.',
    guardianName: 'O Golem do Saber',
    guardianDesc: 'Golem de papel e pergaminho. Imune a dano físico. Vencido apenas respondendo a 3 enigmas corretamente.',
    specialRule: '⚠️ ESPECIAL: Cada sala tem um enigma ou teste de H. Falhar abre armadilhas mágicas. Passar dá bônus.',
    icon: '📚',
    palette: 'arcane',
    challengeType: 'puzzle',
    monsterTypes: ['Guardião de Biblioteca', 'Grimório Animado', 'Esfinge Acadêmica', 'Construto de Conhecimento'],
    trapTypes: ['Runa de Confusão', 'Paradoxo Temporal', 'Labirinto Mental'],
    treasureTypes: ['Pergaminho Raro', 'Tomo de Magia', 'Cristal de Memória'],
    flavorTexts: [
      'As paredes são cobertas de livros impossíveis — alguns escritos em línguas que não existem.',
      'A resposta certa abre portas. A errada abre abismos.',
      'Tanna-Toh não valoriza espadas. Valoriza mentes afiadas.'
    ]
  },
  {
    id: 'lin-wu',
    floorNumber: 11,
    godName: 'Lin-Wu',
    godDomain: 'Deus Samurai das Artes Marciais',
    godAlignment: 'bem',
    name: 'Dojo Sagrado de Lin-Wu',
    description: 'Uma ordem inteira de artistas marciais de pontuação alta oferece um desafio elevado. Honra e técnica são testadas.',
    guardianName: 'Mestre Sensei Imortal',
    guardianDesc: 'Monge de 20° nível, F5 H7. Derrota aventureiros desarmados. Pode ser desafiado em combate honrado.',
    specialRule: 'Honra importa: atacar pelas costas ou usar veneno causa desvantagem. Combate honrado dá +1 H.',
    icon: '🥋',
    palette: 'dojo',
    challengeType: 'combat',
    monsterTypes: ['Monge Guerreiro', 'Samurai Fantasma', 'Ninja das Sombras', 'Lutador de Elite', 'Sensei Ancião'],
    trapTypes: ['Armadilha de Pressão', 'Golpe de Treinamento Fatal', 'Teste de Agilidade'],
    treasureTypes: ['Katana Sagrada', 'Robe do Monge', 'Pergaminho de Técnica'],
    flavorTexts: [
      'O dojo exige silêncio. Qualquer barulho desnecessário é considerado desrespeito.',
      'O Mestre observa. Ele sabe a diferença entre um guerreiro e um brigão.',
      'Lin-Wu ensina que a jornada é mais importante que o destino. Este lugar testa isso.'
    ]
  },
  {
    id: 'wynna',
    floorNumber: 12,
    godName: 'Wynna',
    godDomain: 'Deusa das Fadas e da Magia Selvagem',
    godAlignment: 'neutro',
    name: 'Reino Feérico de Wynna',
    description: 'Fadas e gênios são os principais adversários. A magia aqui é imprevisível e os terrenos mudam constantemente.',
    guardianName: 'Rainha das Fadas',
    guardianDesc: 'Criatura feérica de grande poder, H6, imune a magia não-feérica. Usa encantamentos e ilusões.',
    specialRule: '⚠️ ESPECIAL: Magia tem efeitos aleatórios aqui (+1d6 na tabela de Wynna). Terreno muda a cada turno.',
    icon: '🧚',
    palette: 'fey',
    challengeType: 'mixed',
    monsterTypes: ['Fada Guerreira', 'Gênio do Vento', 'Pixie Venenosa', 'Unicórnio Corrompido', 'Duende Trickster'],
    trapTypes: ['Encantamento de Dança Eterna', 'Ilusão de Caminho', 'Bolso de Dimensão Hostil'],
    treasureTypes: ['Pó de Fada', 'Anel Feérico', 'Fruta Dourada de Wynna'],
    flavorTexts: [
      'As cores aqui não fazem sentido. O céu é verde, a grama é azul.',
      'Uma fada ri. Você não tem certeza se é de alegria ou de planejamento.',
      'O terreno que era sólido há um momento agora é uma lagoa. Wynna acha isso divertido.'
    ]
  },
  {
    id: 'oceano',
    floorNumber: 13,
    godName: 'O Oceano',
    godDomain: 'Deus dos Mares e das Profundezas',
    godAlignment: 'neutro',
    name: 'Caverna Submarina do Oceano',
    description: 'Caverna completamente submersa. Aventureiros sem capacidade de respirar debaixo d\'água simplesmente se afogarão.',
    guardianName: 'Kraken das Profundezas',
    guardianDesc: 'Kraken menor F7 R6, ataca com tentáculos. Vive no coração da câmara submersa.',
    specialRule: '⚠️ ESPECIAL: Ambiente subaquático. Sem feitiço de respiração aquática: -1 PV por rodada de sufocamento.',
    icon: '🌊',
    palette: 'ocean',
    challengeType: 'survival',
    monsterTypes: ['Tubarão Gigante', 'Polvo Assassino', 'Sereia Predadora', 'Sahuagin Guerreiro', 'Enguia Elétrica Gigante'],
    trapTypes: ['Corrente Submarina', 'Câmara Pressurizada', 'Vórtice de Água'],
    treasureTypes: ['Pérola do Oceano', 'Tridente +2', 'Colar de Respiração Aquática'],
    flavorTexts: [
      'A água é fria e escura. Criaturas das profundezas não precisam de luz para encontrar você.',
      'Suas provisões e pergaminhos estão se molhando. Aja rápido.',
      'O Oceano não tem piedade. Ele simplesmente é.'
    ]
  },
  {
    id: 'thyatis',
    floorNumber: 14,
    godName: 'Thyatis',
    godDomain: 'Deus do Fogo e da Destruição',
    godAlignment: 'mal',
    name: 'Câmaras em Chamas de Thyatis',
    description: 'Uma caverna em chamas. Sem proteção especial contra fogo, os aventureiros não sobrevivem por muito tempo.',
    guardianName: 'Elemental de Fogo Primordial',
    guardianDesc: 'Elemental de fogo F6 R5, imune a fogo, causa dano de fogo a cada rodada adjacente.',
    specialRule: '⚠️ ESPECIAL: Dano de fogo ambiental (1 PV/rodada sem proteção). Criaturas imunes ao fogo próprio.',
    icon: '🔥',
    palette: 'fire',
    challengeType: 'survival',
    monsterTypes: ['Elemental de Fogo', 'Ífreet Guerreiro', 'Salamandra de Fogo', 'Górgona Ardente', 'Dragão de Fogo Jovem'],
    trapTypes: ['Jato de Chama', 'Chão de Lava', 'Explosão de Gás Inflamável'],
    treasureTypes: ['Rubi do Fogo', 'Anel Resistente ao Fogo', 'Espada de Chama'],
    flavorTexts: [
      'O calor é insuportável. Você sente sua armadura metálica começando a esquentar.',
      'Thyatis criou este lugar para testar quem realmente deseja a liberdade de Valkaria.',
      'As chamas nunca se apagam. Este lugar arde há séculos.'
    ]
  },
  {
    id: 'sszzaas',
    floorNumber: 15,
    godName: 'Sszzaas',
    godDomain: 'Deus das Serpentes e dos Venenos',
    godAlignment: 'mal',
    name: 'Ninho das Serpentes de Sszzaas',
    description: 'Ambiente hostil infestado de animais peçonhentos. O veneno é a arma primária de todas as criaturas aqui.',
    guardianName: 'Naga Rainha Venenosa',
    guardianDesc: 'Naga F5 H4, ataque venenoso com efeito permanente, feitiços de serpente.',
    specialRule: '⚠️ ESPECIAL: Todo ataque de criatura tem 50% de chance de envenenar (teste R ou perde 1 atributo).',
    icon: '🐍',
    palette: 'venom',
    challengeType: 'survival',
    monsterTypes: ['Cobra Rei Gigante', 'Hidra de Sete Cabeças', 'Víbora Venenosa', 'Naga Guerreira', 'Basilisco'],
    trapTypes: ['Câmara de Gás Venenoso', 'Espinhos Envenenados', 'Poça de Ácido de Serpente'],
    treasureTypes: ['Antídoto Universal', 'Escama de Naga', 'Anel de Imunidade a Veneno'],
    flavorTexts: [
      'O som de escamas deslizando sobre pedra é constante. Elas estão em toda parte.',
      'Sszzaas sussurra promessas de poder a quem sobreviver. Não ouça.',
      'O veneno aqui tem gosto de ambição. Talvez Valkaria aprecie essa ironia.'
    ]
  },
  {
    id: 'keenn',
    floorNumber: 16,
    godName: 'Keenn',
    godDomain: 'Deus dos Guerreiros e do Combate',
    godAlignment: 'neutro',
    name: 'Arena de Ferro de Keenn',
    description: 'Guerreiros em armaduras pesadas e usando armas poderosas são os oponentes. A força bruta encontra a força bruta.',
    guardianName: 'Cavaleiro de Ferro de Keenn',
    guardianDesc: 'Guerreiro F7 H4 A6. Armadura mágica pesada, arma encantada +3. O combate mais difícil até aqui.',
    specialRule: 'Inimigos têm Armadura 4+. Armas mágicas ou habilidade especial são necessárias para penetrar.',
    icon: '🛡️',
    palette: 'iron',
    challengeType: 'combat',
    monsterTypes: ['Cavaleiro de Ferro', 'Paladino Renegado', 'Guerreiro Colossal', 'Golem de Ferro', 'Campeão da Arena'],
    trapTypes: ['Prensa de Ferro', 'Arena com Plateia de Mortos', 'Canhão de Bolas de Ferro'],
    treasureTypes: ['Armadura Mágica +2', 'Espada Rúnica de Keenn', 'Medalha de Campeão'],
    flavorTexts: [
      'O barulho de metal contra metal não para. Keenn honra guerreiros com um duelo eterno.',
      'Esses inimigos não fogem. Não imploram por misericórdia. Apenas lutam.',
      'A arena está manchada com sangue de mil guerreiros. O seu pode ser o próximo.'
    ]
  },
  {
    id: 'megalokk',
    floorNumber: 17,
    godName: 'Megalokk',
    godDomain: 'Deus dos Monstros e das Feras Colossais',
    godAlignment: 'mal',
    name: 'Toca dos Colossais de Megalokk',
    description: 'Monstros diversos e muito maiores que o normal infestam esta masmorra. Inclui o lendário Tiranossauro Colossal.',
    guardianName: 'Tiranossauro Colossal',
    guardianDesc: 'F10 R8, tamanho colossal, cada mordida causa dano em área. A criatura mais poderosa do labirinto.',
    specialRule: 'Todas as criaturas têm +2 F e R comparado ao normal. Combate em espaços apertados é impossível.',
    icon: '🦕',
    palette: 'monster',
    challengeType: 'combat',
    monsterTypes: ['Tiranossauro Colossal', 'Dragão Anciã', 'Hidra de Doze Cabeças', 'Gigante das Tempestades', 'Rocha Viva Golem'],
    trapTypes: ['Pisoteamento de Colossal', 'Rugido Paralisante', 'Queda de Teto pela Passagem do Monstro'],
    treasureTypes: ['Dente de Dragão', 'Escama de Tiranossauro', 'Tesouro de Monstro Ancião'],
    flavorTexts: [
      'O chão treme com cada passo da criatura. Você sente antes de ver.',
      'Megalokk criou estas feras para destruir. Elas são perfeitas no que fazem.',
      'A masmorra é grande porque precisa ser. Os habitantes não cabem em corredores normais.'
    ]
  },
  {
    id: 'nimb',
    floorNumber: 18,
    godName: 'Nimb',
    godDomain: 'Deus do Caos e da Loucura',
    godAlignment: 'caos',
    name: 'Labirinto do Caos de Nimb',
    description: 'Extremamente difícil pela natureza caótica. As criaturas sempre têm poderes inesperados e a realidade é instável.',
    guardianName: 'O Sem-Nome de Nimb',
    guardianDesc: 'Criatura caótica com poderes aleatórios a cada rodada. Pode ser F9 ou F1. Imprevisível.',
    specialRule: '⚠️ ESPECIAL: Role 1d6 no início de cada rodada para o efeito caótico da sala (buff, nerf, teleporte, etc).',
    icon: '🌀',
    palette: 'chaos',
    challengeType: 'survival',
    monsterTypes: ['Slaad do Caos', 'Demônio Mutante', 'Beholder Louco', 'Criatura Sem Forma', 'Mimético Instável'],
    trapTypes: ['Teleporte Aleatório', 'Inversão de Gravidade', 'Explosão de Realidade'],
    treasureTypes: ['Artefato de Nimb (efeito aleatório)', 'Dado do Destino', 'Pergaminho do Caos'],
    flavorTexts: [
      'As paredes mudam de lugar enquanto você olha. O corredor que estava à esquerda agora está acima.',
      'Um inimigo ataca com F8. Na próxima rodada, tem F1 e está confuso. Nimb acha graça.',
      'O caos não pode ser derrotado, apenas sobrevivido. Continue se movendo.'
    ]
  },
  {
    id: 'khalmyr',
    floorNumber: 19,
    godName: 'Khalmyr',
    godDomain: 'Deus da Justiça e da Lei',
    godAlignment: 'bem',
    name: 'Tribunal Eterno de Khalmyr',
    description: 'A penúltima masmorra. Seus aposentos oferecem provas para testar os aventureiros. Justiça, honra e verdade são cobradas.',
    guardianName: 'Paladino Supremo de Khalmyr',
    guardianDesc: 'Paladino F6 H5 A5. Imune a mentiras e trapaças. Força os aventureiros a combate honrado.',
    specialRule: '⚠️ ESPECIAL: Ações desonrosas são punidas magicamente (-1 atributo permanente). Apenas a verdade passa.',
    icon: '⚖️',
    palette: 'justice',
    challengeType: 'mixed',
    monsterTypes: ['Paladino Guardião', 'Juiz Espectral', 'Anjo da Justiça', 'Arqueiro da Lei', 'Golem de Mármore'],
    trapTypes: ['Câmara da Verdade', 'Julgamento do Passado', 'Teste de Culpa'],
    treasureTypes: ['Espada da Justiça', 'Armadura de Khalmyr', 'Símbolo do Paladino'],
    flavorTexts: [
      'Khalmyr sabe de cada trapaça que você usou até aqui. Este é o momento de prestação de contas.',
      'A câmara julga sua alma, não seu poder. Seja honesto.',
      'O penúltimo desafio. Valkaria espera além. Mas Khalmyr garante que apenas os dignos passam.'
    ]
  },
  {
    id: 'valkaria',
    floorNumber: 20,
    godName: 'Valkaria',
    godDomain: 'Deusa da Ambição e dos Aventureiros',
    godAlignment: 'neutro',
    name: 'Câmara Final de Valkaria',
    description: 'A última masmorra, criada pela própria Valkaria. Todas as criaturas são réplicas dos inimigos mais poderosos já enfrentados. O desafio mais mortal concebido.',
    guardianName: 'Avatar de Valkaria',
    guardianDesc: 'A própria deusa em forma de avatar — F8 H6 R7. Usa poderes de todos os outros deuses. O verdadeiro desafio final.',
    specialRule: '⚠️ DESAFIO FINAL: Criaturas são réplicas de todos os guardiões anteriores. Sem recuperação entre batalhas.',
    icon: '👑',
    palette: 'final',
    challengeType: 'combat',
    monsterTypes: ['Réplica do Grande Urso', 'Réplica do Warchief Orc', 'Réplica do Arqueiro Arcano', 'Réplica da Ceifadora', 'Avatar de Valkaria'],
    trapTypes: ['Memória de Todo Perigo Passado', 'Reflexo da Maior Fraqueza', 'Teste da Ambição'],
    treasureTypes: ['Lágrima de Valkaria', 'Título de Libertador de Valkaria', 'Divindade Menor (Escolhido dos Deuses)'],
    flavorTexts: [
      'Você chegou até aqui. Valkaria sorri — pela primeira vez em séculos.',
      'A deusa testou cada herói que entrou. Você é o primeiro a chegar tão longe.',
      'Este é o sonho de Valkaria: humanos capazes de superar os próprios deuses. Prove que ela estava certa.'
    ]
  }
];

export const ROOM_ICONS: Record<RoomType, string> = {
  entrance: '🚪',
  monster: '👹',
  trap: '⚠️',
  treasure: '💰',
  rest: '🔥',
  boss: '💀',
  empty: '▫️',
  puzzle: '🔍',
  social: '💬'
};

export const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrada',
  monster: 'Monstro',
  trap: 'Armadilha',
  treasure: 'Tesouro',
  rest: 'Descanso',
  boss: 'Guardião',
  empty: 'Corredor',
  puzzle: 'Enigma',
  social: 'Encontro'
};

// Alias para compatibilidade
export const VALKARIA_THEMES = VALKARIA_FLOORS;

