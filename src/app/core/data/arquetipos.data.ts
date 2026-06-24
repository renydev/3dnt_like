import { CharacterRace } from '../models/character.model';

export interface ArquetipoPoder {
  name: string;
  description: string;
}

export interface Arquetipo {
  id: CharacterRace;
  name: string;
  icon: string;
  lore: string;
  /** Custo do arquétipo em PP (0 para Humano, 1 ou 2 para os demais). */
  cost: number;
  /** Os 3 poderes do arquétipo, cada um equivalente a uma vantagem ou desvantagem nomeada. */
  poderes: ArquetipoPoder[];
  /** Resumo curto dos poderes para a UI (chips). */
  traits: string[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  color: string;
}

// Os 25 Arquétipos oficiais do 3DeT Victory (Manual de Arquétipos, cap. Personagens).
export const ALL_ARQUETIPOS: Arquetipo[] = [
  {
    id: 'humano', name: 'Humano', icon: '👤', cost: 0, color: '#c97a20', difficulty: 'Fácil',
    lore: 'Versáteis e adaptáveis, humanos ainda superam todas as outras espécies em quantidade na Era das Arcas. Mais iniciativa, mais energia, mais ambição — mas vidas curtas.',
    poderes: [
      { name: 'Mais Além', description: 'Uma vez por cena, gaste 2PM para ter Ganho em um teste.' },
    ],
    traits: ['Mais Além (1×/cena, 2PM = Ganho)'],
  },
  {
    id: 'aberrante', name: 'Aberrante', icon: '👁️', cost: 1, color: '#6b8e23', difficulty: 'Médio',
    lore: 'Seres que não pertencem a este universo — surgidos de experimentos insanos, mutações ou corrupção cósmica. Bizarros demais até para a Era das Arcas.',
    poderes: [
      { name: 'Deformidade', description: 'Escolha uma perícia: ao testá-la (mesmo sem possuí-la), o atributo correspondente tem +1.' },
      { name: 'Teratismo', description: 'Recebe uma Técnica Comum à sua escolha (cumprindo os requisitos dela).' },
      { name: 'Monstruoso', description: 'Desvantagem: aparência grotesca, Perda na iniciativa e em testes sociais sobre aparência.' },
    ],
    traits: ['Deformidade (+1 em uma perícia)', 'Teratismo (Técnica Comum grátis)', 'Monstruoso'],
  },
  {
    id: 'abissal', name: 'Abissal', icon: '😈', cost: 1, color: '#8b0000', difficulty: 'Médio',
    lore: 'Demônios, diabos, infernais ou oni — nativos de planos extraplanares malignos como o Abismo ou os Nove Infernos, visitando a Terra por objetivos próprios ou a serviço de um patrono.',
    poderes: [
      { name: 'Ágil', description: 'Esquivos como gatos — que também são demônios.' },
      { name: 'Desfavor', description: 'Gaste uma ação e 3PM para forçar um teste de Resistência (oposto ao seu Poder) em alvo Perto; se falhar, Perda em todos os testes até o próximo turno.' },
      { name: 'Infame', description: 'Desvantagem: você é um demônio, esperava o quê?' },
    ],
    traits: ['Ágil', 'Desfavor', 'Infame'],
  },
  {
    id: 'alien', name: 'Alien', icon: '👽', cost: 1, color: '#2ecc71', difficulty: 'Médio',
    lore: 'Estrangeiro de outro planeta, época ou dimensão. Superior aos humanos em alguns aspectos, inferior em outros, e sempre com dificuldade de se adaptar à cultura local.',
    poderes: [
      { name: 'Talento', description: 'Escolha uma vantagem entre Ágil, Carismático, Forte, Gênio, Resoluto ou Vigoroso.' },
      { name: 'Xenobiologia', description: 'Escolha uma vantagem que possua: você pode usá-la por metade do custo em PM.' },
      { name: 'Inculto', description: 'Desvantagem: inaptidão à nossa cultura.' },
    ],
    traits: ['Talento (atributo secundário)', 'Xenobiologia (meio custo)', 'Inculto'],
  },
  {
    id: 'anao', name: 'Anão', icon: '⛏️', cost: 1, color: '#7f8c8d', difficulty: 'Fácil',
    lore: 'Não passam de 1,30m, mas são mais robustos que humanos. Adoram trabalho duro e minucioso, aderecos metálicos pesados, barbas longas e cerveja em quantidade industrial.',
    poderes: [
      { name: 'Abascanto', description: 'Ganho em testes de Resistência para evitar ou cancelar efeitos maléficos (exceto dano), como Anulação, Desgaste, Paralisia.' },
      { name: 'A Ferro e Fogo', description: 'Ao testar Máquinas (mesmo sem a perícia), o atributo correspondente tem +1. Também recebe Sentido (Infravisão).' },
      { name: 'Lento', description: 'Desvantagem: perninhas curtas.' },
    ],
    traits: ['Abascanto', 'A Ferro e Fogo (+1 Máquinas, Infravisão)', 'Lento'],
  },
  {
    id: 'anfibio', name: 'Anfíbio', icon: '🐸', cost: 1, color: '#1abc9c', difficulty: 'Fácil',
    lore: 'Tritões, sereias, elfos-do-mar, homens-sapo ou mutantes aquáticos — seres que vivem e agem tanto n\'água quanto em terra firme.',
    poderes: [
      { name: 'Imune (Anfíbio)', description: 'Move-se e respira normalmente embaixo d\'água; orienta-se no escuro percebendo formas.' },
      { name: 'Vigoroso', description: 'Mais resistente por sua tolerância a mudanças de pressão.' },
      { name: 'Ambiente', description: 'Desvantagem: praticamente inventada para você (depende de água por perto).' },
    ],
    traits: ['Imune (Anfíbio)', 'Vigoroso', 'Ambiente'],
  },
  {
    id: 'celestial', name: 'Celestial', icon: '😇', cost: 1, color: '#f1c40f', difficulty: 'Médio',
    lore: 'Anjos ou tenshi, nativos de planos superiores benignos — aparência humana luminosa, de animais nobres, ou formas místicas incompreensíveis.',
    poderes: [
      { name: 'Carismático', description: 'Facilidade para influenciar pessoas.' },
      { name: 'Arrebatar', description: 'Gaste um movimento e 3PM para conceder Ganho ao teste de perícia de um aliado Perto ou Longe (até o turno seguinte dele).' },
      { name: 'Código', description: 'Desvantagem: todo celestial é guiado por pelo menos um código de conduta.' },
    ],
    traits: ['Carismático', 'Arrebatar', 'Código (qualquer)'],
  },
  {
    id: 'centauro', name: 'Centauro', icon: '🐴', cost: 2, color: '#a0522d', difficulty: 'Médio',
    lore: 'Torso humano sobre corpo de quatro ou mais patas — cavalo, leão, lagarto, aranha ou escorpião. Vivem reclusos nos ermos, amigáveis ou territoriais.',
    poderes: [
      { name: 'Corpo Táurico', description: 'Pague 1PM para crítico com 5-6 em testes de Poder de esforço físico (não ataque), iniciativa, e Habilidade para correr/perseguir.' },
      { name: 'Vigoroso', description: 'Robustos e resistentes.' },
      { name: 'Diferente', description: 'Desvantagem: não pode usar roupas, veículos ou equipamentos feitos para humanos.' },
    ],
    traits: ['Corpo Táurico', 'Vigoroso', 'Diferente'],
  },
  {
    id: 'ciborgue', name: 'Ciborgue', icon: '🤖', cost: 2, color: '#34495e', difficulty: 'Médio',
    lore: 'Parte máquina, parte ser vivo — humanos (ou outros) com partes robóticas, máquinas com partes orgânicas, ou meios-golens com partes artificiais mágicas.',
    poderes: [
      { name: 'Construto Vivo', description: 'Recupera PV normalmente, mas também pode ser consertado por outro personagem — ambos os métodos funcionam.' },
      { name: 'Imune', description: 'Imune a Abiótico, Doenças e Resiliente.' },
      { name: 'Diretriz', description: 'Desvantagem: escolha um Código ou Transtorno (travas de programação mental).' },
    ],
    traits: ['Construto Vivo', 'Imune (Abiótico, Doenças, Resiliente)', 'Diretriz'],
  },
  {
    id: 'construto', name: 'Construto', icon: '⚙️', cost: 1, color: '#95a5a6', difficulty: 'Fácil',
    lore: 'Androide, golem ou outro ser artificial de forma e tamanho humanos — produzido em massa, animado por magia, ou quase indistinguível de uma pessoa.',
    poderes: [
      { name: 'Imune', description: 'Imune a Abiótico, Doenças, Resiliente e Sem Mente.' },
      { name: 'Bateria', description: 'Não come, bebe ou dorme, mas precisa recarregar energia (bateria, combustível, cristal mágico).' },
      { name: 'Sem Vida', description: 'Desvantagem: não pode ser curado, apenas consertado.' },
    ],
    traits: ['Imune (Abiótico, Doenças, Resiliente, Sem Mente)', 'Bateria', 'Sem Vida'],
  },
  {
    id: 'dahllan', name: 'Dahllan', icon: '🌳', cost: 1, color: '#27ae60', difficulty: 'Médio',
    lore: 'Parte humanas, parte fadas, parte plantas — seiva de árvore correndo nas veias. Quase todas nascem ou emergem das matas profundas, cabelo que muda como as estações.',
    poderes: [
      { name: 'Bênção da Natureza', description: 'Gaste um movimento e 2PM para transformar a pele em casca de árvore: Ganho em todas as jogadas de Defesa até o próximo turno.' },
      { name: 'Empatia Selvagem', description: 'Em testes de Animais (mesmo sem a perícia), o atributo correspondente tem +1.' },
      { name: 'Código Dahllan', description: 'Desvantagem: não consome produtos de origem animal; nunca ataca um animal nem deixa de ajudá-lo.' },
    ],
    traits: ['Bênção da Natureza', 'Empatia Selvagem (+1 Animais)', 'Código Dahllan'],
  },
  {
    id: 'elfo', name: 'Elfo', icon: '🌿', cost: 1, color: '#2ecc71', difficulty: 'Médio',
    lore: 'Belos, esguios, orelhas pontiagudas, talento para magia e vidas muito longas. Vivem isolados na natureza ou totalmente integrados às cidades humanas.',
    poderes: [
      { name: 'Impecável', description: 'Escolha uma vantagem entre Ágil, Carismático ou Gênio.' },
      { name: 'Natureza Mística', description: 'Em testes de Mística (mesmo sem a perícia), o atributo correspondente tem +1.' },
      { name: 'Frágil', description: 'Desvantagem: compleição física delicada, vulnerável a efeitos nocivos.' },
    ],
    traits: ['Impecável', 'Natureza Mística (+1 Mística)', 'Frágil'],
  },
  {
    id: 'fada', name: 'Fada', icon: '🧚', cost: 1, color: '#e91e63', difficulty: 'Médio',
    lore: 'Nome genérico para seres mágicos ligados à natureza — dríades, sílfides, duendes, sátiros, ninfas. Curiosas e brincalhonas, mas podem esconder séculos de sabedoria.',
    poderes: [
      { name: 'Magia das Fadas', description: 'Escolha entre Magia ou Ilusão: ganha a vantagem e sempre gasta –1PM (mín. 1) para usá-la.' },
      { name: 'Infame', description: 'Fadas não são levadas muito a sério.' },
      { name: 'Delicada', description: 'Desvantagem: escolha entre Diferente (pequenina) ou Frágil (tamanho normal).' },
    ],
    traits: ['Magia das Fadas (Magia ou Ilusão, -1PM)', 'Infame', 'Delicada'],
  },
  {
    id: 'fantasma', name: 'Fantasma', icon: '👻', cost: 2, color: '#bdc3c7', difficulty: 'Difícil',
    lore: 'Morto-vivo imaterial, espírito descarnado — surge quando algum evento poderoso impede uma alma de encontrar o descanso eterno.',
    poderes: [
      { name: 'Espírito', description: 'Versão invertida de Incorpóreo: sempre imaterial, imune a causar/receber dano, pode gastar PM para ficar sólido durante uma cena. Também Imune (Abiótico, Doenças) e Sem Vida.' },
      { name: 'Paralisia', description: 'Pode paralisar vítimas com sua aura de pânico.' },
      { name: 'Devoto', description: 'Preso a este mundo por amor, raiva, vingança ou uma promessa — sempre em uma missão interminável.' },
    ],
    traits: ['Espírito (imaterial)', 'Paralisia', 'Devoto'],
  },
  {
    id: 'goblin', name: 'Goblin', icon: '👺', cost: 1, color: '#16a085', difficulty: 'Difícil',
    lore: 'Humanoides pequenos de pele cinzenta e olhos brilhantes, formando as maiores comunidades viajantes do planeta. Curiosos, hiperativos e inventores improváveis.',
    poderes: [
      { name: 'Espertalhão', description: 'Ao testar Manha (mesmo sem a perícia), o atributo correspondente tem +1.' },
      { name: 'Subterrâneo', description: 'Recebe Sentido (Infravisão) e Ganho em testes de Resistência contra doenças e venenos.' },
      { name: 'Diferente', description: 'Desvantagem: pequenos e pouco preocupados em se vestir bem.' },
    ],
    traits: ['Espertalhão (+1 Manha)', 'Subterrâneo', 'Diferente'],
  },
  {
    id: 'hynne', name: 'Hynne', icon: '🍀', cost: 1, color: '#f39c12', difficulty: 'Médio',
    lore: 'Também conhecidos como halflings, não passam de 90cm — pequenos na ambição quanto no tamanho, apreciadores de boa comida, conforto e (às vezes) grandes aventuras.',
    poderes: [
      { name: 'Atirador', description: 'Gaste 2PM para Ganho em um teste de ataque Longe, em combate violento.' },
      { name: 'Encantador', description: 'Ao testar Influência (mesmo sem a perícia), o atributo correspondente tem +1.' },
      { name: 'Diferente', description: 'Desvantagem: tamanho diminuto traz dificuldades cotidianas.' },
    ],
    traits: ['Atirador', 'Encantador (+1 Influência)', 'Diferente'],
  },
  {
    id: 'kallyanach', name: 'Kallyanach', icon: '🐉', cost: 2, color: '#c0392b', difficulty: 'Difícil',
    lore: 'Meios-dragões — garras, presas, cauda e/ou escamas, às vezes grandes asas coriáceas. Raros, raramente formam famílias, buscam objetivos ou respostas sobre sua origem.',
    poderes: [
      { name: 'Baforada', description: 'Recebe um Ataque Especial (Área, Distante ou Potente), combinável com outros, sempre gastando –1PM (mín. 1).' },
      { name: 'Poder Dracônico', description: 'Escolha entre Forte e Carismático.' },
      { name: 'Código dos Dragões', description: 'Desvantagem: nunca esquece e sempre cumpre uma promessa feita.' },
    ],
    traits: ['Baforada (Ataque Especial)', 'Poder Dracônico', 'Código dos Dragões'],
  },
  {
    id: 'kemono', name: 'Kemono', icon: '🐾', cost: 1, color: '#d35400', difficulty: 'Fácil',
    lore: 'Animais antropomórficos ou humanoides com traços ferais — orelhas, cauda, garras, chifres ou pelagem. Tão civilizados e integrados quanto qualquer humano.',
    poderes: [
      { name: 'Percepção Apurada', description: 'Ao testar Percepção (mesmo sem a perícia nem Sentido), o atributo correspondente tem +1.' },
      { name: 'Talento', description: 'Escolha uma vantagem entre Ágil, Carismático, Forte, Gênio, Resoluto ou Vigoroso.' },
      { name: 'Cacoete', description: 'Desvantagem: escolha entre Antipático, Atrapalhado, Fracote, Frágil, Indeciso ou Tapado.' },
    ],
    traits: ['Percepção Apurada (+1 Percepção)', 'Talento (atributo secundário)', 'Cacoete'],
  },
  {
    id: 'medusa', name: 'Medusa', icon: '🐍', cost: 1, color: '#9b59b6', difficulty: 'Médio',
    lore: 'Corpo humanoide e cabelo de serpentes. Diferente das lendas monstruosas, as Viajantes são civilizadas, sociáveis e adoram as redes sociais.',
    poderes: [
      { name: 'Carismático', description: 'Facilidade para influenciar pessoas.' },
      { name: 'Olhar Atordoante', description: 'Gaste um movimento e 3PM para forçar um teste de Resistência (oposto ao seu Poder) em alvo Perto; se falhar, ele não age por uma rodada e tem Perda na defesa.' },
      { name: 'Fracote', description: 'Desvantagem: pouco vigor físico.' },
    ],
    traits: ['Carismático', 'Olhar Atordoante', 'Fracote'],
  },
  {
    id: 'minotauro', name: 'Minotauro', icon: '🐂', cost: 1, color: '#d35400', difficulty: 'Difícil',
    lore: 'Humanoides robustos com cabeça bovina (touro, búfalo, gnu, bisão, alce). Orgulhosos, sisudos, determinados e muito competitivos.',
    poderes: [
      { name: 'Atlético', description: 'Ao testar Esporte (mesmo sem a perícia), o atributo correspondente tem +1.' },
      { name: 'Sentido Labiríntico', description: 'Sempre sabe o caminho de qualquer lugar em que já esteve; Ganho em testes de Percepção para farejar.' },
      { name: 'Transtorno (Fobia)', description: 'Desvantagem: medo de altura — quedas de 3m ou mais ativam a fobia.' },
    ],
    traits: ['Atlético (+1 Esporte)', 'Sentido Labiríntico', 'Transtorno (Fobia de altura)'],
  },
  {
    id: 'ogro', name: 'Ogro', icon: '🧌', cost: 1, color: '#7d6608', difficulty: 'Médio',
    lore: 'Humanoides imensos e brutais — "ogro" tornou-se sinônimo de qualquer não-humano gigantesco. Procurados como seguranças, soldados e mercenários.',
    poderes: [
      { name: 'Destruidor', description: 'Em combate violento, ao conseguir um crítico atacando um oponente Perto, pague 2PM para somar seu Poder mais uma vez (1×/ataque).' },
      { name: 'Intimidador', description: 'Ganho em testes de Influência para assustar, intimidar ou amedrontar.' },
      { name: 'Diferente', description: 'Desvantagem: quase nada é tão grande quanto um ogro.' },
    ],
    traits: ['Destruidor', 'Intimidador', 'Diferente'],
  },
  {
    id: 'osteon', name: 'Osteon', icon: '💀', cost: 2, color: '#ecf0f1', difficulty: 'Difícil',
    lore: 'Esqueletos com inteligência e vontade próprias, diferentes dos mortos-vivos sem mente que infestam as Arcas. Operários, soldados, pesquisadores ou Arcanautas.',
    poderes: [
      { name: 'Imune', description: 'Imune a Abiótico, Doenças e Resiliente — você é um morto-vivo.' },
      { name: 'Memória Póstuma', description: 'Escolha uma perícia: ao testá-la (mesmo sem possuí-la), o atributo correspondente tem +1.' },
      { name: 'Sem Vida', description: 'Desvantagem: só recupera PV com descanso ou vantagens, não com cura comum.' },
    ],
    traits: ['Imune (Abiótico, Doenças, Resiliente)', 'Memória Póstuma', 'Sem Vida'],
  },
  {
    id: 'qareen', name: 'Qareen', icon: '🧞', cost: 2, color: '#8e44ad', difficulty: 'Difícil',
    lore: 'Meios-gênios — descendem de mortais e criaturas arcanas. Nascem com tatuagens elaboradas que brilham com magia. Generosos e sempre ansiosos por ajudar.',
    poderes: [
      { name: 'Desejos', description: 'Tem a vantagem Magia; ao lançar uma magia pedida por outra pessoa desde seu último turno, o custo cai em –2PM (mín. 1).' },
      { name: 'Carismático', description: 'Facilidade para influenciar pessoas.' },
      { name: 'Código da Gratidão', description: 'Desvantagem: fica a serviço de quem lhe prestou um grande favor, até igualar a dívida.' },
    ],
    traits: ['Desejos (Magia)', 'Carismático', 'Código da Gratidão'],
  },
  {
    id: 'sauroide', name: 'Sauroide', icon: '🦎', cost: 2, color: '#229954', difficulty: 'Difícil',
    lore: 'Seres-réptil combinando traços humanos com lagartos, crocodilos, serpentes ou dinossauros. Robustos e rústicos, mas plenamente capazes de viver em sociedade.',
    poderes: [
      { name: 'Cascudo', description: 'Recebe Resoluto e Vigoroso.' },
      { name: 'Camuflagem', description: 'Movimentos cuidadosos e coloração adaptável — Ganho em testes para se esconder.' },
      { name: 'Fraqueza (Frio)', description: 'Desvantagem: fica lerdo no frio.' },
    ],
    traits: ['Cascudo (Resoluto + Vigoroso)', 'Camuflagem', 'Fraqueza (Frio)'],
  },
  {
    id: 'vampiro', name: 'Vampiro', icon: '🧛', cost: 1, color: '#641e16', difficulty: 'Difícil',
    lore: 'Galantes e sedutores, entre os seres mais poderosos da Era das Arcas — mas pagam caro por esse poder, precisando se alimentar da vida dos vivos.',
    poderes: [
      { name: 'Talento', description: 'Escolha uma vantagem entre Ágil, Carismático, Forte, Gênio, Resoluto ou Vigoroso.' },
      { name: 'Imortal', description: 'Mesmo destruído, você volta — vampiro raiz, não vampiro gótico chorão.' },
      { name: 'Fraqueza (luz do dia)', description: 'Desvantagem: você não gosta nada do sol.' },
    ],
    traits: ['Talento (atributo secundário)', 'Imortal', 'Fraqueza (luz do dia)'],
  },
];

export const ARQUETIPO_MAP = new Map<CharacterRace, Arquetipo>(
  ALL_ARQUETIPOS.map(a => [a.id, a])
);
