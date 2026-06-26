import { Enemy } from '../../../models/combat.model';
import { calcEnemyPP, GROWTH_MAX, GrowthScale, growthScale, vantagemSlotsFor } from '../../../utils/pp-calculator';
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
  /** Andar (masmorra) a que este monstro pertence — ver DUNGEON_REGISTRY em dungeon-registry.ts. */
  floor: number;
}

/**
 * Aplica o fator de crescimento — agora espelhado por atributo (ver GrowthScale
 * em pp-calculator.ts): o Poder do monstro reage à Resistência real da party, e
 * a Resistência do monstro reage ao Poder real da party, em vez de um único
 * multiplicador cego à distribuição de atributos. Se a party estiver bem acima
 * da curva esperada (scale.overall), sorteia vantagens temáticas do arquétipo
 * do monstro. Retorna um Enemy pronto para o combate.
 */
export function spawnGrowableMonster(
  tpl: GrowableMonsterTemplate,
  key: string,
  isBoss: boolean,
  scale: GrowthScale,
): Enemy {
  const bossMul = isBoss ? 1.1 : 1;
  const poderScale       = Math.min(GROWTH_MAX, scale.poder       * bossMul);
  const resistenciaScale = Math.min(GROWTH_MAX, scale.resistencia * bossMul);
  const habilidadeScale  = Math.min(GROWTH_MAX, scale.habilidade  * bossMul);
  const overallScale     = Math.min(GROWTH_MAX, scale.overall     * bossMul);

  let attrs: MonsterAttrs = {
    poder:       Math.max(1, Math.round(tpl.poder       * poderScale)),
    habilidade:  Math.max(1, Math.round(tpl.habilidade  * habilidadeScale)),
    resistencia: Math.max(1, Math.round(tpl.resistencia * resistenciaScale)),
  };

  let hp = tpl.hp ? Math.round(tpl.hp * overallScale) : attrs.resistencia * 5;
  let regenPerTurn = 0;
  let flavorText = tpl.flavorText;
  const bonusVantagens: string[] = [];

  // Chefes sempre manifestam ao menos 1 vantagem extra — mesmo numa run equilibrada,
  // o guardião do andar deve parecer mais que "um mob grande".
  const baseSlots = vantagemSlotsFor(overallScale);
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
