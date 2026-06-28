import { Enemy } from '../models/combat.model';
import { GrowthScale } from '../utils/pp-calculator';
import { GrowableMonsterTemplate, spawnGrowableMonster } from './dungeons/shared/monster-growth';

// ── Bestiário central ─────────────────────────────────────────────────────────
// Fonte única de templates de monstro (atributos-base, lore, arquétipo) usados por
// todos os andares. Cada andar continua dono da SUA composição de encontros (quais
// monstros aparecem em qual sala, em qual quantidade — ver <andar>.monsters.ts);
// este arquivo só responde "quem é esse monstro e o quão forte ele é na base".
//
// Estatísticas canônicas de "A Libertação de Valkaria" (Jambô, 2004), convertidas
// de 3D&T Alpha para 3DeT Victory por uma regra de conversão ajustada (a fórmula
// "oficial" de floor((F+PdF)/2) e floor((A+R)/2) deixava os monstros fracos demais
// — quem usa Força normalmente não usa Poder de Fogo, então somar e dividir por 2
// pune à toa quem só usa um dos dois):
//   Poder       = round(max(Força, Poder de Fogo))           — pega o maior, não a média
//   Resistência = round((Armadura + Resistência) × 0.75)     — soma quase cheia, não média
// Armadura não existe mais como atributo separado — foi absorvida em Resistência.
// Os comentários "// Alpha: ..." abaixo preservam os stats originais para auditoria;
// os números após "→" nesses comentários ainda mostram o cálculo ANTIGO (floor/2) e
// não foram reescritos — os valores reais de poder/resistencia já usam a fórmula nova.
//
// `archetype` define o pool de vantagens "fora da curva" que o monstro pode
// manifestar quando a party está bem acima do esperado (ver monster-growth.ts).
// `floor` amarra o monstro a uma masmorra específica (ver DUNGEON_REGISTRY) — serve
// para auditoria/filtragem (ex.: monstersForFloor) e evita reaproveitar por engano
// um monstro de outro andar/tema.
// A escala real em combate (`scale`) é 100% function do PP da party no confronto
// (growthScale, em pp-calculator.ts) mais um pequeno reforço por andar — nunca
// passa do teto (GROWTH_MAX): monstros curados não ficam infinitamente fortes.

export type MonsterTemplate = GrowableMonsterTemplate;

export const BESTIARIO: Record<string, MonsterTemplate> = {
  // ── Allihanna (andar 1) ───────────────────────────────────────────────────

  elefante: {
    name: 'Elefante', icon: '🐘', archetype: 'paquiderme', floor: 1,
    flavorText: 'Manada protetora às margens do lago — se assustam com invasores e lutam até a morte pelos filhotes.',
    // Alpha: F5 R4 A1 PF1 → P=floor((5+1)/2)=3, R=floor((1+4)/2)=2
    poder: 5, habilidade: 1, resistencia: 4,
    hp: 20,
    xpReward: 12, goldReward: 0,
  },
  assassino_savana: {
    name: 'Assassino da Savana', icon: '🐆', archetype: 'felino', floor: 1,
    flavorText: 'Felino com quatro pares de patas que salta da grama alta para atacar com garras e mordida simultaneamente.',
    // Alpha: F6 R6 A3 PF0 → P=3, R=floor((3+6)/2)=4
    poder: 6, habilidade: 3, resistencia: 7,
    hp: 30,
    xpReward: 18, goldReward: 0,
  },
  urso_coruja: {
    name: 'Urso-Coruja', icon: '🦉', sprite: 'urso-coruja.png', archetype: 'paquiderme', floor: 1,
    flavorText: 'Predador territorial coberto de penas escuras e pelos amarronzados. Ataca com garras e bico sem hesitar.',
    // Alpha: F5 R4 A3 PF0 → P=2, R=floor((3+4)/2)=3
    poder: 5, habilidade: 2, resistencia: 5,
    hp: 20,
    xpReward: 14, goldReward: 0,
  },
  urso_coruja_imenso: {
    name: 'Urso-Coruja Imenso', icon: '🦉', sprite: 'urso-coruja.png', archetype: 'paquiderme', floor: 1,
    flavorText: 'Talvez o maior urso-coruja de toda Arton. Confronta intrusos com fúria absoluta e luta até a morte.',
    // Alpha: F7 R5 A5 PF0 → P=3, R=floor((5+5)/2)=5
    poder: 7, habilidade: 1, resistencia: 8,
    hp: 25,
    xpReward: 25, goldReward: 0,
  },
  leao_fallandi: {
    name: 'Leão de Fallandi', icon: '🦁', archetype: 'felino', floor: 1,
    flavorText: 'Leão maior que o comum, companheiro do druida. Ágil e feroz, protege seu mestre com garras e mordida.',
    // Alpha: F3 R2 A0 PF0 → P=1, R=1
    poder: 3, habilidade: 3, resistencia: 2,
    hp: 15,
    xpReward: 10, goldReward: 0,
  },
  urso_vegetal: {
    name: 'Urso Vegetal', icon: '🌿', archetype: 'defensor', floor: 1,
    flavorText: 'Criatura invocada pela magia Criatura Mágica de Fallandi. Construto feito de matéria vegetal — vulnerável ao fogo.',
    // Alpha: F2 R2 A0 PF0 → P=1, R=1
    poder: 2, habilidade: 1, resistencia: 2,
    hp: 20,
    xpReward: 8, goldReward: 0,
  },
  fallandi: {
    name: 'Fallandi', icon: '🌿', archetype: 'conjurador', floor: 1,
    flavorText: 'Meio humano, meio dríade — o Guardião de Allihanna. Druida que serve a deusa no labirinto com seriedade absoluta.',
    // Alpha: F3 R3 A1 PF0 → P=1, R=2
    poder: 3, habilidade: 3, resistencia: 3,
    hp: 12,
    xpReward: 30, goldReward: 10,
  },
  druida_allihanna: {
    name: 'Druida de Allihanna', icon: '🌱', archetype: 'conjurador', floor: 1,
    flavorText: 'Servo da Mãe Natureza. Prefere a paz, mas defende a floresta com magia e animais aliados.',
    // Alpha: F1 R2 A2 PF2 → P=floor((1+2)/2)=1, R=floor((2+2)/2)=2
    // Poder e PV ajustados pra ocupar a faixa "equilibrado" na refatoração do andar 1
    // (ver allihanna.config.ts) — Resistência intocada; o PV baixo original fazia o
    // golpe de abertura matar o monstro antes de ele lutar, mascarando como "trivial".
    poder: 4, habilidade: 3, resistencia: 3,
    hp: 25,
    xpReward: 10, goldReward: 5,
  },
  ranger: {
    name: 'Ranger', icon: '🏹', archetype: 'atirador', floor: 1,
    flavorText: 'Explorador da floresta, habilidoso com arco e espada. Ataca múltiplas vezes com agilidade.',
    // Alpha: F2 R2 A2 PF3 → P=floor((2+3)/2)=2, R=2
    // Poder e PV ajustados pra "equilibrado" na refatoração do andar 1 — Resistência intocada.
    poder: 4, habilidade: 3, resistencia: 3,
    hp: 30,
    xpReward: 10, goldReward: 3,
  },
  centauro_ranger: {
    name: 'Centauro Ranger', icon: '🐴', sprite: 'centauro-combatente.png', archetype: 'atirador', floor: 1,
    flavorText: 'Meio homem, meio cavalo — patrulha a floresta com arco na mão e casco certeiro.',
    // Alpha: F2 R2 A2 PF2 → P=2, R=2
    // Poder e PV ajustados pra "equilibrado" na refatoração do andar 1 — Resistência intocada.
    poder: 4, habilidade: 3, resistencia: 3,
    hp: 25,
    xpReward: 11, goldReward: 0,
  },
  lobo_cavernas: {
    name: 'Lobo-das-Cavernas', icon: '🐺', sprite: 'lobo-das-cavernas.png', archetype: 'felino', floor: 1,
    flavorText: 'Lobo maior e mais feroz que o comum. Caça em matilha, fareja presas a grande distância.',
    // Alpha: F1 R2 A1 PF0 → P=0, R=floor((1+2)/2)=1
    poder: 1, habilidade: 2, resistencia: 2,
    hp: 10,
    xpReward: 6, goldReward: 0,
  },
  grifo: {
    name: 'Grifo', icon: '🦅', sprite: 'grifo.png', archetype: 'voador', floor: 1,
    flavorText: 'Criatura alada com corpo de leão e cabeça de águia. Veloz e letal no ar ou no chão.',
    // Alpha: F2 R4 A1 PF0 → P=1, R=floor((1+4)/2)=2
    poder: 2, habilidade: 5, resistencia: 4,
    hp: 20,
    xpReward: 16, goldReward: 0,
  },
  gorila: {
    name: 'Gorila', icon: '🦍', archetype: 'paquiderme', floor: 1,
    flavorText: 'Primata colossal, territorialmente agressivo. Conhecido por habitar esta masmorra.',
    // Alpha: F2 R2 A1 PF0 → P=1, R=floor((1+2)/2)=1
    // Poder e PV ajustados pra "equilibrado" na refatoração do andar 1 — Resistência intocada.
    poder: 4, habilidade: 2, resistencia: 2,
    hp: 35,
    xpReward: 8, goldReward: 0,
  },
  driade: {
    name: 'Dríade', icon: '🌳', archetype: 'furtivo', floor: 1,
    flavorText: 'Espírito feminino das árvores. Imortal enquanto sua árvore existir. Paralisa com um toque.',
    // Alpha: F1 R1 A0 PF0 → P=0, R=0
    poder: 1, habilidade: 2, resistencia: 1,
    hp: 5,
    xpReward: 14, goldReward: 0,
  },
  tigre: {
    name: 'Tigre', icon: '🐯', archetype: 'felino', floor: 1,
    flavorText: 'Predador ágil da floresta, caça de surpresa e retira-se ao perder metade dos PVs.',
    // Alpha: F3 R2 A0 PF0 → P=1, R=1
    // Poder e PV ajustados pra "equilibrado" na refatoração do andar 1 — Resistência intocada.
    poder: 4, habilidade: 3, resistencia: 2,
    hp: 35,
    xpReward: 9, goldReward: 0,
  },
  crocodilo: {
    name: 'Crocodilo', icon: '🐊', archetype: 'reptiliano', floor: 1,
    flavorText: 'Réptil blindado que aguarda imóvel antes de atacar com mordida devastadora.',
    // Alpha: F3 R3 A2 PF0 → P=1, R=floor((2+3)/2)=2
    poder: 3, habilidade: 0, resistencia: 4,
    hp: 15,
    xpReward: 9, goldReward: 0,
  },
  urso_cavernas: {
    name: 'Urso das Cavernas', icon: '🐻', archetype: 'paquiderme', floor: 1,
    flavorText: 'Urso de grande porte que habita as cavernas da floresta. Poderoso e territorial.',
    // Alpha: F4 R3 A1 PF0 → P=2, R=2
    // Poder e PV ajustados pra "equilibrado" na refatoração do andar 1 — Resistência intocada.
    poder: 5, habilidade: 3, resistencia: 3,
    hp: 20,
    xpReward: 12, goldReward: 0,
  },

  // ── Ragnar (andar 2) ──────────────────────────────────────────────────────
  // Armadura foi absorvida em Resistência (defesa = Resistência + Armadura + 1d6 já
  // somava as duas, então a fusão é direta: resistencia_nova = resistencia + armadura).

  goblin_guerreiro: {
    name: 'Goblin Guerreiro', icon: '👺', sprite: 'goblin-engenhoqueiro.png', archetype: 'furtivo', floor: 2,
    flavorText: 'Pequeno e covarde, mas perigoso em grupo. Porta uma azagaia enferrujada e grita ao atacar para compensar o tamanho.',
    poder: 1, habilidade: 2, resistencia: 1,
    hp: 5,
    xpReward: 4, goldReward: 2,
  },
  orc_guerreiro: {
    name: 'Orc Guerreiro', icon: '👹', sprite: 'orc.png', archetype: 'dps', floor: 2,
    flavorText: 'Cinza e musculoso, treinado desde o nascimento para matar. Carrega machado de guerra com braço forte demais.',
    poder: 11, habilidade: 2, resistencia: 3,
    hp: 20,
    xpReward: 8, goldReward: 5,
  },
  orc_berserker: {
    name: 'Orc Berserker', icon: '😡', sprite: 'orc.png', archetype: 'dps', floor: 2,
    flavorText: 'Ao entrar em fúria, ignora a dor. Cada ferimento parece apenas aumentar sua brutalidade e velocidade de ataque.',
    poder: 8, habilidade: 2, resistencia: 4,
    hp: 15,
    xpReward: 12, goldReward: 5,
  },
  hobgoblin_capitao: {
    name: 'Hobgoblin Capitão', icon: '🪖', sprite: 'hobgoblin-soldado.png', archetype: 'defensor', floor: 2,
    flavorText: 'Mais alto que um orc, mais disciplinado que um goblin. Comanda pelotões com voz de trovão e espada curta de qualidade.',
    poder: 4, habilidade: 3, resistencia: 5,
    hp: 15,
    xpReward: 15, goldReward: 10,
  },
  ogre_batalha: {
    name: 'Ogre de Batalha', icon: '🗿', sprite: 'ogro.png', archetype: 'paquiderme', floor: 2,
    flavorText: 'Três metros de músculo e raiva. Usa um tronco de árvore como clava. Um único golpe pode derrubar um guerreiro de armadura pesada.',
    poder: 5, habilidade: 1, resistencia: 6,
    hp: 20,
    xpReward: 18, goldReward: 8,
  },
  troll_guerra: {
    name: 'Troll da Guerra', icon: '🟢', sprite: 'troll.png', archetype: 'reptiliano', floor: 2,
    flavorText: 'Verde, imundo e com regeneração sobrenatural. Cortes e perfurações fecham em segundos — apenas fogo e ácido evitam a cura.',
    poder: 5, habilidade: 2, resistencia: 7,
    hp: 25,
    xpReward: 22, goldReward: 6,
  },
  gromthar: {
    name: 'Warchief Gromthar', icon: '⚔️', sprite: 'orc-chefe.png', archetype: 'paquiderme', floor: 2,
    flavorText: 'Meio-ogre, meio-orc, completamente brutal. Lidera a horda com um machado de batalha encantado que zumbe ao cortar o ar.',
    poder: 6, habilidade: 3, resistencia: 9,
    hp: 30,
    xpReward: 50, goldReward: 30,
  },
  // ── Glorienn (andar 3) ────────────────────────────────────────────────────
  // Defensores élficos da masmorra — "todos bondosos", lutam até a morte por Glorienn.

  mago_elfo: {
    name: 'Mago Élfico', icon: '🧙', archetype: 'conjurador', floor: 3,
    flavorText: 'Conjurador élfico escolhido por Glorienn para provar a superioridade de seu povo.',
    // Alpha: F0(corte) H2 R2 A1 PdF0(perf) → P=floor((0+0)/2)=0, R=floor((1+2)/2)=1
    poder: 1, habilidade: 2, resistencia: 2,
    xpReward: 8, goldReward: 5,
  },
  guerreiro_elfo: {
    name: 'Guerreiro Élfico', icon: '🗡️', archetype: 'dps', floor: 3,
    flavorText: 'Combatente élfico de elite, leal a Glorienn até a morte.',
    // Alpha: F2 H2 R2 A2 PdF1 → P=floor((2+1)/2)=1, R=floor((2+2)/2)=2
    poder: 2, habilidade: 2, resistencia: 3,
    xpReward: 7, goldReward: 4,
  },
  bardo_elfo: {
    name: 'Bardo Élfico', icon: '🎻', archetype: 'suporte', floor: 3,
    flavorText: 'Artista e guerreiro élfico, inspira seus companheiros em batalha.',
    // Alpha: F1 H2 R2 A1 PdF1 → P=floor((1+1)/2)=1, R=floor((1+2)/2)=1
    poder: 1, habilidade: 2, resistencia: 2,
    xpReward: 7, goldReward: 4,
  },
  ranger_elfo: {
    name: 'Ranger Élfico', icon: '🏞️', archetype: 'atirador', floor: 3,
    flavorText: 'Batedor élfico especializado em sobrevivência nas cavernas do labirinto.',
    // Alpha: F2 H2 R2 A2 PdF1 → P=1, R=2
    poder: 2, habilidade: 2, resistencia: 3,
    xpReward: 7, goldReward: 4,
  },
  arqueiro_elfo: {
    name: 'Arqueiro Élfico', icon: '🏹', archetype: 'atirador', floor: 3,
    flavorText: 'Arqueiro de elite de Glorienn, treinado em Tiro Múltiplo e Tiro Carregável.',
    // Alpha: F2 H2 R2 A2 PdF3 → P=floor((2+3)/2)=2, R=2
    poder: 3, habilidade: 2, resistencia: 3,
    xpReward: 9, goldReward: 4,
  },
  arqueiro_glorienn: {
    name: 'Arqueiro de Glorienn', icon: '🏹', archetype: 'atirador', floor: 3,
    flavorText: 'Arqueiro arcano de elite que guarda a linha de resistência diante do Guardião — flechas sempre mágicas.',
    // Alpha: F1(corte) H4 R3 A3 PdF5(perf); 12 PVs, 12 PMs → P=floor((1+5)/2)=3, R=floor((3+3)/2)=3
    poder: 5, habilidade: 4, resistencia: 5,
    hp: 12,
    xpReward: 16, goldReward: 8,
  },
  cacador_glorienn: {
    name: 'Caçador de Glorienn', icon: '🗡️', archetype: 'atirador', floor: 3,
    flavorText: 'Ranger de elite que protege os Arqueiros de Glorienn, lutando com sabre e adaga quando o inimigo se aproxima.',
    // Alpha: F2(corte) H3 R3 A3 PdF2(perf); 15 PVs, 12 PMs → P=floor((2+2)/2)=2, R=floor((3+3)/2)=3
    poder: 2, habilidade: 3, resistencia: 5,
    hp: 15,
    xpReward: 14, goldReward: 6,
  },
  sharindhallenrannas: {
    name: 'Sharindhallenrannas', icon: '🧝', archetype: 'conjurador', floor: 3,
    flavorText: 'Maga élfica exótica de asas emplumadas, Guardiã de Glorienn — testemunhou o massacre de Lenérienn e jamais se rende.',
    // Alpha: F3(corte) H4 R3 A2 PdF1; 9 PVs, 20 PMs → P=floor((3+1)/2)=2, R=floor((2+3)/2)=2
    poder: 4, habilidade: 4, resistencia: 4,
    hp: 9,
    xpReward: 35, goldReward: 15,
  },

  // ── Lena (andar 4) ────────────────────────────────────────────────────────
  // Criaturas mágicas grandes demais e imunes a dano normal — só magia/efeitos
  // de cura ferem os habitantes desta masmorra (não modelado mecanicamente aqui).

  dinonico_enorme: {
    name: 'Dinônico Enorme', icon: '🦖', archetype: 'reptiliano', floor: 4,
    flavorText: 'Versão gigantesca do lagarto comum, crescida pela energia positiva de Lena.',
    // Alpha: F4 H2 R4 A1 PdF2 → P=floor((4+2)/2)=3, R=floor((1+4)/2)=2
    poder: 4, habilidade: 2, resistencia: 4,
    xpReward: 12, goldReward: 0,
  },
  sprite_mago: {
    name: 'Sprite Mago', icon: '🧚', archetype: 'conjurador', floor: 4,
    flavorText: 'Pequena fada conjuradora, sociável e travessa, nativa do Reino de Lena.',
    // Alpha: F0 H5 R2 A2 PdF1 → P=floor((0+1)/2)=0, R=floor((2+2)/2)=2
    poder: 1, habilidade: 5, resistencia: 3,
    xpReward: 9, goldReward: 3,
  },
  cao_teleportador: {
    name: 'Cão Teleportador', icon: '🐕', archetype: 'furtivo', floor: 4,
    flavorText: 'Cão inteligente de pelagem marrom-amarelada, organiza-se em matilhas e teletransporta-se em combate.',
    // Alpha: F2 H2 R4 A1 PdF0 → P=1, R=floor((1+4)/2)=2
    poder: 2, habilidade: 2, resistencia: 4,
    xpReward: 8, goldReward: 0,
  },
  formian_guerreiro: {
    name: 'Formian Guerreiro', icon: '🐜', archetype: 'defensor', floor: 4,
    flavorText: 'Cruzamento entre formiga e centauro, organizado em castas — imune a veneno, frio e petrificação.',
    // Alpha: F2 H3 R3 A3 PdF2 → P=floor((2+2)/2)=2, R=floor((3+3)/2)=3
    poder: 2, habilidade: 3, resistencia: 5,
    xpReward: 14, goldReward: 0,
  },
  carrasco_lena: {
    name: 'Carrasco de Lena Enorme', icon: '👹', archetype: 'generico', floor: 4,
    flavorText: 'Monstro mágico infame que ganha PVs ao sofrer dano em vez de perdê-los.',
    // Alpha: F5 H0/4 R5 A2 PdF0 → P=floor((5+0)/2)=2, R=floor((2+5)/2)=3 (H4 em combate)
    poder: 5, habilidade: 4, resistencia: 5,
    xpReward: 18, goldReward: 0,
  },
  cobra_enorme: {
    name: 'Cobra Enorme', icon: '🐍', archetype: 'reptiliano', floor: 4,
    flavorText: 'Serpente crescida pela energia positiva da masmorra, muito maior que o normal de sua espécie.',
    // Alpha: F4 H2 R5 A0 PdF0 → P=2, R=floor((0+5)/2)=2
    poder: 4, habilidade: 2, resistencia: 4,
    xpReward: 10, goldReward: 0,
  },
  lobo_enorme: {
    name: 'Lobo Enorme', icon: '🐺', archetype: 'felino', floor: 4,
    flavorText: 'Lobo do tamanho de um urso, com audição e olfato aguçados, criado pela energia de Lena.',
    // Alpha: F3 H2 R4 A0 PdF0 → P=1, R=2
    poder: 3, habilidade: 2, resistencia: 3,
    xpReward: 8, goldReward: 0,
  },
  lagarto_gigante: {
    name: 'Lagarto Gigante', icon: '🦎', archetype: 'reptiliano', floor: 4,
    flavorText: 'Réptil de proporções avantajadas, crescido sem limite pela energia positiva da masmorra.',
    // Alpha: F3 H2 R4 A3 PdF0 → P=1, R=floor((3+4)/2)=3
    poder: 3, habilidade: 2, resistencia: 5,
    xpReward: 9, goldReward: 0,
  },
  fada_lena: {
    name: 'Fada de Lena', icon: '🧚‍♀️', archetype: 'voador', floor: 4,
    flavorText: 'Pixie ou grig — fada pequena e brincalhona, vive em enxames nos jardins da masmorra.',
    // Alpha: F0 H4 R2 A2 PdF0 → P=0, R=2
    poder: 1, habilidade: 4, resistencia: 3,
    xpReward: 6, goldReward: 0,
  },
  unicornio_enorme: {
    name: 'Unicórnio Enorme', icon: '🦄', archetype: 'paquiderme', floor: 4,
    flavorText: 'Unicórnio maior que o normal, veloz e de sentidos aguçados — símbolo da masmorra de Lena.',
    // Alpha: F4 H3 R3 A3 PdF0 → P=2, R=3
    poder: 4, habilidade: 3, resistencia: 5,
    xpReward: 16, goldReward: 0,
  },
  tentaculos_seiva: {
    name: 'Tentáculos de Seiva', icon: '🌿', archetype: 'generico', floor: 4,
    flavorText: 'Raízes vivas que emergem dos rios de seiva da masmorra para envolver e constringir intrusos.',
    // Alpha: F3 H4 R4 A1 PdF0; 20 PVs, 20 PMs → P=1, R=floor((1+4)/2)=2
    poder: 3, habilidade: 4, resistencia: 4,
    hp: 20,
    xpReward: 10, goldReward: 0,
  },
  quelicerossauro: {
    name: 'Quelicerossauro', icon: '🦕', archetype: 'reptiliano', floor: 4,
    flavorText: 'Monstro do tamanho de um T-Rex com mandíbulas de inseto — nunca sente fome, mas caça por instinto.',
    // Alpha: F7 H4 R5 A1 PdF0; 25 PVs, 25 PMs → P=3, R=floor((1+5)/2)=3
    poder: 7, habilidade: 4, resistencia: 5,
    hp: 25,
    xpReward: 24, goldReward: 0,
  },
  tandan: {
    name: 'Tandan', icon: '🐉', archetype: 'voador', floor: 4,
    flavorText: 'Dragonete gigante de asas como as de uma borboleta — a Guardiã de Lena prefere brincar a lutar de verdade.',
    // Alpha: F5(sopro/mord.) H4 R4 A3 PdF3; 18 PVs, 30 PMs → P=floor((5+3)/2)=4, R=floor((3+4)/2)=3
    poder: 5, habilidade: 4, resistencia: 5,
    hp: 18,
    xpReward: 40, goldReward: 12,
  },

  // ── Hyninn (andar 5) ──────────────────────────────────────────────────────
  // Masmorra do Deus da Trapaça: criaturas metamórficas, construtos animados
  // e armadilhas — poucos monstros, mas traiçoeiros.

  mimico: {
    name: 'Mímico', icon: '📦', archetype: 'generico', floor: 5,
    flavorText: 'Criatura amorfa disfarçada de mobília — agarra e devora vítimas incautas com pseudópodes adesivos.',
    // Alpha: F3 H2 R4 A2 PdF0 → P=floor((3+0)/2)=1, R=floor((2+4)/2)=3
    poder: 4, habilidade: 2, resistencia: 5,
    hp: 25,
    xpReward: 10, goldReward: 0,
  },
  golem_pedra: {
    name: 'Golem de Pedra', icon: '🗿', archetype: 'defensor', floor: 5,
    flavorText: 'Construto de pedra invulnerável a quase toda magia, exceto efeitos do Caminho Terra.',
    // Alpha: F5 H1 R5 A4 PdF0 → P=2, R=floor((4+5)/2)=4
    poder: 5, habilidade: 1, resistencia: 7,
    xpReward: 16, goldReward: 0,
  },
  gargula: {
    name: 'Gárgula', icon: '🗿', archetype: 'voador', floor: 5,
    flavorText: 'Construto alado de pedra viva, espreita do alto com sentidos sobrenaturais.',
    // Alpha: F3 H3 R4 A2 PdF0 → P=1, R=3
    poder: 5, habilidade: 3, resistencia: 5,
    hp: 30,
    xpReward: 12, goldReward: 0,
  },
  phasm: {
    name: 'Phasm', icon: '🫧', archetype: 'furtivo', floor: 5,
    flavorText: 'Bolha multicolorida amorfa, capaz de assumir a forma de quase qualquer criatura ou objeto.',
    // Alpha: F1 H3 R3 A4 PdF0 → P=0, R=floor((4+3)/2)=3
    poder: 1, habilidade: 3, resistencia: 5,
    xpReward: 9, goldReward: 0,
  },
  tigre_hyninn: {
    name: 'Tigre-de-Hyninn', icon: '🐅', archetype: 'felino', floor: 5,
    flavorText: 'Felino silencioso e invisível, capaz de teleporte — o predador favorito do Deus da Trapaça.',
    // Alpha: F3 H4 R3 A0 PdF0 → P=1, R=1
    poder: 3, habilidade: 4, resistencia: 2,
    xpReward: 11, goldReward: 0,
  },
  armario_animado: {
    name: 'Armário Animado', icon: '🗄️', archetype: 'generico', floor: 5,
    flavorText: 'Mobília animada por Hyninn para emboscar intrusos — construto sem inteligência própria.',
    // Alpha: F3 H1 R5 A4 PdF0; 25 PVs, 25 PMs → P=1, R=floor((4+5)/2)=4
    poder: 3, habilidade: 1, resistencia: 7,
    hp: 25,
    xpReward: 14, goldReward: 0,
  },
  bau_animado: {
    name: 'Baú Animado', icon: '🧰', archetype: 'generico', floor: 5,
    flavorText: 'Outro objeto animado da masmorra, ataca quando alguém se aproxima.',
    // Alpha: F2 H1 R4 A3 PdF0; 20 PVs, 20 PMs → P=1, R=floor((3+4)/2)=3
    poder: 2, habilidade: 1, resistencia: 5,
    hp: 20,
    xpReward: 11, goldReward: 0,
  },
  corrente_animada: {
    name: 'Corrente Animada', icon: '⛓️', archetype: 'generico', floor: 5,
    flavorText: 'Corrente viva que se enrola no pescoço da vítima em vez de causar dano direto.',
    // Alpha: F1 H2 R2 A1 PdF0; 10 PVs, 10 PMs → P=0, R=floor((1+2)/2)=1
    poder: 1, habilidade: 2, resistencia: 2,
    hp: 10,
    xpReward: 6, goldReward: 0,
  },
  duplo: {
    name: 'Duplo', icon: '🎭', archetype: 'furtivo', floor: 5,
    flavorText: 'Doppelganger paranoico criado por Hyninn — nunca trabalha em equipe, nem mesmo com outros duplos.',
    // Alpha: F2 H5 R3 A1 PdF0; 9 PVs, 9 PMs → P=1, R=floor((1+3)/2)=2
    poder: 2, habilidade: 5, resistencia: 3,
    hp: 9,
    xpReward: 13, goldReward: 0,
  },
  tigre_primordial: {
    name: 'Tigre Primordial', icon: '🐯', archetype: 'felino', floor: 5,
    flavorText: 'O primeiro e mais poderoso tigre-de-Hyninn — naturalmente desfocado, quase impossível de acertar.',
    // Alpha: F6 H4 R5 A2 PdF3; 25 PVs, 25 PMs → P=floor((6+3)/2)=4, R=floor((2+5)/2)=3
    poder: 6, habilidade: 4, resistencia: 5,
    hp: 25,
    xpReward: 38, goldReward: 10,
  },

  // ── Marah (andar 6) ───────────────────────────────────────────────────────
  // Masmorra da Deusa da Paz — desafio quase sem combate real (estátuas
  // ilusórias, dríades pacíficas); estes stats servem só se a violência for usada.

  clerigo_marah: {
    name: 'Clériga de Marah', icon: '⛪', archetype: 'suporte', floor: 6,
    flavorText: 'Serva de Marah, viva ou morta, recompensada com a estadia neste paraíso de paz.',
    // Alpha: F0 H4 R3 A0 PdF0 → P=0, R=3
    poder: 1, habilidade: 4, resistencia: 2,
    xpReward: 7, goldReward: 0,
  },
  bardo_marah: {
    name: 'Bardo de Marah', icon: '🎼', archetype: 'suporte', floor: 6,
    flavorText: 'Músico e artista que serve à Dama Branca, vive entre flores e música de bandolim.',
    // Alpha: F2 H3 R2 A2 PdF1 → P=floor((2+1)/2)=1, R=2
    poder: 6, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 7, goldReward: 0,
  },
  paladino_marah: {
    name: 'Paladino de Marah', icon: '🛡️', archetype: 'defensor', floor: 6,
    flavorText: 'Guerreiro santo da Deusa da Paz, recompensado com a eternidade neste castelo tranquilo.',
    // Alpha: F3 H3 R3 A3 PdF0 → P=1, R=3
    poder: 3, habilidade: 3, resistencia: 5,
    xpReward: 9, goldReward: 0,
  },
  sprite_bardo_marah: {
    name: 'Sprite Bardo', icon: '🧚', archetype: 'suporte', floor: 6,
    flavorText: 'Fada minúscula que canta e toca instrumentos pela masmorra de Marah.',
    // Alpha: F1 H4 R1 A2 PdF1; 6 PVs, 9 PMs → P=1, R=floor((2+1)/2)=1
    poder: 1, habilidade: 4, resistencia: 2,
    hp: 6,
    xpReward: 6, goldReward: 0,
  },
  sprite_feiticeiro_marah: {
    name: 'Sprite Feiticeiro', icon: '🧚‍♂️', archetype: 'conjurador', floor: 6,
    flavorText: 'Fada conjuradora que cria pequenos shows de fogos de artifício ilusórios na Festa das Fadas.',
    // Alpha: F0 H4 R1 A2 PdF1; 9 PVs, 12 PMs → P=0, R=1
    poder: 1, habilidade: 4, resistencia: 2,
    hp: 9,
    xpReward: 7, goldReward: 0,
  },
  estatua_viva: {
    name: 'Estátua Viva', icon: '🗿', archetype: 'defensor', floor: 6,
    flavorText: 'Aasimar de mármore ilusório que ganha "vida" para testar a disposição à violência dos visitantes — ilusória, não causa dano real.',
    // Alpha: F4 H2 R4 A4 PdF0; 20 PVs, 20 PMs → P=2, R=4
    poder: 4, habilidade: 2, resistencia: 6,
    hp: 20,
    xpReward: 0, goldReward: 0,
  },
  driade_marah: {
    name: 'Dríade de Marah', icon: '🧜', archetype: 'conjurador', floor: 6,
    flavorText: 'Nandira, Nandara ou Nandora — dríades bondosas disfarçadas de elfa-do-mar, tentam convencer (não combater) os aventureiros.',
    // Alpha: F1 H3 R2 A0 PdF0; 10 PVs, 20 PMs → P=0, R=2
    poder: 1, habilidade: 3, resistencia: 2,
    hp: 10,
    xpReward: 8, goldReward: 0,
  },
  prislanya: {
    name: 'Prislanya', icon: '🧚‍♀️', archetype: 'conjurador', floor: 6,
    flavorText: 'Ninfa Guardiã de Marah, disfarçada de Valkaria cativa — tenta convencer os heróis a desistir, sem nenhuma intenção de feri-los.',
    // Alpha: F0 H1 R2 A0 PdF0; 10 PVs, 10 PMs → P=0, R=2
    poder: 8, habilidade: 1, resistencia: 2,
    hp: 20,
    xpReward: 20, goldReward: 0,
  },

  // ── Tenebra (andar 7) ─────────────────────────────────────────────────────
  // Masmorra da Deusa das Trevas — mortos-vivos poderosos, eternamente no escuro.

  vulto_alado: {
    name: 'Vulto Alado', icon: '🦇', archetype: 'voador', floor: 7,
    flavorText: 'Morto-vivo semelhante a um morcego gigante, composto de pura escuridão — quase invisível contra o céu noturno.',
    // Alpha: F4 H4 R3 A4 PdF0 → P=2, R=floor((4+3)/2)=3
    poder: 4, habilidade: 4, resistencia: 5,
    xpReward: 16, goldReward: 0,
  },
  troglodita_guerreiro: {
    name: 'Troglodita Guerreiro', icon: '🪓', archetype: 'dps', floor: 7,
    flavorText: 'Servo subterrâneo fiel de Tenebra, enxerga no escuro e nunca é incomodado pelos mortos-vivos da masmorra.',
    // Alpha: F3 H3 R3 A2 PdF1 → P=floor((3+1)/2)=2, R=floor((2+3)/2)=2
    poder: 4, habilidade: 3, resistencia: 4,
    hp: 20,
    xpReward: 13, goldReward: 3,
  },
  zumbi_enorme: {
    name: 'Zumbi Enorme', icon: '🧟', archetype: 'generico', floor: 7,
    flavorText: 'Morto-vivo de proporções gigantescas, vagueia sem cessar pelos túneis de Tenebra.',
    // Alpha: F5 H0 R6 A2 PdF0 → P=2, R=floor((2+6)/2)=4 (H1 em combate)
    poder: 5, habilidade: 1, resistencia: 6,
    xpReward: 18, goldReward: 0,
  },
  esqueleto_colossal: {
    name: 'Esqueleto Colossal', icon: '💀', archetype: 'defensor', floor: 7,
    flavorText: 'Restos ósseos de um gigante, animados pela vontade de Tenebra — invulnerável ao frio.',
    // Alpha: F6 H1 R6 A4 PdF0 → P=3, R=floor((4+6)/2)=5
    poder: 6, habilidade: 1, resistencia: 8,
    xpReward: 22, goldReward: 0,
  },
  devorador: {
    name: 'Devorador', icon: '☠️', archetype: 'generico', floor: 7,
    flavorText: 'Morto-vivo esquelético que aprisiona a essência de suas vítimas dentro das próprias costelas.',
    // Alpha: F3 H2 R3 A3 PdF0 → P=1, R=3
    poder: 3, habilidade: 2, resistencia: 5,
    xpReward: 12, goldReward: 0,
  },
  bodak: {
    name: 'Bodak', icon: '🧟‍♂️', archetype: 'generico', floor: 7,
    flavorText: 'Restos mortais reanimados pelo toque do mal, face distorcida em loucura eterna — vulnerável à prata e ao sol.',
    // Alpha: F3 H3 R2 A1 PdF0 → P=1, R=floor((1+2)/2)=1
    poder: 3, habilidade: 3, resistencia: 2,
    xpReward: 11, goldReward: 0,
  },
  aparicao: {
    name: 'Aparição', icon: '👻', archetype: 'voador', floor: 7,
    flavorText: 'Fantasma incorpóreo nascido do mal e das trevas, despreza todos os seres vivos — vulnerável ao sol.',
    // Alpha: F0 H3 R3 A1 PdF0 → P=0, R=2
    poder: 1, habilidade: 3, resistencia: 3,
    xpReward: 10, goldReward: 0,
  },
  andarilho_noturno: {
    name: 'Andarilho Noturno', icon: '👤', archetype: 'generico', floor: 7,
    flavorText: 'Vulto noturno de 6 metros de altura, de olhar amaldiçoado — espreita as sombras para emboscar suas vítimas.',
    // Alpha: F5 H3 R4 A4 PdF0 → P=2, R=4
    poder: 5, habilidade: 3, resistencia: 6,
    xpReward: 20, goldReward: 0,
  },
  hayasha: {
    name: 'Hayasha', icon: '👩‍🦰', archetype: 'conjurador', floor: 7,
    flavorText: 'Banshee amaldiçoada por Tenebra — barda enlouquecida após séculos de cativeiro, mas talvez ainda peça socorro em vez de atacar.',
    // Alpha: F3(contusão) H3 R5 A2 PdF2(som); 25 PVs, 25 PMs → P=floor((3+2)/2)=2, R=floor((2+5)/2)=3
    poder: 3, habilidade: 3, resistencia: 5,
    hp: 25,
    xpReward: 24, goldReward: 15,
  },
  verrkash: {
    name: 'Verrkash', icon: '👻', archetype: 'conjurador', floor: 7,
    flavorText: 'Mago-fantasma faminto por energia mística, atormentado por nunca ter se tornado um lich em vida.',
    // Alpha: F0 H5 R5 A3 PdF0; 25 PVs, 25 PMs → P=0, R=floor((3+5)/2)=4
    poder: 1, habilidade: 5, resistencia: 6,
    hp: 25,
    xpReward: 24, goldReward: 0,
  },
  ravarimm: {
    name: 'Ravarimm', icon: '🧛', archetype: 'defensor', floor: 7,
    flavorText: 'Anão vampiro, escultor apaixonado e Guardião de Tenebra — esculpiu sozinho todas as estátuas da masmorra.',
    // Alpha: F4(corte) H3 R4 A4 PdF4(corte); 24 PVs, 24 PMs → P=floor((4+4)/2)=4, R=floor((4+4)/2)=4
    poder: 4, habilidade: 3, resistencia: 6,
    hp: 24,
    xpReward: 45, goldReward: 20,
  },

  // ── Azgher (andar 8) ──────────────────────────────────────────────────────
  // Masmorra do Deus-Sol — deserto eterno e luz cegante; monstros aprisionados
  // como castigo, guerreando entre si pelo domínio do lugar.

  dragonne: {
    name: 'Dragonne', icon: '🦁', archetype: 'voador', floor: 8,
    flavorText: 'Mistura de leão com dragão de bronze, capaz de rugir e amedrontar a até 40m de distância.',
    // Alpha: F5 H3 R4 A3 PdF0 → P=2, R=floor((3+4)/2)=3
    poder: 5, habilidade: 3, resistencia: 5,
    xpReward: 16, goldReward: 0,
  },
  androesfinge: {
    name: 'Andro-Esfinge', icon: '🦁', archetype: 'conjurador', floor: 8,
    flavorText: 'Esfinge masculina de corpo leonino e cabeça humana, capaz de conjurar magias de Clericato.',
    // Alpha: F4 H3 R4 A4 PdF0 → P=2, R=4
    poder: 4, habilidade: 3, resistencia: 6,
    xpReward: 18, goldReward: 0,
  },
  hieracoesfinge: {
    name: 'Hieraco-Esfinge', icon: '🦅', archetype: 'felino', floor: 8,
    flavorText: 'Contraparte maligna das esfinges, corpo de leão e cabeça de falcão — caça gino-esfinges para se reproduzir.',
    // Alpha: F4 H4 R3 A3 PdF0 → P=2, R=3
    poder: 4, habilidade: 4, resistencia: 5,
    xpReward: 17, goldReward: 0,
  },
  ginoesfinge: {
    name: 'Gino-Esfinge', icon: '🦁', archetype: 'conjurador', floor: 8,
    flavorText: 'Esfinge feminina de forma humanoide e olhos de leoa, sabe Cancelamento de Magia e Detecção de Magia.',
    // Alpha: F2 H4 R4 A4 PdF0 → P=1, R=4
    poder: 2, habilidade: 4, resistencia: 6,
    xpReward: 15, goldReward: 0,
  },
  escorpiao_imenso: {
    name: 'Escorpião Imenso', icon: '🦂', archetype: 'reptiliano', floor: 8,
    flavorText: 'Aracnídeo gigante do deserto, ferrão peçonhento e carapaça resistente.',
    // Alpha: F5 H1 R4 A3 PdF0 → P=2, R=floor((3+4)/2)=3
    poder: 5, habilidade: 1, resistencia: 5,
    xpReward: 14, goldReward: 0,
  },
  lamia: {
    name: 'Lamia', icon: '🐍', archetype: 'furtivo', floor: 8,
    flavorText: 'Criatura de corpo centauro com torso feminino e parte inferior de serpente — egoísta e desconfiada de tudo.',
    // Alpha: F2 H3 R2 A2 PdF0 → P=1, R=2
    poder: 10, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 11, goldReward: 0,
  },
  mumia: {
    name: 'Múmia', icon: '🧟‍♂️', archetype: 'defensor', floor: 8,
    flavorText: 'Morto-vivo embalsamado pelas próprias múmias da masmorra — vulnerável apenas a magia, armas mágicas e fogo.',
    // Alpha: F3 H4 R4 A5 PdF0 → P=1, R=floor((5+4)/2)=4
    poder: 3, habilidade: 4, resistencia: 7,
    xpReward: 16, goldReward: 0,
  },
  escorpiao_colossal: {
    name: 'Escorpião Colossal', icon: '🦂', archetype: 'reptiliano', floor: 8,
    flavorText: 'Versão titânica do escorpião do deserto, capaz de esmagar uma carruagem com a cauda.',
    // Alpha: F7 H1 R6 A2 PdF0 → P=3, R=4
    poder: 7, habilidade: 1, resistencia: 6,
    xpReward: 22, goldReward: 0,
  },
  elemental_areia: {
    name: 'Elemental da Areia', icon: '🌪️', archetype: 'generico', floor: 8,
    flavorText: 'Elemental composto de ar e terra, irremediavelmente insano e agressivo — vulnerável apenas a magia.',
    // Alpha: F4 H6 R3 A4 PdF4 → P=floor((4+4)/2)=4, R=floor((4+3)/2)=3
    poder: 4, habilidade: 6, resistencia: 5,
    xpReward: 24, goldReward: 0,
  },
  efreet: {
    name: 'Efreet', icon: '🧞', archetype: 'conjurador', floor: 8,
    flavorText: 'Gênio do fogo aprisionado por Azgher, imortal e quase invulnerável a ataques não-mágicos.',
    // Alpha: F4 H3 R4 A4 PdF4(fogo) → P=4, R=4
    poder: 4, habilidade: 3, resistencia: 6,
    xpReward: 26, goldReward: 10,
  },
  enxame_azgher: {
    name: 'Enxame de Azgher', icon: '🪲', archetype: 'generico', floor: 8,
    flavorText: 'Milhares de besouros dourados disfarçados de joias, hibernam por séculos até despertar para atacar em enxame.',
    // Alpha: F0 H3 R5 A1 PdF0; 25 PVs, 25 PMs → P=0, R=3
    poder: 2, habilidade: 3, resistencia: 5,
    hp: 25,
    xpReward: 16, goldReward: 0,
  },
  gorgon_azgher: {
    name: 'Górgon de Azgher', icon: '🐂', archetype: 'paquiderme', floor: 8,
    flavorText: 'Touro monstruoso de sete metros que transmuta suas vítimas em estátuas de ouro em vez de pedra.',
    // Alpha: F5 H1 R4 A5 PdF0; 20 PVs, 20 PMs → P=2, R=floor((5+4)/2)=4
    poder: 5, habilidade: 1, resistencia: 7,
    hp: 20,
    xpReward: 24, goldReward: 0,
  },
  alkhab: {
    name: 'Al-khab', icon: '🐍', archetype: 'conjurador', floor: 8,
    flavorText: 'Couatl-sol, serpente emplumada que comandou as forças de Azgher contra Tenebra — Guardião honrado e generoso.',
    // Alpha: F6 H4 R5 A5 PdF3(luz); 35 PVs, 35 PMs → P=floor((6+3)/2)=4, R=floor((5+5)/2)=5
    poder: 6, habilidade: 4, resistencia: 8,
    hp: 35,
    xpReward: 55, goldReward: 25,
  },

  // ── Tauron (andar 9) ──────────────────────────────────────────────────────
  // Masmorra do Deus da Força — prisão-labirinto de minotauros e feras de arena.

  guerreiro_minotauro: {
    name: 'Guerreiro Minotauro', icon: '🐃', archetype: 'dps', floor: 9,
    flavorText: 'Minotauro orgulhoso, prisioneiro buscando redenção aos olhos de Tauron através do combate.',
    // Alpha: F4 H2 R3 A4 PdF0 → P=2, R=floor((4+3)/2)=3
    poder: 4, habilidade: 2, resistencia: 5,
    xpReward: 16, goldReward: 0,
  },
  guerreiro_tauron: {
    name: 'Guerreiro de Tauron', icon: '⚔️', archetype: 'dps', floor: 9,
    flavorText: 'Humano, anão ou outro prisioneiro da masmorra-labirinto, buscando vitórias que agradem ao Deus da Força.',
    // Alpha: F2 H3 R3 A2 PdF1 → P=floor((2+1)/2)=1, R=floor((2+3)/2)=2
    poder: 3, habilidade: 3, resistencia: 4,
    hp: 20,
    xpReward: 10, goldReward: 0,
  },
  minotauro_selvagem: {
    name: 'Minotauro Selvagem', icon: '🐃', archetype: 'dps', floor: 9,
    flavorText: 'Fera de arena confinada por magia, devolve poder e experiência a quem a derrota repetidamente.',
    // Alpha: F5 H2 R5 A2 PdF0 → P=2, R=floor((2+5)/2)=3
    poder: 5, habilidade: 2, resistencia: 5,
    xpReward: 18, goldReward: 0,
  },
  leao_gigante: {
    name: 'Leão Gigante', icon: '🦁', archetype: 'felino', floor: 9,
    flavorText: 'Fera de arena de porte avantajado, usada como adversário para gladiadores em treinamento.',
    // Alpha: F5 H1 R5 A0 PdF0 → P=2, R=2
    poder: 5, habilidade: 1, resistencia: 4,
    xpReward: 15, goldReward: 0,
  },
  manticora: {
    name: 'Mantícora', icon: '🦂', archetype: 'voador', floor: 9,
    flavorText: 'Criatura alada de cauda escorpiônica, ataca múltiplas vezes com faro aguçado.',
    // Alpha: F5 H5 R4 A3 PdF0 → P=2, R=floor((3+4)/2)=3
    poder: 5, habilidade: 5, resistencia: 5,
    xpReward: 19, goldReward: 0,
  },
  quimera: {
    name: 'Quimera', icon: '🐲', archetype: 'voador', floor: 9,
    flavorText: 'Monstro de três cabeças (leão, cabra, dragão), sopro de fogo devastador e ataque múltiplo.',
    // Alpha: F5 H3 R5 A4 PdF6 → P=floor((5+6)/2)=5, R=floor((4+5)/2)=4
    poder: 6, habilidade: 3, resistencia: 7,
    xpReward: 28, goldReward: 0,
  },
  gigante_fogo: {
    name: 'Gigante do Fogo', icon: '🔥', archetype: 'paquiderme', floor: 9,
    flavorText: 'Colosso flamejante invulnerável ao fogo, mas vulnerável a frio e gelo.',
    // Alpha: F6(fogo/corte) H1 R5 A4 PdF5(contusão) → P=floor((6+5)/2)=5, R=floor((4+5)/2)=4
    poder: 6, habilidade: 1, resistencia: 7,
    xpReward: 26, goldReward: 0,
  },
  golem_pedra_tauron: {
    name: 'Golem de Pedra (Tauron)', icon: '🗿', archetype: 'defensor', floor: 9,
    flavorText: 'Construto de pedra usado como fera de arena, invulnerável a toda magia exceto Terra.',
    // Alpha: F5 H2 R5 A6 PdF0 → P=2, R=floor((6+5)/2)=5
    poder: 5, habilidade: 2, resistencia: 8,
    xpReward: 20, goldReward: 0,
  },
  verme_purpura: {
    name: 'Verme Púrpura', icon: '🐛', archetype: 'generico', floor: 9,
    flavorText: 'Verme gigantesco capaz de engolir uma criatura inteira — corpo de coloração púrpura, mais de 20 metros de comprimento.',
    // Alpha: F6 H1 R5 A5 PdF0 → P=3, R=floor((5+5)/2)=5
    poder: 6, habilidade: 1, resistencia: 8,
    xpReward: 22, goldReward: 0,
  },
  wyvern: {
    name: 'Wyvern', icon: '🐉', archetype: 'voador', floor: 9,
    flavorText: 'Dragão menor de duas pernas, ferrão venenoso ou sopro de chamas, ataca em voo.',
    // Alpha: F5 H5 R4 A4 PdF0/3 → P=2, R=4
    poder: 5, habilidade: 5, resistencia: 6,
    xpReward: 20, goldReward: 0,
  },
  divina_serpente: {
    name: 'Divina Serpente', icon: '🐍', archetype: 'conjurador', floor: 9,
    flavorText: 'Criatura de torso feminino e cauda de serpente, lembrada como a Grande Serpente que originou a lenda de Tauron — corpo sempre em chamas.',
    // Alpha: F6(fogo) H4 R5 A3 PdF4(fogo); 55 PVs, 35 PMs → P=floor((6+4)/2)=5, R=floor((3+5)/2)=4
    poder: 6, habilidade: 4, resistencia: 6,
    hp: 55,
    xpReward: 42, goldReward: 30,
  },
  potentius: {
    name: 'Potentius', icon: '🐃', archetype: 'dps', floor: 9,
    flavorText: 'Gladiador minotauro, Guardião de Tauron e campeão invicto de incontáveis torneios — luta com tridente e rede paralisante.',
    // Alpha: F4(perfuração) H4 R5 A3 PdF3; 35 PVs, 20 PMs → P=floor((4+3)/2)=3, R=floor((3+5)/2)=4
    poder: 4, habilidade: 4, resistencia: 6,
    hp: 35,
    xpReward: 48, goldReward: 20,
  },

  // ── Tanna-Toh (andar 10) ──────────────────────────────────────────────────
  // Masmorra da Deusa do Conhecimento — uma biblioteca quase desabitada, sem
  // monstros errantes; só NPCs e os "personagens fugidos dos livros".

  liranny: {
    name: 'Liranny', icon: '🎻', archetype: 'suporte', floor: 10,
    flavorText: 'Bardo insano preso há séculos em seu próprio luto, tenta compor a canção perfeita para comover os deuses.',
    // Alpha: F2 H2 R2 A1 PdF2; 4 PVs, 4 PMs → P=floor((2+2)/2)=2, R=floor((1+2)/2)=1
    poder: 9, habilidade: 2, resistencia: 2,
    hp: 14,
    xpReward: 6, goldReward: 0,
  },
  thwor_ironfist: {
    name: 'Thwor Ironfist', icon: '👹', archetype: 'dps', floor: 10,
    flavorText: 'General bugbear escapado das páginas de um livro por poucos instantes, ainda ferido de seu duelo contra o avatar de Glorienn.',
    // Alpha: F4(corte) H6 R6 A4 PdF3; 42 PVs (16 no momento), 18 PMs (7 no momento) → P=floor((4+3)/2)=3, R=floor((4+6)/2)=5
    poder: 4, habilidade: 6, resistencia: 8,
    hp: 16,
    xpReward: 20, goldReward: 0,
  },
  sathane: {
    name: 'Sathane', icon: '💀', archetype: 'defensor', floor: 10,
    flavorText: 'Golem de ferro sem cabeça, o Guardião do Conhecimento — sua caveira de cristal se regenera enquanto houver crânios nas estantes.',
    // Alpha: F7 H2 R4 A5 PdF0; 20 PVs, 20 PMs → P=3, R=floor((5+4)/2)=4
    poder: 7, habilidade: 2, resistencia: 7,
    hp: 20,
    xpReward: 40, goldReward: 0,
  },

  // ── Lin-Wu (andar 11) ─────────────────────────────────────────────────────
  // Masmorra do Deus Dragão — monastério silencioso, artistas marciais da
  // Ordem dos Defensores do Sonho. A tabela de encontros do livro só dá o custo
  // em PP (sem atributos Alpha) para os artistas marciais comuns — estimados
  // aqui na mesma faixa de poder (11-12 pontos) usada nos demais andares.

  artista_marcial: {
    name: 'Artista Marcial', icon: '🥋', archetype: 'dps', floor: 11,
    flavorText: 'Membro da Ordem dos Defensores do Sonho, treina há séculos em combate desarmado no monastério silencioso de Lin-Wu.',
    // Estimado a partir do custo de ~11-12 pontos citado no livro (sem stats Alpha explícitos).
    poder: 8, habilidade: 3, resistencia: 2,
    hp: 15,
    xpReward: 13, goldReward: 0,
  },
  yon_ude: {
    name: 'Yon-ude Hebi', icon: '🐍', archetype: 'dps', floor: 11,
    flavorText: 'Naga de quatro braços, um dos artistas marciais mais habilidosos de sua espécie — Guardião de Lin-Wu, luta até a morte por honra.',
    // Alpha: F4(contusão) H5 R3 A4 PdF3; 20 PVs, 20 PMs → P=floor((4+3)/2)=3, R=floor((4+3)/2)=3
    poder: 4, habilidade: 5, resistencia: 5,
    hp: 20,
    xpReward: 38, goldReward: 0,
  },

  // ── Wynna (andar 12) ──────────────────────────────────────────────────────
  // Masmorra da Deusa da Magia — magia arcana infinita, fadas e gênios.
  // A tabela de encontros do livro só dá custo em PP para vários destes (sem
  // atributos Alpha explícitos); estimados na mesma faixa de poder (13 pontos).

  feiticeiro_wynna: {
    name: 'Feiticeiro de Wynna', icon: '🧙‍♂️', archetype: 'conjurador', floor: 12,
    flavorText: 'Mago ou feiticeiro instruído por Wynna a deter os aventureiros — aqui a magia arcana é infinita, nunca consome PM.',
    // Estimado a partir do custo de 13 pontos citado no livro (sem stats Alpha explícitos).
    poder: 2, habilidade: 4, resistencia: 3,
    xpReward: 17, goldReward: 0,
  },
  elemental_wynna: {
    name: 'Elemental de Wynna', icon: '🌪️', archetype: 'generico', floor: 12,
    flavorText: 'Elemental de água, fogo, terra ou ar que patrulha as áreas maiores da masmorra à espera de invasores.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 4, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 18, goldReward: 0,
  },
  djinn_enorme: {
    name: 'Djinn Enorme', icon: '🧞', archetype: 'voador', floor: 12,
    flavorText: 'Gênio do ar de proporções avantajadas, um dos muitos seres mágicos a serviço de Wynna.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 8, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 19, goldReward: 0,
  },
  hidra_branca: {
    name: 'Hidra Branca (11 cabeças)', icon: '🐉', archetype: 'reptiliano', floor: 12,
    flavorText: 'Réptil multicéfalo de escamas geladas — cada cabeça ataca de um ângulo diferente.',
    // Estimado (livro não dá stats Alpha explícitos, só "11 cabeças" como indicação de força).
    poder: 4, habilidade: 2, resistencia: 4,
    xpReward: 26, goldReward: 0,
  },
  ninfa_wynna: {
    name: 'Ninfa de Wynna', icon: '🧜‍♀️', archetype: 'conjurador', floor: 12,
    flavorText: 'Espírito mágico gentil, raro entre os encontros aleatórios desta masmorra.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 1, habilidade: 3, resistencia: 2,
    xpReward: 12, goldReward: 0,
  },
  katharmek: {
    name: 'Katharmek', icon: '🐲', archetype: 'conjurador', floor: 12,
    flavorText: 'Kobold feiticeiro, descendente distante de dragões — protegido por Wynna após perder todo o seu grupo de aventureiros.',
    // Alpha: F2(contusão) H3 R2 A5 PdF0; 9 PVs, 16 PMs → P=1, R=floor((5+2)/2)=3
    poder: 2, habilidade: 3, resistencia: 5,
    hp: 9,
    xpReward: 22, goldReward: 0,
  },
  darkazimm: {
    name: 'Darkazimm', icon: '👿', archetype: 'conjurador', floor: 12,
    flavorText: 'Gênio das trevas aprisionado por Wynna como castigo por escravizar seres mágicos — Guardião eterno, luta pela vida sem trégua.',
    // Alpha: F4(corte) H6 R4 A4 PdF3; 30 PVs, 30 PMs → P=floor((4+3)/2)=3, R=floor((4+4)/2)=4
    poder: 4, habilidade: 6, resistencia: 6,
    hp: 30,
    xpReward: 50, goldReward: 20,
  },

  // ── Oceano (andar 13) ─────────────────────────────────────────────────────
  // Masmorra submersa do Grande Oceano — guerra eterna entre elfos-do-mar e
  // sereias, manipulada em segredo pelo Guardião dragão-marinho.

  elfo_mar_ranger: {
    name: 'Elfo-do-Mar Ranger', icon: '🔱', archetype: 'atirador', floor: 13,
    flavorText: 'Batedor dos redutos bárbaros dos elfos-do-mar, desconfia de conjuradores e não luta ao lado de mulheres.',
    // Alpha: F3 H4 R3 A2 PdF4; 15 PVs, 12 PMs → P=floor((3+4)/2)=3, R=floor((2+3)/2)=2
    poder: 5, habilidade: 4, resistencia: 4,
    hp: 15,
    xpReward: 16, goldReward: 0,
  },
  elfo_mar_barbaro: {
    name: 'Elfo-do-Mar Bárbaro', icon: '🔱', archetype: 'dps', floor: 13,
    flavorText: 'Guerreiro fervoroso dos redutos submarinos, vive em festas tribais e conselhos de guerra eternos contra as sereias.',
    // Alpha: F5 H3 R3 A2 PdF0; 18 PVs, 12 PMs → P=2, R=floor((2+3)/2)=2
    poder: 5, habilidade: 3, resistencia: 4,
    hp: 18,
    xpReward: 15, goldReward: 0,
  },
  tojanida_imensa: {
    name: 'Tojanida Anciã Imensa', icon: '🐢', archetype: 'defensor', floor: 13,
    flavorText: 'Tartaruga marinha inteligente de sete apêndices, quase impossível de surpreender — versão anciã, muito mais forte que o normal.',
    // Alpha: jovem F2-4 H3-4 R3-4 A2-3, anciã +3 em tudo → F7 H7 R7 A6 PdF0 → P=3, R=floor((6+7)/2)=6
    poder: 3, habilidade: 7, resistencia: 5,
    xpReward: 26, goldReward: 0,
  },
  homem_selako: {
    name: 'Homem-Selako', icon: '🦈', archetype: 'dps', floor: 13,
    flavorText: 'Sahuagin de pele lisa e nadadeiras como barbatanas de tubarão, ataca comunidades costeiras em águas quentes.',
    // Alpha: F2-4 H2-3 R1-2 A1-2 PdF2-3 (faixa média) → P=floor((3+2)/2)=2, R=1
    poder: 3, habilidade: 2, resistencia: 2,
    xpReward: 10, goldReward: 0,
  },
  tartaruga_dragao: {
    name: 'Tartaruga-Dragão', icon: '🐢', archetype: 'reptiliano', floor: 13,
    flavorText: 'Réptil marinho de 12 metros, casco esverdeado e sopro de vapor superaquecido — encontrado no Mar do Dragão-Rei.',
    // Alpha: F4-6 H2-4 R5-6 A3-5 PdF6-7 (faixa média-alta) → P=floor((5+6)/2)=5, R=floor((4+5)/2)=4
    poder: 7, habilidade: 3, resistencia: 7,
    xpReward: 28, goldReward: 0,
  },
  sereia_feiticeira: {
    name: 'Sereia Feiticeira', icon: '🧜‍♀️', archetype: 'conjurador', floor: 13,
    flavorText: 'Conjuradora matriarcal, fraca em combate direto mas poderosa em magia — compensa com inteligência o que falta em força.',
    // Alpha: F1 H3 R2 A2 PdF2; 6 PVs, 8 PMs → P=floor((1+2)/2)=1, R=floor((2+2)/2)=2
    poder: 2, habilidade: 3, resistencia: 3,
    hp: 6,
    xpReward: 12, goldReward: 0,
  },
  sereia_barda: {
    name: 'Sereia Barda', icon: '🧜‍♀️', archetype: 'suporte', floor: 13,
    flavorText: 'Artista encantadora das profundezas, usa O Canto da Sereia para controlar e enganar inimigos.',
    // Alpha: F1 H3 R3 A1 PdF2; 6 PVs, 9 PMs → P=1, R=2
    poder: 2, habilidade: 3, resistencia: 3,
    hp: 6,
    xpReward: 12, goldReward: 0,
  },
  sereia_cleriga: {
    name: 'Sereia Clériga', icon: '🧜‍♀️', archetype: 'suporte', floor: 13,
    flavorText: 'Devota do Grande Oceano, usa varinhas de cura e paralisia para proteger suas irmãs em combate.',
    // Alpha: F2 H2 R3 A1 PdF2; 12 PVs, 12 PMs → P=1, R=2
    poder: 2, habilidade: 2, resistencia: 3,
    hp: 12,
    xpReward: 14, goldReward: 0,
  },
  coriphena: {
    name: 'Coriphena', icon: '🐲', archetype: 'conjurador', floor: 13,
    flavorText: 'Dragão-marinho venerável e traiçoeiro, Guardião do Oceano — manipula secretamente a guerra entre elfos-do-mar e sereias por diversão.',
    // Alpha: F7 H8 R8 A8 PdF9(água); 40 PVs, 40 PMs → P=floor((7+9)/2)=8, R=floor((8+8)/2)=8
    poder: 9, habilidade: 8, resistencia: 12,
    hp: 40,
    xpReward: 70, goldReward: 35,
  },

  // ── Thyatis (andar 14) ────────────────────────────────────────────────────
  // Masmorra do Deus do Renascimento — paredes de lava viva, só criaturas
  // ígneas (imunes a fogo) sobrevivem aqui.

  thoqqa: {
    name: 'Thoqqa', icon: '🐛', archetype: 'reptiliano', floor: 14,
    flavorText: 'Elemental vermiforme de corpo superaquecido, cego e guiado por sentido sísmico — incendeia tudo que toca.',
    // Alpha: F2-3(fogo) H1-3 R2-3 A2-3 PdF0 (faixa média) → P=1, R=2
    poder: 3, habilidade: 2, resistencia: 4,
    xpReward: 9, goldReward: 0,
  },
  mastim_thyatis: {
    name: 'Mastim de Thyatis', icon: '🐺', archetype: 'felino', floor: 14,
    flavorText: 'Cão infernal de pelagem em brasa, caça em matilhas pelos corredores incandescentes da masmorra.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 10, habilidade: 3, resistencia: 2,
    hp: 25,
    xpReward: 11, goldReward: 0,
  },
  salamandra_nobre: {
    name: 'Salamandra Nobre', icon: '🦎', archetype: 'conjurador', floor: 14,
    flavorText: 'A mais forte e habilidosa das castas de salamandras, lidera tribos com lanças superaquecidas e magia do fogo.',
    // Alpha: F5(fogo) H3 R4 A3 PdF3 (faixa alta + magia) → P=floor((5+3)/2)=4, R=floor((3+4)/2)=3
    poder: 5, habilidade: 3, resistencia: 5,
    xpReward: 20, goldReward: 0,
  },
  elemental_fogo_anciao: {
    name: 'Elemental do Fogo Ancião', icon: '🔥', archetype: 'generico', floor: 14,
    flavorText: 'Forma ancestral e poderosa de elemental do fogo, vagueia pelas câmaras mais profundas da masmorra.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 5, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 22, goldReward: 0,
  },
  dragao_vermelho_adulto: {
    name: 'Dragão Vermelho Adulto', icon: '🐉', archetype: 'voador', floor: 14,
    flavorText: 'Réptil caótico e maligno aprisionado por Thyatis, vive há 800 anos sem envelhecer, pilhando tesouros de rivais.',
    // Alpha: F6 H6 R7 A7 PdF8(fogo); 35 PVs, 35 PMs → P=floor((6+8)/2)=7, R=floor((7+7)/2)=7
    poder: 8, habilidade: 6, resistencia: 11,
    hp: 35,
    xpReward: 48, goldReward: 20,
  },
  dragao_vermelho_experiente: {
    name: 'Dragão Vermelho Experiente', icon: '🐉', archetype: 'voador', floor: 14,
    flavorText: 'Dragão vermelho mais velho e poderoso, domina os covis mais ricos da masmorra de Thyatis.',
    // Alpha: F7 H7 R8 A8 PdF9(fogo); 40 PVs, 40 PMs → P=floor((7+9)/2)=8, R=floor((8+8)/2)=8
    poder: 9, habilidade: 7, resistencia: 12,
    hp: 40,
    xpReward: 55, goldReward: 25,
  },
  reyjane: {
    name: 'Reyjane', icon: '🔥', archetype: 'voador', floor: 14,
    flavorText: 'Fênix imensa e ancestral, Guardiã de Thyatis — finge lutar de verdade, pois seu real desejo é ser sacrificada para gerar uma ninhada.',
    // Alpha: F5 H6 R7 A6 PdF8; 35 PVs, 35 PMs → P=floor((5+8)/2)=6, R=floor((6+7)/2)=6
    poder: 8, habilidade: 6, resistencia: 10,
    hp: 35,
    xpReward: 50, goldReward: 0,
  },

  // ── Sszzaas (andar 15) ────────────────────────────────────────────────────
  // Masmorra do Deus da Traição, o Senhor das Serpentes — corredores tomados
  // por milhões de cobras. O Guardião real é um espelho mágico do personagem
  // mais forte do grupo (cópia exata de atributos/itens) — não modelável como
  // template estático do bestiário; ver tabela de encontros aleatórios abaixo.

  cultista_sszzaas: {
    name: 'Cultista de Sszzaaz', icon: '🐍', archetype: 'furtivo', floor: 15,
    flavorText: 'Homem-serpente do culto de Sszzaaz, patrulha em busca de vítimas para sacrifício e perdão do Grande Corruptor.',
    // Alpha: F3 H4 R5 A4 PdF4; 20 PVs, 15 PMs → P=floor((3+4)/2)=3, R=floor((4+5)/2)=4
    poder: 4, habilidade: 4, resistencia: 7,
    hp: 20,
    xpReward: 20, goldReward: 5,
  },
  hidra_negra: {
    name: 'Hidra Negra (12 cabeças)', icon: '🐍', archetype: 'reptiliano', floor: 15,
    flavorText: 'Réptil multicéfalo sem patas, corpo de serpente — uma das criaturas mais temidas da masmorra.',
    // Estimado (livro não dá stats Alpha explícitos, só "12 cabeças" como indicação de força).
    poder: 4, habilidade: 2, resistencia: 4,
    xpReward: 28, goldReward: 0,
  },
  naga_sszzaas: {
    name: 'Naga', icon: '🐍', archetype: 'conjurador', floor: 15,
    flavorText: 'Naga espiritual ou negra, usuária de magia com mordida venenosa em vez de constrição.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 5, habilidade: 4, resistencia: 3,
    hp: 15,
    xpReward: 16, goldReward: 0,
  },
  medusa_sszzaas: {
    name: 'Medusa', icon: '🐍', archetype: 'furtivo', floor: 15,
    flavorText: 'Mulher-serpente de olhar petrificante, rara nesta masmorra.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 10, habilidade: 3, resistencia: 2,
    hp: 20,
    xpReward: 14, goldReward: 0,
  },
  dragao_negro_adulto: {
    name: 'Dragão Negro Adulto', icon: '🐉', archetype: 'furtivo', floor: 15,
    flavorText: 'Dragão covarde e traiçoeiro que raramente assume a forma verdadeira, infiltrado disfarçado entre homens-serpente.',
    // Estimado (livro não dá stats Alpha explícitos para este encontro aleatório).
    poder: 6, habilidade: 5, resistencia: 6,
    xpReward: 42, goldReward: 15,
  },
  kuroryuh: {
    name: 'Kuroryuh', icon: '🐉', archetype: 'conjurador', floor: 15,
    flavorText: 'Dragão negro fêmea, líder do culto a Sszzaaz disfarçada de elfa-negra cativa — finge ser vítima para sacrificar seus "salvadores".',
    // Alpha: F4 H4 R5 A5 PdF6(veneno); 35 PVs, 35 PMs → P=floor((4+6)/2)=5, R=floor((5+5)/2)=5
    poder: 6, habilidade: 4, resistencia: 8,
    hp: 35,
    xpReward: 45, goldReward: 20,
  },

  // ── Keenn (andar 16) ──────────────────────────────────────────────────────
  // Masmorra do Deus da Guerra — torneio eterno de campeões de todo o
  // multiverso. A tabela de encontros do livro só dá custo em PP genérico
  // (12-14 pontos) para guerreiros/bárbaros/artistas marciais de várias raças;
  // estimados aqui como um único combatente representativo.

  combatente_keenn: {
    name: 'Combatente de Keenn', icon: '⚔️', archetype: 'dps', floor: 16,
    flavorText: 'Lutador trazido de Arton ou outros mundos para o torneio eterno de Keenn — usa equipamento com bônus +4 na Força de Ataque.',
    // Estimado a partir do custo de 12-14 pontos citado no livro (sem stats Alpha explícitos).
    poder: 5, habilidade: 3, resistencia: 3,
    hp: 15,
    xpReward: 18, goldReward: 0,
  },
  harkash: {
    name: 'Harkash', icon: '👿', archetype: 'dps', floor: 16,
    flavorText: 'Diabo cornugon, possivelmente o lutador mais poderoso da masmorra além do próprio Guardião — colecionador de crânios e ossos.',
    // Alpha: F6 H5 R5 A6 PdF5; 35 PVs, 35 PMs → P=floor((6+5)/2)=5, R=floor((6+5)/2)=5
    poder: 6, habilidade: 5, resistencia: 8,
    hp: 35,
    xpReward: 42, goldReward: 15,
  },
  destrukto: {
    name: 'Destrukto', icon: '🔨', archetype: 'defensor', floor: 16,
    flavorText: 'Antigo sumo-sacerdote de Keenn, derrotado em vida com vergonha — Guardião que busca a morte honrada em batalha que tanto sonhou.',
    // Alpha: F6 H4 R5 A7 PdF3; 45 PVs, 35 PMs → P=floor((6+3)/2)=4, R=floor((7+5)/2)=6
    poder: 6, habilidade: 4, resistencia: 9,
    hp: 45,
    xpReward: 52, goldReward: 20,
  },

  // ── Megalokk (andar 17) ───────────────────────────────────────────────────
  // Masmorra do Deus dos Monstros — antiga colônia formian tomada por
  // predadores selvagens, todos "maiores que o normal" (variantes imensas).

  behir_imenso: {
    name: 'Behir Imenso', icon: '🐍', archetype: 'reptiliano', floor: 17,
    flavorText: 'Serpente gigante com uma dúzia de patas e sopro elétrico, inimiga mortal de dragões.',
    // Alpha (variante imensa): F6 H3 R5 A3 PdF6(eletricidade) → P=floor((6+6)/2)=6, R=floor((3+5)/2)=4
    poder: 6, habilidade: 3, resistencia: 6,
    xpReward: 30, goldReward: 0,
  },
  bulette_imenso: {
    name: 'Bulette Imenso', icon: '🐢', archetype: 'paquiderme', floor: 17,
    flavorText: 'Cruzamento entre tatu e tartaruga monstruosa, "selako terrestre" que ataca emergindo da lama.',
    // Alpha (variante imensa): F6 H3 R5 A5 PdF0 → P=3, R=5
    poder: 6, habilidade: 3, resistencia: 8,
    xpReward: 24, goldReward: 0,
  },
  cubo_gelatinoso_imenso: {
    name: 'Cubo Gelatinoso Imenso', icon: '🧊', archetype: 'generico', floor: 17,
    flavorText: 'Massa amorfa transparente que engolfa e dissolve qualquer matéria orgânica em seu caminho.',
    // Alpha (variante imensa): F2 H1 R4 A0 PdF0 → P=1, R=2
    poder: 6, habilidade: 1, resistencia: 3,
    hp: 15,
    xpReward: 12, goldReward: 0,
  },
  otyugh_enorme: {
    name: 'Otyugh Enorme', icon: '👁️', archetype: 'generico', floor: 17,
    flavorText: 'Carniceiro subterrâneo grotesco, tentáculos sensoriais no topo da cabeça e mordida que transmite doenças.',
    // Alpha (variante enorme): F2 H2 R2 A3 PdF0 → P=1, R=floor((3+2)/2)=2
    poder: 3, habilidade: 2, resistencia: 4,
    hp: 20,
    xpReward: 13, goldReward: 0,
  },
  tendriculo_imenso: {
    name: 'Tendrículo Imenso', icon: '🌿', archetype: 'generico', floor: 17,
    flavorText: 'Amontoado de vegetação predatória surgido da Praga Coral, engole vítimas inteiras com sua boca de espinhos.',
    // Alpha (variante imensa): F6 H1 R4 A4 PdF0 → P=3, R=4
    poder: 6, habilidade: 1, resistencia: 6,
    xpReward: 22, goldReward: 0,
  },
  umber_hulk_enorme: {
    name: 'Umber Hulk Enorme', icon: '🪲', archetype: 'defensor', floor: 17,
    flavorText: 'Cruzamento entre gorila e besouro gigante, seu olhar confuso provoca loucura em quem o encara.',
    // Alpha (variante enorme): F4 H2 R4 A3 PdF0 → P=2, R=floor((3+4)/2)=3
    poder: 4, habilidade: 2, resistencia: 5,
    xpReward: 18, goldReward: 0,
  },
  monstro_ferrugem_grande: {
    name: 'Monstro da Ferrugem Grande', icon: '🪲', archetype: 'generico', floor: 17,
    flavorText: 'Criatura que enferruja metal ao toque — terror de aventureiros bem-equipados.',
    // Estimado (variante "grande", livro não dá stats base explícitos para esta criatura).
    poder: 2, habilidade: 1, resistencia: 2,
    xpReward: 14, goldReward: 0,
  },
  trex_colossal: {
    name: 'Tiranossauro Colossal', icon: '🦖', archetype: 'paquiderme', floor: 17,
    flavorText: 'O maior predador da masmorra, muito maior que qualquer outro em vários mundos — estabeleceu seu covil entre ossadas de presas.',
    // Alpha: F9 H3 R5 A4 PdF0; 45 PVs, 25 PMs → P=4, R=floor((4+5)/2)=4
    poder: 9, habilidade: 3, resistencia: 7,
    hp: 45,
    xpReward: 46, goldReward: 0,
  },

  // ── Nimb (andar 18) ───────────────────────────────────────────────────────
  // Masmorra do Deus do Caos — a tabela de encontros do livro lista NPCs de
  // outros livros (Holy Avenger 3D&T) que não temos como converter aqui. Em vez
  // de inventar substitutos, o encontro aleatório desta masmorra sorteia
  // literalmente qualquer monstro já cadastrado no bestiário (de qualquer
  // andar) — o que é, na prática, a tradução mais fiel possível do espírito
  // "qualquer criatura ao acaso pelos planos" descrito no livro.

  fera_caos: {
    name: 'Fera-do-Caos', icon: '🌀', archetype: 'generico', floor: 18,
    flavorText: 'Criatura amorfa de mutações constantes, nativa do Reino de Nimb — seu toque transforma vítimas em massa disforme.',
    // Alpha: F3-4 H2-3 R2-3 A1-2 PdF0 → P=floor((3+0)/2)=1, R=floor((1+2)/2)=1
    poder: 5, habilidade: 2, resistencia: 3,
    hp: 15,
    xpReward: 10, goldReward: 0,
  },
  tarrasque: {
    name: 'O Tarrasque', icon: '🦖', archetype: 'paquiderme', floor: 18,
    flavorText: 'Monstro lendário de 21 metros, quase indestrutível — uma das criaturas mais temidas do multiverso.',
    // Alpha: F8 H5 R8 A10 PdF0 → P=4, R=floor((10+8)/2)=9
    poder: 8, habilidade: 5, resistencia: 14,
    xpReward: 60, goldReward: 0,
  },
  hit: {
    name: 'Hit', icon: '🐦', archetype: 'defensor', floor: 18,
    flavorText: 'Clériga de Nimb, Guardiã da Ponte — cercada por pássaros do caos que invertem acertos e erros a seu favor.',
    // Alpha: F3 H4 R5 A2 PdF0; 20 PVs, 20 PMs → P=floor((3+0)/2)=1, R=floor((2+5)/2)=3
    poder: 3, habilidade: 4, resistencia: 5,
    hp: 20,
    xpReward: 35, goldReward: 0,
  },

  // ── Khalmyr (andar 19) ────────────────────────────────────────────────────
  // Masmorra do Deus da Justiça — cinco testes estruturados de bondade,
  // percepção, expulsão do mal, coragem e destruição do mal. Sem tabela de
  // encontros aleatórios (nada nesta masmorra é obra do acaso).

  clerigo_khalmyr_ferido: {
    name: 'Clérigo de Khalmyr (ferido)', icon: '🩸', archetype: 'suporte', floor: 19,
    flavorText: 'Sacerdote leal e bondoso, gravemente ferido para testar a generosidade dos Libertadores em curá-lo (Teste da Bondade).',
    // Alpha: ~9 pontos, 10 PVs (descrito só como "clérigos de 9 pontos") → estimado P=1, R=2
    poder: 8, habilidade: 2, resistencia: 2,
    hp: 15,
    xpReward: 0, goldReward: 0,
  },
  guerreiro_anao_khalmyr: {
    name: 'Guerreiro Anão (Teste da Percepção)', icon: '🪓', archetype: 'dps', floor: 19,
    flavorText: 'Um entre fileiras idênticas de anões — metade são malignos prisioneiros, metade paladinos leais; só o comportamento os distingue.',
    // Alpha: F3 H3 R3 A3 PdF0; 15 PVs, 12 PMs → P=floor((3+0)/2)=1, R=3
    poder: 3, habilidade: 3, resistencia: 5,
    hp: 15,
    xpReward: 16, goldReward: 0,
  },
  paladino_anao_khalmyr: {
    name: 'Paladino Anão (Teste da Percepção)', icon: '🛡️', archetype: 'defensor', floor: 19,
    flavorText: 'Paladino anão leal disfarçado entre prisioneiros malignos idênticos — segue seu código de honra mesmo sob disfarce.',
    // Alpha: F3 H2 R3 A3 PdF0; 15 PVs, 12 PMs → P=1, R=3
    poder: 3, habilidade: 2, resistencia: 5,
    hp: 15,
    xpReward: 16, goldReward: 0,
  },
  zumbi_grande_khalmyr: {
    name: 'Zumbi Grande Aprisionado', icon: '🧟', archetype: 'defensor', floor: 19,
    flavorText: 'Morto-vivo gigantesco (em vida, ogre ou bugbear) com Armadura Extra contra quase tudo — só cai para expulsão de mortos-vivos (Teste da Expulsão do Mal).',
    // Alpha: F4 H1 R2 A5 PdF0; 10 PVs, 10 PMs → P=2, R=floor((5+2)/2)=3
    poder: 4, habilidade: 1, resistencia: 5,
    hp: 10,
    xpReward: 14, goldReward: 0,
  },
  gelugon: {
    name: 'Gelugon', icon: '👹', archetype: 'dps', floor: 19,
    flavorText: 'Diabo do gelo aprisionado por Khalmyr, asas de inseto cobertas de gelo disfarçadas de mantos brancos (Teste da Coragem).',
    // Alpha: F6 H5 R6 A7 PdF0; 30 PVs, 30 PMs → P=3, R=floor((7+6)/2)=6
    poder: 6, habilidade: 5, resistencia: 10,
    hp: 30,
    xpReward: 36, goldReward: 0,
  },
  esqueleto_grande_khalmyr: {
    name: 'Esqueleto Grande Aprisionado', icon: '💀', archetype: 'defensor', floor: 19,
    flavorText: 'Esqueleto humanoide monstruoso com Armadura Extra quase total — só armas e magias sagradas o ferem (Teste da Destruição do Mal).',
    // Alpha: F4 H3 R2 A5 PdF0; 10 PVs, 10 PMs → P=2, R=floor((5+2)/2)=3
    poder: 4, habilidade: 3, resistencia: 5,
    hp: 10,
    xpReward: 14, goldReward: 0,
  },
  thomar_steelwill: {
    name: 'Thomar Steelwill', icon: '🗡️', archetype: 'defensor', floor: 19,
    flavorText: 'Paladino caído em desgraça, seduzido por uma súcubo — Guardião de Khalmyr, sua armadura sobrenatural só cede conforme os Libertadores provam seu valor.',
    // Alpha: F7(corte) H4 R5 A4 PdF0; 63 PVs, 35 PMs → P=floor((7+0)/2)=3, R=floor((4+5)/2)=4
    poder: 7, habilidade: 4, resistencia: 7,
    hp: 63,
    xpReward: 58, goldReward: 25,
  },
  karlya: {
    name: 'Karlya', icon: '😈', archetype: 'conjurador', floor: 19,
    flavorText: 'Súcubo que corrompeu Thomar Steelwill, aprisionada ao lado dele — luta junto ao paladino caído.',
    // Alpha: F3 H5 R3 A5 PdF0; 21 PVs, 25 PMs → P=1, R=floor((5+3)/2)=4
    poder: 3, habilidade: 5, resistencia: 6,
    hp: 21,
    xpReward: 30, goldReward: 0,
  },

  // ── Valkaria (andar 20, final) ───────────────────────────────────────────
  // O Labirinto da própria deusa: todos os Guardiões já derrotados retornam
  // como criaturas errantes, e o desafio final é contra o avatar de Valkaria.

  bhaltan: {
    name: 'Bhaltan', icon: '👁️', archetype: 'conjurador', floor: 20,
    flavorText: 'O Observador, maior de sua espécie no multiverso — Guardião de Megalokk, antro de atrocidades e petrificação.',
    // Alpha: F6 H5 R7 A7 PdF5; 45 PVs, 55 PMs → P=floor((6+5)/2)=5, R=floor((7+7)/2)=7
    poder: 6, habilidade: 5, resistencia: 11,
    hp: 45,
    xpReward: 55, goldReward: 25,
  },
  avatar_valkaria: {
    name: 'Avatar de Valkaria', icon: '👑', archetype: 'conjurador', floor: 20,
    flavorText: 'A própria deusa encarnada, empunhando o Desbravador — a Última Guardiã, desafio final do Labirinto que ela mesma construiu.',
    // Alpha: F15 H10 R20 A20 PdF20; 100 PVs, 100 PMs → P=floor((15+20)/2)=17, R=floor((20+20)/2)=20
    poder: 20, habilidade: 10, resistencia: 30,
    hp: 100,
    xpReward: 200, goldReward: 100,
  },
};

/** Todos os IDs cadastrados no bestiário — usado pelo encontro caótico de Nimb. */
export const ALL_MONSTER_IDS = Object.keys(BESTIARIO);

/** Instancia um Enemy a partir de um template do bestiário, já escalado pelo confronto atual. */
export function spawnMonster(key: string, scale: GrowthScale, isBoss = false): Enemy {
  return spawnGrowableMonster(BESTIARIO[key], key, isBoss, scale);
}

/** Todos os monstros cadastrados para um andar específico — útil para auditoria/debug. */
export function monstersForFloor(floor: number): Array<{ id: string } & MonsterTemplate> {
  return Object.entries(BESTIARIO)
    .filter(([, tpl]) => tpl.floor === floor)
    .map(([id, tpl]) => ({ id, ...tpl }));
}
