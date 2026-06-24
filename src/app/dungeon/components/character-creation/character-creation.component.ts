import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../core/services/game-state.service';
import { ArquetiposService } from '../../../core/services/arquetipos.service';
import { Character } from '../../../core/models/character.model';
import { Arquetipo, ALL_ARQUETIPOS, ARQUETIPO_MAP } from '../../../core/data/arquetipos.data';
import { KitDef, ALL_KITS, KIT_MAP, kitsCost } from '../../../core/data/kits.data';
import { VALKARIA_FLOORS, DungeonTheme } from '../../../core/models/dungeon.model';
import { ALL_VANTAGENS, VANTAGEM_CATEGORIES, VantagemDef, VantagemCategory } from '../../../core/data/vantagens.data';
import { ALL_DESVANTAGENS, DesvantagemDef } from '../../../core/data/desvantagens.data';
import { parseCostValue } from '../../../core/utils/pp-calculator';
import { PericiaService } from '../../../core/services/pericias.service';
import { PericiaDef } from '../../../core/data/pericias.data';
import { powerScaleSymbol } from '../../../core/utils/power-scale';

const VANTAGEM_CATEGORY_ICONS: Record<VantagemCategory, string> = {
  combate: '⚔️', defesa: '🛡️', atributo: '💪', mental: '🧠',
  social: '💬', movimento: '🏃', recursos: '💰', especial: '✨',
};

// ── Tier de origem ────────────────────────────────────────────────────────────

export interface StartingTier {
  id: 'iniciante' | 'heroi' | 'veterano';
  label: string;
  subtitle: string;
  description: string;
  basePoints: number;
  maxCharacteristic: number;
  icon: string;
  color: string;
  extras: string[];
}

// As 3 faixas de poder oficiais do 3DeT Victory (cap. Recompensas, "Iniciantes, Heróis e Veteranos").
// O limite de atributo 5 na criação vale para as três faixas — o que muda é o total de pontos.
export const STARTING_TIERS: StartingTier[] = [
  {
    id: 'veterano',
    label: 'Veterano',
    subtitle: '★ Modo Fácil',
    description: 'Um campeão consagrado, destinado a vencer torneios mundiais ou proteger o planeta. 35 pontos de personagem.',
    basePoints: 35,
    maxCharacteristic: 5,
    icon: '👑',
    color: '#d4aa14',
    extras: ['35 pontos de personagem', 'Atributos máximos na criação: 5', 'Recomendado para conhecer o jogo'],
  },
  {
    id: 'heroi',
    label: 'Herói',
    subtitle: '⚔ Modo Médio',
    description: 'Você tem boa experiência em sua área e começa a ser reconhecido ao redor do mundo. 20 pontos de personagem.',
    basePoints: 20,
    maxCharacteristic: 5,
    icon: '🏆',
    color: '#2980b9',
    extras: ['20 pontos de personagem', 'Atributos máximos na criação: 5', 'Desafiador, mas equilibrado'],
  },
  {
    id: 'iniciante',
    label: 'Iniciante',
    subtitle: '🔥 Modo Difícil',
    description: 'Um personagem recém-criado, dando os primeiros passos como aventureiro. 10 pontos de personagem — o padrão do livro.',
    basePoints: 10,
    maxCharacteristic: 5,
    icon: '🌱',
    color: '#27ae60',
    extras: ['10 pontos de personagem', 'Atributos máximos na criação: 5', 'Padrão oficial do 3DeT Victory'],
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
  tierId: 'iniciante';
  raceId: string;
  kitIds: string[];
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
    tierId: 'iniciante',
    raceId: 'humano',
    kitIds: ['guerreiro'],
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
    tierId: 'iniciante',
    raceId: 'elfo',
    kitIds: ['mago'],
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
    tag: 'Patrulheiro',
    tierId: 'iniciante',
    raceId: 'kemono',
    kitIds: ['patrulheiro'],
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
  gameState     = inject(GameStateService);
  arquetiposSvc = inject(ArquetiposService);
  periciasSvc   = inject(PericiaService);

  readonly ATTR_META = [
    { key: 'poder'       as const, label: 'Poder',           icon: '⚔️',  color: '#e74c3c' },
    { key: 'habilidade'  as const, label: 'Habilidade',      icon: '🎯',  color: '#3498db' },
    { key: 'resistencia' as const, label: 'Resistência',     icon: '🛡️', color: '#27ae60' },
  ];

  tiers             = STARTING_TIERS;
  presets           = PRESET_CHARACTERS;
  vantagens         = ALL_VANTAGENS;
  desvantagens      = ALL_DESVANTAGENS;
  categories        = VANTAGEM_CATEGORIES.map(c => ({ ...c, icon: VANTAGEM_CATEGORY_ICONS[c.id] }));
  periciaCategories = this.periciasSvc.categories;
  kits              = ALL_KITS;
  arquetipos        = ALL_ARQUETIPOS;
  steps             = [
    { n: 1, label: 'Origem'       },
    { n: 2, label: 'Início Rápido'},
    { n: 3, label: 'Raça'         },
    { n: 4, label: 'Profissão'    },
    { n: 5, label: 'Atributos'    },
    { n: 6, label: 'Vantagens'    },
    { n: 7, label: 'Perícias'     },
    { n: 8, label: 'Devoção'      },
  ];

  gods = VALKARIA_FLOORS;

  step                 = signal(1);
  charName             = 'Aventureiro';
  selectedTier         = signal<StartingTier | null>(null);
  selectedRace         = signal<Arquetipo | null>(null);
  selectedKits             = signal<string[]>([]);
  selectedVantagens        = signal<string[]>([]);
  selectedDesvantagens     = signal<string[]>([]);
  selectedPericias         = signal<string[]>([]);
  selectedEspecializacoes  = signal<string[]>([]);
  selectedGod              = signal<DungeonTheme | null>(null);
  raceDiffFilter       = signal('Todas');

  distributedAttrs = signal({
    poder: 0, habilidade: 0, resistencia: 0,
  });

  // ── Helpers de custo ────────────────────────────────────────────────────────

  /** Custo incremental (3D&T Victory): 1pt até o 5º, 2pts por ponto acima de 5. */
  nextCost(currentVal: number): number { return currentVal < 5 ? 1 : 2; }

  /** Custo total para ter um atributo no nível N: linear, N pontos (até 5; 2/ponto acima). */
  totalCost(n: number): number { return n <= 5 ? Math.max(0, n) : 5 + (n - 5) * 2; }

  // ── Computed ────────────────────────────────────────────────────────────────

  filteredRaces = computed(() => {
    const f = this.raceDiffFilter();
    return f === 'Todas' ? this.arquetipos : this.arquetipos.filter(r => r.difficulty === f);
  });

  /** Valor final de cada atributo = distribuído (arquétipos não dão modificador numérico, só vantagens/desvantagens nomeadas). */
  finalStats = computed(() => {
    const d    = this.distributedAttrs();
    const poder       = d.poder;
    const habilidade  = d.habilidade;
    const resistencia = d.resistencia;
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
    const raceCost  = this.selectedRace()?.cost ?? 0;
    const desvRef   = this.selectedDesvantagens()
      .reduce((s, id) => s + Math.abs(parseCostValue(ALL_DESVANTAGENS.find(d => d.id === id)?.refund ?? '0')), 0);
    return tier - raceCost + desvRef;
  });

  attrSpent = computed(() => {
    const d = this.distributedAttrs();
    return this.totalCost(d.poder) + this.totalCost(d.habilidade)
         + this.totalCost(d.resistencia);
  });

  /** Custo dos kits: 1pt o primeiro, +1pt cada adicional (2pt o segundo, 3pt o terceiro...). */
  kitsSpent = computed(() => kitsCost(this.selectedKits().length));

  vantagensSpent = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + parseCostValue(ALL_VANTAGENS.find(v => v.id === id)?.cost ?? '0'), 0)
  );

  periciasSpent = computed(() =>
    this.periciasSvc.totalCost(this.selectedPericias()) + this.selectedEspecializacoes().length
  );

  pointsLeft = computed(() =>
    this.totalPoints() - this.attrSpent() - this.kitsSpent() - this.vantagensSpent() - this.periciasSpent()
  );

  /** Os poderes do arquétipo (vantagens e desvantagens nomeadas, concedidas automaticamente). */
  allFreeVantagens = computed(() => {
    return (this.selectedRace()?.poderes ?? []).map(p => p.name);
  });

  selectedVantagensNames = computed(() =>
    this.selectedVantagens().map(id => ALL_VANTAGENS.find(v => v.id === id)?.name ?? id)
  );

  selectedKitsNames = computed(() => this.selectedKits().map(id => KIT_MAP.get(id)?.name ?? id));

  // ── Helpers de exibição ─────────────────────────────────────────────────────

  vantagensByCategory(cat: string): VantagemDef[] {
    return ALL_VANTAGENS.filter(v => v.category === cat);
  }

  vantagemCost(v: VantagemDef): number { return parseCostValue(v.cost); }
  desvRefund(d: DesvantagemDef): number { return Math.abs(parseCostValue(d.refund)); }

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

  // ── Kits (Arcanautas) ──────────────────────────────────────────────────────

  isKitSelected(id: string): boolean { return this.selectedKits().includes(id); }

  kitById(id: string): KitDef | undefined { return KIT_MAP.get(id); }

  /** Custo do PRÓXIMO kit, dado quantos já estão selecionados. */
  nextKitCost(): number { return kitsCost(this.selectedKits().length + 1) - this.kitsSpent(); }

  canSelectKit(k: KitDef): boolean {
    if (this.isKitSelected(k.id)) return true;
    return this.pointsLeft() >= this.nextKitCost();
  }

  toggleKit(k: KitDef) {
    if (this.isKitSelected(k.id)) {
      this.selectedKits.update(l => l.filter(x => x !== k.id));
    } else if (this.canSelectKit(k)) {
      this.selectedKits.update(l => [...l, k.id]);
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
  getDesv(id: string)            { return ALL_DESVANTAGENS.find(d => d.id === id); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  /** Valor final do atributo (distribuído + racial). */
  finalAttr(key: 'poder'|'habilidade'|'resistencia'): number {
    const s = this.finalStats();
    return (s as any)[key];
  }

  /** Símbolo de Escala de Poder (3D&T) — vazio em Ningen (0–9), cobre criações futuras com tetos maiores. */
  attrScaleSymbol(key: 'poder'|'habilidade'|'resistencia'): string {
    return powerScaleSymbol(this.finalAttr(key));
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
    this.nextStep();
  }

  selectRace(r: Arquetipo) { this.selectedRace.set(r); this.step.set(4); }
  goToStep(n: number) { this.step.set(n); }

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
    return this.pointsLeft() >= this.vantagemCost(v);
  }

  canSelectDesv(d: DesvantagemDef): boolean {
    return this.isDesvSelected(d.id) || this.selectedDesvantagens().length < 2;
  }

  canAdvance(): boolean {
    if (this.step() === 1) return !!this.selectedTier();
    if (this.step() === 2) return true;
    if (this.step() === 3) return !!this.selectedRace();
    if (this.step() === 4) return this.selectedKits().length > 0;
    if (this.step() === 5) return this.pointsLeft() >= 0;
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedTier() && !!this.selectedRace() && this.selectedKits().length > 0
      && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  applyPreset(preset: PresetCharacter) {
    const tier = STARTING_TIERS.find(t => t.id === preset.tierId)!;
    const race = ARQUETIPO_MAP.get(preset.raceId as any)!;

    this.selectedTier.set(tier);
    this.selectedRace.set(race);
    this.selectedKits.set([...preset.kitIds]);
    this.distributedAttrs.set({ ...preset.attrs });
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
    const firstKit = KIT_MAP.get(this.selectedKits()[0]);

    const character: Character = ({
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      kits: this.selectedKits(),
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
      statusEffects: [],
      levelUpPoints: 0,
      portraitIcon: firstKit?.icon ?? this.selectedRace()?.icon ?? '⚔️',
      patronGod: this.selectedGod()?.id ?? undefined,
    });

    this.gameState.startCustomGame(character);
  }
}
