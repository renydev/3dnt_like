import { Desvantagem } from '../models/game-data.model';

export const TODAS_DESVANTAGENS: Desvantagem[] = [

  // ── COMPORTAMENTAL ────────────────────────────────────────────────────────────

  {
    id: 'codigo_dos_herois',
    name: 'Código dos Heróis',
    refund: 1,
    category: 'comportamental',
    icon: '⚜️',
    shortPenalty: 'Sempre protege os fracos; nunca recusa ajuda',
    fullPenalty: 'O personagem deve cumprir sua palavra, proteger qualquer criatura mais fraca que ele e jamais recusar um pedido de ajuda, mesmo que seja perigoso ou inconveniente.',
    flavor: 'Heroísmo não é escolha — é destino.'
  },
  {
    id: 'codigo_da_honestidade',
    name: 'Código da Honestidade',
    refund: 1,
    category: 'comportamental',
    icon: '📜',
    shortPenalty: 'Nunca mente, rouba ou trapaceia',
    fullPenalty: 'O personagem nunca pode roubar, trapacear, mentir ou desobedecer às leis locais, nem permitir que seus companheiros o façam sem protestar.'
  },
  {
    id: 'codigo_da_derrota',
    name: 'Código da Derrota',
    refund: 2,
    category: 'comportamental',
    icon: '💀',
    shortPenalty: 'Jamais se rende; deve morrer a 0 PVs',
    fullPenalty: 'Nunca pode aceitar captura com vida. Se reduzido a 0 PVs em combate honrado, DEVE tirar a própria vida em vez de ser capturado.',
    flavor: 'A morte com honra vale mais que a vida sem ela.'
  },
  {
    id: 'codigo_ninja',
    name: 'Código Ninja',
    refund: 1,
    category: 'comportamental',
    icon: '🥷',
    shortPenalty: 'Cumpre a missão a qualquer custo',
    fullPenalty: 'O personagem deve sempre cumprir sua missão designada, mesmo ao custo da própria vida. Abandonar uma missão é motivo de desonra irreparável.'
  },
  {
    id: 'fobia',
    name: 'Fobia',
    refund: 1,
    category: 'psicologica',
    icon: '😱',
    shortPenalty: '-1 em tudo quando confrontado com o objeto da fobia',
    fullPenalty: 'O personagem tem um medo irracional intenso de algo específico (altura, escuridão, fogo, aranhas, mortos-vivos...). Quando confrontado, sofre -1 em todas as Características até sair da situação.',
    flavor: 'Cada herói carrega seus próprios demônios.'
  },
  {
    id: 'insano_raiva',
    name: 'Insano: Ira',
    refund: 2,
    category: 'psicologica',
    icon: '😡',
    shortPenalty: 'Em falha crítica (6), perde uma ação',
    fullPenalty: 'Crises de raiva incontroláveis surgem nos piores momentos. Quando rola resultado 6 em qualquer dado durante combate, entra em estado de fúria e perde sua próxima ação completa.',
    incompatibleWith: ['sorte', 'insano_paranoia', 'insano_fobia_morte']
  },
  {
    id: 'insano_paranoia',
    name: 'Insano: Paranoia',
    refund: 2,
    category: 'psicologica',
    icon: '🫥',
    shortPenalty: 'Desconfia de aliados; -1 em ações cooperativas',
    fullPenalty: 'O personagem desconfia de todos ao seu redor, incluindo aliados. Sofre -1 em todas as ações que dependam de cooperação direta. Periodicamente, o Mestre pode exigir testes para que não tome atitudes hostis contra aliados.',
    incompatibleWith: ['insano_raiva', 'insano_fobia_morte']
  },
  {
    id: 'insano_fobia_morte',
    name: 'Insano: Fobia da Morte',
    refund: 1,
    category: 'psicologica',
    icon: '💀',
    shortPenalty: '-2 em testes ao ver mortos-vivos ou falar sobre morte',
    fullPenalty: 'O medo da morte é tão intenso que paralisa. Em presença de mortos-vivos ou em situações que envolvam morte iminente, o personagem sofre -2 em todos os testes.',
    incompatibleWith: ['insano_paranoia', 'insano_raiva']
  },
  {
    id: 'azar',
    name: 'Azar',
    refund: 3,
    category: 'magica',
    icon: '🎲',
    shortPenalty: 'Após cada sucesso, rola 1d: resultado 6 cancela o sucesso',
    fullPenalty: 'O personagem está cercado de má sorte. Após cada teste bem-sucedido (exceto Esquivas), deve rolar 1d. Resultado 6 cancela o sucesso anterior. Para magias, rola antes de lançar — resultado 6 faz a magia falhar e consume os PMs.',
    incompatibleWith: ['sorte'],
    flavor: 'Até o universo parece trabalhar contra ele.'
  },
  {
    id: 'compulsao',
    name: 'Compulsão',
    refund: 1,
    category: 'psicologica',
    icon: '🔄',
    shortPenalty: '-1 em testes ao resistir à compulsão',
    fullPenalty: 'O personagem tem um comportamento compulsivo que não consegue controlar (colecionar objetos, contar tudo, precisar organizar coisas, etc.). Quando a situação envolve sua compulsão, sofre -1 em testes para resistir ou pode desperdiçar ações.'
  },

  // ── SOCIAL ────────────────────────────────────────────────────────────────────

  {
    id: 'inimigo',
    name: 'Inimigo',
    refund: 2,
    category: 'social',
    icon: '⚔️',
    shortPenalty: 'Inimigo poderoso que interfere na aventura',
    fullPenalty: 'Alguém poderoso (um nobre, um assassino, uma guilda ou um monstro inteligente) quer o personagem morto ou destruído. Este inimigo pode aparecer a qualquer momento, enviando capangas ou agindo pessoalmente.',
    flavor: 'Herói sem inimigos é herói sem história.'
  },
  {
    id: 'obrigacao',
    name: 'Obrigação',
    refund: 1,
    category: 'social',
    icon: '🔗',
    shortPenalty: 'Deve satisfações a uma organização',
    fullPenalty: 'O personagem tem uma dívida ou obrigação com uma organização poderosa (uma guilda, um templo, uma ordem de cavalaria). Pode ser chamado a prestar serviços, e recusar tem consequências sérias.',
    incompatibleWith: ['patrono']
  },
  {
    id: 'ma_fama',
    name: 'Má Fama',
    refund: 1,
    category: 'social',
    icon: '💢',
    shortPenalty: 'NPCs desconfiam; -2 em interações amigáveis',
    fullPenalty: 'O personagem tem uma reputação terrível — seja justificada ou não. Comerciantes cobram mais, guardas o observam com suspeita, e cidadãos comuns evitam contato. Sofre -2 em testes de interação social amigável.',
    incompatibleWith: ['ma_fama_v']
  },
  {
    id: 'inculto',
    name: 'Inculto',
    refund: 1,
    category: 'social',
    icon: '📖',
    shortPenalty: 'Não sabe ler nem escrever; -2 em testes de conhecimento',
    fullPenalty: 'O personagem não sabe ler nem escrever. Sofre -2 em todos os testes que dependam de conhecimento livresco, documentos ou habilidades que requerem educação formal.'
  },
  {
    id: 'protegido_indefeso',
    name: 'Protegido Indefeso',
    refund: 2,
    category: 'social',
    icon: '🧒',
    shortPenalty: 'Tem uma pessoa fraca para proteger',
    fullPenalty: 'O personagem possui alguém que depende completamente de sua proteção — uma criança, um familiar, um civil inocente. Inimigos podem usar essa pessoa como reféns, e o personagem sofre -2 em todos os testes quando o protegido está em perigo.',
    flavor: 'Amar alguém é criar uma fraqueza que todo inimigo vai encontrar.'
  },
  {
    id: 'assombrado',
    name: 'Assombrado',
    refund: 2,
    category: 'psicologica',
    icon: '👻',
    shortPenalty: '-1 em tudo quando o fantasma aparece (4-6 em 1d)',
    fullPenalty: 'Um espírito dedicado a atormentar o personagem. Quando entra em combate, o Mestre rola 1d: resultado 4, 5 ou 6 significa que o fantasma aparece, impondo -1 em TODAS as Características até que vá embora.',
    flavor: 'Os mortos têm memória longa e paciência infinita.'
  },

  // ── FÍSICA ────────────────────────────────────────────────────────────────────

  {
    id: 'aparencia_monstruosa',
    name: 'Aparência Monstruosa',
    refund: 1,
    category: 'fisica',
    icon: '👹',
    shortPenalty: 'Pessoas fogem ou ficam hostis; -2 em Lábia e Sedução',
    fullPenalty: 'A aparência do personagem é profundamente repulsiva ou assustadora. Pessoas comuns fogem ou ficam furiosas. Sofre -2 em Lábia e Sedução, mas ganha +1 em Interrogatório e Intimidação.',
    incompatibleWith: ['aparencia_agradavel']
  },
  {
    id: 'fraqueza_fogo',
    name: 'Vulnerabilidade: Fogo',
    refund: 1,
    category: 'fisica',
    icon: '🔥',
    shortPenalty: '+2 de dano de todas as fontes de fogo',
    fullPenalty: 'O personagem é anormalmente suscetível ao fogo. Recebe +2 de dano de qualquer fonte de Calor/Fogo, incluindo magias de fogo, tochas e brasas.',
    incompatibleWith: ['invulnerabilidade_fogo']
  },
  {
    id: 'fraqueza_magia',
    name: 'Vulnerabilidade: Magia',
    refund: 1,
    category: 'magica',
    icon: '💜',
    shortPenalty: '+1 de dano de todas as fontes mágicas',
    fullPenalty: 'A resistência mágica do personagem é praticamente nula. Recebe +1 de dano de todas as fontes mágicas — magias de ataque, maldições e armas encantadas.'
  },
  {
    id: 'fraqueza_prata',
    name: 'Vulnerabilidade: Prata',
    refund: 1,
    category: 'fisica',
    icon: '🥈',
    shortPenalty: 'Dano de prata ignora metade da Armadura',
    fullPenalty: 'Armas de prata são letais ao personagem. Ataques com armas de prata ou prata pura ignoram metade do valor de Armadura ao calcular a FD.',
    flavor: 'Todo monstro tem sua prata.'
  },
  {
    id: 'bateria',
    name: 'Bateria',
    refund: 2,
    category: 'fisica',
    icon: '🔋',
    shortPenalty: 'Fica inativo por 1d horas após X horas de atividade',
    fullPenalty: 'O personagem tem energia limitada: 12 horas de atividade por ponto de Resistência. Após esse limite, deve descansar em repouso absoluto por 1d horas para recarregar. Só pode ser possuída por Máquinas e Construtos.'
  },
  {
    id: 'alergia',
    name: 'Alergia',
    refund: 1,
    category: 'fisica',
    icon: '🌿',
    shortPenalty: '-1 em tudo quando em contato com a substância',
    fullPenalty: 'O personagem tem reação severa a uma substância comum (alho, prata, água benta, flores silvestres, etc.). Em contato ou na presença próxima, sofre -1 em todas as Características.'
  },
  {
    id: 'dependencia',
    name: 'Dependência',
    refund: 2,
    category: 'fisica',
    icon: '⚗️',
    shortPenalty: '-1 em tudo sem a substância por 24 horas',
    fullPenalty: 'O personagem depende de uma substância ou ritual para funcionar plenamente (poção específica, meditação, alimentação especial). Sem ela por 24 horas, sofre -1 em todas as Características.',
    flavor: 'O poder nunca vem de graça.'
  }
];
