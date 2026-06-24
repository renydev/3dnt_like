// Vantagens do 3DeT Victory — lista oficial completa do manual (cap. Personagens, "Vantagens", pág. 42-63)

export type VantagemCategory =
  | 'combate' | 'defesa' | 'atributo' | 'mental' | 'social' | 'movimento' | 'recursos' | 'especial';

export interface VantagemDef {
  id: string;
  name: string;
  cost: string;   // custo em PP, como exibido no manual (ex: "1pt", "1-2pt", "2, 4 ou 6pt")
  category: VantagemCategory;
  icon: string;
  description: string;
}

export const VANTAGEM_CATEGORIES: { id: VantagemCategory; label: string }[] = [
  { id: 'combate',   label: 'Combate' },
  { id: 'defesa',    label: 'Defesa' },
  { id: 'atributo',  label: 'Atributo Secundário' },
  { id: 'mental',    label: 'Mental / Percepção' },
  { id: 'social',    label: 'Social' },
  { id: 'movimento', label: 'Movimento' },
  { id: 'recursos',  label: 'Recursos' },
  { id: 'especial',  label: 'Especial' },
];

export const ALL_VANTAGENS: VantagemDef[] = [
  {
    id: 'aceleracao', name: 'Aceleração', cost: '1pt', category: 'movimento', icon: '💨',
    description: 'Gaste 1PM para um movimento extra no turno, ou para Ganho na iniciativa ou em testes de Habilidade para correr, fugir ou perseguir.',
  },
  {
    id: 'mais_acao', name: '+Ação', cost: '1pt cada', category: 'recursos', icon: '⚡',
    description: 'Concede +2PA além dos oferecidos pelo Poder. Pode ser comprada várias vezes, acumulando +2PA por compra.',
  },
  {
    id: 'acumulador', name: 'Acumulador', cost: '1pt', category: 'combate', icon: '📈',
    description: 'Sempre que acerta um ataque, pode gastar 2PM para Poder +1 no próximo ataque (acumulável até P+5). Erra ou deixa de atacar e os bônus acabam.',
  },
  {
    id: 'agil', name: 'Ágil', cost: '1pt', category: 'atributo', icon: '🤸',
    description: 'H+2 em testes de agilidade, coordenação ou equilíbrio (incluso iniciativa), valendo em críticos. Por 2PM, crítico automático com 5 ou 6 nesses testes. Incompatível com Atrapalhado.',
  },
  {
    id: 'ajudante', name: 'Ajudante', cost: '1pt cada', category: 'especial', icon: '🤝',
    description: 'Você tem um aliado (pessoa, animal, objeto) que pode invocar por 2PM 1×/rodada: Curandeiro (cura 2D ou repete teste de Resistência), Especialista (Ganho em perícia escolhida), Familiar (custo reduzido), Lutador (Ganho em ataque/defesa) ou Montaria (movimento extra).',
  },
  {
    id: 'alcance', name: 'Alcance', cost: '1-2pt', category: 'combate', icon: '🎯',
    description: '1pt: ataca Longe sem penalidade e Muito Longe com Perda. 2pt: também atinge Muito Longe sem penalidade. Sem esta vantagem, vantagens de ataque só alcançam alvos Perto.',
  },
  {
    id: 'anulacao', name: 'Anulação', cost: '2pt', category: 'mental', icon: '🚫',
    description: 'Por 3PM, tenta impedir o alvo de usar uma vantagem específica; ele resiste com teste de Resistência (9 + seu Poder). Apenas uma vantagem anulada por vez.',
  },
  {
    id: 'arena', name: 'Arena', cost: '1pt cada', category: 'especial', icon: '🏟️',
    description: 'Em um tipo de terreno escolhido (água, céu, cidade, ermos, subterrâneo...), gaste 2PM para Ganho em um teste.',
  },
  {
    id: 'artefato', name: 'Artefato', cost: '1pt ou mais', category: 'recursos', icon: '🗡️',
    description: 'Você possui um item único e poderoso. Cada ponto vale 10XP para comprar qualidades de arma, armadura ou acessório (ver Recompensas).',
  },
  {
    id: 'ataque_especial', name: 'Ataque Especial', cost: '1pt cada', category: 'combate', icon: '💥',
    description: 'Compre efeitos de ataque com custo em PM: Área, Choque (usa R), Distante, Espiritual (dano em PM), Investida, Múltiplo, Penetrante, Perigoso (crítico em 5-6), Poderoso, Potente (+P2 por ponto), Preciso (usa H), Titânico (crítico automático). Pode comprar vários efeitos.',
  },
  {
    id: 'base', name: 'Base', cost: '1pt', category: 'recursos', icon: '🏠',
    description: 'Você tem um esconderijo seguro, alcançável de qualquer lugar fora de combate. Pode levar aliados (até Poder+Habilidade). Testes feitos lá têm Ganho.',
  },
  {
    id: 'brutal', name: 'Brutal', cost: '1pt cada', category: 'combate', icon: '🩸',
    description: 'Recupera recursos ao causar dano em combate real: Vida (1PV por 3 de dano causado), Mana (1PM por 3 de dano) ou Derrota (3PV+1PM ao derrotar um oponente). Versões acumulam.',
  },
  {
    id: 'carismatico', name: 'Carismático', cost: '1pt', category: 'atributo', icon: '😎',
    description: 'P+2 em testes sociais, válido em críticos. Por 2PM, crítico automático com 5 ou 6 nesses testes. Incompatível com Antipático.',
  },
  {
    id: 'clone', name: 'Clone', cost: '1pt', category: 'defesa', icon: '👥',
    description: 'Gaste 2PM e um movimento para criar uma cópia exata de si. Ao sofrer um ataque bem-sucedido, uma cópia desaparece em vez de você sofrer dano.',
  },
  {
    id: 'confusao', name: 'Confusão', cost: '1pt', category: 'combate', icon: '🌀',
    description: 'Ataque e gaste 2PM; se vencer a defesa, o alvo fica confuso (alvos de suas ações escolhidos ao acaso) até sofrer dano ou resistir (R, 9 + seu Poder).',
  },
  {
    id: 'cura', name: 'Cura', cost: '1pt', category: 'especial', icon: '💚',
    description: 'Gaste 2PM para curar 1D PV em si ou em quem tocar (até dados = sua Habilidade), ou para repetir um teste de Resistência falho contra efeito negativo.',
  },
  {
    id: 'defesa_especial', name: 'Defesa Especial', cost: '1pt cada', category: 'defesa', icon: '🛡️',
    description: 'Compre efeitos defensivos com custo em PM: Blindada (crítico em 5-6), Bloqueio (usa P), Esquiva (usa H), Proteção/Provocação (defende por um aliado), Reflexão (devolve dano), Robusta, Tenaz (+2 por ponto), Titânica (defesa perfeita garantida).',
  },
  {
    id: 'desgaste', name: 'Desgaste', cost: '1pt', category: 'combate', icon: '☣️',
    description: 'Ataque e gaste 2PM; se causar dano, o alvo sofre o mesmo dano de novo na próxima rodada, a menos que gaste a ação para tratar o efeito.',
  },
  {
    id: 'devoto', name: 'Devoto', cost: '1pt', category: 'social', icon: '🙏',
    description: 'Ao agir em nome de sua causa ou crença, gaste 2PM para Ganho. Utilizável até 2× por cena.',
  },
  {
    id: 'elo_mental', name: 'Elo Mental', cost: '1pt', category: 'mental', icon: '🔗',
    description: 'Ligação com outro personagem (que também precisa ter esta vantagem): comunicação mental à vista, compartilhar PM em perigo, e repassar Ganho entre si.',
  },
  {
    id: 'estender', name: 'Estender', cost: '1pt', category: 'especial', icon: '📡',
    description: 'Gaste 1PM por turno para que uma vantagem pessoal também funcione em um aliado Perto.',
  },
  {
    id: 'famoso', name: 'Famoso', cost: '1pt', category: 'social', icon: '🌟',
    description: 'Reconhecido por NPCs; gaste 3PM para Ganho em testes sociais com quem o reconhece. Incompatível com Infame.',
  },
  {
    id: 'foco', name: 'Foco', cost: '1pt', category: 'especial', icon: '🧘',
    description: 'Gaste 2PM e um turno se concentrando (Perda na defesa neste tempo); no turno seguinte, seu próximo teste recebe um crítico automático.',
  },
  {
    id: 'forte', name: 'Forte', cost: '1pt', category: 'atributo', icon: '💪',
    description: 'P+2 em testes de esforço físico, válido em críticos. Por 2PM, crítico automático com 5 ou 6 nesses testes. Incompatível com Fracote.',
  },
  {
    id: 'genio', name: 'Gênio', cost: '1pt', category: 'atributo', icon: '🧠',
    description: 'H+2 em testes de conhecimento e raciocínio, válido em críticos. Por 2PM, crítico automático com 5 ou 6 nesses testes. Incompatível com Tapado.',
  },
  {
    id: 'golpe_final', name: 'Golpe Final', cost: '1pt', category: 'combate', icon: '⚔️',
    description: 'Gaste 3PM e ataque um alvo perto da derrota: o ataque é tratado como uma escala acima.',
  },
  {
    id: 'grimorio', name: 'Grimório', cost: '1pt ou mais', category: 'recursos', icon: '📖',
    description: 'Fonte de conhecimento com técnicas próprias. Cada ponto vale 10XP para adquirir truques ou técnicas comuns já no início (sujeito à aprovação do mestre).',
  },
  {
    id: 'ilusao', name: 'Ilusão', cost: '2pt', category: 'mental', icon: '🎭',
    description: 'Cria imagens tridimensionais intangíveis que enganam os sentidos (1 a 8PM segundo o tamanho). Detectadas por teste de Percepção (9 + PM gastos) ou pela vantagem Sentido.',
  },
  {
    id: 'imitar', name: 'Imitar', cost: '1pt', category: 'mental', icon: '🪞',
    description: 'Ao ver alguém usar uma vantagem (ou já sabendo dela), teste de Percepção (9) e gaste 3PM para adquiri-la até o fim da cena. Apenas uma por vez.',
  },
  {
    id: 'imortal', name: 'Imortal', cost: '1pt', category: 'defesa', icon: '♾️',
    description: 'Em testes de morte, nunca tem resultado pior que inconsciente — pode ser derrotado, nunca morto de verdade.',
  },
  {
    id: 'improviso', name: 'Improviso', cost: '2pt', category: 'especial', icon: '🎲',
    description: 'Gaste 3PM para aprender, na hora, uma perícia que não tenha, usável até o fim da cena. Apenas uma perícia improvisada por vez.',
  },
  {
    id: 'imune', name: 'Imune', cost: '1pt cada', category: 'defesa', icon: '🚷',
    description: 'Imunidade a algo específico: Abiótico (sem necessidades biológicas), Anfíbio (respira embaixo d\'água), Doenças, Resiliente (sem fadiga), ou Sem Mente (imune a efeitos mentais).',
  },
  {
    id: 'incorporeo', name: 'Incorpóreo', cost: '2pt', category: 'defesa', icon: '👻',
    description: 'Por uma ação e 5PM, fica intangível: atravessa barreiras e é imune a dano de combate violento (exceto Magia ou outros Incorpóreos), mas também não pode causar dano físico.',
  },
  {
    id: 'inimigo', name: 'Inimigo', cost: '1-2pt cada', category: 'combate', icon: '🗡️',
    description: 'Especialista contra um grupo de criaturas (Humanos, Humanoides, Construtos, Espíritos ou Monstros): crítico em 5-6 contra eles. Custa 2pt se o grupo é muito comum na campanha.',
  },
  {
    id: 'inofensivo', name: 'Inofensivo', cost: '1pt', category: 'social', icon: '🐰',
    description: 'Aparência não-ameaçadora rende uma ação extra antes do primeiro turno (1ª vez contra cada oponente) e Ganho na iniciativa contra quem já o conhece. Por 3PM, Ganho para enganar ou passar despercebido.',
  },
  {
    id: 'instrutor', name: 'Instrutor', cost: '1pt', category: 'social', icon: '🎓',
    description: 'Por uma ação e 2PM, permite que um aliado teste como se tivesse uma perícia (ou vantagem) que você possui, até o turno seguinte dele.',
  },
  {
    id: 'inventario', name: 'Inventário', cost: '1-3pt', category: 'recursos', icon: '🎒',
    description: 'Define quantos itens consumíveis você carrega: 1pt Pequeno (3 comuns+1 incomum), 2pt Grande (5+2), 3pt Supremo (5 comuns+4 incomuns+1 raro). Recarrega a cada aventura.',
  },
  {
    id: 'invisivel', name: 'Invisível', cost: '1-2pt', category: 'especial', icon: '🫥',
    description: 'Por uma ação e 3PM, fica invisível (Ganho para se esconder, ataques contra você têm Perda). 1pt: cai ao atacar ou sofrer dano. 2pt: cai apenas ao sofrer dano.',
  },
  {
    id: 'irresistivel', name: 'Irresistível', cost: '1pt', category: 'mental', icon: '🌀',
    description: 'Gaste 2PM (ou mais) para aumentar a meta de resistência contra suas vantagens (Anulação, Confusão, Ilusão, Paralisia, Punição...) em +3 por cada 2PM.',
  },
  {
    id: 'maestria', name: 'Maestria', cost: '1pt cada', category: 'especial', icon: '🏆',
    description: 'Escolha uma perícia que possui: gaste 1PM para crítico em 5-6 em testes dela. Pode ser comprada novamente para outras perícias.',
  },
  {
    id: 'magia', name: 'Magia', cost: '2pt', category: 'especial', icon: '✨',
    description: 'Gaste PM para somar diretamente em qualquer teste de ataque, defesa ou perícia (até o limite de sua Habilidade). Pode usar Mística em vez de Luta para ataques/defesas mágicas.',
  },
  {
    id: 'mais_mana', name: '+Mana', cost: '1pt cada', category: 'recursos', icon: '🔵',
    description: 'Concede +10PM além dos oferecidos pela Habilidade. Pode ser comprada várias vezes.',
  },
  {
    id: 'mais_membros', name: '+Membros', cost: '2pt', category: 'especial', icon: '🦾',
    description: 'Membros extras (braços, cauda, tentáculos...) permitem gastar 3PM para uma segunda ação no turno — apenas uma ação extra por rodada.',
  },
  {
    id: 'mentor', name: 'Mentor', cost: '1pt cada', category: 'especial', icon: '👴',
    description: 'Escolha uma perícia: 1×/cena, Ganho em um teste dela; técnicas que exigem essa perícia custam −1PM (mín. 1). Compre novamente para outras perícias.',
  },
  {
    id: 'obstinado', name: 'Obstinado', cost: '1pt', category: 'recursos', icon: '🔥',
    description: 'Pode gastar 1 ponto de atributo (P, H ou R) como se fosse 1PA — reduzindo temporariamente o recurso associado. Recupera com 8h de descanso.',
  },
  {
    id: 'paralisia', name: 'Paralisia', cost: '1pt', category: 'combate', icon: '🥶',
    description: 'Ataque e gaste 2PM; se vencer a defesa, o alvo fica imobilizado em vez de sofrer dano, até sofrer dano ou resistir (R, 6 + seu Poder).',
  },
  {
    id: 'patrono', name: 'Patrono', cost: '1pt', category: 'social', icon: '🏛️',
    description: 'Serve a uma organização poderosa: gaste 1PM para Ganho em testes de compra relacionados à missão do patrono, e recebe um item extra de Inventário por raridade.',
  },
  {
    id: 'punicao', name: 'Punição', cost: '1-2pt', category: 'combate', icon: '☠️',
    description: 'Escolha uma desvantagem de valor equivalente; ataque e gaste 2PM — se vencer a defesa, o alvo sofre os efeitos dessa desvantagem em vez de dano, até sofrer dano ou resistir (R, 6 + seu Poder).',
  },
  {
    id: 'regeneracao', name: 'Regeneração', cost: '1-2pt', category: 'defesa', icon: '💗',
    description: '1pt: recupera 1PV no início do turno. 2pt: recupera 3PV. Em testes de morte nunca tem resultado pior que Inconsciente.',
  },
  {
    id: 'resoluto', name: 'Resoluto', cost: '1pt', category: 'atributo', icon: '🗿',
    description: 'R+2 em testes de força de vontade (inclui testes de morte), válido em críticos. Por 2PM, crítico automático com 5 ou 6. Incompatível com Indeciso.',
  },
  {
    id: 'riqueza', name: 'Riqueza', cost: '2, 4 ou 6pt', category: 'recursos', icon: '💰',
    description: 'Recursos financeiros de escala superior: gaste PM em testes de compra para subir de nível (2pt/2PM = 1 nível, até 4pt/4PM = 2 níveis, 6pt/6PM = 3 níveis).',
  },
  {
    id: 'sentido', name: 'Sentido', cost: '1pt cada', category: 'mental', icon: '👁️',
    description: 'Percepção especial: Aguçado (Ganho com um sentido escolhido), Infravisão, Intuição (detecta mentiras/intenções), Radar (percepção 360° e sinais), ou Raio X. Compre novamente para outro sentido.',
  },
  {
    id: 'telepata', name: 'Telepata', cost: '1pt', category: 'mental', icon: '🧠',
    description: 'Por um movimento e 1PM: Ganho em teste social com alguém na cena, descobrir algo sobre um personagem (H, 9), ou Ganho de defesa prevendo um ataque.',
  },
  {
    id: 'teleporte', name: 'Teleporte', cost: '1pt', category: 'movimento', icon: '🌀',
    description: 'Use um movimento e PM (1 por incremento de distância) para se deslocar a qualquer lugar visível. Por 3PM, ganha defesa contra um ataque.',
  },
  {
    id: 'torcida', name: 'Torcida', cost: '1pt', category: 'social', icon: '📣',
    description: 'Quando há uma torcida presente (1 em 1D no início da cena, ou sempre em locais apropriados), recebe um Ganho por rodada em qualquer teste.',
  },
  {
    id: 'transformacao', name: 'Transformação', cost: '1-2pt cada', category: 'especial', icon: '🦸',
    description: 'Tenha outra forma com os mesmos pontos, mudando perícias, vantagens e até personalidade. Restaura PM/PV ao transformar. 1× por sessão grátis, depois custa 1PA.',
  },
  {
    id: 'mais_vida', name: '+Vida', cost: '1pt cada', category: 'recursos', icon: '❤️',
    description: 'Concede +10PV além dos oferecidos pela Resistência. Pode ser comprada várias vezes.',
  },
  {
    id: 'vigoroso', name: 'Vigoroso', cost: '1pt', category: 'atributo', icon: '🐂',
    description: 'R+2 em testes de saúde física (inclui testes de morte), válido em críticos. Por 2PM, crítico automático com 5 ou 6. Incompatível com Frágil.',
  },
  {
    id: 'voo', name: 'Voo', cost: '1pt', category: 'movimento', icon: '🪽',
    description: 'Pode voar usando um movimento para ficar Longe ou mais pelo ar. Levantar voo do chão custa um movimento e 2PM; ignora certos terrenos difíceis.',
  },
];

export const VANTAGEM_MAP = new Map<string, VantagemDef>(
  ALL_VANTAGENS.map(v => [v.id, v])
);
