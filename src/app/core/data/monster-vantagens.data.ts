/**
 * Pools de vantagens "fora da curva" por arquétipo de monstro.
 *
 * Quando a party está mais forte que o esperado, um monstro curado pode manifestar
 * 1 ou 2 dessas vantagens (ver pp-calculator.ts: growthScale/vantagemSlotsFor) —
 * sempre dentro do universo temático do bicho (um felino nunca sorteia Voo).
 *
 * O efeito mecânico de cada vantagem é aplicado no momento do spawn (attrs/hp),
 * exceto Regeneração, que é resolvida turno a turno em combat.service.ts.
 */

export type MonsterArchetype =
  // animais/feras
  | 'felino' | 'paquiderme' | 'voador' | 'reptiliano'
  // humanoides bípedes (papéis de combate)
  | 'defensor' | 'dps' | 'furtivo' | 'conjurador' | 'atirador' | 'suporte'
  | 'generico';

export interface MonsterAttrs {
  poder: number;
  habilidade: number;
  resistencia: number;
}

export interface MonsterVantagemEffect {
  name: string;
  /** Sufixo narrativo anexado ao flavorText quando a vantagem se manifesta. */
  flavor: string;
  /** Aplica o efeito mecânico nos atributos já escalados (mutação imutável: retorna novo objeto). */
  apply: (attrs: MonsterAttrs) => MonsterAttrs;
  hpBonus?: number;
  regenPerTurn?: number;
}

const vigoroso: MonsterVantagemEffect = {
  name: 'Vigoroso', flavor: 'Sua pele é visivelmente mais resistente que o normal da espécie.',
  apply: a => ({ ...a, resistencia: a.resistencia + 2 }),
};
const forte: MonsterVantagemEffect = {
  name: 'Forte', flavor: 'Seus músculos parecem fora de proporção, anormalmente densos.',
  apply: a => ({ ...a, poder: a.poder + 2 }),
};
const agil: MonsterVantagemEffect = {
  name: 'Ágil', flavor: 'Seus reflexos são rápidos demais para um animal comum.',
  apply: a => ({ ...a, habilidade: a.habilidade + 2 }),
};
const aceleracao: MonsterVantagemEffect = {
  name: 'Aceleração', flavor: 'Ele se move com uma velocidade sobre-humana, fora da curva natural da espécie.',
  apply: a => ({ ...a, habilidade: a.habilidade + 2 }),
};
const maisVida: MonsterVantagemEffect = {
  name: '+Vida', flavor: 'Algo o mantém de pé muito além do que feridas daquela gravidade permitiriam.',
  apply: a => a, hpBonus: 10,
};
const imuneResiliente: MonsterVantagemEffect = {
  name: 'Imune (Resiliente)', flavor: 'Ele não demonstra qualquer sinal de cansaço, ferimento ou fome.',
  apply: a => ({ ...a, resistencia: a.resistencia + 1 }),
};
const regeneracao: MonsterVantagemEffect = {
  name: 'Regeneração', flavor: 'Pequenos ferimentos se fecham sozinhos enquanto ele luta.',
  apply: a => a, regenPerTurn: 2,
};
const camuflagem: MonsterVantagemEffect = {
  name: 'Camuflagem', flavor: 'Sua coloração confunde os olhos — é difícil acertá-lo com precisão.',
  apply: a => ({ ...a, habilidade: a.habilidade + 1 }),
};
const voo: MonsterVantagemEffect = {
  name: 'Voo', flavor: 'Ele se ergue no ar com uma facilidade que nenhum predador terrestre teria.',
  apply: a => ({ ...a, habilidade: a.habilidade + 1 }),
};
const alcance: MonsterVantagemEffect = {
  name: 'Alcance', flavor: 'Seus ataques alcançam muito mais longe do que parece possível.',
  apply: a => ({ ...a, poder: a.poder + 1 }),
};

// ── Humanoides bípedes (papéis de combate) ───────────────────────────────────

const posturaDefensiva: MonsterVantagemEffect = {
  name: 'Defesa Especial', flavor: 'Sua postura de combate é quase impenetrável — bloqueia golpes que deveriam atingi-lo.',
  apply: a => ({ ...a, resistencia: a.resistencia + 2 }),
};
const provocacao: MonsterVantagemEffect = {
  name: 'Defesa Especial (Provocação)', flavor: 'Ele se interpõe deliberadamente, atraindo os ataques para si.',
  apply: a => ({ ...a, resistencia: a.resistencia + 1, poder: a.poder + 1 }),
};
const implacavel: MonsterVantagemEffect = {
  name: 'Implacável', flavor: 'Cada ferimento parece apenas alimentar sua fúria — ele ataca com força crescente.',
  apply: a => ({ ...a, poder: a.poder + 2 }),
};
const acumulador: MonsterVantagemEffect = {
  name: 'Acumulador', flavor: 'Quanto mais acerta, mais forte fica — seus golpes ganham peso a cada acerto.',
  apply: a => ({ ...a, poder: a.poder + 1, habilidade: a.habilidade + 1 }),
};
const golpeFurtivo: MonsterVantagemEffect = {
  name: 'Ataque Furtivo', flavor: 'Ele ataca das sombras com uma precisão letal, visando pontos vitais.',
  apply: a => ({ ...a, habilidade: a.habilidade + 2 }),
};
const invisivelParcial: MonsterVantagemEffect = {
  name: 'Invisível', flavor: 'Ele se torna quase impossível de enxergar por instantes, escapando de qualquer reação.',
  apply: a => ({ ...a, habilidade: a.habilidade + 1, resistencia: a.resistencia + 1 }),
};
const magiaInstavel: MonsterVantagemEffect = {
  name: 'Magia', flavor: 'Energia arcana instável crepita ao redor dele, amplificando cada feitiço.',
  apply: a => ({ ...a, poder: a.poder + 2 }),
};
const elementoPrimordial: MonsterVantagemEffect = {
  name: 'Elemento Primordial', flavor: 'Ele canaliza uma força elemental muito além do esperado para sua espécie.',
  apply: a => ({ ...a, poder: a.poder + 1, habilidade: a.habilidade + 1 }),
};
const tiroCerteiro: MonsterVantagemEffect = {
  name: 'Tiro Certeiro', flavor: 'Cada disparo encontra um ponto vital com uma precisão que desafia o acaso.',
  apply: a => ({ ...a, poder: a.poder + 2 }),
};
const miraPerfeita: MonsterVantagemEffect = {
  name: 'Mira Perfeita', flavor: 'Ele nunca erra o primeiro golpe — parece prever exatamente onde você vai estar.',
  apply: a => ({ ...a, habilidade: a.habilidade + 2 }),
};
const auraDeApoio: MonsterVantagemEffect = {
  name: 'Aura de Proteção', flavor: 'Uma aura protege seus aliados próximos, tornando o grupo inteiro mais resistente.',
  apply: a => ({ ...a, resistencia: a.resistencia + 1 }),
};

export const MONSTER_VANTAGEM_POOLS: Record<MonsterArchetype, MonsterVantagemEffect[]> = {
  felino:      [agil, forte, aceleracao],
  paquiderme:  [vigoroso, imuneResiliente, maisVida],
  voador:      [voo, alcance, agil],
  reptiliano:  [regeneracao, camuflagem, vigoroso],
  defensor:    [posturaDefensiva, provocacao, vigoroso],
  dps:         [implacavel, acumulador, forte],
  furtivo:     [golpeFurtivo, invisivelParcial, agil],
  conjurador:  [magiaInstavel, elementoPrimordial, regeneracao],
  atirador:    [tiroCerteiro, miraPerfeita, alcance],
  suporte:     [auraDeApoio, regeneracao, imuneResiliente],
  generico:    [forte, vigoroso, agil],
};

/** Sorteia N vantagens distintas do pool do arquétipo (sem repetição). */
export function rollMonsterVantagens(archetype: MonsterArchetype, slots: number): MonsterVantagemEffect[] {
  if (slots <= 0) return [];
  const pool = [...(MONSTER_VANTAGEM_POOLS[archetype] ?? MONSTER_VANTAGEM_POOLS.generico)];
  const picked: MonsterVantagemEffect[] = [];
  for (let i = 0; i < slots && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
