import { Vantagem } from '../models/game-data.model';

export const TODAS_VANTAGENS: Vantagem[] = [

  // ── COMBATE ──────────────────────────────────────────────────────────────────

  {
    id: 'ataque_especial',
    name: 'Ataque Especial',
    cost: 2,
    category: 'combate',
    icon: '⚔️',
    shortEffect: 'FA+2 gastando 2 PMs',
    fullEffect: 'Ao gastar 2 Pontos de Magia, o personagem realiza um Ataque Especial, adicionando +2 à sua Força de Ataque. Pode ser combinado com outros bônus de FA.',
    flavor: 'O golpe concentrado de um guerreiro experiente vale mais do que mil golpes apressados.',
    pmCost: 2
  },
  {
    id: 'ataque_multiplo',
    name: 'Ataque Múltiplo',
    cost: 2,
    category: 'combate',
    icon: '⚡',
    shortEffect: 'Ataques extras sem redutor de H (2 PMs cada)',
    fullEffect: 'O personagem pode realizar ataques extras sem sofrer o redutor normal de Habilidade, pagando 2 PMs por ataque adicional. Cada ataque além do primeiro consome 2 PMs.',
    flavor: 'Um mestre das armas não precisa escolher entre velocidade e precisão.',
    incompatibleWith: ['tiro_multiplo'],
    pmCost: 2
  },
  {
    id: 'tiro_multiplo',
    name: 'Tiro Múltiplo',
    cost: 2,
    category: 'combate',
    icon: '🏹',
    shortEffect: 'Disparos extras com PdF sem redutor de H (2 PMs cada)',
    fullEffect: 'Igual ao Ataque Múltiplo, mas para ataques à distância baseados em Poder de Fogo. Cada disparo extra custa 2 PMs e não causa redutor de Habilidade.',
    incompatibleWith: ['ataque_multiplo'],
    pmCost: 2
  },
  {
    id: 'forca_colossal',
    name: 'Força Colossal',
    cost: 2,
    category: 'combate',
    icon: '💪',
    shortEffect: 'F+2 permanente (máx F5)',
    fullEffect: 'A Força do personagem aumenta permanentemente em 2 pontos, até o máximo de 5. Afeta FA em combate corpo a corpo e testes de Força.',
    flavor: 'Poucos conseguem manter a posição diante de um golpe que pode rachar pedra.',
    incompatibleWith: ['tiro_certeiro']
  },
  {
    id: 'tiro_certeiro',
    name: 'Tiro Certeiro',
    cost: 2,
    category: 'combate',
    icon: '🎯',
    shortEffect: 'PdF+2 permanente (máx PdF5)',
    fullEffect: 'O Poder de Fogo do personagem aumenta permanentemente em 2 pontos, até o máximo de 5. Aumenta a FA em ataques à distância.',
    incompatibleWith: ['forca_colossal']
  },
  {
    id: 'habilidade_superior',
    name: 'Habilidade Superior',
    cost: 2,
    category: 'combate',
    icon: '🌪️',
    shortEffect: 'H+2 permanente (máx H5)',
    fullEffect: 'A Habilidade do personagem aumenta permanentemente em 2 pontos, até o máximo de 5. Melhora FA, FD, esquivas e múltiplos ataques.'
  },
  {
    id: 'arma_especial',
    name: 'Arma Especial',
    cost: 2,
    category: 'combate',
    icon: '🗡️',
    shortEffect: 'Arma única com propriedades mágicas',
    fullEffect: 'O personagem possui uma arma especial com propriedades únicas — pode ser mágica, ancestral ou amaldiçoada. A arma inflige +1d de dano bônus e conta como mágica para fins de resistências.',
    flavor: 'Toda lenda começa com uma arma que se recusa a ser esquecida.'
  },
  {
    id: 'ataque_pelas_costas',
    name: 'Ataque pelas Costas',
    cost: 2,
    category: 'combate',
    icon: '🗡️',
    shortEffect: 'Dano dobrado em ataques surpresa',
    fullEffect: 'Quando ataca um inimigo desprevenido ou pelas costas, o personagem dobra sua Força para calcular a FA (não os dados). O alvo deve estar Indefeso ou desconhecer o ataque.',
    onlyClass: ['ladino']
  },
  {
    id: 'carga',
    name: 'Carga',
    cost: 1,
    category: 'combate',
    icon: '🐂',
    shortEffect: 'FA+2 ao carregar, mas fica vulnerável',
    fullEffect: 'Ao gastar uma ação completa se movendo em linha reta em direção ao inimigo, o personagem ganha FA+2 naquele ataque. Durante a carga, sofre -1 em sua FD.',
    pmCost: 0
  },
  {
    id: 'golpe_poderoso',
    name: 'Golpe Poderoso',
    cost: 1,
    category: 'combate',
    icon: '🔨',
    shortEffect: 'Troca precisão por dano: FA+2, FD-2',
    fullEffect: 'O personagem pode optar por um golpe mais arriscado: ganha FA+2, mas sofre -2 em sua FD naquele turno. Declarado antes da rolagem.',
    incompatibleWith: ['combate_defensivo'],
    pmCost: 0
  },
  {
    id: 'combate_defensivo',
    name: 'Combate Defensivo',
    cost: 1,
    category: 'combate',
    icon: '🛡️',
    shortEffect: 'Troca ataque por defesa: FD+2, FA-2',
    fullEffect: 'O personagem adota postura defensiva: ganha FD+2 mas sofre FA-2 naquele turno. Declarado antes da rolagem.',
    incompatibleWith: ['golpe_poderoso'],
    pmCost: 0
  },
  {
    id: 'grito_de_kiai',
    name: 'Grito de Kiai',
    cost: 1,
    category: 'combate',
    icon: '😤',
    shortEffect: '+1 FA ao usar armas orientais; intimida',
    fullEffect: 'Com um grito de guerra, o personagem ganha +1 à FA ao usar armas orientais (Kama, Nunchaku, Sai). Uma vez por combate, pode intimidar um inimigo com teste de Habilidade vs. Resistência.',
    pmCost: 1
  },

  // ── DEFESA ────────────────────────────────────────────────────────────────────

  {
    id: 'armadura_extra',
    name: 'Armadura Extra',
    cost: 2,
    category: 'defesa',
    icon: '🛡️',
    shortEffect: 'A+2 permanente',
    fullEffect: 'O personagem possui uma proteção adicional excepcional, seja por equipamento pesado, escudo, ou resistência natural. Recebe +2 em seu valor de Armadura permanentemente.',
    flavor: 'Aço sobre aço — um castelo ambulante.'
  },
  {
    id: 'resistencia_superior',
    name: 'Resistência Superior',
    cost: 2,
    category: 'defesa',
    icon: '❤️',
    shortEffect: 'R+2 permanente (máx R5) — +10 PVs',
    fullEffect: 'A Resistência do personagem aumenta permanentemente em 2 pontos, até o máximo de 5. Como PV = R×5, o personagem ganha +10 PVs máximos.'
  },
  {
    id: 'esquiva_aprimorada',
    name: 'Esquiva Aprimorada',
    cost: 1,
    category: 'defesa',
    icon: '💨',
    shortEffect: 'H+1 em todos os testes de Esquiva',
    fullEffect: 'O personagem recebe H+1 especificamente para testes de Esquiva. Nunca pode ser pego de Ataque Surpresa enquanto acordado.',
    flavor: 'Quem nunca está onde o golpe cai nunca é atingido.'
  },
  {
    id: 'pele_grossa',
    name: 'Pele Grossa',
    cost: 1,
    category: 'defesa',
    icon: '🦏',
    shortEffect: 'Reduz 1 de dano por ataque recebido',
    fullEffect: 'Cada ataque que cause dano ao personagem é reduzido em 1 ponto, após todos os cálculos de FD. Não se aplica a dano que ignore Armadura.'
  },
  {
    id: 'regeneracao',
    name: 'Regeneração',
    cost: 3,
    category: 'defesa',
    icon: '💚',
    shortEffect: 'Recupera 1 PV por turno, inclusive em combate',
    fullEffect: 'O personagem regenera 1 Ponto de Vida ao final de cada turno, mesmo durante o combate. Não funciona com dano de fontes especiais (veneno divino, armas sagradas específicas, etc).',
    flavor: 'Nenhuma ferida é permanente para quem tem a vida como aliada.'
  },
  {
    id: 'invulnerabilidade_fogo',
    name: 'Invulnerabilidade: Fogo',
    cost: 2,
    category: 'defesa',
    icon: '🔥',
    shortEffect: 'Imune a dano de Calor/Fogo',
    fullEffect: 'O personagem é completamente imune a dano do tipo Calor/Fogo, natural ou mágico. Inclui magias de Fogo, brasas, lava e qualquer fonte de calor intenso.',
    incompatibleWith: ['fraqueza_fogo']
  },
  {
    id: 'invulnerabilidade_frio',
    name: 'Invulnerabilidade: Frio',
    cost: 2,
    category: 'defesa',
    icon: '❄️',
    shortEffect: 'Imune a dano de Frio/Gelo',
    fullEffect: 'O personagem é completamente imune a dano do tipo Frio/Gelo, natural ou mágico.'
  },
  {
    id: 'invulnerabilidade_relampago',
    name: 'Invulnerabilidade: Relâmpago',
    cost: 2,
    category: 'defesa',
    icon: '⚡',
    shortEffect: 'Imune a dano elétrico',
    fullEffect: 'O personagem é completamente imune a dano do tipo Relâmpago/Eletricidade.'
  },

  // ── MOVIMENTO ─────────────────────────────────────────────────────────────────

  {
    id: 'aceleracao',
    name: 'Aceleração',
    cost: 1,
    category: 'movimento',
    icon: '💨',
    shortEffect: 'H+1 em Esquivas; velocidade dobrada',
    fullEffect: 'A velocidade máxima do personagem é dobrada. Além disso, recebe H+1 em testes de Esquiva. Não é cumulativo com Teleporte.',
    incompatibleWith: ['teleporte']
  },
  {
    id: 'teleporte',
    name: 'Teleporte',
    cost: 2,
    category: 'movimento',
    icon: '✨',
    shortEffect: 'Teleporta até alcance do Focus (1 PM)',
    fullEffect: 'O personagem pode se teletransportar instantaneamente para qualquer ponto dentro de seu alcance de combate, gastando 1 PM. Garante H+1 em Esquivas.',
    incompatibleWith: ['aceleracao'],
    pmCost: 1
  },
  {
    id: 'levitacao',
    name: 'Levitação',
    cost: 2,
    category: 'movimento',
    icon: '🌊',
    shortEffect: 'Flutua e voa até altura igual à R em metros',
    fullEffect: 'O personagem pode flutuar e voar até uma altitude máxima em metros igual à sua Resistência. Enquanto levita, ataques contra ele sofrem -1 de FA e ele ignora terreno desfavorável.',
    pmCost: 1
  },
  {
    id: 'membros_elasticos',
    name: 'Membros Elásticos',
    cost: 1,
    category: 'movimento',
    icon: '🪡',
    shortEffect: 'Alcance de combate corporal dobrado',
    fullEffect: 'O personagem pode atacar em corpo a corpo alvos a até 3m de distância. Também pode usar habilidades de toque a essa distância.',
    pmCost: 0
  },

  // ── MAGIA ─────────────────────────────────────────────────────────────────────

  {
    id: 'arcano',
    name: 'Arcano',
    cost: 3,
    category: 'magia',
    icon: '🔮',
    shortEffect: '3 pontos de Focus para distribuir entre os Caminhos',
    fullEffect: 'O personagem possui aptidão mágica natural. Recebe 3 pontos de Focus para distribuir livremente entre os seis Caminhos (Água, Ar, Fogo, Terra, Luz, Trevas) no momento da criação. Focus máximo por Caminho é 5. Pode ser comprado múltiplas vezes para obter mais Focus.',
    flavor: 'A magia não é aprendida — é lembrada.'
  },
  {
    id: 'pontos_magia_extra',
    name: 'Pontos de Magia Extras',
    cost: 1,
    category: 'magia',
    icon: '💧',
    shortEffect: '+5 PMs permanentes',
    fullEffect: 'O personagem possui uma reserva mágica maior. Ganha +5 Pontos de Magia permanentes ao máximo de PMs. Pode ser comprado múltiplas vezes.'
  },
  {
    id: 'foco_magico_vant',
    name: 'Foco Mágico',
    cost: 1,
    category: 'magia',
    icon: '🌀',
    shortEffect: 'Magias custam -1 PM (mín. 1)',
    fullEffect: 'A concentração do personagem reduz o custo de todas as suas magias em 1 PM. O custo mínimo continua sendo 1 PM.',
    flavor: 'Eficiência mágica é a diferença entre um feiticeiro e um mestre.'
  },
  {
    id: 'telepatia',
    name: 'Telepatia',
    cost: 2,
    category: 'magia',
    icon: '🧠',
    shortEffect: 'Lê mentes e usa magias psíquicas',
    fullEffect: 'O personagem pode ler a mente de qualquer criatura dentro do alcance de combate (alvo faz teste de R para resistir). É pré-requisito para todas as magias psíquicas e de controle mental.',
    flavor: 'Os segredos mais bem guardados sempre vivem na mente.'
  },
  {
    id: 'clericato',
    name: 'Clericato',
    cost: 3,
    category: 'divino',
    icon: '✝️',
    shortEffect: 'Acesso a magias divinas; 2 Focus nos Caminhos do deus',
    fullEffect: 'O personagem é um sacerdote ordenado de um deus do Panteão de Arton. Recebe 2 pontos de Focus para gastar nos Caminhos determinados por sua divindade (ex: Khalmyr: Luz e Água; Thwor: Terra e Fogo). Pode lançar magias com requisito Clericato. Não requer a Vantagem Arcano — Clericato É a fonte mágica do clérigo.',
    flavor: 'Os deuses não falam com todos — mas ouvem os que sabem rezar.'
  },
  {
    id: 'paladino',
    name: 'Paladino',
    cost: 3,
    category: 'divino',
    icon: '⚜️',
    shortEffect: 'Guerreiro sagrado — magias divinas + combate',
    fullEffect: 'O personagem é um Paladino. Recebe 2 pontos de Focus nos Caminhos da Água, Ar e Luz. Pode lançar magias divinas e de combate. Deve seguir um Código de Honra. Versão maligna: Algoz.',
    requires: ['clericato']
  },

  // ── SENTIDOS ──────────────────────────────────────────────────────────────────

  {
    id: 'visao_noturna',
    name: 'Visão Noturna',
    cost: 1,
    category: 'sentidos',
    icon: '👁️',
    shortEffect: 'Enxerga no escuro total como no claro',
    fullEffect: 'O personagem enxerga perfeitamente em escuridão total, como se houvesse luz plena. Não sofre penalidades em ambientes sem luz.'
  },
  {
    id: 'audicao_aguçada',
    name: 'Audição Aguçada',
    cost: 1,
    category: 'sentidos',
    icon: '👂',
    shortEffect: 'Reduz penalidade de cegueira de -3 para -2',
    fullEffect: 'Os ouvidos aguçados do personagem compensam parcialmente a cegueira. Quando incapaz de ver, a penalidade de -3 em testes de Esquiva é reduzida para -2.',
    incompatibleWith: ['radar']
  },
  {
    id: 'radar',
    name: 'Radar',
    cost: 2,
    category: 'sentidos',
    icon: '📡',
    shortEffect: 'Detecta tudo ao redor; -2 em vez de -3 cego',
    fullEffect: 'O personagem possui sentido extra que detecta qualquer criatura ou objeto em movimento em seu alcance de combate. Quando cego, sofre apenas -2 em Esquivas.',
    incompatibleWith: ['audicao_aguçada']
  },
  {
    id: 'sentidos_especiais',
    name: 'Sentidos Especiais',
    cost: 1,
    category: 'sentidos',
    icon: '🌟',
    shortEffect: 'Percepção sobrenatural; H-3 para perceber ameaças',
    fullEffect: 'O personagem sempre está alerta. Recebe H+1 para Esquivas e nunca pode receber Ataques Surpresa enquanto estiver consciente.',
    flavor: 'Sentir o perigo antes de vê-lo é o que separa os veteranos dos calouros.'
  },
  {
    id: 'oraculo',
    name: 'Oráculo',
    cost: 2,
    category: 'sentidos',
    icon: '🔭',
    shortEffect: 'Visões do futuro em momentos críticos',
    fullEffect: 'Em momentos escolhidos pelo Mestre, o personagem recebe visões rápidas do futuro. Também pode se concentrar (ação completa) para tentar ter visões. As imagens raramente são claras.'
  },

  // ── SOCIAL ────────────────────────────────────────────────────────────────────

  {
    id: 'aparencia_agradavel',
    name: 'Aparência Agradável',
    cost: 1,
    category: 'social',
    icon: '😊',
    shortEffect: '+1 em testes sociais; pode liderar pessoas',
    fullEffect: 'O personagem causa boa impressão e é considerado atraente. Recebe +1 em testes de Atuação, Lábia, Sedução e outras perícias sociais. Pode liderar um número de pessoas igual à sua Habilidade.',
    incompatibleWith: ['aparencia_monstruosa']
  },
  {
    id: 'aparencia_inofensiva',
    name: 'Aparência Inofensiva',
    cost: 1,
    category: 'social',
    icon: '😇',
    shortEffect: 'Ataque extra antes do combate; -2 em Intimidação',
    fullEffect: 'O personagem não parece perigoso. Ganha um ataque extra antes do primeiro turno de qualquer combate, enquanto o oponente não souber de sua capacidade. Porém, sofre -2 em testes de Intimidação.'
  },
  {
    id: 'aliado',
    name: 'Aliado',
    cost: 2,
    category: 'social',
    icon: '🤝',
    shortEffect: 'Possui um NPC aliado poderoso',
    fullEffect: 'O personagem tem um aliado fiel — um guerreiro, mago, nobre ou informante que pode ser chamado uma vez por aventura. O aliado age em benefício do personagem dentro do razoável.'
  },
  {
    id: 'patrono',
    name: 'Patrono',
    cost: 2,
    category: 'social',
    icon: '👑',
    shortEffect: 'Proteção e recursos de uma organização',
    fullEffect: 'O personagem conta com o apoio de uma organização poderosa — uma guilda, ordem ou casa nobre. Recebe recursos, informações e proteção dessa organização, mas também tem obrigações com ela.',
    incompatibleWith: ['obrigacao']
  },
  {
    id: 'ma_fama_v',
    name: 'Má Fama (Vantagem)',
    cost: 1,
    category: 'social',
    icon: '💀',
    shortEffect: '+2 em Intimidação; medo automático em R0',
    fullEffect: 'Diferente da Desvantagem Má Fama, esta versão funciona a favor do personagem. Criaturas com R0 ficam com medo automaticamente. Recebe +2 em testes de Intimidação, mas -1 em interações amigáveis.',
    incompatibleWith: ['ma_fama'],
    flavor: 'A reputação é a melhor armadura — e a mais barata.'
  },

  // ── ESPECIAL ──────────────────────────────────────────────────────────────────

  {
    id: 'sorte',
    name: 'Sorte',
    cost: 3,
    category: 'especial',
    icon: '🍀',
    shortEffect: 'Rerrola 1 resultado por sessão',
    fullEffect: 'Uma vez por sessão de jogo, o personagem pode rerolar qualquer dado (FA, FD, teste) e escolher o melhor resultado. Deve ser declarado antes de ver o resultado.',
    incompatibleWith: ['azar']
  },
  {
    id: 'sede_de_batalha',
    name: 'Sede de Batalha',
    cost: 2,
    category: 'especial',
    icon: '🩸',
    shortEffect: 'Recupera 2 PVs por inimigo derrotado',
    fullEffect: 'A adrenalina do combate alimenta o personagem. Cada vez que derrota um inimigo (reduz a 0 PVs), recupera 2 Pontos de Vida imediatamente.',
    flavor: 'Não é sombrio — é apenas o preço que os inimigos pagam pela sobrevivência dele.'
  },
  {
    id: 'paralisia',
    name: 'Paralisia',
    cost: 2,
    category: 'especial',
    icon: '🫙',
    shortEffect: 'Ataque paralisa oponentes (teste de R)',
    fullEffect: 'Um ataque bem-sucedido que cause dano pode paralisar o alvo. Após sofrer dano, o alvo faz um teste de Resistência. Em caso de falha, fica Indefeso por 1d turnos.',
    pmCost: 2
  },
  {
    id: 'veneno',
    name: 'Veneno Natural',
    cost: 2,
    category: 'especial',
    icon: '☠️',
    shortEffect: 'Ataques envenenam: -1 em todas as Características',
    fullEffect: 'Os ataques do personagem carregam veneno natural. Alvos atingidos fazem teste de Resistência; em falha, sofrem -1 em todas as Características por 1d horas.',
    pmCost: 0
  },
  {
    id: 'reflexao',
    name: 'Reflexão',
    cost: 3,
    category: 'especial',
    icon: '🪞',
    shortEffect: 'Reflete ataques de PdF de volta ao atacante',
    fullEffect: 'Quando recebe um ataque baseado em Poder de Fogo, o personagem pode tentar refletir com um teste de Habilidade. Sucesso devolve o ataque ao atacante com a mesma FA original.',
    pmCost: 2
  },
  {
    id: 'forma_alternativa',
    name: 'Forma Alternativa',
    cost: 3,
    category: 'especial',
    icon: '🐺',
    shortEffect: 'Transforma em outra forma com stats diferentes',
    fullEffect: 'O personagem pode se transformar em outra forma (animal, monstruosa, elemental) como ação completa. A forma alternativa tem um conjunto diferente de stats e pode ter vantagens próprias.',
    pmCost: 2
  },
  {
    id: 'construto',
    name: 'Construto',
    cost: 2,
    category: 'racial',
    icon: '⚙️',
    shortEffect: 'Não respira, não come, imune a veneno e doenças',
    fullEffect: 'O personagem é um ser artificial — golem, autômato ou morto-vivo especial. Não precisa respirar, comer ou dormir. Imune a venenos, doenças e magias que afetam apenas criaturas vivas.'
  },
  {
    id: 'modelo_especial',
    name: 'Modelo Especial',
    cost: 1,
    category: 'racial',
    icon: '📏',
    shortEffect: 'Tamanho diferente do humano padrão',
    fullEffect: 'O personagem é significativamente maior ou menor que um humano comum. Tamanhos maiores ganham alcance de combate maior e FA bônus; tamanhos menores recebem bônus em furtividade.'
  },
  {
    id: 'devoção',
    name: 'Devoção',
    cost: 1,
    category: 'divino',
    icon: '🙏',
    shortEffect: '+1 em testes relacionados ao deus venerado',
    fullEffect: 'O personagem é devoto fiel de um deus de Arton (sem ser clérigo). Recebe +1 em todos os testes realizados em circunstâncias aprovadas por seu deus. A divindade pode intervir diretamente em situações extremas.',
    flavor: 'A fé não move montanhas. Mas dá coragem para escalar.'
  },
  {
    id: 'perito',
    name: 'Perito',
    cost: 1,
    category: 'especial',
    icon: '📚',
    shortEffect: '+2 em testes de uma Especialização escolhida',
    fullEffect: 'O personagem é excepcionalmente habilidoso em uma especialização específica (Escalada, Arrombamento, Alquimia, etc.). Recebe +2 em todos os testes dessa especialização.'
  },
  {
    id: 'usar_armaduras',
    name: 'Usar Armaduras',
    cost: 1,
    category: 'combate',
    icon: '🛡️',
    shortEffect: 'Usa armaduras pesadas sem penalidade',
    fullEffect: 'O personagem está treinado no uso de armaduras pesadas medievais, sem sofrer as penalidades normais de Habilidade. Inclui cota de malha, placas e escudos grandes.'
  },
  {
    id: 'usar_armas_exoticas',
    name: 'Usar Armas Exóticas',
    cost: 1,
    category: 'combate',
    icon: '🪃',
    shortEffect: 'Proficiência com armas exóticas',
    fullEffect: 'O personagem possui treinamento especial com armas exóticas medievais ou orientais (Espada Bastarda, Aji Drow, Katana, Nunchaku, etc.), sem penalidades.'
  },
  {
    id: 'cura_acelerada',
    name: 'Cura Acelerada',
    cost: 1,
    category: 'defesa',
    icon: '💊',
    shortEffect: 'Recupera o dobro de PVs em descanso',
    fullEffect: 'O organismo do personagem se recupera com notável rapidez. Em situações de descanso, recupera o dobro dos Pontos de Vida normais. Também recupera de envenenamentos e doenças menores mais rapidamente.'
  },
  {
    id: 'inquebravel',
    name: 'Inquebrável',
    cost: 2,
    category: 'defesa',
    icon: '🪨',
    shortEffect: 'Continua lutando com 0 PVs por R turnos',
    fullEffect: 'O personagem possui uma vontade extraordinária de sobreviver. Ao atingir 0 Pontos de Vida, ainda pode agir por um número de turnos igual à sua Resistência antes de cair. Após isso, faz teste de morte normalmente.',
    flavor: 'Não é coragem. É recusa absoluta em aceitar o fim.'
  },
  {
    id: 'arena',
    name: 'Arena',
    cost: 1,
    category: 'combate',
    icon: '🏟️',
    shortEffect: 'H+1 em um ambiente/terreno específico',
    fullEffect: 'O personagem tem vantagem em um tipo específico de ambiente ou situação de combate (floresta, ruínas, água, etc.). Recebe H+1 em todos os testes de combate e Esquiva naquele ambiente.',
    flavor: 'O campo de batalha certo é metade da vitória.'
  }
];
