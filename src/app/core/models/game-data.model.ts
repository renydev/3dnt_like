import { CharacterClass } from './character.model';

// ─── VANTAGENS ────────────────────────────────────────────────────────────────

export type VantagemCategory =
  | 'combate' | 'magia' | 'defesa' | 'movimento' | 'social'
  | 'sentidos' | 'racial' | 'divino' | 'especial';

export interface Vantagem {
  id: string;
  name: string;
  cost: number;            // pontos de personagem
  category: VantagemCategory;
  icon: string;
  shortEffect: string;     // uma linha — usado nos chips de seleção
  fullEffect: string;      // descrição completa do efeito mecânico
  flavor?: string;         // texto de lore
  requires?: string[];     // ids de outras vantagens pré-requisito
  incompatibleWith?: string[];
  pmCost?: number;         // PM por uso, se for ativa
  onlyClass?: CharacterClass[];
}

// ─── DESVANTAGENS ─────────────────────────────────────────────────────────────

export type DesvantagemCategory = 'comportamental' | 'social' | 'fisica' | 'psicologica' | 'magica';

export interface Desvantagem {
  id: string;
  name: string;
  refund: number;          // pontos devolvidos (positivo)
  category: DesvantagemCategory;
  icon: string;
  shortPenalty: string;
  fullPenalty: string;
  flavor?: string;
  incompatibleWith?: string[];
}

// ─── MAGIAS ───────────────────────────────────────────────────────────────────

export type MagiaSchool = 'fogo' | 'agua' | 'ar' | 'terra' | 'luz' | 'trevas'
  | 'secundario' | 'divino' | 'psiquico' | 'universal';

export type MagiaDuration = 'instantanea' | 'sustentavel' | 'permanente' | 'especial';
export type MagiaRange = 'toque' | 'padrao' | 'area' | 'conjurador' | 'especial';

// Alvo da magia
export type MagiaTargetType = 'proprio' | 'unico' | 'multiplo' | 'area';

// Tipo do efeito principal
export type MagiaDamageType = 'dano' | 'cura' | 'controle' | 'buff' | 'nenhum';

/**
 * ─── METODOLOGIA DE CÁLCULO DE DANO ──────────────────────────────────────────
 *
 * damageFormula usa notação prefixada:
 *   Negativo (-) = causa dano    Positivo (+) = cura / beneficia
 *
 * Variáveis disponíveis na fórmula:
 *   H      = Habilidade do conjurador
 *   Focus  = nível de Focus no Caminho usado
 *   PdF    = Poder de Fogo do conjurador
 *   PM     = PMs gastos na ativação (relevante quando damagePerPM está definido)
 *   1d6    = 1 dado de 6 faces (notação 3D&T: "1d")
 *
 * Resolução de ataque (damageType === 'dano'):
 *   1. Conjurador rola FA = valor de damageFormula (em positivo)
 *   2. Alvo rola FD = H_alvo + A_alvo + 1d6
 *   3. Dano final = FA − FD  (mínimo 0)
 *   4. Se ignoresArmor = true → FD do alvo não inclui A (apenas H + 1d6)
 *   5. Se savingThrow definido → alvo faz teste (1d6 ≤ atributo); sucesso = metade do dano ou sem efeito
 *
 * Resolução de cura (damageType === 'cura'):
 *   1. Conjurador calcula valor de damageFormula (em positivo)
 *   2. Alvo recupera esse valor em PVs (não pode ultrapassar máximo)
 *   3. damagePerPM indica escalonamento por PM extra gasto
 *
 * Resolução de controle/buff (damageType === 'controle' | 'buff'):
 *   Sem cálculo numérico de HP; efeito descrito em `effect`
 *   savingThrow indica atributo para resistir ao controle
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface Magia {
  id: string;
  name: string;
  school: MagiaSchool;
  focusRequired: number;      // nível mínimo de Focus
  pmCost: string;             // ex: "2", "padrão", "1 por alvo"
  duration: MagiaDuration;
  range: MagiaRange;
  icon: string;
  description: string;        // descrição narrativa
  effect: string;             // efeito mecânico completo (texto)

  // ── Alvo e área ──────────────────────────────────────────────────────────
  targetType: MagiaTargetType;
  areaRadius?: number;        // raio em metros (targetType === 'area')
  maxTargets?: number;        // máximo de alvos (targetType === 'multiplo')

  // ── Dano / Cura ──────────────────────────────────────────────────────────
  damageType: MagiaDamageType;
  damageFormula?: string;     // negativo = dano, positivo = cura. Ex: '-H-Focus-1d6', '+1d6', '-9'
  damagePerPM?: string;       // escalonamento por PM extra. Ex: '+1d6 por 2 PMs'
  ignoresArmor?: boolean;     // true = FD do alvo não inclui Armadura
  savingThrow?: 'R' | 'H';   // atributo para teste de resistência

  requiresVantagem?: string[];
  flavor?: string;
}

// ─── ENCONTROS DE ROLEPLAY ────────────────────────────────────────────────────

export type EncounterTheme =
  | 'moral' | 'exploracao' | 'negociacao' | 'descoberta'
  | 'sobrevivencia' | 'mistico' | 'armadilha' | 'personagem';

export interface EncounterChoice {
  text: string;
  testStat?: 'forca' | 'habilidade' | 'resistencia';
  testModifier?: number;   // bônus/redutor no teste
  successText: string;
  failText?: string;       // só se houver teste
  reward?: { type: 'gold' | 'item' | 'healing' | 'xp' | 'vantagem_temp'; label: string; value: number };
  penalty?: { type: 'damage' | 'gold_loss' | 'item' | 'status'; label: string; value: number };
}

export interface RoleplayEncounter {
  id: string;
  title: string;
  theme: EncounterTheme;
  setting: string;         // descrição da cena
  description: string;     // o que o jogador encontra
  choices: [EncounterChoice, EncounterChoice, EncounterChoice]; // sempre 3
  flavorText?: string;     // citação/epígrafe
}
