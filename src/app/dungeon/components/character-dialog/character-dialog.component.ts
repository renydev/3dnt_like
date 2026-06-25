import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character, DEFAULT_CHAR_COLOR } from '../../../core/models/character.model';
import { KIT_MAP } from '../../../core/data/kits.data';
import { ALL_ARQUETIPOS } from '../../../core/data/arquetipos.data';
import { getEffectiveStats, mergeBonus, allEquipItems, EquipSlot, equipSlotLabel } from '../../../core/models/item.model';
import { getPowerScale, powerScaleSymbol, powerScaleLabel, formatAttributeAbacus } from '../../../core/utils/power-scale';

export type SpendableAttr = 'poder' | 'habilidade' | 'resistencia';

export interface AttrRow {
  key: SpendableAttr;
  label: string;
  abbr: string;
  icon: string;
  value: (c: Character) => number;
}

export const ATTR_ROWS: AttrRow[] = [
  { key: 'poder',       label: 'Poder',          abbr: 'P',  icon: '⚔️', value: c => c.poder.current },
  { key: 'habilidade',  label: 'Habilidade',     abbr: 'H',  icon: '🎯', value: c => c.habilidade.current },
  { key: 'resistencia', label: 'Resistência',    abbr: 'R',  icon: '🛡️', value: c => c.resistencia.current },
];

// ── Catálogos de vantagens e desvantagens 3D&T ───────────────────────────────

export interface VantagemDef { name: string; cost: number; desc: string; }
export interface DesvantagemDef { name: string; reward: number; desc: string; }

export const VANTAGENS_CATALOG: VantagemDef[] = [
  // Combate
  { name: 'Acrobacia',         cost: 1, desc: '+2 em testes de agilidade, equilíbrio e piruetas.' },
  { name: 'Ambidestria',       cost: 1, desc: 'Usa duas armas sem penalidade.' },
  { name: 'Ataques Múltiplos', cost: 3, desc: 'Pode realizar 2 ataques por rodada.' },
  { name: 'Ataque Duplo',      cost: 2, desc: 'Desfere dois golpes por rodada com a mesma arma.' },
  { name: 'Detectar Inimigos', cost: 1, desc: 'Nunca é surpreendido em combate.' },
  { name: 'Esquiva',           cost: 1, desc: '+2 na defesa contra ataques à distância.' },
  { name: 'Faro Apurado',      cost: 1, desc: 'Detecta inimigos e armadilhas ocultas por cheiro e som.' },
  { name: 'Força Colossal',    cost: 2, desc: '+2 em todos os testes de Força.' },
  { name: 'Mira Certeira',     cost: 1, desc: '+2 em ataques à distância.' },
  { name: 'Percepção',         cost: 1, desc: '+2 em testes de percepção e investigação.' },
  { name: 'Prontidão',         cost: 1, desc: 'Age primeiro em qualquer iniciativa.' },
  { name: 'Reflexos Aguçados', cost: 1, desc: '+1 em iniciativa e testes de esquiva.' },
  { name: 'Sede de Batalha',   cost: 2, desc: 'Recupera 2 PV por inimigo derrotado.' },
  { name: 'Sentidos Aguçados', cost: 1, desc: 'Detecta armadilhas e emboscadas; +1 em Percepção.' },
  { name: 'Tiro Certeiro',     cost: 1, desc: '+1 Habilidade em todos os ataques à distância.' },
  // Defesa / Suporte
  { name: 'Armadura Pesada',   cost: 2, desc: '+1 Armadura permanente.' },
  { name: 'Fortitude',         cost: 1, desc: '+5 PV máximos.' },
  { name: 'Imunidade Mágica',  cost: 2, desc: 'Resistência a magias e efeitos arcanos.' },
  { name: 'Regeneração',       cost: 2, desc: 'Recupera 1 PV por rodada fora de combate.' },
  { name: 'Toque Curador',     cost: 1, desc: 'Pode curar 1d6 PV em aliado (1×/dia).' },
  { name: 'Visão no Escuro',   cost: 1, desc: 'Enxerga perfeitamente na escuridão total.' },
  { name: 'Arma Especial',     cost: 1, desc: 'Proficiência e +1d6 de dano com uma arma específica.' },
  // Magia
  { name: 'Arcano',            cost: 4, desc: 'Aptidão natural para a magia. Recebe Focus 1 em todos os seis Caminhos automaticamente.' },
  { name: 'Clericato',         cost: 2, desc: 'Acesso à magia divina. Permite usar Focus nos Caminhos de Luz e Trevas.' },
  { name: 'Magia Aprimorada',  cost: 2, desc: '+4 Poder de Fogo.' },
  { name: 'Foco Arcano',       cost: 1, desc: 'Concentração perfeita. Magias custam −1 PF (mínimo 1).' },
];

/** Poderes concedidos automaticamente pelo Arquétipo (3DeT Victory) — não têm custo em PE, são apenas nomeados. */
const ARQUETIPO_PODER_MAP = new Map<string, string>(
  ALL_ARQUETIPOS.flatMap(a => a.poderes.map(p => [p.name, p.description] as const))
);

export const DESVANTAGENS_CATALOG: DesvantagemDef[] = [
  { name: 'Ansioso',            reward: 1, desc: 'Perde 1 ponto em testes que exigem paciência.' },
  { name: 'Azarado',            reward: 1, desc: 'Uma vez por sessão sofre uma reviravolta negativa.' },
  { name: 'Cobiçoso',           reward: 1, desc: 'Deve tentar pegar itens valiosos à vista.' },
  { name: 'Covarde',            reward: 1, desc: 'Testa Habilidade para não fugir de batalhas difíceis.' },
  { name: 'Fobia',              reward: 1, desc: 'Paralisa diante do seu medo específico.' },
  { name: 'Inimigo Oculto',     reward: 1, desc: 'Há alguém poderoso que quer vê-lo morto.' },
  { name: 'Inimigo Poderoso',   reward: 2, desc: 'Alguém muito poderoso e conhecido quer você morto.' },
  { name: 'Lento',              reward: 1, desc: '−1 em Habilidade em testes de velocidade.' },
  { name: 'Má Fama',            reward: 1, desc: 'NPCs desconfiam de você por padrão.' },
  { name: 'Maneta',             reward: 2, desc: 'Perdeu uma mão; −2 em ações que exigem ambas.' },
  { name: 'Obrigação',          reward: 1, desc: 'Tem um dever que não pode ignorar.' },
  { name: 'Pé Frio',            reward: 1, desc: 'Uma vez por sessão, rerrola um dado favorável.' },
  { name: 'Sanguinário',        reward: 1, desc: 'Difícil de parar em combate: testa Habilidade para não atacar.' },
  { name: 'Teimosia',           reward: 1, desc: 'Recusa ajuda; −1 em testes cooperativos.' },
  { name: 'Vulnerabilidade',    reward: 2, desc: 'Recebe +2 de dano de um tipo específico.' },
];

@Component({
  selector: 'app-character-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-dialog.component.html',
  styleUrl: './character-dialog.component.scss',
})
export class CharacterDialogComponent {
  char = input.required<Character | null>();
  close = output<void>();

  gs = inject(GameStateService);
  attrRows = ATTR_ROWS;
  vantagens = VANTAGENS_CATALOG;
  desvantagens = DESVANTAGENS_CATALOG;

  showVantagensMenu = signal(false);
  showDesvantagensMenu = signal(false);
  pendingAttr = signal<SpendableAttr | null>(null);

  classColor(): string { return DEFAULT_CHAR_COLOR; }
  classIcon(): string  { return KIT_MAP.get(this.char()!.kits[0])?.icon ?? this.char()!.portraitIcon ?? '⚔️'; }
  kitNames(kitIds: string[]): string { return kitIds.map(id => KIT_MAP.get(id)?.name ?? id).join(', '); }

  // ── XP / PE ─────────────────────────────────────────────────────

  /** XP acumulado total (inclui o que já virou PE) */
  totalXp(): number { return this.char()!.xp; }

  /** Progresso para o próximo PE: xp % 10 */
  xpProgress(): number { return this.char()!.xp % 10; }

  /** PE disponíveis para gastar */
  pe(): number { return this.char()!.levelUpPoints ?? 0; }

  /** PE totais gastos (aprox: 1PE a cada 10 XP acumulados) */
  peTotal(): number { return Math.floor(this.char()!.xp / 10); }

  // ── Atributos em círculos ────────────────────────────────────────

  racialMod(attr: SpendableAttr): number {
    return this.char()!.racialMods?.[attr] ?? 0;
  }

  /** Dots enriquecidos com tipo racial para CSS. */
  dotsDetailed(attr: SpendableAttr, value: number): { filled: boolean; type: 'base' | 'racial-bonus' | 'racial-penalty' | 'empty' }[] {
    const racial = this.racialMod(attr);
    const penaltyCount = racial < 0 ? Math.abs(racial) : 0;
    // Layout: [finalValue filled] + [penaltyCount red empty] + [empty until min 5]
    const total = Math.max(5, value + penaltyCount + 1);
    return Array.from({ length: total }, (_, i) => {
      if (racial >= 0) {
        // bônus racial: primeiros dots são base, os últimos (racial) são verdes
        if (i < value - racial) return { filled: true,  type: 'base' };
        if (i < value)          return { filled: true,  type: 'racial-bonus' };
      } else {
        // penalidade racial: dots preenchidos são base, depois vêm dots vermelhos
        if (i < value)                            return { filled: true,  type: 'base' };
        if (i < value + penaltyCount) return { filled: false, type: 'racial-penalty' };
      }
      return { filled: false, type: 'empty' };
    });
  }

  upgradeCost(attr: SpendableAttr): number {
    const c = this.char()!;
    const base = c[attr].base - this.racialMod(attr);
    return base < 5 ? 1 : 2;
  }

  canSpend(attr: SpendableAttr): boolean {
    return this.pe() >= this.upgradeCost(attr);
  }

  requestSpend(attr: SpendableAttr): void {
    if (!this.canSpend(attr)) return;
    this.pendingAttr.set(attr);
  }

  confirmSpend(): void {
    const attr = this.pendingAttr();
    this.pendingAttr.set(null);
    if (!attr) return;
    const c = this.char()!;
    if (c.isCompanion) {
      this.gs.spendCompanionLevelUpPoint(c.id, attr);
    } else {
      this.gs.spendLevelUpPoint(attr);
    }
  }

  cancelSpend(): void { this.pendingAttr.set(null); }

  pendingAttrLabel(): string {
    return ATTR_ROWS.find(r => r.key === this.pendingAttr())?.label ?? '';
  }

  // ── HP / PM bars ────────────────────────────────────────────────

  hpPct(): number {
    const c = this.char()!;
    return c.pontosVida.max > 0 ? Math.round((c.pontosVida.current / c.pontosVida.max) * 100) : 0;
  }

  pmPct(): number {
    const c = this.char()!;
    return c.pontosMana.max > 0 ? Math.round((c.pontosMana.current / c.pontosMana.max) * 100) : 0;
  }

  // ── Vantagens ───────────────────────────────────────────────────

  availableVantagens(): VantagemDef[] {
    const owned = new Set(this.char()!.vantagens);
    return VANTAGENS_CATALOG.filter(v => !owned.has(v.name));
  }

  vantagemDef(name: string): VantagemDef | undefined {
    const catalogMatch = VANTAGENS_CATALOG.find(v => v.name === name);
    if (catalogMatch) return catalogMatch;
    // Poderes do Arquétipo são concedidos automaticamente (sem custo em PE) —
    // não estão no catálogo de compra, mas precisam mostrar a descrição
    // assim como as desvantagens escolhidas mostram.
    const poderDesc = ARQUETIPO_PODER_MAP.get(name);
    return poderDesc ? { name, cost: 0, desc: poderDesc } : undefined;
  }

  canBuyVantagem(v: VantagemDef): boolean { return this.pe() >= v.cost; }

  buyVantagem(v: VantagemDef): void {
    if (!this.canBuyVantagem(v)) return;
    this.gs.character.update(c => c ? {
      ...c,
      vantagens: [...c.vantagens, v.name],
      levelUpPoints: (c.levelUpPoints ?? 0) - v.cost,
    } : c);
    this.gs.addLog(`✅ ${this.char()!.name} adquiriu vantagem: ${v.name} (-${v.cost} PE)`);
  }

  // ── Desvantagens ─────────────────────────────────────────────────

  availableDesvantagens(): DesvantagemDef[] {
    const owned = new Set(this.char()!.desvantagens);
    return DESVANTAGENS_CATALOG.filter(d => !owned.has(d.name));
  }

  desvantagemDef(name: string): DesvantagemDef | undefined {
    return DESVANTAGENS_CATALOG.find(d => d.name === name);
  }

  canRemoveDesvantagem(name: string): boolean {
    const def = this.desvantagemDef(name);
    return !!def && this.pe() >= def.reward;
  }

  removeDesvantagem(name: string): void {
    const def = this.desvantagemDef(name);
    if (!def || !this.canRemoveDesvantagem(name)) return;
    this.gs.character.update(c => c ? {
      ...c,
      desvantagens: c.desvantagens.filter(d => d !== name),
      levelUpPoints: (c.levelUpPoints ?? 0) - def.reward,
    } : c);
    this.gs.addLog(`🔓 ${this.char()!.name} removeu desvantagem: ${name} (-${def.reward} PE)`);
  }

  takeDesvantagem(d: DesvantagemDef): void {
    this.gs.character.update(c => c ? {
      ...c,
      desvantagens: [...c.desvantagens, d.name],
      levelUpPoints: (c.levelUpPoints ?? 0) + d.reward,
    } : c);
    this.gs.addLog(`⚠️ ${this.char()!.name} tomou desvantagem: ${d.name} (+${d.reward} PE)`);
    this.showDesvantagensMenu.set(false);
  }

  // ── Equipamentos & Stats Efetivos ─────────────────────────────────

  equipBonus(attr: SpendableAttr): number {
    const c = this.char()!;
    const b = mergeBonus(...allEquipItems(c.equipment ?? {}));
    switch (attr) {
      case 'poder':       return b.poder       ?? 0;
      case 'habilidade':  return b.habilidade  ?? 0;
      case 'resistencia': return b.resistencia ?? 0;
    }
  }

  effectiveValue(attr: SpendableAttr): number {
    const c = this.char()!;
    return c[attr].current + this.equipBonus(attr);
  }

  /** Escala de Poder (3D&T) do atributo — Ningen é a escala normal e não mostra símbolo. */
  isAboveNingen(attr: SpendableAttr): boolean {
    return getPowerScale(this.effectiveValue(attr)) !== 'ningen';
  }

  scaleSymbol(attr: SpendableAttr): string { return powerScaleSymbol(this.effectiveValue(attr)); }
  scaleLabel(attr: SpendableAttr): string { return powerScaleLabel(this.effectiveValue(attr)); }
  scaleAbacus(attr: SpendableAttr): string { return formatAttributeAbacus(this.effectiveValue(attr)); }

  /** Armadura é 100% equipamento no 3D&T Victory — exibida fora da grade de atributos. */
  armorBonus(): number {
    const b = mergeBonus(...allEquipItems(this.char()!.equipment ?? {}));
    return b.armadura ?? 0;
  }

  readonly equipSlots: { key: EquipSlot; label: string }[] = [
    { key: 'weapon',     label: 'Arma' },
    { key: 'offhand',    label: 'Mão Sec.' },
    { key: 'armor',      label: 'Armadura' },
    { key: 'head',       label: 'Cabeça' },
    { key: 'gloves',     label: 'Luvas' },
    { key: 'boots',      label: 'Botas' },
    { key: 'ring_left',  label: 'Anel Esq.' },
    { key: 'ring_right', label: 'Anel Dir.' },
  ];

  equippedItem(slot: EquipSlot) {
    return (this.char()!.equipment as any)?.[slot] ?? null;
  }

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
