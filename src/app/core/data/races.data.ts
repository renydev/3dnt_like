import { CharacterRace } from '../models/character.model';

export interface RaceModifiers {
  forca?: number;
  habilidade?: number;
  resistencia?: number;
  armadura?: number;
  pontosMagia?: number;
  pontosVida?: number;
}

export interface RaceVantagem {
  name: string;
  description: string;
}

export interface RaceDesvantagem {
  name: string;
  description: string;
}

export interface Race {
  id: CharacterRace;
  name: string;
  icon: string;
  lore: string;
  modifiers: RaceModifiers;
  bonusPoints: number;          // pontos de personagem extras
  freeVantagens: RaceVantagem[];
  freeDesvantagens: RaceDesvantagem[];
  traits: string[];             // bullets de resumo para a UI
  recommendedClasses: CharacterRace[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  color: string;
}

export const ALL_RACES: Race[] = [
  {
    id: 'humano',
    name: 'Humano',
    icon: '👤',
    color: '#c97a20',
    difficulty: 'Fácil',
    lore: 'Versáteis e determinados, os humanos dominam a maior parte de Arton. Sem talento inato específico, compensam com adaptabilidade e ambição sem igual.',
    modifiers: {},
    bonusPoints: 2,
    freeVantagens: [],
    freeDesvantagens: [],
    traits: [
      '+2 pontos de personagem extras',
      'Sem modificadores de atributo',
      'Adaptável a qualquer classe',
      'Começa com mais pontos para vantagens'
    ],
    recommendedClasses: []
  },
  {
    id: 'elfo',
    name: 'Elfo',
    icon: '🌿',
    color: '#27ae60',
    difficulty: 'Médio',
    lore: 'Ancestrais e graciosos, os elfos carregam séculos de sabedoria. Ligados à magia desde o nascimento, enxergam no escuro e possuem reflexos sobre-humanos.',
    modifiers: { habilidade: 1, forca: -1, pontosMagia: 2 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Sentidos Élficos', description: 'Visão no escuro até 18m. +2 em testes de Percepção.' },
      { name: 'Resistência Élfica', description: 'Imune a sono mágico e com vantagem contra efeitos de encantamento.' }
    ],
    freeDesvantagens: [],
    traits: [
      '+1 Habilidade, −1 Força',
      '+2 Pontos de Magia',
      'Visão no escuro (18m)',
      'Imune a sono mágico',
      '+2 em Percepção'
    ],
    recommendedClasses: []
  },
  {
    id: 'anao',
    name: 'Anão',
    icon: '⛏️',
    color: '#7f8c8d',
    difficulty: 'Fácil',
    lore: 'Forjados nas profundezas da terra, os anões são tão duros quanto o aço. Resistentes ao veneno e especialistas em combate subterrâneo e trabalho com metal.',
    modifiers: { resistencia: 1, habilidade: -1, armadura: 1, pontosMagia: -2 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Resistência Anã', description: 'Imune a venenos. +2 em testes de Resistência contra doenças.' },
      { name: 'Teimosia', description: '+2 PV por nível. Não pode ser derrubado por efeitos de empurrão.' }
    ],
    freeDesvantagens: [
      { name: 'Lento', description: 'Deslocamento reduzido em −3m. Não pode usar Corrida em combate.' }
    ],
    traits: [
      '+1 Resistência, −1 Habilidade',
      '+1 Armadura natural',
      '−2 Pontos de Magia',
      'Imune a venenos',
      '+2 PV por nível'
    ],
    recommendedClasses: []
  },
  {
    id: 'halfling',
    name: 'Halfling',
    icon: '🍀',
    color: '#f39c12',
    difficulty: 'Médio',
    lore: 'Pequenos mas incrivelmente sortudos, os halflings escapam de situações impossíveis com um sorriso no rosto. A fortuna os favorece de maneiras inexplicáveis.',
    modifiers: { habilidade: 1, forca: -1, resistencia: -1, armadura: 1 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Sorte de Halfling', description: 'Uma vez por combate, pode rerrolar qualquer dado e ficar com o melhor resultado.' },
      { name: 'Furtividade Natural', description: '+2 em testes de Furtividade. Pode se esconder atrás de criaturas Médias.' }
    ],
    freeDesvantagens: [],
    traits: [
      '+1 Habilidade, −1 Força, −1 Resistência',
      '+1 Armadura (agilidade)',
      'Rerrolamento 1×/combate',
      '+2 em Furtividade'
    ],
    recommendedClasses: []
  },
  {
    id: 'gnomo',
    name: 'Gnomo',
    icon: '🔧',
    color: '#3498db',
    difficulty: 'Médio',
    lore: 'Inventores e illusionistas natos, os gnomos combinam curiosidade insaciável com talento mágico. Menores que halflings, compensam com engenho e criatividade.',
    modifiers: { habilidade: 1, forca: -1, pontosMagia: 2 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Visão no Escuro', description: 'Enxerga perfeitamente no escuro até 18m.' },
      { name: 'Ilusionista Nato', description: 'Magias da escola de Ilusão custam −1 PM. Pode lançar Luz como magia inata 1×/dia.' }
    ],
    freeDesvantagens: [
      { name: 'Pequeno', description: 'Desvantagem em testes de Força pura contra criaturas Grandes ou maiores.' }
    ],
    traits: [
      '+1 Habilidade, −1 Força',
      '+2 Pontos de Magia',
      'Visão no escuro (18m)',
      'Magias de Ilusão −1 PM',
      'Luz 1×/dia (inato)'
    ],
    recommendedClasses: []
  },
  {
    id: 'meio-elfo',
    name: 'Meio-Elfo',
    icon: '✨',
    color: '#9b59b6',
    difficulty: 'Fácil',
    lore: 'Herdeiros de dois mundos, os meio-elfos possuem a graça élfica e a resiliência humana. Aceitos em ambas as sociedades, sua natureza híbrida os torna extraordinariamente versáteis.',
    modifiers: { habilidade: 1, pontosMagia: 1 },
    bonusPoints: 1,
    freeVantagens: [
      { name: 'Herança Dual', description: 'Conta como Humano E Elfo para pré-requisitos. +1 em testes de Diplomacia e Blefe.' },
      { name: 'Sentidos Parciais', description: 'Visão no escuro até 9m (metade dos elfos puros).' }
    ],
    freeDesvantagens: [],
    traits: [
      '+1 Habilidade, +1 PM',
      '+1 ponto de personagem extra',
      'Visão no escuro (9m)',
      'Conta como Humano e Elfo',
      '+1 em Diplomacia e Blefe'
    ],
    recommendedClasses: []
  },
  {
    id: 'meio-orc',
    name: 'Meio-Orc',
    icon: '🪓',
    color: '#e74c3c',
    difficulty: 'Médio',
    lore: 'Herdeiros da brutalidade orcish e da inteligência humana, os meio-orcs são guerreiros formidáveis. Temidos e mal compreendidos, encontraram seu lugar nas masmorras mais perigosas.',
    modifiers: { forca: 2, habilidade: -1, resistencia: 1, pontosMagia: -2 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Fúria Bárbara', description: '1×/combate: +2 Força e +2 Resistência por 3 rodadas. Após, fica Fatigado por 1 rodada.' },
      { name: 'Implacável', description: 'Quando reduzido a 0 PV, pode fazer 1 ataque adicional antes de cair.' }
    ],
    freeDesvantagens: [
      { name: 'Má Fama', description: '−2 em testes sociais com NPCs que conhecem sua herança orcish.' }
    ],
    traits: [
      '+2 Força, +1 Resistência, −1 Habilidade',
      '−2 Pontos de Magia',
      'Fúria Bárbara 1×/combate',
      'Ataque ao cair',
      '−2 social (aparência orcish)'
    ],
    recommendedClasses: []
  },
  {
    id: 'lefou',
    name: 'Lefou',
    icon: '🌑',
    color: '#8e44ad',
    difficulty: 'Difícil',
    lore: 'Corrompidos pelo toque de Suna ou outras forças das trevas, os lefou carregam a marca do mal em sua própria carne. Temidos por todos, mas dotados de poder sombrio incomparável.',
    modifiers: { resistencia: 1, pontosMagia: 3 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Toque das Trevas', description: 'Pode lançar Drenar Energia como magia inata 1×/combate (sem custo de PM).' },
      { name: 'Resistência Maldita', description: '+2 em testes de Resistência contra magia divina e efeitos sagrados.' },
      { name: 'Visão nas Trevas', description: 'Visão perfeita no escuro total até 18m.' }
    ],
    freeDesvantagens: [
      { name: 'Marca do Mal', description: '−3 em todas as interações sociais com NPCs de bem. Clérigos de bens detectam automaticamente.' },
      { name: 'Sede de Magia Negra', description: 'Deve fazer teste de Resistência para não usar poderes sombrios quando possível.' }
    ],
    traits: [
      '+1 Resistência, +3 Pontos de Magia',
      'Drenar Energia 1×/combate (grátis)',
      'Visão no escuro total (18m)',
      '−3 em interações sociais de bem',
      'Detectado por Detectar Mal'
    ],
    recommendedClasses: []
  },
  {
    id: 'minotauro',
    name: 'Minotauro',
    icon: '🐂',
    color: '#d35400',
    difficulty: 'Difícil',
    lore: 'Filhos de Tauron, os minotauros são guerreiros colossais com chifres que rasgam armaduras. Têm dificuldade em usar equipamentos comuns e são vistos como monstros pela maioria.',
    modifiers: { forca: 3, resistencia: 2, habilidade: -2, armadura: 1, pontosMagia: -3 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Chifrada', description: 'Ataque especial: Chifrada causa Força+1 de dano e empurra o alvo 3m. 1×/rodada.' },
      { name: 'Orientação Natural', description: 'Nunca se perde em labirintos. +4 em testes de navegação subterrânea.' },
      { name: 'Colossal', description: 'Tamanho Grande: +4 PV base, armas causar +1d de dano.' }
    ],
    freeDesvantagens: [
      { name: 'Monstruoso', description: '−4 em testes sociais. NPCs podem atacar preventivamente. Não pode usar armaduras comuns.' },
      { name: 'Instinto Bestial', description: 'Em combate, deve fazer teste H-2 para não atacar o alvo mais próximo ao invés do escolhido.' }
    ],
    traits: [
      '+3 Força, +2 Resistência, +1 Armadura',
      '−2 Habilidade, −3 Pontos de Magia',
      'Chifrada (empurrão) 1×/rodada',
      'Nunca se perde em masmorras',
      'Tamanho Grande (+4 PV base)'
    ],
    recommendedClasses: []
  },
  {
    id: 'goblin',
    name: 'Goblin',
    icon: '👺',
    color: '#16a085',
    difficulty: 'Difícil',
    lore: 'Ao contrário de seus companheiros tribais, alguns goblins desenvolvem astúcia e ambição suficientes para aventurar-se nas masmorras. Pequenos, rápidos e traiçoeiros, compensam com criatividade e ousadia.',
    modifiers: { habilidade: 3, forca: -2, resistencia: -1, pontosMagia: -1 },
    bonusPoints: 0,
    freeVantagens: [
      { name: 'Fuga Instintiva', description: 'Pode usar Retirada como ação bônus (não ação completa). +2 em testes de Furtividade.' },
      { name: 'Visão no Escuro', description: 'Enxerga perfeitamente no escuro até 18m.' },
      { name: 'Oportunista', description: '+2 de dano em ataques furtivos e ataques contra inimigos flanqueados.' }
    ],
    freeDesvantagens: [
      { name: 'Desconfiado', description: '−3 em testes sociais com raças não-goblinóides. Dificuldade em negociar.' },
      { name: 'Frágil', description: 'PV máximo −2 por nível.' }
    ],
    traits: [
      '+3 Habilidade, −2 Força, −1 Resistência',
      '−1 Pontos de Magia',
      'Retirada como ação bônus',
      'Visão no escuro (18m)',
      '+2 dano em flanqueio'
    ],
    recommendedClasses: []
  }
];

export const RACE_MAP = new Map<CharacterRace, Race>(
  ALL_RACES.map(r => [r.id, r])
);
