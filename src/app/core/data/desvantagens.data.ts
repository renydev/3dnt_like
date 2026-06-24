// Desvantagens do 3DeT Victory — lista oficial completa do manual (cap. Personagens, "Desvantagens", pág. 64-74)

export type DesvantagemCategory = 'comportamental' | 'social' | 'fisica' | 'combate' | 'recursos' | 'especial';

export interface DesvantagemDef {
  id: string;
  name: string;
  refund: string; // pontos recebidos, como exibido no manual (ex: "-1pt", "-1 ou -2pt")
  category: DesvantagemCategory;
  icon: string;
  description: string;
}

export const DESVANTAGEM_CATEGORIES: { id: DesvantagemCategory; label: string }[] = [
  { id: 'comportamental', label: 'Comportamental' },
  { id: 'social',         label: 'Social' },
  { id: 'fisica',         label: 'Física' },
  { id: 'combate',        label: 'Combate' },
  { id: 'recursos',       label: 'Recursos' },
  { id: 'especial',       label: 'Especial' },
];

export const ALL_DESVANTAGENS: DesvantagemDef[] = [
  {
    id: 'ambiente', name: 'Ambiente', refund: '-1pt', category: 'especial', icon: '🌍',
    description: 'Você depende de um ambiente específico (água, clima, lugar). No início de cada cena, 1 em 1D significa que nada do seu ambiente existe ali, e você tem Perda em todos os testes.',
  },
  {
    id: 'amnesia', name: 'Amnésia', refund: '-2pt', category: 'especial', icon: '🌀',
    description: 'Você não conhece sua própria ficha — o mestre a mantém em segredo. Você descobre suas capacidades e limites por tentativa e erro durante o jogo.',
  },
  {
    id: 'antipatico', name: 'Antipático', refund: '-1pt', category: 'social', icon: '😠',
    description: 'Em testes de Poder envolvendo interação social, você tem Perda e nunca tem acertos críticos. Incompatível com Carismático.',
  },
  {
    id: 'assombrado', name: 'Assombrado', refund: '-1 ou -2pt', category: 'comportamental', icon: '👻',
    description: 'Você é perturbado por algo do passado. -1pt: 1 em 1D ao entrar em cena de risco, todos os testes têm Perda até o fim da cena. -2pt: acontece com qualquer resultado ímpar.',
  },
  {
    id: 'atrapalhado', name: 'Atrapalhado', refund: '-1pt', category: 'fisica', icon: '🤦',
    description: 'Em testes de Habilidade envolvendo coordenação e agilidade, você tem Perda e nunca tem acertos críticos. Incompatível com Ágil.',
  },
  {
    id: 'aura', name: 'Aura', refund: '-1 ou -2pt', category: 'social', icon: '🌫️',
    description: 'Você emana uma aura negativa perceptível. -1pt: testes de outros Perto de você têm Perda. -2pt: o efeito alcança até Longe.',
  },
  {
    id: 'bateria', name: 'Bateria', refund: '-1pt', category: 'recursos', icon: '🔋',
    description: 'Ao chegar a 0PM você desliga, ficando inconsciente. Com PM abaixo de sua Habilidade, todos os seus testes têm Perda.',
  },
  {
    id: 'codigo', name: 'Código', refund: '-1pt cada', category: 'comportamental', icon: '📜',
    description: 'Você segue um código de conduta (Leis de Asimov, Código do Caçador, do Combate, da Derrota, da Gratidão, dos Heróis, da Honestidade, da Redenção...). Violá-lo causa Perda em todos os testes até se redimir.',
  },
  {
    id: 'dependencia', name: 'Dependência', refund: '-2pt', category: 'recursos', icon: '🩸',
    description: 'Você depende de algo raro ou proibido para viver (sangue, cérebros, substância ilícita). Não satisfazê-la diariamente causa Perda em todos os testes.',
  },
  {
    id: 'diferente', name: 'Diferente', refund: '-1pt', category: 'fisica', icon: '👽',
    description: 'Seu corpo é muito diferente do humanoide comum — você tem Perda ao usar itens feitos para outros (só usa bem o que foi feito para você).',
  },
  {
    id: 'elo_vital', name: 'Elo Vital', refund: '-1pt', category: 'combate', icon: '🔗',
    description: 'Você e um aliado (que também tem esta desvantagem) compartilham dano: sempre que um sofre dano, o outro perde PV na mesma quantidade. Curar um não cura o outro.',
  },
  {
    id: 'fracote', name: 'Fracote', refund: '-1pt', category: 'fisica', icon: '🪶',
    description: 'Em testes de Poder envolvendo esforço físico, você tem Perda e nunca tem acertos críticos. Incompatível com Forte.',
  },
  {
    id: 'fragil', name: 'Frágil', refund: '-1pt', category: 'fisica', icon: '🥚',
    description: 'Em testes de Resistência envolvendo saúde física (inclui testes de morte), você tem Perda e nunca tem acertos críticos. Incompatível com Vigoroso.',
  },
  {
    id: 'fraqueza', name: 'Fraqueza', refund: '-1 ou -2pt', category: 'especial', icon: '🍀',
    description: 'Existe algo a que você é vulnerável; Perto dele, todos os seus testes têm Perda. -1pt se for incomum (1 em 1D), -2pt se comum (1-3 em 1D).',
  },
  {
    id: 'furia', name: 'Fúria', refund: '-2pt', category: 'comportamental', icon: '😡',
    description: 'Ao sofrer dano ou se irritar, teste de Resistência (9 ou o dano recebido) ou entra em frenesi: ataca o alvo mais próximo, com Perda em testes não-ataque e vantagens custando PM em dobro.',
  },
  {
    id: 'inapto', name: 'Inapto', refund: '-1pt', category: 'especial', icon: '🚫',
    description: 'Escolha uma perícia que não possui: você está sempre em Perda nela, e qualquer falha é uma falha crítica.',
  },
  {
    id: 'inculto', name: 'Inculto', refund: '-1pt', category: 'social', icon: '🗣️',
    description: 'Você não conhece a cultura/língua local: dificuldade para ler e se comunicar, e Perda em testes sociais com quem não o entende.',
  },
  {
    id: 'indeciso', name: 'Indeciso', refund: '-1pt', category: 'comportamental', icon: '😟',
    description: 'Em testes de Resistência envolvendo força de vontade, você tem Perda e nunca tem acertos críticos. Incompatível com Resoluto.',
  },
  {
    id: 'infame', name: 'Infame', refund: '-1pt', category: 'social', icon: '💀',
    description: 'Você é conhecido por má fama: testes sociais com NPCs que o reconhecem sempre têm Perda. Incompatível com Famoso.',
  },
  {
    id: 'lento', name: 'Lento', refund: '-1pt', category: 'fisica', icon: '🐌',
    description: 'Sempre em Perda em testes de iniciativa, e gasta um movimento extra para cruzar cada distância. Incompatível com Aceleração.',
  },
  {
    id: 'maldicao', name: 'Maldição', refund: '-1 ou -2pt', category: 'especial', icon: '🪄',
    description: 'Você é vítima de uma maldição (criada com aprovação do mestre). -1pt: suave, mais constrangedora que prejudicial. -2pt: grave, com efeito mecânico real (ex.: recebe de volta o dano que causa).',
  },
  {
    id: 'monstruoso', name: 'Monstruoso', refund: '-1pt', category: 'social', icon: '👹',
    description: 'Aparência grotesca: sempre em Perda na iniciativa (exceto surpreendendo) e em testes sociais sobre aparência. Incompatível com Inofensivo.',
  },
  {
    id: 'municao', name: 'Munição', refund: '-1pt', category: 'combate', icon: '🔫',
    description: 'Sua arma/técnica precisa recarregar a cada uso: atacar sem antes gastar um movimento recarregando significa não somar Poder ao ataque (nem em críticos).',
  },
  {
    id: 'pacifista', name: 'Pacifista', refund: '-1 ou -2pt', category: 'comportamental', icon: '☮️',
    description: '-1pt: não pode fazer testes de ataque, só se defender. -2pt: não pode causar dano de forma alguma, nem com palavras. Violar causa Perda até se redimir.',
  },
  {
    id: 'pobreza', name: 'Pobreza', refund: '-1pt', category: 'recursos', icon: '💸',
    description: 'Todos os seus testes de compra são feitos em Perda. Incompatível com Riqueza.',
  },
  {
    id: 'ponto_fraco', name: 'Ponto Fraco', refund: '-1pt', category: 'combate', icon: '🎯',
    description: 'Você tem uma falha explorável. Quem a conhece pode gastar 1PM para Ganho contra você num teste que a explore.',
  },
  {
    id: 'protegido', name: 'Protegido', refund: '-1pt', category: 'recursos', icon: '🧒',
    description: 'Existe alguém que você precisa proteger. Enquanto ele está desaparecido, indefeso ou ferido, todos os seus testes têm Perda. Se ele morre, você ganha Assombrado (-2pt) sem ponto extra.',
  },
  {
    id: 'restricao', name: 'Restrição', refund: '-1 ou -2pt', category: 'recursos', icon: '⛓️',
    description: 'Sob certa condição, suas vantagens custam o dobro de PM. -1pt se incomum, -2pt se comum. Exige ao menos uma vantagem que gaste PM.',
  },
  {
    id: 'sem_vida', name: 'Sem Vida', refund: '-2pt', category: 'fisica', icon: '🤖',
    description: 'Você não é um ser vivo: nunca morre de verdade (pior resultado em teste de morte é inconsciente), mas não recupera PV por descanso, itens, Cura ou Regeneração — só conserto/restauração por perícia.',
  },
  {
    id: 'tapado', name: 'Tapado', refund: '-1pt', category: 'comportamental', icon: '🙃',
    description: 'Em testes de Habilidade envolvendo inteligência e raciocínio, você tem Perda e nunca tem acertos críticos. Incompatível com Gênio.',
  },
  {
    id: 'transtorno', name: 'Transtorno', refund: '-1pt cada', category: 'comportamental', icon: '🧩',
    description: 'Escolha um transtorno mental: Cleptomania, Compulsão, Distração, Fantasia, Fobia, Megalomania, Mitomania ou Paranoia. Superá-lo em cena exige teste de Resistência (9).',
  },
  {
    id: 'utensilio', name: 'Utensílio', refund: '-1 ou -2pt', category: 'combate', icon: '🔧',
    description: 'Você depende de um item para usar bem algo. -1pt: sem ele, não tem críticos numa perícia escolhida. -2pt: sem ele, não pode usar vantagens/técnicas que gastam PM nem PA.',
  },
];

export const DESVANTAGEM_MAP = new Map<string, DesvantagemDef>(
  ALL_DESVANTAGENS.map(d => [d.id, d])
);
