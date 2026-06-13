import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';
import { GameDataService } from '../../core/services/game-data.service';
import { Character } from '../../core/models/character.model';
import { Race } from '../../core/data/races.data';
import { ClassDef } from '../../core/data/classes.data';
import { VANTAGENS, DESVANTAGENS, VANTAGEM_CATEGORIES, VantagemDef, DesvantagemDef } from '../../core/models/character-creation.model';

// ── Tier de origem ────────────────────────────────────────────────────────────

export interface StartingTier {
  id: 'novato' | 'aventureiro' | 'lenda';
  label: string;
  subtitle: string;
  description: string;
  basePoints: number;
  icon: string;
  color: string;
  extras: string[];
}

export const STARTING_TIERS: StartingTier[] = [
  {
    id: 'novato',
    label: 'Novato',
    subtitle: 'Começando do zero',
    description: 'Ideal para quem está aprendendo o sistema 3D&T. Menos pontos, mas ainda assim capaz de criar heróis interessantes.',
    basePoints: 5,
    icon: '🌱',
    color: '#27ae60',
    extras: ['Dificuldade recomendada para iniciantes', 'Personagem mais humano e limitado'],
  },
  {
    id: 'aventureiro',
    label: 'Aventureiro',
    subtitle: 'O padrão do 3D&T',
    description: 'O modo oficial do sistema. Equilíbrio entre poder e desafio — a experiência que os autores planejaram.',
    basePoints: 7,
    icon: '⚔️',
    color: '#e67e22',
    extras: ['Modo padrão do sistema 3D&T', 'Mais vantagens e flexibilidade de build'],
  },
  {
    id: 'lenda',
    label: 'Lenda',
    subtitle: 'Heróis épicos',
    description: 'Para campanhas de alto poder. Personagens com 10 pontos são semideuses desde o início, capazes de feitos extraordinários.',
    basePoints: 10,
    icon: '👑',
    color: '#d4aa14',
    extras: ['Personagens excepcionalmente poderosos', 'Múltiplas vantagens desde o início', 'Recomendado para jogadores experientes'],
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
  gameState = inject(GameStateService);
  gameData  = inject(GameDataService);

  tiers        = STARTING_TIERS;
  vantagens    = VANTAGENS;
  desvantagens = DESVANTAGENS;
  categories   = VANTAGEM_CATEGORIES;
  steps        = [
    { n: 1, label: 'Origem'   },
    { n: 2, label: 'Raça'     },
    { n: 3, label: 'Classe'   },
    { n: 4, label: 'Vantagens'},
  ];

  step                 = signal(1);
  charName             = 'Aventureiro';
  selectedTier         = signal<StartingTier | null>(null);
  selectedRace         = signal<Race | null>(null);
  selectedClass        = signal<ClassDef | null>(null);
  selectedVantagens    = signal<string[]>([]);
  selectedDesvantagens = signal<string[]>([]);
  raceDiffFilter       = signal('Todas');
  classDiffFilter      = signal('Todas');

  // ── Computed ────────────────────────────────────────────────────────────────

  filteredRaces = computed(() => {
    const f = this.raceDiffFilter();
    return f === 'Todas' ? this.gameData.races : this.gameData.races.filter(r => r.difficulty === f);
  });

  filteredClasses = computed(() => {
    const f = this.classDiffFilter();
    return f === 'Todas' ? this.gameData.classes : this.gameData.classes.filter(c => c.difficulty === f);
  });

  finalStats = computed(() => {
    const r = this.selectedRace();
    const c = this.selectedClass();
    if (!r || !c) return { forca: 1, habilidade: 1, resistencia: 1, armadura: 0, pontosMagia: 0, pontosVida: 10, bonusPoints: 0 };
    return this.gameData.calculateFinalStats(r.id, c.id);
  });

  statRows = computed(() => {
    const s = this.finalStats();
    return [
      { label: 'Força',       value: s.forca,       color: '#e74c3c' },
      { label: 'Habilidade',  value: s.habilidade,  color: '#3498db' },
      { label: 'Resistência', value: s.resistencia, color: '#27ae60' },
      { label: 'Armadura',    value: s.armadura,    color: '#95a5a6' },
    ];
  });

  totalPoints = computed(() => {
    const tier      = this.selectedTier()?.basePoints ?? 5;
    const racebonus = this.selectedRace()?.bonusPoints ?? 0;
    const desvRef   = this.selectedDesvantagens()
      .reduce((s, id) => s + (DESVANTAGENS.find(d => d.id === id)?.refund ?? 0), 0);
    return tier + racebonus + desvRef;
  });

  spentPoints = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + (VANTAGENS.find(v => v.id === id)?.cost ?? 0), 0)
  );

  pointsLeft = computed(() => this.totalPoints() - this.spentPoints());

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
    const maxF = 4;
    return [
      { label: 'F', value: cls.baseStats.forca,       pct: (cls.baseStats.forca / maxF) * 100 },
      { label: 'H', value: cls.baseStats.habilidade,  pct: (cls.baseStats.habilidade / maxF) * 100 },
      { label: 'R', value: cls.baseStats.resistencia, pct: (cls.baseStats.resistencia / maxF) * 100 },
      { label: 'A', value: cls.baseStats.armadura,    pct: (cls.baseStats.armadura / maxF) * 100 },
    ];
  }

  vantagensByCategory(cat: string): VantagemDef[] {
    return VANTAGENS.filter(v => v.category === cat);
  }

  diffColor(d: string): string { return DIFFICULTY_COLORS[d] ?? '#888'; }

  isVantagemSelected(id: string) { return this.selectedVantagens().includes(id); }
  isDesvSelected(id: string)     { return this.selectedDesvantagens().includes(id); }
  getDesv(id: string)            { return DESVANTAGENS.find(d => d.id === id); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  // ── Seleções ────────────────────────────────────────────────────────────────

  selectTier(t: StartingTier) {
    this.selectedTier.set(t);
    // Limpa seleções anteriores ao trocar dificuldade
    this.selectedVantagens.set([]);
    this.selectedDesvantagens.set([]);
  }

  selectRace(r: Race)     { this.selectedRace.set(r); }
  selectClass(c: ClassDef) { this.selectedClass.set(c); }
  goToStep(n: number)     { this.step.set(n); }

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
      pontosMagia: { base: stats.pontosMagia, current: stats.pontosMagia, max: stats.pontosMagia },
      pontosVida:  { base: stats.pontosVida,  current: stats.pontosVida,  max: stats.pontosVida },
      vantagens:    [...this.allFreeVantagens(), ...this.selectedVantagensNames()],
      desvantagens: this.selectedDesvantagens().map(id => this.getDesv(id)!.name),
      gold: 20 + (this.selectedTier()?.basePoints ?? 5) * 2,
      items: ['Poção de Cura'],
      statusEffects: [],
      levelUpPoints: 0,
      portraitIcon: this.selectedClass()!.icon,
    };

    this.gameState.startCustomGame(character);
  }
}
