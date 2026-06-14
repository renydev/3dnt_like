import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../core/services/game-state.service';
import { GameDataService } from '../../../core/services/game-data.service';
import { Character } from '../../../core/models/character.model';
import { Race } from '../../../core/data/races.data';
import { ClassDef } from '../../../core/data/classes.data';
import { VANTAGENS, DESVANTAGENS, VANTAGEM_CATEGORIES, VantagemDef, DesvantagemDef } from '../../../core/models/character-creation.model';
import { PericiaService } from '../../../core/services/pericias.service';
import { PericiaDef } from '../../../core/data/pericias.data';

// ── Tier de origem ────────────────────────────────────────────────────────────

export interface StartingTier {
  id: 'pessoa-comum' | 'novato' | 'lutador' | 'campeao' | 'lenda';
  label: string;
  subtitle: string;
  description: string;
  basePoints: number;
  maxCharacteristic: number;
  icon: string;
  color: string;
  extras: string[];
}

export const STARTING_TIERS: StartingTier[] = [
  {
    id: 'pessoa-comum',
    label: 'Pessoa Comum',
    subtitle: 'Poder de combate quase nulo',
    description: 'Civis, comerciantes, artesãos. Quase todas as Características são zero. Pode ter uma Especialização ou uma Perícia.',
    basePoints: 2,
    maxCharacteristic: 1,
    icon: '🧑',
    color: '#7f8c8d',
    extras: ['Características máximas: 1', 'Até 1 Desvantagem suave (−1pt)', 'Para campanhas de simulação realista'],
  },
  {
    id: 'novato',
    label: 'Novato',
    subtitle: 'Herói em início de carreira',
    description: 'A pontuação típica para aventuras medievais. Você deu seus primeiros passos como aventureiro.',
    basePoints: 5,
    maxCharacteristic: 2,
    icon: '🌱',
    color: '#27ae60',
    extras: ['Características e Focus máximos: 2', 'Até 2 Vantagens', 'Até 3 Desvantagens de −1pt, ou 1 de −2pts'],
  },
  {
    id: 'lutador',
    label: 'Lutador',
    subtitle: 'Aventureiro experiente',
    description: 'Você já tem certa experiência como aventureiro e sobreviveu a muitos desafios.',
    basePoints: 7,
    maxCharacteristic: 3,
    icon: '⚔️',
    color: '#e67e22',
    extras: ['Características e Focus máximos: 3', 'Quaisquer Vantagens disponíveis', 'Até 3 Desvantagens de −1pt, ou 2 de −2pts'],
  },
  {
    id: 'campeao',
    label: 'Campeão',
    subtitle: 'Muitas vitórias na carreira',
    description: 'Você teve muitas vitórias e seu nome é conhecido entre os aventureiros.',
    basePoints: 10,
    maxCharacteristic: 4,
    icon: '🏆',
    color: '#2980b9',
    extras: ['Características e Focus máximos: 4', 'Até 3 Desvantagens de −1 a −2pts, ou 2 de qualquer valor'],
  },
  {
    id: 'lenda',
    label: 'Lenda',
    subtitle: 'Entre os melhores do mundo',
    description: 'Você conquistou seu lugar entre os maiores heróis. Esta é a pontuação máxima para um personagem recém criado.',
    basePoints: 12,
    maxCharacteristic: 5,
    icon: '👑',
    color: '#d4aa14',
    extras: ['Características e Focus máximos: 5', 'Até 3 Desvantagens de qualquer valor', 'Pontuação máxima inicial'],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  'Iniciante': '#27ae60',
  'Intermediário': '#e67e22',
  'Avançado': '#8e44ad',
};

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-creation.component.html',
  styleUrl: './character-creation.component.scss',
})
export class CharacterCreationComponent {
  gameState    = inject(GameStateService);
  gameData     = inject(GameDataService);
  periciasSvc  = inject(PericiaService);

  readonly ATTR_META = [
    { key: 'forca'       as const, label: 'Força',           icon: '⚔️',  color: '#e74c3c' },
    { key: 'habilidade'  as const, label: 'Habilidade',      icon: '🎯',  color: '#3498db' },
    { key: 'resistencia' as const, label: 'Resistência',     icon: '🛡️', color: '#27ae60' },
    { key: 'armadura'    as const, label: 'Armadura',        icon: '🔰',  color: '#95a5a6' },
    { key: 'poderFogo' as const, label: 'Poder de Fogo', icon: '✨',  color: '#8e44ad' },
  ];

  tiers           = STARTING_TIERS;
  vantagens       = VANTAGENS;
  desvantagens    = DESVANTAGENS;
  categories      = VANTAGEM_CATEGORIES;
  periciaCategories = this.periciasSvc.categories;
  steps           = [
    { n: 1, label: 'Origem'    },
    { n: 2, label: 'Raça'      },
    { n: 3, label: 'Classe'    },
    { n: 4, label: 'Atributos' },
    { n: 5, label: 'Vantagens' },
    { n: 6, label: 'Perícias'  },
  ];

  step                 = signal(1);
  charName             = 'Aventureiro';
  selectedTier         = signal<StartingTier | null>(null);
  selectedRace         = signal<Race | null>(null);
  selectedClass        = signal<ClassDef | null>(null);
  selectedVantagens    = signal<string[]>([]);
  selectedDesvantagens = signal<string[]>([]);
  selectedPericias     = signal<string[]>([]);
  raceDiffFilter       = signal('Todas');
  classDiffFilter      = signal('Todas');

  distributedAttrs = signal({
    forca: 0, habilidade: 0, resistencia: 0, armadura: 0, poderFogo: 0,
  });

  // ── Helpers de custo ────────────────────────────────────────────────────────

  /** Custo incremental: ir de N para N+1 custa N+1 pontos. */
  nextCost(currentVal: number): number { return currentVal + 1; }

  /** Custo total para ter um atributo no nível N: N*(N+1)/2. */
  totalCost(n: number): number { return n * (n + 1) / 2; }

  // ── Computed ────────────────────────────────────────────────────────────────

  filteredRaces = computed(() => {
    const f = this.raceDiffFilter();
    return f === 'Todas' ? this.gameData.races : this.gameData.races.filter(r => r.difficulty === f);
  });

  filteredClasses = computed(() => {
    const f = this.classDiffFilter();
    return f === 'Todas' ? this.gameData.classes : this.gameData.classes.filter(c => c.difficulty === f);
  });

  /** Valor final de cada atributo = distribuído + modificador racial. */
  finalStats = computed(() => {
    const r    = this.selectedRace();
    const mods = r?.modifiers ?? {};
    const d    = this.distributedAttrs();
    const forca       = d.forca       + (mods.forca       ?? 0);
    const habilidade  = d.habilidade  + (mods.habilidade  ?? 0);
    const resistencia = d.resistencia + (mods.resistencia ?? 0);
    const armadura    = d.armadura    + (mods.armadura    ?? 0);
    const poderFogo  = Math.max(1, d.poderFogo + (mods.poderFogo ?? 0));
    const pontosVida = resistencia === 0 ? 1 : resistencia * 5;
    return { forca, habilidade, resistencia, armadura, poderFogo, pontosVida };
  });

  statRows = computed(() => {
    const s = this.finalStats();
    const d = this.distributedAttrs();
    return this.ATTR_META.map(m => ({
      ...m,
      distributed: d[m.key],
      final: m.key === 'armadura' ? s.armadura
           : m.key === 'poderFogo' ? s.poderFogo
           : (s as any)[m.key],
    }));
  });

  totalPoints = computed(() => {
    const tier      = this.selectedTier()?.basePoints ?? 5;
    const raceCost  = this.selectedRace()?.pointCost  ?? 0;
    const racebonus = this.selectedRace()?.bonusPoints ?? 0;
    const desvRef   = this.selectedDesvantagens()
      .reduce((s, id) => s + (DESVANTAGENS.find(d => d.id === id)?.refund ?? 0), 0);
    return tier - raceCost + racebonus + desvRef;
  });

  attrSpent = computed(() => {
    const d = this.distributedAttrs();
    return this.totalCost(d.forca) + this.totalCost(d.habilidade)
         + this.totalCost(d.resistencia) + this.totalCost(d.armadura)
         + this.totalCost(d.poderFogo);
  });

  vantagensSpent = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + (VANTAGENS.find(v => v.id === id)?.cost ?? 0), 0)
  );

  periciasSpent = computed(() => this.periciasSvc.totalCost(this.selectedPericias()));

  pointsLeft = computed(() =>
    this.totalPoints() - this.attrSpent() - this.vantagensSpent() - this.periciasSpent()
  );

  allFreeVantagens = computed(() => {
    const list: string[] = [];
    this.selectedRace()?.freeVantagens.forEach(v => list.push(v.name));
    this.selectedClass()?.freeVantagens.forEach(v => list.push(v.name));
    return list;
  });

  selectedVantagensNames = computed(() =>
    this.selectedVantagens().map(id => VANTAGENS.find(v => v.id === id)?.name ?? id)
  );

  // ── Helpers de exibição ─────────────────────────────────────────────────────

  classStatBars(cls: ClassDef): { label: string; value: number; pct: number }[] {
    const maxF = 5;
    return [
      { label: 'F', value: cls.baseStats.forca,       pct: (cls.baseStats.forca / maxF) * 100 },
      { label: 'H', value: cls.baseStats.habilidade,  pct: (cls.baseStats.habilidade / maxF) * 100 },
      { label: 'R', value: cls.baseStats.resistencia, pct: (cls.baseStats.resistencia / maxF) * 100 },
      { label: 'A', value: cls.baseStats.armadura,    pct: (cls.baseStats.armadura / maxF) * 100 },
      { label: 'PF', value: cls.baseStats.poderFogo, pct: Math.min(100, (cls.baseStats.poderFogo / 8) * 100) },
    ];
  }

  vantagensByCategory(cat: string): VantagemDef[] {
    return VANTAGENS.filter(v => v.category === cat);
  }

  periciasByCategory(cat: string): PericiaDef[] {
    return this.periciasSvc.periciasByCategory(cat);
  }

  isPericiaSelected(id: string): boolean { return this.selectedPericias().includes(id); }

  canSelectPericia(p: PericiaDef): boolean {
    if (this.isPericiaSelected(p.id)) return true;
    return this.pointsLeft() >= p.cost;
  }

  togglePericia(p: PericiaDef) {
    if (this.isPericiaSelected(p.id)) {
      this.selectedPericias.update(l => l.filter(x => x !== p.id));
    } else if (this.canSelectPericia(p)) {
      this.selectedPericias.update(l => [...l, p.id]);
    }
  }

  diffColor(d: string): string { return DIFFICULTY_COLORS[d] ?? '#888'; }

  isVantagemSelected(id: string) { return this.selectedVantagens().includes(id); }
  isDesvSelected(id: string)     { return this.selectedDesvantagens().includes(id); }
  getDesv(id: string)            { return DESVANTAGENS.find(d => d.id === id); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  /** Valor final do atributo (distribuído + racial). */
  finalAttr(key: 'forca'|'habilidade'|'resistencia'|'armadura'|'poderFogo'): number {
    const s = this.finalStats();
    return key === 'armadura' ? s.armadura
         : key === 'poderFogo' ? s.poderFogo
         : (s as any)[key];
  }

  canIncrement(key: 'forca'|'habilidade'|'resistencia'|'armadura'|'poderFogo'): boolean {
    const maxAttr = this.selectedTier()?.maxCharacteristic ?? 5;
    const finalVal = this.finalAttr(key);
    if (finalVal >= maxAttr) return false;
    const cost = this.nextCost(this.distributedAttrs()[key]);
    return this.pointsLeft() >= cost;
  }

  canDecrement(key: 'forca'|'habilidade'|'resistencia'|'armadura'|'poderFogo'): boolean {
    return this.distributedAttrs()[key] > 0;
  }

  // ── Seleções ────────────────────────────────────────────────────────────────

  selectTier(t: StartingTier) {
    this.selectedTier.set(t);
    this.selectedVantagens.set([]);
    this.selectedDesvantagens.set([]);
    this.selectedPericias.set([]);
    this.distributedAttrs.set({ forca: 0, habilidade: 0, resistencia: 0, armadura: 0, poderFogo: 0 });
    this.nextStep();
  }

  selectRace(r: Race)      { this.selectedRace.set(r); this.nextStep(); }
  selectClass(c: ClassDef) { this.selectedClass.set(c); this.nextStep(); }
  goToStep(n: number)      { this.step.set(n); }

  incrementAttr(key: 'forca'|'habilidade'|'resistencia'|'armadura'|'poderFogo') {
    if (!this.canIncrement(key)) return;
    this.distributedAttrs.update(d => ({ ...d, [key]: d[key] + 1 }));
  }

  decrementAttr(key: 'forca'|'habilidade'|'resistencia'|'armadura'|'poderFogo') {
    if (!this.canDecrement(key)) return;
    this.distributedAttrs.update(d => ({ ...d, [key]: d[key] - 1 }));
  }

  toggleVantagem(v: VantagemDef) {
    if (this.isVantagemSelected(v.id)) {
      this.selectedVantagens.update(l => l.filter(x => x !== v.id));
    } else if (this.canSelectVantagem(v)) {
      this.selectedVantagens.update(l => [...l, v.id]);
    }
  }

  toggleDesv(d: DesvantagemDef) {
    if (this.isDesvSelected(d.id)) {
      this.selectedDesvantagens.update(l => l.filter(x => x !== d.id));
    } else if (this.canSelectDesv(d)) {
      this.selectedDesvantagens.update(l => [...l, d.id]);
    }
  }

  // ── Validação ───────────────────────────────────────────────────────────────

  canSelectVantagem(v: VantagemDef): boolean {
    if (this.isVantagemSelected(v.id)) return true;
    if (this.pointsLeft() < v.cost) return false;
    return !(v.incompatibleWith ?? []).some(id => this.isVantagemSelected(id));
  }

  canSelectDesv(d: DesvantagemDef): boolean {
    return this.isDesvSelected(d.id) || this.selectedDesvantagens().length < 2;
  }

  canAdvance(): boolean {
    if (this.step() === 1) return !!this.selectedTier();
    if (this.step() === 2) return !!this.selectedRace();
    if (this.step() === 3) return !!this.selectedClass();
    if (this.step() === 4) return this.pointsLeft() >= 0;
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedTier() && !!this.selectedRace() && !!this.selectedClass()
      && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  // ── Confirmar ───────────────────────────────────────────────────────────────

  confirm() {
    if (!this.canConfirm()) return;
    const stats = this.finalStats();

    const character: Character = {
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      class: this.selectedClass()!.id,
      race:  this.selectedRace()!.id,
      level: 1, xp: 0, xpToNextLevel: 100,
      forca:       { base: stats.forca,       current: stats.forca,       max: stats.forca },
      habilidade:  { base: stats.habilidade,  current: stats.habilidade,  max: stats.habilidade },
      resistencia: { base: stats.resistencia, current: stats.resistencia, max: stats.resistencia },
      armadura: stats.armadura,
      poderFogo: { base: stats.poderFogo, current: stats.poderFogo, max: stats.poderFogo },
      pontosVida:  { base: stats.pontosVida,  current: stats.pontosVida,  max: stats.pontosVida },
      vantagens:    [...this.allFreeVantagens(), ...this.selectedVantagensNames()],
      desvantagens: this.selectedDesvantagens().map(id => this.getDesv(id)!.name),
      pericias:     [...this.selectedPericias()],
      gold: 20 + (this.selectedTier()?.basePoints ?? 5) * 2,
      items: ['Poção de Cura'],
      racialMods: this.selectedRace()!.modifiers ?? {},
      statusEffects: [],
      levelUpPoints: 0,
      portraitIcon: this.selectedClass()!.icon,
    };

    this.gameState.startCustomGame(character);
  }
}
