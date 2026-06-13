import { Enemy } from '../models/combat.model';

function d6() { return Math.ceil(Math.random() * 6); }

const MONSTER_POOLS: Record<number, Array<{ name: string; icon: string; flavorText: string; isUndead?: boolean }>> = {
  1: [
    { name: 'Goblin Batedora', icon: '👺', flavorText: 'Uma criatura esguia com dentes afiados e olhos amarelos brilhantes.' },
    { name: 'Rato Gigante das Masmorras', icon: '🐀', flavorText: 'Tão grande quanto um cão, com presas enferrujadas de tanto roer metal.' },
    { name: 'Esqueleto Errante', icon: '💀', flavorText: 'Ossos animados por magia antiga. Seus olhos são brasas apagadas.', isUndead: true },
  ],
  2: [
    { name: 'Kobold Feiticeiro', icon: '🦎', flavorText: 'Um lagarto bípede que gesticula feitiços simples com dedos tortos.' },
    { name: 'Zumbi das Profundezas', icon: '🧟', flavorText: 'Move-se com esforço, mas é incansável. Não sente dor.', isUndead: true },
    { name: 'Aranha das Trevas', icon: '🕷️', flavorText: 'Oito olhos brilham na escuridão antes que você a veja.' },
  ],
  3: [
    { name: 'Goblin Guerreiro', icon: '⚔️', flavorText: 'Empunha uma cimitarra enferrujada com surpreendente habilidade.' },
    { name: 'Zumbi Guardião', icon: '🧟', flavorText: 'Criado para proteger este corredor por séculos.', isUndead: true },
    { name: 'Caranguejo das Cavernas', icon: '🦀', flavorText: 'Carapaça dura como pedra, garras que partem osso.' },
  ],
  4: [
    { name: 'Orc Batedor', icon: '👹', flavorText: 'Musculoso e brutal. Cheira a sangue e cerveja azeda.' },
    { name: 'Elemental de Pedra Menor', icon: '🪨', flavorText: 'Uma massa animada de rocha e mágica da terra.' },
    { name: 'Espectro', icon: '👻', flavorText: 'Flutua sem tocar o chão. Seu toque drena a vida.', isUndead: true },
  ],
  5: [
    { name: 'Troll das Cavernas', icon: '🧌', flavorText: 'Regenera ferimentos menores. Odeio fogo e ácido.' },
    { name: 'Gnoll Guerreiro', icon: '🐺', flavorText: 'Metade homem, metade hiena. Ri enquanto mata.' },
    { name: 'Mumia Menor', icon: '🤕', flavorText: 'Enfaixada em bandagens apodrecidas. Emana maldição.', isUndead: true },
  ],
};

const BOSS_DATA: Record<number, { name: string; icon: string; flavorText: string; isUndead?: boolean }> = {
  1: { name: 'O Grande Urso Sagrado', icon: '🐻', flavorText: 'Guardião de Allihanna, corrompido por forças sombrias. Seus rugidos fazem as paredes tremerem.' },
  2: { name: 'Warchief Gromthar', icon: '👹', flavorText: 'O senhor dos orcs desta região. Empunha um machado do tamanho de um homem.' },
  3: { name: 'Hidra de Três Cabeças', icon: '🐲', flavorText: 'Cada cabeça ataca de um ângulo diferente. Cortar uma faz crescer duas.' },
  4: { name: 'Lich Aprendiz', icon: '💀', flavorText: 'Um necromante que buscou imortalidade cedo demais. Poderoso, mas instável.', isUndead: true },
  5: { name: 'Golem de Ferro', icon: '🤖', flavorText: 'Construído para guardar este tesouro para sempre. Nunca para.' },
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
    return {
      ...tpl,
      hp,
      maxHp: hp,
      forca: 2 + Math.floor(floor / 2),
      armadura: 1 + Math.floor(floor / 3),
      xpReward: 50 + floor * 20,
      goldReward: 20 + floor * 10,
      isBoss: true,
    };
  }

  const tpl = getMonsterTemplate(floor);
  const hp = 8 + floor * 2;
  return {
    ...tpl,
    hp,
    maxHp: hp,
    forca: 1 + Math.floor(floor / 3),
    armadura: Math.floor(floor / 4),
    xpReward: 10 + floor * 5,
    goldReward: 5 + floor * 3,
    isBoss: false,
  };
}
