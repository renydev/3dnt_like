import { Enemy } from '../models/combat.model';
import { calcEnemyPP } from '../utils/pp-calculator';

const MONSTER_POOLS: Record<number, Array<{ name: string; icon: string; sprite?: string; flavorText: string; isUndead?: boolean }>> = {
  1: [
    { name: 'Goblin Batedora', icon: '👺', sprite: 'goblin-salteador.png', flavorText: 'Uma criatura esguia com dentes afiados e olhos amarelos brilhantes.' },
    { name: 'Rato Gigante das Masmorras', icon: '🐀', sprite: 'rato-gigante.png', flavorText: 'Tão grande quanto um cão, com presas enferrujadas de tanto roer metal.' },
    { name: 'Esqueleto Errante', icon: '💀', sprite: 'esqueleto.png', flavorText: 'Ossos animados por magia antiga. Seus olhos são brasas apagadas.', isUndead: true },
  ],
  2: [
    { name: 'Kobold Feiticeiro', icon: '🦎', sprite: 'kobolds.png', flavorText: 'Um lagarto bípede que gesticula feitiços simples com dedos tortos.' },
    { name: 'Zumbi das Profundezas', icon: '🧟', sprite: 'zumbi.png', flavorText: 'Move-se com esforço, mas é incansável. Não sente dor.', isUndead: true },
    { name: 'Aranha das Trevas', icon: '🕷️', sprite: 'aranha-gigante.png', flavorText: 'Oito olhos brilham na escuridão antes que você a veja.' },
  ],
  3: [
    { name: 'Goblin Guerreiro', icon: '⚔️', sprite: 'goblin-engenhoqueiro.png', flavorText: 'Empunha uma cimitarra enferrujada com surpreendente habilidade.' },
    { name: 'Zumbi Guardião', icon: '🧟', sprite: 'zumbi.png', flavorText: 'Criado para proteger este corredor por séculos.', isUndead: true },
    { name: 'Caranguejo das Cavernas', icon: '🦀', sprite: 'placeholder.png', flavorText: 'Carapaça dura como pedra, garras que partem osso.' },
  ],
  4: [
    { name: 'Orc Batedor', icon: '👹', sprite: 'orc.png', flavorText: 'Musculoso e brutal. Cheira a sangue e cerveja azeda.' },
    { name: 'Elemental de Pedra Menor', icon: '🪨', sprite: 'glop.png', flavorText: 'Uma massa animada de rocha e mágica da terra.' },
    { name: 'Espectro', icon: '👻', sprite: 'aparicao.png', flavorText: 'Flutua sem tocar o chão. Seu toque drena a vida.', isUndead: true },
  ],
  5: [
    { name: 'Troll das Cavernas', icon: '🧌', sprite: 'troll-das-cavernas.png', flavorText: 'Regenera ferimentos menores. Odeio fogo e ácido.' },
    { name: 'Gnoll Guerreiro', icon: '🐺', sprite: 'gnoll.png', flavorText: 'Metade homem, metade hiena. Ri enquanto mata.' },
    { name: 'Mumia Menor', icon: '🤕', sprite: 'placeholder.png', flavorText: 'Enfaixada em bandagens apodrecidas. Emana maldição.', isUndead: true },
  ],
};

const BOSS_DATA: Record<number, { name: string; icon: string; sprite?: string; flavorText: string; isUndead?: boolean }> = {
  1: { name: 'O Grande Urso Sagrado', icon: '🐻', sprite: 'urso-coruja.png', flavorText: 'Guardião de Allihanna, corrompido por forças sombrias. Seus rugidos fazem as paredes tremerem.' },
  2: { name: 'Warchief Gromthar', icon: '👹', sprite: 'orc-chefe.png', flavorText: 'O senhor dos orcs desta região. Empunha um machado do tamanho de um homem.' },
  3: { name: 'Hidra de Três Cabeças', icon: '🐲', sprite: 'hidra.png', flavorText: 'Cada cabeça ataca de um ângulo diferente. Cortar uma faz crescer duas.' },
  4: { name: 'Lich Aprendiz', icon: '💀', sprite: 'necromante-veterano.png', flavorText: 'Um necromante que buscou imortalidade cedo demais. Poderoso, mas instável.', isUndead: true },
  5: { name: 'Golem de Ferro', icon: '🤖', sprite: 'golem-de-ferro.png', flavorText: 'Construído para guardar este tesouro para sempre. Nunca para.' },
};

function getMonsterTemplate(floor: number) {
  const tier = Math.min(5, Math.max(1, Math.ceil(floor / 4)));
  const pool = MONSTER_POOLS[tier] ?? MONSTER_POOLS[1];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getBossTemplate(floor: number) {
  const key = Math.min(5, Math.max(1, Math.ceil(floor / 4)));
  return BOSS_DATA[key] ?? BOSS_DATA[1];
}

export function generateEnemy(floor: number, isBoss: boolean): Enemy {
  if (isBoss) {
    const tpl = getBossTemplate(floor);
    const hp = 20 + floor * 5;
    const forca = 2 + Math.floor(floor / 2);
    const habilidade = 1 + Math.floor(floor / 3);
    const resistencia = Math.max(1, Math.floor(hp / 5));
    const armadura = 1 + Math.floor(floor / 3);
    return {
      id: `boss_${floor}_${Math.random().toString(36).slice(2, 7)}`,
      ...tpl,
      hp,
      maxHp: hp,
      forca,
      habilidade,
      resistencia,
      armadura,
      pp: calcEnemyPP(forca, habilidade, armadura, resistencia),
      xpReward: 50 + floor * 20,
      goldReward: 20 + floor * 10,
      isBoss: true,
    };
  }

  const tpl = getMonsterTemplate(floor);
  const hp = 8 + floor * 2;
  const forca = 1 + Math.floor(floor / 3);
  const habilidade = Math.max(1, Math.floor(floor / 4));
  const resistencia = Math.max(1, Math.floor(hp / 5));
  const armadura = Math.floor(floor / 4);
  return {
    id: `enemy_${floor}_${Math.random().toString(36).slice(2, 7)}`,
    ...tpl,
    hp,
    maxHp: hp,
    forca,
    habilidade,
    resistencia,
    armadura,
    pp: calcEnemyPP(forca, habilidade, armadura, resistencia),
    xpReward: 10 + floor * 5,
    goldReward: 5 + floor * 3,
    isBoss: false,
  };
}
