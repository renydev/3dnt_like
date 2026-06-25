import { Enemy } from '../../../models/combat.model';
import { calcEnemyPP, growthScale, vantagemSlotsFor } from '../../../utils/pp-calculator';
import { MonsterArchetype, MonsterAttrs, rollMonsterVantagens } from '../../monster-vantagens.data';

export interface GrowableMonsterTemplate {
  name: string;
  icon: string;
  sprite?: string;
  flavorText: string;
  poder: number;
  habilidade: number;
  resistencia: number;
  hp?: number;
  xpReward: number;
  goldReward: number;
  /** Categoria temática usada para sortear vantagens "fora da curva" (default: 'generico'). */
  archetype?: MonsterArchetype;
}

/**
 * Aplica o fator de crescimento (mesma proporção P/H/R, só a magnitude muda) e,
 * se a party estiver bem acima da curva esperada, sorteia vantagens temáticas do
 * arquétipo do monstro. Retorna um Enemy pronto para o combate.
 */
export function spawnGrowableMonster(
  tpl: GrowableMonsterTemplate,
  key: string,
  isBoss: boolean,
  scale: number,
): Enemy {
  const effectiveScale = isBoss ? Math.min(scale * 1.1, 2.6) : scale;

  let attrs: MonsterAttrs = {
    poder:       Math.max(1, Math.round(tpl.poder       * effectiveScale)),
    habilidade:  Math.max(1, Math.round(tpl.habilidade  * effectiveScale)),
    resistencia: Math.max(1, Math.round(tpl.resistencia * effectiveScale)),
  };

  let hp = tpl.hp ? Math.round(tpl.hp * effectiveScale) : attrs.resistencia * 5;
  let regenPerTurn = 0;
  let flavorText = tpl.flavorText;
  const bonusVantagens: string[] = [];

  // Chefes sempre manifestam ao menos 1 vantagem extra — mesmo numa run equilibrada,
  // o guardião do andar deve parecer mais que "um mob grande".
  const baseSlots = vantagemSlotsFor(effectiveScale);
  const slots = isBoss ? Math.max(1, baseSlots) : baseSlots;
  const rolled = rollMonsterVantagens(tpl.archetype ?? 'generico', slots);
  for (const v of rolled) {
    attrs = v.apply(attrs);
    if (v.hpBonus) hp += v.hpBonus;
    if (v.regenPerTurn) regenPerTurn += v.regenPerTurn;
    bonusVantagens.push(v.name);
    flavorText = `${flavorText} ${v.flavor}`;
  }

  return {
    id: `${key}_${Math.random().toString(36).slice(2, 7)}`,
    name: tpl.name,
    icon: tpl.icon,
    sprite: tpl.sprite,
    flavorText,
    hp,
    maxHp: hp,
    poder: attrs.poder,
    habilidade: attrs.habilidade,
    resistencia: attrs.resistencia,
    armadura: 0,
    pp: calcEnemyPP(attrs.poder, attrs.habilidade, attrs.resistencia),
    xpReward: tpl.xpReward,
    goldReward: tpl.goldReward,
    isBoss,
    bonusVantagens: bonusVantagens.length ? bonusVantagens : undefined,
    regenPerTurn: regenPerTurn || undefined,
  };
}

export { growthScale };
