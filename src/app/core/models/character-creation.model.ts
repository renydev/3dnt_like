import { CharacterClass, CharacterRace } from './character.model';

export interface Race {
  id: CharacterRace;
  name: string;
  icon: string;
  lore: string;
  modifiers: { forca?: number; habilidade?: number; resistencia?: number; armadura?: number; poderFogo?: number };
  freeVantagem: string;
  bonusPoints: number;
  traits: string[];
}

export interface ClassDef {
  id: CharacterClass;
  name: string;
  icon: string;
  role: string;
  lore: string;
  baseStats: { forca: number; habilidade: number; resistencia: number; armadura: number; poderFogo: number };
  freeVantagem: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  difficultyColor: string;
  playstyle: string;
}

export interface VantagemDef {
  id: string;
  name: string;
  cost: number;
  category: 'combate' | 'magia' | 'defesa' | 'social' | 'especial';
  icon: string;
  description: string;
  effect: string;
  incompatibleWith?: string[];
  requiresClass?: CharacterClass[];
}

export interface DesvantagemDef {
  id: string;
  name: string;
  refund: number;
  category: 'comportamental' | 'social' | 'fisica';
  icon: string;
  description: string;
  penalty: string;
}

// ─── RAÇAS ────────────────────────────────────────────────────────────────────

export const RACES: Race[] = [
  {
    id: 'humano',
    name: 'Humano',
    icon: '👤',
    lore: 'Versáteis e adaptáveis, os humanos dominam a maior parte de Arton. Sua força vem da diversidade e da determinação.',
    modifiers: {},
    freeVantagem: 'Versatilidade Humana',
    bonusPoints: 1,
    traits: ['+1 ponto de vantagem extra', 'Sem penalidades raciais', 'Adaptável a qualquer classe']
  },
  {
    id: 'elfo',
    name: 'Elfo',
    icon: '🌿',
    lore: 'Ancestrais e graciosos, os elfos carregam séculos de sabedoria. Ligados à magia desde o nascimento, possuem reflexos sobre-humanos.',
    modifiers: { habilidade: 1, forca: -1, poderFogo: 2 },
    freeVantagem: 'Sentidos Élficos',
    bonusPoints: 0,
    traits: ['+1 Habilidade, −1 Força', '+2 Poder de Fogo', 'Sentidos Élficos grátis']
  },
  {
    id: 'anao',
    name: 'Anão',
    icon: '⛏️',
    lore: 'Forjados nas profundezas da terra, os anões são tão duros quanto o aço. Resistentes ao veneno e especialistas em combate subterrâneo.',
    modifiers: { resistencia: 1, habilidade: -1, armadura: 1, poderFogo: -2 },
    freeVantagem: 'Resistência Anã',
    bonusPoints: 0,
    traits: ['+1 Resistência, −1 Habilidade', '+1 Armadura', 'Imune a venenos menores']
  },
  {
    id: 'halfling',
    name: 'Halfling',
    icon: '🍀',
    lore: 'Pequenos mas incrivelmente sortudos, os halflings escapam de situações impossíveis com um sorriso no rosto. A fortuna os favorece.',
    modifiers: { habilidade: 1, forca: -1, resistencia: -1, armadura: 1 },
    freeVantagem: 'Sorte de Halfling',
    bonusPoints: 0,
    traits: ['+1 Habilidade, −1 Força, −1 Resistência', '+1 Armadura', 'Pode rerrolar 1 teste por combate']
  },
  {
    id: 'meio-elfo',
    name: 'Meio-Elfo',
    icon: '✨',
    lore: 'Herdeiros de dois mundos, os meio-elfos possuem a graça élfica e a resiliência humana. Sua natureza híbrida os torna extraordinariamente versáteis.',
    modifiers: { habilidade: 1, poderFogo: 1 },
    freeVantagem: 'Herança Dual',
    bonusPoints: 1,
    traits: ['+1 Habilidade, +1 PF', '+1 ponto de vantagem extra', 'Herança Dual grátis']
  }
];

// ─── CLASSES ──────────────────────────────────────────────────────────────────

export const CLASSES: ClassDef[] = [
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    icon: '⚔️',
    role: 'Tanque / Dano',
    lore: 'Mestres das armas e da guerra, guerreiros se jogam no combate sem hesitar. A linha de frente é sua casa.',
    baseStats: { forca: 3, habilidade: 2, resistencia: 3, armadura: 3, poderFogo: 0 },
    freeVantagem: 'Ataque Duplo',
    difficulty: 'Iniciante',
    difficultyColor: '#27ae60',
    playstyle: 'Combate direto — entre, bata, sobreviva.'
  },
  {
    id: 'mago',
    name: 'Mago',
    icon: '🔮',
    role: 'Magia Ofensiva',
    lore: 'Estudiosos do arcano, magos transformam Poder de Fogo em destruição pura. Frágeis, mas letais à distância.',
    baseStats: { forca: 1, habilidade: 3, resistencia: 2, armadura: 1, poderFogo: 8 },
    freeVantagem: 'Conjuração Aprimorada',
    difficulty: 'Avançado',
    difficultyColor: '#8e44ad',
    playstyle: 'Alto risco, alto impacto — gerencie PMs com cuidado.'
  },
  {
    id: 'ladino',
    name: 'Ladino',
    icon: '🗡️',
    role: 'Furtividade / Dano',
    lore: 'Sombras são seus aliados. Ladinos atacam de surpresa, exploram fraquezas e desaparecem antes da represália.',
    baseStats: { forca: 2, habilidade: 4, resistencia: 2, armadura: 2, poderFogo: 0 },
    freeVantagem: 'Ataque Furtivo',
    difficulty: 'Intermediário',
    difficultyColor: '#e67e22',
    playstyle: 'Posicionamento é tudo — maximize ataques furtivos.'
  },
  {
    id: 'clerigo',
    name: 'Clérigo',
    icon: '✨',
    role: 'Suporte / Cura',
    lore: 'Canalizadores do poder divino, clérigos curam os aliados e purificam o mal. Servem aos deuses de Arton.',
    baseStats: { forca: 2, habilidade: 2, resistencia: 2, armadura: 2, poderFogo: 6 },
    freeVantagem: 'Cura Divina',
    difficulty: 'Intermediário',
    difficultyColor: '#f39c12',
    playstyle: 'Sustentabilidade — cure-se entre combates e dure mais.'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    role: 'Exploração / Dano',
    lore: 'Guardiões das fronteiras, rangers dominam o combate à distância e o rastreamento. Nenhuma armadilha os pega de surpresa.',
    baseStats: { forca: 2, habilidade: 3, resistencia: 2, armadura: 2, poderFogo: 2 },
    freeVantagem: 'Rastreamento Élfico',
    difficulty: 'Intermediário',
    difficultyColor: '#16a085',
    playstyle: 'Detecte armadilhas, ataque de longe, controle o ritmo.'
  }
];

// ─── VANTAGENS ────────────────────────────────────────────────────────────────

export const VANTAGENS: VantagemDef[] = [
  // Combate
  {
    id: 'acrobacia',
    name: 'Acrobacia',
    cost: 1,
    category: 'combate',
    icon: '🤸',
    description: '+2 em testes de agilidade, equilíbrio e piruetas.',
    effect: '+2 em testes de agilidade e equilíbrio'
  },
  {
    id: 'ambidestria',
    name: 'Ambidestria',
    cost: 1,
    category: 'combate',
    icon: '🗡️',
    description: 'Usa duas armas sem penalidade.',
    effect: 'Sem penalidade para usar arma na mão não-dominante'
  },
  {
    id: 'ataques_multiplos',
    name: 'Ataques Múltiplos',
    cost: 3,
    category: 'combate',
    icon: '⚡',
    description: 'Pode realizar 2 ataques por rodada.',
    effect: '2 ataques por rodada'
  },
  {
    id: 'ataque_duplo',
    name: 'Ataque Duplo',
    cost: 2,
    category: 'combate',
    icon: '⚔️',
    description: 'Desfere dois golpes por rodada com a mesma arma.',
    effect: 'Dois golpes por rodada',
    incompatibleWith: ['tiro_certeiro']
  },
  {
    id: 'detectar_inimigos',
    name: 'Detectar Inimigos',
    cost: 1,
    category: 'combate',
    icon: '👁️',
    description: 'Nunca é surpreendido em combate.',
    effect: 'Imune a surpresa'
  },
  {
    id: 'esquiva',
    name: 'Esquiva',
    cost: 1,
    category: 'combate',
    icon: '🌪️',
    description: '+2 na defesa contra ataques à distância.',
    effect: '+2 vs ataques à distância'
  },
  {
    id: 'faro_apurado',
    name: 'Faro Apurado',
    cost: 1,
    category: 'combate',
    icon: '👃',
    description: 'Detecta inimigos e armadilhas ocultas por cheiro e som.',
    effect: 'Detecta ocultos por olfato e audição'
  },
  {
    id: 'forca_colossal',
    name: 'Força Colossal',
    cost: 2,
    category: 'combate',
    icon: '💪',
    description: 'Musculatura sobre-humana que inspira terror.',
    effect: '+2 em todos os testes de Força',
    incompatibleWith: ['tiro_certeiro']
  },
  {
    id: 'mira_certeira',
    name: 'Mira Certeira',
    cost: 1,
    category: 'combate',
    icon: '🎯',
    description: 'Mira impecável — cada projétil encontra seu alvo.',
    effect: '+2 em ataques à distância'
  },
  {
    id: 'percepcao',
    name: 'Percepção',
    cost: 1,
    category: 'combate',
    icon: '🔍',
    description: '+2 em testes de percepção e investigação.',
    effect: '+2 Percepção e Investigação'
  },
  {
    id: 'prontidao',
    name: 'Prontidão',
    cost: 1,
    category: 'combate',
    icon: '⚡',
    description: 'Age primeiro em qualquer iniciativa.',
    effect: 'Sempre age primeiro'
  },
  {
    id: 'reflexos_aguçados',
    name: 'Reflexos Aguçados',
    cost: 1,
    category: 'combate',
    icon: '💨',
    description: 'Reage aos ataques antes mesmo de vê-los.',
    effect: '+1 em iniciativa e testes de esquiva'
  },
  {
    id: 'sede_de_batalha',
    name: 'Sede de Batalha',
    cost: 2,
    category: 'especial',
    icon: '🩸',
    description: 'A adrenalina do combate é sua melhor cura.',
    effect: 'Recupera 2 PV por inimigo derrotado'
  },
  {
    id: 'sentidos_aguçados',
    name: 'Sentidos Aguçados',
    cost: 1,
    category: 'especial',
    icon: '🦅',
    description: 'Percepção afiada que fareja o perigo antes de chegar.',
    effect: 'Detecta armadilhas e emboscadas; +1 em Percepção'
  },
  {
    id: 'tiro_certeiro',
    name: 'Tiro Certeiro',
    cost: 1,
    category: 'combate',
    icon: '🏹',
    description: 'Mira impecável — cada flecha encontra seu alvo.',
    effect: '+1 Habilidade em todos os ataques à distância',
    incompatibleWith: ['forca_colossal', 'ataque_duplo']
  },
  // Defesa / Suporte
  {
    id: 'armadura_pesada',
    name: 'Armadura Pesada',
    cost: 2,
    category: 'defesa',
    icon: '🛡️',
    description: 'Acostumado ao peso de metais reforçados.',
    effect: '+1 Armadura permanente'
  },
  {
    id: 'arma_especial',
    name: 'Arma Especial',
    cost: 1,
    category: 'defesa',
    icon: '🗡️',
    description: 'Proficiência e +1d6 de dano com uma arma específica.',
    effect: '+1d6 dano com arma escolhida'
  },
  {
    id: 'fortitude',
    name: 'Fortitude',
    cost: 1,
    category: 'defesa',
    icon: '❤️',
    description: '+5 PV máximos.',
    effect: '+5 PV máximos'
  },
  {
    id: 'imunidade_magica',
    name: 'Imunidade Mágica',
    cost: 2,
    category: 'defesa',
    icon: '🔮',
    description: 'Resistência a magias e efeitos arcanos.',
    effect: 'Resistência a magias'
  },
  {
    id: 'regeneracao',
    name: 'Regeneração',
    cost: 2,
    category: 'defesa',
    icon: '💚',
    description: 'Recupera 1 PV por rodada fora de combate.',
    effect: '+1 PV/rodada fora de combate'
  },
  {
    id: 'toque_curador',
    name: 'Toque Curador',
    cost: 1,
    category: 'defesa',
    icon: '🤲',
    description: 'Pode curar 1d6 PV em aliado (1×/dia).',
    effect: 'Cura 1d6 PV em aliado 1×/dia'
  },
  {
    id: 'visao_escuro',
    name: 'Visão no Escuro',
    cost: 1,
    category: 'defesa',
    icon: '🦇',
    description: 'Enxerga perfeitamente na escuridão total.',
    effect: 'Visão completa no escuro'
  },
  // Magia
  {
    id: 'arcano',
    name: 'Arcano',
    cost: 4,
    category: 'magia',
    icon: '🌟',
    description: 'Aptidão natural para a magia. Recebe Focus 1 em todos os seis Caminhos automaticamente.',
    effect: 'Focus 1 em todos os Caminhos; acesso à magia'
  },
  {
    id: 'clericato',
    name: 'Clericato',
    cost: 2,
    category: 'magia',
    icon: '✝️',
    description: 'Acesso à magia divina. Permite usar Focus nos Caminhos de Luz e Trevas.',
    effect: 'Focus divino; acesso à magia sagrada'
  },
  {
    id: 'magia_aprimorada',
    name: 'Magia Aprimorada',
    cost: 2,
    category: 'magia',
    icon: '🔮',
    description: 'Reservas arcanas além do comum.',
    effect: '+4 Poder de Fogo'
  },
  {
    id: 'foco_arcano',
    name: 'Foco Arcano',
    cost: 1,
    category: 'magia',
    icon: '🌀',
    description: 'Concentração perfeita reduz o custo mágico.',
    effect: 'Magias custam −1 PF (mínimo 1)',
    requiresClass: ['mago', 'clerigo']
  },
];

// ─── DESVANTAGENS ─────────────────────────────────────────────────────────────

export const DESVANTAGENS: DesvantagemDef[] = [
  {
    id: 'ansioso',
    name: 'Ansioso',
    refund: 1,
    category: 'comportamental',
    icon: '😰',
    description: 'Perde 1 ponto em testes que exigem paciência.',
    penalty: '−1 em testes que exigem paciência ou espera'
  },
  {
    id: 'azarado',
    name: 'Azarado',
    refund: 1,
    category: 'comportamental',
    icon: '🍀',
    description: 'Uma vez por sessão sofre uma reviravolta negativa.',
    penalty: 'Uma reviravolta negativa aleatória por sessão'
  },
  {
    id: 'cobicoso',
    name: 'Cobiçoso',
    refund: 1,
    category: 'comportamental',
    icon: '💰',
    description: 'Deve tentar pegar itens valiosos à vista.',
    penalty: 'Compulsão por pegar objetos valiosos'
  },
  {
    id: 'covarde',
    name: 'Covarde',
    refund: 1,
    category: 'comportamental',
    icon: '😨',
    description: 'Testa Habilidade para não fugir de batalhas difíceis.',
    penalty: 'Teste de Habilidade ou foge em combates difíceis'
  },
  {
    id: 'fobia',
    name: 'Fobia',
    refund: 1,
    category: 'comportamental',
    icon: '😱',
    description: 'Um medo irracional que paralisa nos momentos errados.',
    penalty: '−1 em todos os testes quando confrontado com o objeto da fobia'
  },
  {
    id: 'inimigo_oculto',
    name: 'Inimigo Oculto',
    refund: 1,
    category: 'social',
    icon: '⚔️',
    description: 'Há alguém poderoso que quer vê-lo morto.',
    penalty: 'Encontros adicionais com inimigos específicos'
  },
  {
    id: 'inimigo',
    name: 'Inimigo Poderoso',
    refund: 2,
    category: 'social',
    icon: '💀',
    description: 'Alguém muito poderoso e conhecido quer você morto.',
    penalty: 'Encontros frequentes e mais intensos com inimigos específicos'
  },
  {
    id: 'lento',
    name: 'Lento',
    refund: 1,
    category: 'fisica',
    icon: '🐢',
    description: '−1 em Habilidade em testes de velocidade.',
    penalty: '−1 Habilidade em testes de velocidade'
  },
  {
    id: 'ma_fama',
    name: 'Má Fama',
    refund: 1,
    category: 'social',
    icon: '😤',
    description: 'NPCs desconfiam de você por padrão.',
    penalty: 'Desvantagem em situações sociais com estranhos'
  },
  {
    id: 'maneta',
    name: 'Maneta',
    refund: 2,
    category: 'fisica',
    icon: '🦾',
    description: 'Perdeu uma mão; −2 em ações que exigem ambas.',
    penalty: '−2 em ações bimanuais'
  },
  {
    id: 'obrigacao',
    name: 'Obrigação',
    refund: 1,
    category: 'social',
    icon: '🔗',
    description: 'Tem um dever que não pode ignorar.',
    penalty: 'Deve cumprir obrigações com uma organização poderosa'
  },
  {
    id: 'pe_frio',
    name: 'Pé Frio',
    refund: 1,
    category: 'comportamental',
    icon: '🎲',
    description: 'Uma vez por sessão, rerrola um dado favorável.',
    penalty: 'Rerrola um resultado favorável por sessão'
  },
  {
    id: 'sanguinario',
    name: 'Sanguinário',
    refund: 1,
    category: 'comportamental',
    icon: '🩸',
    description: 'Difícil de parar em combate; testa Habilidade para não atacar.',
    penalty: 'Teste de Habilidade para não continuar atacando inimigos vencidos'
  },
  {
    id: 'teimosia',
    name: 'Teimosia',
    refund: 1,
    category: 'comportamental',
    icon: '🤬',
    description: 'Recusa ajuda; −1 em testes cooperativos.',
    penalty: '−1 em testes cooperativos'
  },
  {
    id: 'vulnerabilidade',
    name: 'Vulnerabilidade',
    refund: 2,
    category: 'fisica',
    icon: '💔',
    description: 'Recebe +2 de dano de um tipo específico.',
    penalty: '+2 de dano de um tipo específico'
  },
];

export const VANTAGEM_CATEGORIES = [
  { id: 'combate', label: 'Combate', icon: '⚔️' },
  { id: 'magia', label: 'Magia', icon: '🔮' },
  { id: 'defesa', label: 'Defesa', icon: '🛡️' },
  { id: 'especial', label: 'Especial', icon: '⭐' }
] as const;
