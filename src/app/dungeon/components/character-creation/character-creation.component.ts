import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../core/services/game-state.service';
import { GameDataService } from '../../../core/services/game-data.service';
import { Character, FocusPath, FOCUS_PATHS, FOCUS_PATH_LABELS, FOCUS_PATH_ICONS, FocusPaths } from '../../../core/models/character.model';
import { applyStartingRing } from '../../../core/models/item.model';
import { Race, ALL_RACES, RACE_MAP } from '../../../core/data/races.data';
import { ClassDef, ALL_CLASSES, CLASS_MAP } from '../../../core/data/classes.data';
import { VALKARIA_FLOORS, DungeonTheme } from '../../../core/models/dungeon.model';
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
    id: 'lenda',
    label: 'Lenda',
    subtitle: '★ Modo Fácil',
    description: 'Você conquista seu lugar entre os maiores heróis. Pontuação máxima — recomendada para conhecer o jogo.',
    basePoints: 12,
    maxCharacteristic: 5,
    icon: '👑',
    color: '#d4aa14',
    extras: ['Características máximas: 5', 'Até 3 Desvantagens de qualquer valor', 'Pontuação máxima inicial'],
  },
  {
    id: 'campeao',
    label: 'Campeão',
    subtitle: '⚔ Modo Médio',
    description: 'Você tem muitas vitórias e seu nome é conhecido entre os aventureiros. Desafiador, mas equilibrado.',
    basePoints: 10,
    maxCharacteristic: 4,
    icon: '🏆',
    color: '#2980b9',
    extras: ['Características máximas: 4', 'Até 3 Desvantagens de −1 a −2pts, ou 2 de qualquer valor'],
  },
  {
    id: 'lutador',
    label: 'Lutador',
    subtitle: '🔥 Modo Difícil',
    description: 'Você tem certa experiência como aventureiro, mas cada ponto conta. Para quem quer um desafio real.',
    basePoints: 7,
    maxCharacteristic: 3,
    icon: '⚔️',
    color: '#e67e22',
    extras: ['Características máximas: 3', 'Quaisquer Vantagens disponíveis', 'Até 3 Desvantagens de −1pt, ou 2 de −2pts'],
  },
  {
    id: 'novato',
    label: 'Novato',
    subtitle: '💀 Modo Muito Difícil',
    description: 'Você deu seus primeiros passos como aventureiro. O dungeon será implacável com você.',
    basePoints: 5,
    maxCharacteristic: 2,
    icon: '🌱',
    color: '#27ae60',
    extras: ['Características máximas: 2', 'Até 2 Vantagens', 'Até 3 Desvantagens de −1pt, ou 1 de −2pts'],
  },
  {
    id: 'pessoa-comum',
    label: 'Pessoa Comum',
    subtitle: '☠ Impossível',
    description: 'Civil sem treinamento de combate. Quase todas as Características são zero. Boa sorte.',
    basePoints: 2,
    maxCharacteristic: 1,
    icon: '🧑',
    color: '#7f8c8d',
    extras: ['Características máximas: 1', 'Até 1 Desvantagem suave (−1pt)', 'Sobrevivência: improvável'],
  },
];

// ── Personagens pré-criados ───────────────────────────────────────────────────

export interface PresetCharacter {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tag: string;
  tierId: 'lutador';
  raceId: string;
  classId: string;
  attrs: { poder: number; habilidade: number; resistencia: number };
  vantagenIds: string[];
  desvIds: string[];
  highlights: string[];
}

export const PRESET_CHARACTERS: PresetCharacter[] = [
  {
    id: 'guerreiro-preset',
    name: 'Thordak, o Guerreiro',
    description: 'Humano resistente especializado em combate corpo a corpo. Usa sua força bruta para destruir inimigos à curta distância.',
    icon: '⚔️',
    color: '#e74c3c',
    tag: 'Guerreiro',
    tierId: 'lutador',
    raceId: 'humano',
    classId: 'guerreiro',
    // Humano: 7 base + 2 bonus = 9pts. Custo linear: 3+1+1 = 5 (4 sobram para perícias/vantagens)
    attrs: { poder: 3, habilidade: 1, resistencia: 1 },
    vantagenIds: [],
    desvIds: [],
    highlights: ['Poder máximo de um Lutador', 'Combate corpo a corpo', 'Simples de jogar'],
  },
  {
    id: 'mago-preset',
    name: 'Aerindel, a Maga',
    description: 'Elfa com imenso talento arcano. Destrói grupos de inimigos com magias poderosas, mas é frágil se cercada.',
    icon: '🔮',
    color: '#8e44ad',
    tag: 'Mago',
    tierId: 'lutador',
    raceId: 'elfo',
    classId: 'mago',
    // Elfo: 7 base - 2 custo raça = 5pts. Custo linear: 1+2+1 = 4 (1 sobra)
    // Final: poder:0 (1-1), habilidade:2 (1+1), resistencia:1
    attrs: { poder: 1, habilidade: 1, resistencia: 1 },
    vantagenIds: [],
    desvIds: [],
    highlights: ['Poder 3 com bônus élfico', 'Dano mágico devastador', 'Requer posicionamento'],
  },
  {
    id: 'arqueiro-preset',
    name: 'Silas, o Arqueiro',
    description: 'Meio-elfo ágil e preciso. Ataca à distância com alta habilidade antes que os inimigos cheguem perto.',
    icon: '🏹',
    color: '#27ae60',
    tag: 'Ranger',
    tierId: 'lutador',
    raceId: 'meio-elfo',
    classId: 'ranger',
    // Meio-elfo: 7 base - 1 custo raça + 1 bonus = 7pts. Custo linear: 1+2+1 = 4 (3 sobram)
    // Final: poder:1, habilidade:3 (2+1), resistencia:1
    attrs: { poder: 1, habilidade: 2, resistencia: 1 },
    vantagenIds: [],
    desvIds: [],
    highlights: ['Habilidade 3 para ataques certeiros', 'Mobilidade e alcance', 'Estilo de jogo versátil'],
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
    { key: 'poder'       as const, label: 'Poder',           icon: '⚔️',  color: '#e74c3c' },
    { key: 'habilidade'  as const, label: 'Habilidade',      icon: '🎯',  color: '#3498db' },
    { key: 'resistencia' as const, label: 'Resistência',     icon: '🛡️', color: '#27ae60' },
  ];

  tiers             = STARTING_TIERS;
  presets           = PRESET_CHARACTERS;
  vantagens         = VANTAGENS;
  desvantagens      = DESVANTAGENS;
  categories        = VANTAGEM_CATEGORIES;
  periciaCategories = this.periciasSvc.categories;
  steps             = [
    { n: 1, label: 'Origem'       },
    { n: 2, label: 'Início Rápido'},
    { n: 3, label: 'Raça'         },
    { n: 4, label: 'Classe'       },
    { n: 5, label: 'Atributos'    },
    { n: 6, label: 'Vantagens'    },
    { n: 7, label: 'Perícias'     },
    { n: 8, label: 'Devoção'      },
  ];

  gods = VALKARIA_FLOORS;

  step                 = signal(1);
  charName             = 'Aventureiro';
  selectedTier         = signal<StartingTier | null>(null);
  selectedRace         = signal<Race | null>(null);
  selectedClass        = signal<ClassDef | null>(null);
  selectedVantagens        = signal<string[]>([]);
  selectedDesvantagens     = signal<string[]>([]);
  selectedPericias         = signal<string[]>([]);
  selectedEspecializacoes  = signal<string[]>([]);
  selectedGod              = signal<DungeonTheme | null>(null);
  raceDiffFilter       = signal('Todas');
  classDiffFilter      = signal('Todas');

  distributedAttrs = signal({
    poder: 0, habilidade: 0, resistencia: 0,
  });

  // Focos de Magia — distribuídos junto com atributos no passo 5
  readonly FOCUS_META = FOCUS_PATHS.map(p => ({
    key: p,
    label: FOCUS_PATH_LABELS[p],
    icon: FOCUS_PATH_ICONS[p],
  }));

  distributedFocus = signal<FocusPaths>({
    fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0,
  });

  // ── Helpers de custo ────────────────────────────────────────────────────────

  /** Custo incremental (3D&T Victory): 1pt até o 5º, 2pts por ponto acima de 5. */
  nextCost(currentVal: number): number { return currentVal < 5 ? 1 : 2; }

  /** Custo total para ter um atributo no nível N: linear, N pontos (até 5; 2/ponto acima). */
  totalCost(n: number): number { return n <= 5 ? Math.max(0, n) : 5 + (n - 5) * 2; }

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
    const poder       = d.poder       + (mods.poder       ?? 0);
    const habilidade  = d.habilidade  + (mods.habilidade  ?? 0);
    const resistencia = d.resistencia + (mods.resistencia ?? 0);
    const pontosVida = resistencia === 0 ? 1 : resistencia * 5;
    const pontosMana = habilidade === 0 ? 1 : habilidade * 5;
    return { poder, habilidade, resistencia, pontosVida, pontosMana };
  });

  statRows = computed(() => {
    const s = this.finalStats();
    const d = this.distributedAttrs();
    return this.ATTR_META.map(m => ({
      ...m,
      distributed: d[m.key],
      final: (s as any)[m.key],
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

  focusSpent = computed(() => {
    const f = this.distributedFocus();
    return FOCUS_PATHS.reduce((sum, p) => sum + this.totalCost(f[p]), 0);
  });

  attrSpent = computed(() => {
    const d = this.distributedAttrs();
    return this.totalCost(d.poder) + this.totalCost(d.habilidade)
         + this.totalCost(d.resistencia) + this.focusSpent();
  });

  vantagensSpent = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + (VANTAGENS.find(v => v.id === id)?.cost ?? 0), 0)
  );

  periciasSpent = computed(() =>
    this.periciasSvc.totalCost(this.selectedPericias()) + this.selectedEspecializacoes().length
  );

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
    const maxAttr = 10;
    return [
      { label: 'P', value: cls.baseStats.poder,       pct: Math.min(100, (cls.baseStats.poder / maxAttr) * 100) },
      { label: 'H', value: cls.baseStats.habilidade,  pct: (cls.baseStats.habilidade / 5) * 100 },
      { label: 'R', value: cls.baseStats.resistencia, pct: (cls.baseStats.resistencia / 5) * 100 },
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

  // ── Especializações individuais (1 PP cada) ──────────────────────────────────

  isEspecializacaoSelected(espId: string): boolean {
    return this.selectedEspecializacoes().includes(espId);
  }

  /** Retorna true se a especializacao já está coberta pela perícia completa selecionada */
  isEspecializacaoCoveredByPericia(periciaId: string): boolean {
    return this.isPericiaSelected(periciaId);
  }

  canSelectEspecializacao(periciaId: string, espId: string): boolean {
    if (this.isEspecializacaoCoveredByPericia(periciaId)) return true;
    if (this.isEspecializacaoSelected(espId)) return true;
    return this.pointsLeft() >= 1;
  }

  toggleEspecializacao(periciaId: string, espId: string) {
    if (this.isEspecializacaoCoveredByPericia(periciaId)) return;
    if (this.isEspecializacaoSelected(espId)) {
      this.selectedEspecializacoes.update(l => l.filter(x => x !== espId));
    } else if (this.pointsLeft() >= 1) {
      this.selectedEspecializacoes.update(l => [...l, espId]);
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
  finalAttr(key: 'poder'|'habilidade'|'resistencia'): number {
    const s = this.finalStats();
    return (s as any)[key];
  }

  canUseFocus(): boolean {
    const cls = this.selectedClass()?.id;
    if (cls === 'mago' || cls === 'clerigo') return true;
    const sel = this.selectedVantagens();
    return sel.includes('arcano') || sel.includes('clericato');
  }

  canIncrementFocus(path: FocusPath): boolean {
    if (!this.canUseFocus()) return false;
    const cur = this.distributedFocus()[path];
    if (cur >= 5) return false;
    return this.pointsLeft() >= this.nextCost(cur);
  }

  canDecrementFocus(path: FocusPath): boolean {
    return this.distributedFocus()[path] > 0;
  }

  incrementFocus(path: FocusPath): void {
    if (!this.canIncrementFocus(path)) return;
    this.distributedFocus.update(f => ({ ...f, [path]: f[path] + 1 }));
  }

  decrementFocus(path: FocusPath): void {
    if (!this.canDecrementFocus(path)) return;
    this.distributedFocus.update(f => ({ ...f, [path]: f[path] - 1 }));
  }

  canIncrement(key: 'poder'|'habilidade'|'resistencia'): boolean {
    const maxAttr = this.selectedTier()?.maxCharacteristic ?? 5;
    const finalVal = this.finalAttr(key);
    if (finalVal >= maxAttr) return false;
    const cost = this.nextCost(this.distributedAttrs()[key]);
    return this.pointsLeft() >= cost;
  }

  canDecrement(key: 'poder'|'habilidade'|'resistencia'): boolean {
    return this.distributedAttrs()[key] > 0;
  }

  // ── Seleções ────────────────────────────────────────────────────────────────

  selectTier(t: StartingTier) {
    this.selectedTier.set(t);
    this.selectedVantagens.set([]);
    this.selectedDesvantagens.set([]);
    this.selectedPericias.set([]);
    this.selectedEspecializacoes.set([]);
    this.selectedGod.set(null);
    this.distributedAttrs.set({ poder: 0, habilidade: 0, resistencia: 0 });
    this.distributedFocus.set({ fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0 });
    this.nextStep();
  }

  selectRace(r: Race)      { this.selectedRace.set(r);  this.step.set(4); }
  selectClass(c: ClassDef) { this.selectedClass.set(c); this.step.set(5); }
  goToStep(n: number)      { this.step.set(n); }

  incrementAttr(key: 'poder'|'habilidade'|'resistencia') {
    if (!this.canIncrement(key)) return;
    this.distributedAttrs.update(d => ({ ...d, [key]: d[key] + 1 }));
  }

  decrementAttr(key: 'poder'|'habilidade'|'resistencia') {
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
    if (this.step() === 2) return true;
    if (this.step() === 3) return !!this.selectedRace();
    if (this.step() === 4) return !!this.selectedClass();
    if (this.step() === 5) return this.pointsLeft() >= 0;
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedTier() && !!this.selectedRace() && !!this.selectedClass()
      && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  applyPreset(preset: PresetCharacter) {
    const tier = STARTING_TIERS.find(t => t.id === preset.tierId)!;
    const race = ALL_RACES.find(r => r.id === preset.raceId)!;
    const cls  = ALL_CLASSES.find(c => c.id === preset.classId)!;

    this.selectedTier.set(tier);
    this.selectedRace.set(race);
    this.selectedClass.set(cls);
    this.distributedAttrs.set({ ...preset.attrs });
    this.distributedFocus.set({ fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0 });
    this.selectedVantagens.set([...preset.vantagenIds]);
    this.selectedDesvantagens.set([...preset.desvIds]);
    this.selectedPericias.set([]);
    this.selectedEspecializacoes.set([]);
    this.charName = preset.name;
    this.confirm();
  }

  skipPreset() { this.step.set(3); }

  // ── Confirmar ───────────────────────────────────────────────────────────────

  confirm() {
    if (!this.canConfirm()) return;
    const stats = this.finalStats();

    const character: Character = applyStartingRing({
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      class: this.selectedClass()!.id,
      race:  this.selectedRace()!.id,
      level: 1, xp: 0, xpToNextLevel: 100,
      poder:       { base: stats.poder,       current: stats.poder,       max: stats.poder },
      habilidade:  { base: stats.habilidade,  current: stats.habilidade,  max: stats.habilidade },
      resistencia: { base: stats.resistencia, current: stats.resistencia, max: stats.resistencia },
      pontosVida: { base: stats.pontosVida, current: stats.pontosVida, max: stats.pontosVida },
      pontosMana: { base: stats.pontosMana, current: stats.pontosMana, max: stats.pontosMana },
      vantagens:    [...this.allFreeVantagens(), ...this.selectedVantagensNames()],
      desvantagens: this.selectedDesvantagens().map(id => this.getDesv(id)!.name),
      pericias:     [...this.selectedPericias(), ...this.selectedEspecializacoes()],
      gold: 20 + (this.selectedTier()?.basePoints ?? 5) * 2,
      inventory: [],
      equipment: {},
      focus: { ...this.distributedFocus() },
      racialMods: this.selectedRace()!.modifiers ?? {},
      statusEffects: [],
      levelUpPoints: 0,
      portraitIcon: this.selectedClass()!.icon,
      patronGod: this.selectedGod()?.id ?? undefined,
    });

    this.gameState.startCustomGame(character);
  }
}
