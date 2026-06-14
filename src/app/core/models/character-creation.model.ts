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
    id: 'ataque_duplo',
    name: 'Ataque Duplo',
    cost: 2,
    category: 'combate',
    icon: '⚔️',
    description: 'Desfere dois golpes onde outros fazem um.',
    effect: 'Realiza dois ataques por rodada',
    incompatibleWith: ['tiro_certeiro']
  },
  {
    id: 'tiro_certeiro',
    name: 'Tiro Certeiro',
    cost: 1,
    category: 'combate',
    icon: '🎯',
    description: 'Mira impecável — cada flecha encontra seu alvo.',
    effect: '+1 Habilidade em todos os ataques à distância',
    incompatibleWith: ['forca_colossal', 'ataque_duplo']
  },
  {
    id: 'reflexos_aguçados',
    name: 'Reflexos Aguçados',
    cost: 1,
    category: 'combate',
    icon: '⚡',
    description: 'Reage aos ataques antes mesmo de vê-los.',
    effect: '+1 em iniciativa e testes de esquiva'
  },
  // Magia
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
    effect: 'Magias custam −1 PF (mínimo 1)'
  },
  // Defesa
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
    id: 'esquiva',
    name: 'Esquiva',
    cost: 1,
    category: 'defesa',
    icon: '🌪️',
    description: 'Corpo e mente treinados para sair do caminho.',
    effect: '+1 em testes de defesa e Resistência'
  },
  // Especial
  {
    id: 'sentidos_aguçados',
    name: 'Sentidos Aguçados',
    cost: 1,
    category: 'especial',
    icon: '👁️',
    description: 'Percepção afiada que fareja o perigo antes de chegar.',
    effect: 'Detecta armadilhas e emboscadas; +1 em testes de Percepção'
  },
  {
    id: 'sede_de_batalha',
    name: 'Sede de Batalha',
    cost: 2,
    category: 'especial',
    icon: '🩸',
    description: 'A adrenalina do combate é sua melhor cura.',
    effect: 'Recupera 2 PV por inimigo derrotado'
  }
];

// ─── DESVANTAGENS ─────────────────────────────────────────────────────────────

export const DESVANTAGENS: DesvantagemDef[] = [
  {
    id: 'codigo_de_honra',
    name: 'Código de Honra',
    refund: 2,
    category: 'comportamental',
    icon: '📜',
    description: 'Segue um código de conduta rígido e inabalável.',
    penalty: 'Não pode fugir de combate nem atacar inimigos indefesos'
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
    id: 'inimigo',
    name: 'Inimigo Poderoso',
    refund: 2,
    category: 'social',
    icon: '⚔️',
    description: 'Alguém muito poderoso quer você morto.',
    penalty: 'Encontros adicionais de inimigos específicos nos andares'
  },
  {
    id: 'obrigacao',
    name: 'Obrigação',
    refund: 1,
    category: 'social',
    icon: '🔗',
    description: 'Deve satisfações a uma organização poderosa.',
    penalty: '−1 ponto de tesouro em recompensas (dívida a pagar)'
  },
  {
    id: 'fraqueza_magia',
    name: 'Fraqueza à Magia',
    refund: 1,
    category: 'fisica',
    icon: '💜',
    description: 'Sua resistência mágica é praticamente nula.',
    penalty: 'Recebe +1 de dano de todas as fontes mágicas'
  },
  {
    id: 'insano_raiva',
    name: 'Insano: Ira',
    refund: 2,
    category: 'comportamental',
    icon: '😡',
    description: 'Crises de raiva incontroláveis surgem nos momentos mais críticos.',
    penalty: 'Em falha crítica (resultado 6), perde uma ação na próxima rodada'
  }
];

export const VANTAGEM_CATEGORIES = [
  { id: 'combate', label: 'Combate', icon: '⚔️' },
  { id: 'magia', label: 'Magia', icon: '🔮' },
  { id: 'defesa', label: 'Defesa', icon: '🛡️' },
  { id: 'especial', label: 'Especial', icon: '⭐' }
] as const;
