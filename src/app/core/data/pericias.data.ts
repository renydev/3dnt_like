// Perícias do 3DeT Victory — lista oficial completa do manual (cap. Personagens, "Perícias", pág. 40-41)
// Cada perícia custa 1 ponto e cobre uma área ampla de atuação — sem especializações.

export interface EspecializacaoDef {
  id: string;
  name: string;
  description: string;
}

export interface PericiaDef {
  id: string;
  name: string;
  icon: string;
  cost: number; // sempre 1 no 3DeT Victory
  category: 'combate' | 'conhecimento' | 'social' | 'fisico' | 'tecnico' | 'criminal';
  description: string;
  especializacoes: EspecializacaoDef[];
}

export const ALL_PERICIAS: PericiaDef[] = [
  {
    id: 'luta',
    name: 'Luta',
    icon: '🥊',
    cost: 1,
    category: 'combate',
    description: 'Você sabe atacar e se defender em combate, corpo a corpo ou à distância. Também envolve a parte teórica: reconhecer estilos de luta, analisar técnicas de inimigos e desenvolver táticas. Conflitos violentos quase sempre exigem testes de Luta.',
    especializacoes: [],
  },
  {
    id: 'animais',
    name: 'Animais',
    icon: '🐾',
    cost: 1,
    category: 'fisico',
    description: 'Você sabe cuidar, adestrar, cavalgar e lidar com animais e outras criaturas irracionais, como vários monstros. Substitui Medicina, mas apenas para animais. Com bons resultados, consegue até se comunicar com eles.',
    especializacoes: [],
  },
  {
    id: 'arte',
    name: 'Arte',
    icon: '🎨',
    cost: 1,
    category: 'conhecimento',
    description: 'Você sabe fazer performances artísticas como cantar, dançar, tocar música, cozinhar, fazer cosplay (e se disfarçar), desenhar e avaliar objetos de arte.',
    especializacoes: [],
  },
  {
    id: 'esporte',
    name: 'Esporte',
    icon: '🏃',
    cost: 1,
    category: 'fisico',
    description: 'Você conhece os muitos tipos de esportes e suas regras, além de ser capacitado em atividades físicas como correr, escalar, nadar, fazer acrobacias, equilibrar-se e saltar.',
    especializacoes: [],
  },
  {
    id: 'influencia',
    name: 'Influência',
    icon: '🗣️',
    cost: 1,
    category: 'social',
    description: 'Você sabe convencer outros a acreditar em algo ou fazer o que você quer. Envolve diplomacia, liderança, intimidação, sedução, blefe, hipnose, lábia, barganha e obter informações.',
    especializacoes: [],
  },
  {
    id: 'manha',
    name: 'Manha',
    icon: '🃏',
    cost: 1,
    category: 'criminal',
    description: 'Você sabe fazer coisas malandras ou ilegais: construir (e sabotar) armadilhas, arrombar portas e fechaduras, bater carteiras, criar (e decifrar) mensagens criptografadas, se disfarçar, falsificar objetos, ser furtivo, intimidar e rastrear pistas e pegadas.',
    especializacoes: [],
  },
  {
    id: 'maquinas',
    name: 'Máquinas',
    icon: '⚙️',
    cost: 1,
    category: 'tecnico',
    description: 'Você sabe operar, construir e consertar máquinas, veículos e aparelhos de todo tipo. Também lida com computadores, hackeia sistemas, navega na internet e joga games ou simulações. Substitui Medicina, mas apenas para construtos.',
    especializacoes: [],
  },
  {
    id: 'medicina',
    name: 'Medicina',
    icon: '⚕️',
    cost: 1,
    category: 'tecnico',
    description: 'Você sabe realizar primeiros socorros, diagnósticos, tratar doenças e venenos, fazer cirurgias e todo tipo de conhecimento de saúde. Pode despertar um personagem inconsciente ou estabilizar um quase morto.',
    especializacoes: [],
  },
  {
    id: 'mistica',
    name: 'Mística',
    icon: '🔮',
    cost: 1,
    category: 'conhecimento',
    description: 'Você sabe sobre forças sobrenaturais e artes místicas. Usada para atacar ou defender com poderes mágicos (como a vantagem Magia), e para reconhecer, contra-atacar e teorizar sobre conhecimentos ocultos, magia e criaturas mágicas.',
    especializacoes: [],
  },
  {
    id: 'percepcao',
    name: 'Percepção',
    icon: '👁️',
    cost: 1,
    category: 'conhecimento',
    description: 'Você sabe usar seus sentidos para perceber melhor o mundo ao redor: ouvir ruídos baixos, notar coisas e personagens distantes ou escondidos, ler lábios, rastrear pistas, evitar surpresas e até notar se alguém está mentindo.',
    especializacoes: [],
  },
  {
    id: 'saber',
    name: 'Saber',
    icon: '📚',
    cost: 1,
    category: 'conhecimento',
    description: 'Você sabe tudo sobre tudo: qualquer conhecimento teórico em ciências, idiomas e até assuntos sobrenaturais, ou como e onde pesquisá-los. Engloba todos os campos do conhecimento.',
    especializacoes: [],
  },
  {
    id: 'sobrevivencia',
    name: 'Sobrevivência',
    icon: '🌲',
    cost: 1,
    category: 'fisico',
    description: 'Você sabe subsistir e se orientar em condições adversas: encontrar e produzir alimento, construir abrigos, rastrear pistas, reconhecer criaturas selvagens, construir e sabotar armadilhas, ser furtivo, nadar e prever o clima.',
    especializacoes: [],
  },
];

export const PERICIA_MAP = new Map<string, PericiaDef>(
  ALL_PERICIAS.map(p => [p.id, p])
);

export const PERICIA_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'combate',      label: 'Combate',      icon: '🥊' },
  { id: 'conhecimento', label: 'Conhecimento', icon: '📚' },
  { id: 'social',       label: 'Social',       icon: '🤝' },
  { id: 'fisico',       label: 'Físico',        icon: '💪' },
  { id: 'tecnico',      label: 'Técnico',       icon: '🔧' },
  { id: 'criminal',     label: 'Criminal',      icon: '🃏' },
];
