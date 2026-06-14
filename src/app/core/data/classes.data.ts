import { CharacterClass } from '../models/character.model';

export interface ClassBaseStats {
  forca: number;
  habilidade: number;
  resistencia: number;
  armadura: number;
  poderFogo: number;
}

export interface ClassVantagem {
  name: string;
  description: string;
}

export interface ClassDef {
  id: CharacterClass;
  name: string;
  icon: string;
  color: string;
  role: string;
  lore: string;
  baseStats: ClassBaseStats;
  pvBase: number;           // PV = pvBase + (R × 5) no 3D&T
  freeVantagens: ClassVantagem[];
  traits: string[];
  playstyle: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  recommendedRaces?: CharacterClass[];
}

// Atributos base 3D&T Alpha: distribuição de 12 pontos entre F/H/R/A/PF
// F+H+R deve somar ~7-9; A e PF são separados
export const ALL_CLASSES: ClassDef[] = [
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    icon: '⚔️',
    color: '#c0392b',
    role: 'Tanque / Dano Físico',
    difficulty: 'Iniciante',
    lore: 'Mestres das armas e da guerra, guerreiros se jogam no combate sem hesitar. Treinados desde cedo nas artes marciais, dominam toda arma que tocam e resistem ao que derrubaria qualquer outro.',
    baseStats: { forca: 3, habilidade: 2, resistencia: 3, armadura: 3, poderFogo: 0 },
    pvBase: 20,
    freeVantagens: [
      { name: 'Ataque Duplo', description: 'Realiza dois ataques por rodada com a mesma arma ou armas diferentes.' },
      { name: 'Especialização em Arma', description: 'Escolha uma arma: +1 de dano com ela permanentemente.' }
    ],
    traits: [
      'F3 H2 R3 A3 PM0',
      'Ataque Duplo grátis',
      'Especialização em Arma grátis',
      'Melhor PV do jogo',
      'Equipamentos pesados sem penalidade'
    ],
    playstyle: 'Linha de frente — entre, bata, sobreviva. Simples e letal.'
  },
  {
    id: 'mago',
    name: 'Mago',
    icon: '🔮',
    color: '#8e44ad',
    role: 'Dano Mágico / Controle',
    difficulty: 'Avançado',
    lore: 'Estudiosos do arcano, magos transformam Poder de Fogo em destruição pura ou controle absoluto do campo de batalha. Frágeis, mas letais. Um mago sem PF é quase inútil — um mago com PF é invencível.',
    baseStats: { forca: 1, habilidade: 3, resistencia: 2, armadura: 1, poderFogo: 8 },
    pvBase: 10,
    freeVantagens: [
      { name: 'Arcano Avançado', description: 'Começa com 3 pontos de Focus para distribuir entre Caminhos Arcanos.' },
      { name: 'Conjuração Aprimorada', description: 'Uma vez por combate, pode lançar uma magia como ação bônus.' }
    ],
    traits: [
      'F1 H3 R2 A1 PM8',
      '3 pontos de Focus para Caminhos',
      'Conjuração como ação bônus 1×/combate',
      'Menor PV do jogo',
      'Maior arsenal mágico'
    ],
    playstyle: 'Alto risco, alto impacto — gerencie PMs com cuidado e destrua de longe.'
  },
  {
    id: 'ladino',
    name: 'Ladino',
    icon: '🗡️',
    color: '#2c3e50',
    role: 'Dano Furtivo / Utilidade',
    difficulty: 'Intermediário',
    lore: 'Sombras são seus aliados. Ladinos atacam de surpresa, exploram fraquezas e desaparecem antes da represália. Especialistas em armadilhas, venenos e tudo que a sociedade educada prefere não mencionar.',
    baseStats: { forca: 2, habilidade: 4, resistencia: 2, armadura: 2, poderFogo: 0 },
    pvBase: 12,
    freeVantagens: [
      { name: 'Ataque Pelas Costas', description: '+2d6 de dano em ataques surpresa ou flanqueados. Ignora metade da Armadura do alvo.' },
      { name: 'Furtividade Profissional', description: '+3 em todos os testes de Furtividade e Prestidigitação.' }
    ],
    traits: [
      'F2 H4 R2 A2 PM0',
      '+2d6 dano surpresa',
      'Ignora metade da Armadura em furtivo',
      '+3 em Furtividade',
      'Detecta armadilhas automaticamente'
    ],
    playstyle: 'Posicionamento é tudo — maximize furtividade e nunca lute em campo aberto.'
  },
  {
    id: 'clerigo',
    name: 'Clérigo',
    icon: '🌟',
    color: '#f39c12',
    role: 'Suporte / Cura / Anti-morto-vivo',
    difficulty: 'Intermediário',
    lore: 'Canalizadores do poder divino, clérigos curam os aliados e purificam o mal. Servem aos deuses de Arton — e em uma masmorra com 20 andares, ter um clérigo por perto pode ser a diferença entre a vida e a morte.',
    baseStats: { forca: 2, habilidade: 2, resistencia: 3, armadura: 2, poderFogo: 6 },
    pvBase: 16,
    freeVantagens: [
      { name: 'Cura Divina', description: 'Gasta PF para curar: 1 PF = recupera 1d6+H PV em si mesmo ou em aliado adjacente.' },
      { name: 'Expulsar Mortos-Vivos', description: '1×/combate: todos os mortos-vivos no alcance fazem teste de R ou fogem por 3 rodadas.' }
    ],
    traits: [
      'F2 H2 R3 A2 PM6',
      'Cura: 1 PF = 1d6+H PV',
      'Expulsar mortos-vivos 1×/combate',
      'Magias divinas (Caminhos Sagrados)',
      'Segunda melhor R do jogo'
    ],
    playstyle: 'Sustentabilidade — mantenha o grupo vivo e destrua mortos-vivos em ondas.'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    color: '#16a085',
    role: 'Exploração / Dano à Distância',
    difficulty: 'Intermediário',
    lore: 'Guardiões das fronteiras selvagens, rangers dominam o combate à distância e o rastreamento em qualquer terreno. Nenhuma armadilha os pega de surpresa — eles conhecem as masmorras melhor que seus construtores.',
    baseStats: { forca: 2, habilidade: 3, resistencia: 2, armadura: 2, poderFogo: 2 },
    pvBase: 14,
    freeVantagens: [
      { name: 'Inimigo Favorito', description: 'Escolha um tipo de criatura (mortos-vivos, bestas, humanoídes): +2 de dano e +2 em testes contra eles.' },
      { name: 'Rastreamento', description: 'Detecta armadilhas automaticamente. +3 em testes de Sobrevivência e Percepção em masmorras.' }
    ],
    traits: [
      'F2 H3 R2 A2 PM2',
      '+2 dano/testes contra Inimigo Favorito',
      'Detecta armadilhas automaticamente',
      '+3 Percepção e Sobrevivência',
      'Ataque duplo com arco grátis'
    ],
    playstyle: 'Detecte primeiro, ataque de longe, controle o ritmo de exploração.'
  },
  {
    id: 'bardo',
    name: 'Bardo',
    icon: '🎵',
    color: '#e67e22',
    role: 'Suporte / Versatilidade',
    difficulty: 'Avançado',
    lore: 'Mestres das artes e da palavra, bardos influenciam aliados e inimigos com canções e histórias. Nenhuma classe é tão versátil — e nenhuma exige tanto domínio do sistema para aproveitar ao máximo.',
    baseStats: { forca: 1, habilidade: 3, resistencia: 2, armadura: 1, poderFogo: 4 },
    pvBase: 12,
    freeVantagens: [
      { name: 'Inspiração Bardística', description: '1×/turno: aliado à vista ganha +1d6 em um teste de sua escolha. Dura até o início do seu próximo turno.' },
      { name: 'Jack of All Trades', description: '+1 em todos os testes de perícia que não possui treinamento.' },
      { name: 'Magia Bardística', description: 'Acesso a magias de qualquer escola (custo +1 PF), máximo Focus 2.' }
    ],
    traits: [
      'F1 H3 R2 A1 PM4',
      'Inspiração: +1d6 em testes de aliado',
      '+1 em toda perícia não treinada',
      'Magia de qualquer escola (Focus máx. 2)',
      'Habilidade social incomparável'
    ],
    playstyle: 'Suporte tático — potencie aliados, enfraqueza inimigos, nunca lute diretamente.'
  },
  {
    id: 'druida',
    name: 'Druida',
    icon: '🌿',
    color: '#27ae60',
    role: 'Magia Natural / Suporte',
    difficulty: 'Intermediário',
    lore: 'Guardiões da natureza, druidas canalizam o poder das estações e das criaturas selvagens. Em uma floresta subterrânea como a de Allihanna, são especialmente poderosos.',
    baseStats: { forca: 2, habilidade: 2, resistencia: 3, armadura: 2, poderFogo: 6 },
    pvBase: 16,
    freeVantagens: [
      { name: 'Forma Animal', description: '1×/combate: transforma-se em uma besta de CR até seu nível por 3 rodadas.' },
      { name: 'Magia Natural', description: '3 pontos de Focus para Caminhos Naturais (Terra, Água, Ar, Fogo). Magias de natureza −1 PF.' }
    ],
    traits: [
      'F2 H2 R3 A2 PM6',
      'Forma Animal 1×/combate',
      '3 pontos de Focus (Caminhos Naturais)',
      'Magias naturais −1 PF',
      'Cura por Regeneração (não Cura Divina)'
    ],
    playstyle: 'Adaptabilidade — mude de forma para o que o encontro precisa e gerencie natureza.'
  },
  {
    id: 'paladino',
    name: 'Paladino',
    icon: '🛡️',
    color: '#2980b9',
    role: 'Tanque / Anti-mal',
    difficulty: 'Intermediário',
    lore: 'Guerreiros sagrados a serviço de um deus de bem, paladinos combinam a dureza do guerreiro com o poder divino do clérigo. Implacáveis contra o mal, são os inimigos naturais de vampiros, demônios e lichs.',
    baseStats: { forca: 3, habilidade: 2, resistencia: 3, armadura: 3, poderFogo: 2 },
    pvBase: 18,
    freeVantagens: [
      { name: 'Imposição de Mãos', description: '1×/combate: cura (Nível × R) PV tocando um aliado ou causa o mesmo como dano sagrado a mortos-vivos.' },
      { name: 'Aura de Proteção', description: 'Aliados dentro de 3m ganham +1 em testes de Resistência contra magia e efeitos de mal.' },
      { name: 'Golpe Divino', description: '1×/rodada: adiciona 1d6 de dano sagrado a um ataque físico.' }
    ],
    traits: [
      'F3 H2 R3 A3 PM2',
      'Imposição de Mãos: cura ou dano sagrado 1×/combate',
      'Aura +1 R em aliados próximos',
      'Golpe Divino +1d6 sagrado/rodada',
      'Detecta o Mal automaticamente'
    ],
    playstyle: 'Protetor do grupo — absorva dano, bênçoe aliados e destrua o mal com golpes sagrados.'
  },
  {
    id: 'barbaro',
    name: 'Bárbaro',
    icon: '🪓',
    color: '#a04020',
    role: 'Dano Físico / Tanque Selvagem',
    difficulty: 'Iniciante',
    lore: 'Guerreiros das terras selvagens, bárbaros entram em fúria para suportar ferimentos que matariam qualquer outro. Sem treinamento formal, compensam com força bruta e resistência sobre-humana.',
    baseStats: { forca: 3, habilidade: 2, resistencia: 4, armadura: 2, poderFogo: 0 },
    pvBase: 22,
    freeVantagens: [
      { name: 'Fúria Bárbara', description: 'Gasta 2 PF (ou 0 se não tiver PF): +2 F e +2 R por 3 rodadas. Após, fica Fatigado (−1 F e R) por 1 rodada.' },
      { name: 'Alma Primitiva', description: '+2 em testes de Resistência contra magias e efeitos mentais. Imune a Medo.' }
    ],
    traits: [
      'F3 H2 R4 A2 PM0',
      'Fúria Bárbara: +2F+2R por 3 rodadas',
      'Imune a Medo',
      '+2 Resistência contra magia',
      'Maior PV do jogo'
    ],
    playstyle: 'Entre em fúria, absorva punição, destrua tudo à frente.'
  },
  {
    id: 'monge',
    name: 'Monge',
    icon: '👊',
    color: '#d4a017',
    role: 'Combate Desarmado / Velocidade',
    difficulty: 'Intermediário',
    lore: 'Discípulos de disciplinas físicas e espirituais, monges transformam o próprio corpo em arma. Sem armadura, movem-se com uma graça letal que confunde e destrói os inimigos.',
    baseStats: { forca: 2, habilidade: 4, resistencia: 2, armadura: 0, poderFogo: 4 },
    pvBase: 14,
    freeVantagens: [
      { name: 'Ataque Desarmado', description: 'Ataques sem arma causam 1d6+F de dano (como uma arma média). Pode realizar dois ataques desarmados por rodada.' },
      { name: 'Armadura de Ki', description: 'Usa H como bônus de Armadura quando desarmado e sem armadura. PF funciona como reserva de Ki para habilidades.' }
    ],
    traits: [
      'F2 H4 R2 A0 PM4',
      'Ataque desarmado: 1d6+F (dois por rodada)',
      'A = H quando sem armadura (Ki)',
      'PF = reserva de Ki',
      'Alta velocidade de movimento'
    ],
    playstyle: 'Velocidade e precisão — maximize H, ignore armadura, destrua com rajadas de golpes.'
  },
];



export const CLASS_MAP = new Map<CharacterClass, ClassDef>(
  ALL_CLASSES.map(c => [c.id, c])
);
