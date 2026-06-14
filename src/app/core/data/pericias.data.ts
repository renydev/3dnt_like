// Perícias do 3D&T — cada uma custa 3 pontos e engloba todas as especializações
// Fonte: 3D&T Super Manual Turbo, cap. Perícias (págs. 41-44)

export interface EspecializacaoDef {
  id: string;
  name: string;
  description: string;
}

export interface PericiaDef {
  id: string;
  name: string;
  icon: string;
  cost: number; // sempre 3 no 3D&T base
  category: 'conhecimento' | 'social' | 'fisico' | 'tecnico' | 'criminal';
  description: string;
  especializacoes: EspecializacaoDef[];
}

export const ALL_PERICIAS: PericiaDef[] = [
  {
    id: 'animais',
    name: 'Animais',
    icon: '🐾',
    cost: 3,
    category: 'conhecimento',
    description: 'Você entende de animais. Sabe cuidar, tratar ferimentos, evitar animais perigosos, cavalgar, treinar e domar. Em mundos de fantasia, também permite se comunicar com animais.',
    especializacoes: [
      { id: 'animais_doma', name: 'Doma', description: 'Você sabe domar animais selvagens.' },
      { id: 'animais_montaria', name: 'Montaria', description: 'Você sabe montar cavalos, elefantes, camelos e outros animais.' },
      { id: 'animais_tratamento', name: 'Tratamento', description: 'Você sabe alimentar e cuidar de animais. Percebe se um animal está doente.' },
      { id: 'animais_treinamento', name: 'Treinamento', description: 'Você sabe treinar animais domésticos para truques simples: andar, parar, sentar, guardar e atacar.' },
      { id: 'animais_veterinaria', name: 'Veterinária', description: 'Diagnósticos, primeiros socorros e cirurgias em animais. Funciona como Medicina, mas somente para animais.' },
    ],
  },
  {
    id: 'arte',
    name: 'Arte',
    icon: '🎨',
    cost: 3,
    category: 'conhecimento',
    description: 'Você tem sensibilidade e talento para artes. Sabe cantar, dançar, desenhar e tocar instrumentos musicais. Exigência para certas magias que influenciam a mente e os sentimentos.',
    especializacoes: [
      { id: 'arte_atuacao', name: 'Atuação', description: 'Você é um ator. Pode simular emoções que não está sentindo.' },
      { id: 'arte_falsificacao', name: 'Falsificação', description: 'Cria cópias de cartas, documentos e obras de arte; reconhece peças falsas.' },
      { id: 'arte_fotografia', name: 'Fotografia', description: 'Sabe operar câmeras e, se tiver laboratório, revelar fotos.' },
      { id: 'arte_instrumentos', name: 'Instrumentos Musicais', description: 'Você sabe tocar instrumentos musicais de vários tipos.' },
      { id: 'arte_prestidigitacao', name: 'Prestidigitação', description: 'Faz truques com pequenos objetos — sumir moedas, lenços e cartas como mágica.' },
      { id: 'arte_redacao', name: 'Redação', description: 'Produz textos profissionais: relatórios, poesias, romances, reportagens, cartas de amor.' },
    ],
  },
  {
    id: 'ciencia',
    name: 'Ciência',
    icon: '🔬',
    cost: 3,
    category: 'conhecimento',
    description: 'Você é um cientista. Conhece física, química, biologia e outras ciências. Torna você algo como Reed Richards, Doc Brown ou a Tartaruga Ninja Donatello.',
    especializacoes: [
      { id: 'ciencia_biologia', name: 'Biologia', description: 'Conhece organismos vivos, ecossistemas e anatomia.' },
      { id: 'ciencia_fisica', name: 'Física', description: 'Domina leis de movimento, energia e eletricidade.' },
      { id: 'ciencia_quimica', name: 'Química', description: 'Cria compostos, antídotos, explosivos e venenos com equipamento adequado.' },
      { id: 'ciencia_matematica', name: 'Matemática', description: 'Cálculos avançados, estatística e lógica.' },
      { id: 'ciencia_astronomia', name: 'Astronomia', description: 'Conhece os astros, navegação celeste e calendários.' },
      { id: 'ciencia_arqueologia', name: 'Arqueologia', description: 'Identifica artefatos, ruínas e civilizações antigas.' },
    ],
  },
  {
    id: 'idiomas',
    name: 'Idiomas',
    icon: '🗣️',
    cost: 3,
    category: 'conhecimento',
    description: 'Você é um poliglota. Conhece os principais idiomas do mundo e aprende novos com facilidade. Sem esta Perícia, você fala apenas sua língua nativa.',
    especializacoes: [
      { id: 'idiomas_morse', name: 'Código Morse', description: 'Transmite e recebe mensagens em pontos e traços.' },
      { id: 'idiomas_criptografia', name: 'Criptografia', description: 'Cria e decifra mensagens secretas.' },
      { id: 'idiomas_leitura_labial', name: 'Leitura Labial', description: 'Descobre o que alguém diz observando os movimentos da boca.' },
      { id: 'idiomas_sinais', name: 'Linguagem de Sinais', description: 'Comunica-se sem som, com gestos.' },
      { id: 'idiomas_antigo', name: 'Idioma Antigo', description: 'Lê e fala línguas mortas ou arcanas (élfico clássico, anão antigo, dracônico…).' },
      { id: 'idiomas_estrangeiro', name: 'Idioma Estrangeiro', description: 'Domina um idioma específico além do nativo.' },
    ],
  },
  {
    id: 'investigacao',
    name: 'Investigação',
    icon: '🔍',
    cost: 3,
    category: 'conhecimento',
    description: 'Você é um policial, detetive ou agente secreto. Conhece técnicas de investigação: seguir pistas, encontrar impressões digitais, usar disfarces, instalar explosivos, decifrar códigos e desarmar armadilhas.',
    especializacoes: [
      { id: 'inv_armadilhas', name: 'Armadilhas', description: 'Constrói, arma e desarma armadilhas, explosivos e aparelhos de detecção.' },
      { id: 'inv_arrombamento', name: 'Arrombamento', description: 'Força portas e abre fechaduras trancadas.' },
      { id: 'inv_criptografia', name: 'Criptografia', description: 'Cria e decifra mensagens secretas.' },
      { id: 'inv_disfarce', name: 'Disfarce', description: 'Parece com outra pessoa ou oculta a própria aparência.' },
      { id: 'inv_falsificacao', name: 'Falsificação', description: 'Cria cópias de documentos e reconhece peças falsificadas.' },
      { id: 'inv_furtividade', name: 'Furtividade', description: 'Esconde-se e move-se em silêncio sem ser visto.' },
      { id: 'inv_interrogatorio', name: 'Interrogatório', description: 'Com perguntas habilidosas e pressão emocional, obtém informações de qualquer pessoa.' },
      { id: 'inv_intimidacao', name: 'Intimidação', description: 'Igual à Lábia, mas usa ameaças em vez de conversa amistosa.' },
      { id: 'inv_rastreio', name: 'Rastreio', description: 'Segue pistas e pegadas.' },
    ],
  },
  {
    id: 'maquinas',
    name: 'Máquinas',
    icon: '⚙️',
    cost: 3,
    category: 'tecnico',
    description: 'Você é bom com máquinas, veículos e computadores. Opera, pilota, dirige, constrói e conserta qualquer coisa com peças e ferramentas certas. Exigência para possuir e consertar Máquinas e Construtos.',
    especializacoes: [
      { id: 'maq_armadilhas', name: 'Armadilhas', description: 'Constrói, arma e desarma armadilhas, explosivos e aparelhos de detecção.' },
      { id: 'maq_computacao', name: 'Computação', description: 'Opera computadores, navega na Internet, quebra senhas e penetra em sistemas.' },
      { id: 'maq_conducao', name: 'Condução', description: 'Dirige veículos terrestres como carros, ônibus e motos.' },
      { id: 'maq_eletronica', name: 'Eletrônica', description: 'Constrói e conserta aparelhos eletrônicos.' },
      { id: 'maq_mecanica', name: 'Mecânica', description: 'Conserta (mas não constrói) máquinas, veículos e armas.' },
      { id: 'maq_pilotagem', name: 'Pilotagem', description: 'Pilota aeronaves, barcos e veículos de competição.' },
    ],
  },
  {
    id: 'medicina',
    name: 'Medicina',
    icon: '⚕️',
    cost: 3,
    category: 'tecnico',
    description: 'Você é médico ou curandeiro. Conhece o corpo humano, doenças, venenos e tratamentos. Pode realizar cirurgias, diagnosticar enfermidades e prestar primeiros socorros avançados.',
    especializacoes: [
      { id: 'med_cirurgia', name: 'Cirurgia', description: 'Realiza operações complexas com equipamento adequado.' },
      { id: 'med_diagnostico', name: 'Diagnóstico', description: 'Identifica doenças, venenos e condições ocultas.' },
      { id: 'med_farmacologia', name: 'Farmacologia', description: 'Prepara remédios, antídotos e toxinas.' },
      { id: 'med_primeiros_socorros', name: 'Primeiros Socorros', description: 'Estabiliza feridos e trata lesões em campo.' },
      { id: 'med_veterinaria', name: 'Veterinária', description: 'Aplica conhecimentos médicos em animais.' },
    ],
  },
  {
    id: 'sobrevivencia',
    name: 'Sobrevivência',
    icon: '🌲',
    cost: 3,
    category: 'fisico',
    description: 'Você sabe sobreviver em condições adversas: encontrar comida e água, montar acampamento, rastrear animais, prever clima e navegar sem instrumentos. Um Doutor Dollitle ou Tarzã.',
    especializacoes: [
      { id: 'sob_acampamento', name: 'Acampamento', description: 'Monta abrigos eficientes com materiais disponíveis no ambiente.' },
      { id: 'sob_buscaalimento', name: 'Busca de Alimento', description: 'Encontra comida e água potável em qualquer ambiente.' },
      { id: 'sob_clima', name: 'Leitura de Clima', description: 'Prevê mudanças climáticas com horas de antecedência.' },
      { id: 'sob_navegacao', name: 'Navegação', description: 'Orienta-se pelo sol, estrelas e marcos naturais.' },
      { id: 'sob_rastreio', name: 'Rastreio', description: 'Segue pistas e pegadas de humanos e animais.' },
    ],
  },
  {
    id: 'crime',
    name: 'Crime',
    icon: '🃏',
    cost: 3,
    category: 'criminal',
    description: 'Você conhece o submundo. Sabe furtar, usar armas ilegais, traficar, capangar e outras habilidades que a sociedade educada prefere não mencionar.',
    especializacoes: [
      { id: 'crime_arrombamento', name: 'Arrombamento', description: 'Abre fechaduras e força entradas sem deixar rastros.' },
      { id: 'crime_disfarce', name: 'Disfarce', description: 'Muda a própria aparência para não ser reconhecido.' },
      { id: 'crime_furto', name: 'Furto', description: 'Rouba objetos de pessoas sem que percebam.' },
      { id: 'crime_furtividade', name: 'Furtividade', description: 'Move-se em silêncio e nas sombras.' },
      { id: 'crime_rastreio', name: 'Rastreio', description: 'Segue alguém sem ser notado ou encontra esconderijos.' },
      { id: 'crime_jogatina', name: 'Jogatina', description: 'Joga e trapaceia em jogos de azar.' },
      { id: 'crime_venenos', name: 'Venenos', description: 'Prepara e aplica venenos e antídotos.' },
    ],
  },
  {
    id: 'esporte',
    name: 'Esporte',
    icon: '🏃',
    cost: 3,
    category: 'fisico',
    description: 'Você é um atleta. Sabe nadar, correr, escalar, lutar e praticar qualquer esporte físico com nível competitivo.',
    especializacoes: [
      { id: 'esp_acrobacia', name: 'Acrobacia', description: 'Realiza piruetas, saltos e manobras acrobáticas.' },
      { id: 'esp_corrida', name: 'Corrida', description: 'Corre mais rápido e por mais tempo que pessoas comuns.' },
      { id: 'esp_escalada', name: 'Escalada', description: 'Sobe paredes e penhascos com ou sem equipamento.' },
      { id: 'esp_jogos', name: 'Jogos', description: 'Competitivo em xadrez, tabuleiro, videogames e RPGs.' },
      { id: 'esp_mergulho', name: 'Mergulho', description: 'Usa equipamento de mergulho e respira sob pressão.' },
      { id: 'esp_natacao', name: 'Natação', description: 'Nada longas distâncias e manobra na água.' },
      { id: 'esp_pilotagem', name: 'Pilotagem', description: 'Pilota aeronaves, barcos e veículos de competição.' },
    ],
  },
  {
    id: 'manipulacao',
    name: 'Manipulação',
    icon: '🎭',
    cost: 3,
    category: 'social',
    description: 'Você sabe lidar com pessoas — para o bem ou para o mal. Convence, seduz, intimida e manipula com igual destreza. A Perícia de espiões, líderes e vigaristas.',
    especializacoes: [
      { id: 'man_labia', name: 'Lábia', description: 'Convence pessoas com conversa amistosa e argumentos criativos.' },
      { id: 'man_seducao', name: 'Sedução', description: 'Usa o charme pessoal para influenciar pessoas.' },
      { id: 'man_interrogatorio', name: 'Interrogatório', description: 'Extrai informações com pressão psicológica.' },
      { id: 'man_intimidacao', name: 'Intimidação', description: 'Impõe obediência através de ameaças e postura dominante.' },
      { id: 'man_lideranca', name: 'Liderança', description: 'Inspira aliados, aumentando moral e coordenação.' },
      { id: 'man_tortura', name: 'Tortura', description: 'Extrai informações através de métodos extremos (apenas com aprovação do Mestre).' },
    ],
  },
];

export const PERICIA_MAP = new Map<string, PericiaDef>(
  ALL_PERICIAS.map(p => [p.id, p])
);

export const PERICIA_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'conhecimento', label: 'Conhecimento', icon: '📚' },
  { id: 'social',       label: 'Social',       icon: '🤝' },
  { id: 'fisico',       label: 'Físico',        icon: '💪' },
  { id: 'tecnico',      label: 'Técnico',       icon: '🔧' },
  { id: 'criminal',     label: 'Criminal',      icon: '🃏' },
];
