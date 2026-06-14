import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character, CLASS_COLORS, CLASS_ICONS } from '../../../core/models/character.model';

export type SpendableAttr = 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo';

export interface AttrRow {
  key: SpendableAttr;
  label: string;
  abbr: string;
  icon: string;
  value: (c: Character) => number;
}

export const ATTR_ROWS: AttrRow[] = [
  { key: 'forca',       label: 'Força',          abbr: 'F',  icon: '⚔️', value: c => c.forca.current },
  { key: 'habilidade',  label: 'Habilidade',     abbr: 'H',  icon: '🎯', value: c => c.habilidade.current },
  { key: 'resistencia', label: 'Resistência',    abbr: 'R',  icon: '🛡️', value: c => c.resistencia.current },
  { key: 'armadura',    label: 'Armadura',       abbr: 'A',  icon: '🔰', value: c => c.armadura },
  { key: 'poderFogo',   label: 'Poder de Fogo',  abbr: 'PF', icon: '✨', value: c => c.poderFogo.current },
];

// ── Catálogos de vantagens e desvantagens 3D&T ───────────────────────────────

export interface VantagemDef { name: string; cost: number; desc: string; }
export interface DesvantagemDef { name: string; reward: number; desc: string; }

export const VANTAGENS_CATALOG: VantagemDef[] = [
  { name: 'Acrobacia',         cost: 1, desc: '+2 em testes de agilidade e equilíbrio.' },
  { name: 'Ambidestria',       cost: 1, desc: 'Usa duas armas sem penalidade.' },
  { name: 'Ataques Múltiplos', cost: 3, desc: 'Pode realizar 2 ataques por rodada.' },
  { name: 'Detectar Inimigos', cost: 1, desc: 'Nunca é surpreendido em combate.' },
  { name: 'Esquiva',           cost: 1, desc: '+2 na defesa contra ataques à distância.' },
  { name: 'Faro Apurado',      cost: 1, desc: 'Detecta inimigos e armadilhas ocultas.' },
  { name: 'Fortitude',         cost: 1, desc: '+5 PV máximos.' },
  { name: 'Mira Certeira',     cost: 1, desc: '+2 em ataques à distância.' },
  { name: 'Percepção',         cost: 1, desc: '+2 em testes de percepção e investigação.' },
  { name: 'Prontidão',         cost: 1, desc: 'Age primeiro em qualquer iniciativa.' },
  { name: 'Regeneração',       cost: 2, desc: 'Recupera 1 PV por rodada fora de combate.' },
  { name: 'Toque Curador',     cost: 1, desc: 'Pode curar 1d6 PV em aliado (1×/dia).' },
  { name: 'Visão no Escuro',   cost: 1, desc: 'Enxerga perfeitamente na escuridão.' },
  { name: 'Arma Especial',     cost: 1, desc: 'Proficiência e +1d6 com uma arma específica.' },
  { name: 'Imunidade Mágica',  cost: 2, desc: 'Resistência a magias e efeitos arcanos.' },
];

export const DESVANTAGENS_CATALOG: DesvantagemDef[] = [
  { name: 'Ansioso',       reward: 1, desc: 'Perde 1 ponto em testes que exigem paciência.' },
  { name: 'Azarado',       reward: 1, desc: 'Uma vez por sessão sofre uma reviravolta negativa.' },
  { name: 'Cobiçoso',      reward: 1, desc: 'Deve tentar pegar itens valiosos à vista.' },
  { name: 'Covarde',       reward: 1, desc: 'Testa Habilidade para não fugir de batalhas difíceis.' },
  { name: 'Fobia',         reward: 1, desc: 'Paralisa diante do seu medo específico.' },
  { name: 'Inimigo Oculto',reward: 1, desc: 'Há alguém poderoso que quer vê-lo morto.' },
  { name: 'Lento',         reward: 1, desc: '-1 em Habilidade em testes de velocidade.' },
  { name: 'Má Fama',       reward: 1, desc: 'NPCs desconfiam de você por padrão.' },
  { name: 'Obrigação',     reward: 1, desc: 'Tem um dever que não pode ignorar.' },
  { name: 'Pé Frio',       reward: 1, desc: 'Uma vez por sessão, rerrola um dado favorável.' },
  { name: 'Sanguinário',   reward: 1, desc: 'Difícil de parar em combate: testa Habilidade para não atacar.' },
  { name: 'Teimosia',      reward: 1, desc: 'Recusa ajuda; -1 em testes cooperativos.' },
  { name: 'Maneta',        reward: 2, desc: 'Perdeu uma mão; -2 em ações que exigem ambas.' },
  { name: 'Vulnerabilidade',reward: 2, desc: 'Recebe +2 de dano de um tipo específico.' },
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

  classColor(): string { return CLASS_COLORS[this.char()!.class] ?? '#888'; }
  classIcon(): string  { return CLASS_ICONS[this.char()!.class] ?? '⚔️'; }

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

  /** Gera array de booleanos: true=preenchido, false=vazio */
  dots(value: number): boolean[] {
    const total = Math.max(5, value + 1);
    return Array.from({ length: total }, (_, i) => i < value);
  }

  upgradeCost(attr: SpendableAttr): number {
    const c = this.char()!;
    const base = attr === 'armadura' ? c.armadura : c[attr].base;
    return base + 1;
  }

  canSpend(attr: SpendableAttr): boolean {
    return this.pe() >= this.upgradeCost(attr);
  }

  spend(attr: SpendableAttr): void {
    if (!this.canSpend(attr)) return;
    const c = this.char()!;
    if (c.isCompanion) {
      this.gs.spendCompanionLevelUpPoint(c.id, attr);
    } else {
      this.gs.spendLevelUpPoint(attr);
    }
  }

  // ── HP / PF bars ────────────────────────────────────────────────

  hpPct(): number {
    const c = this.char()!;
    return c.pontosVida.max > 0 ? Math.round((c.pontosVida.current / c.pontosVida.max) * 100) : 0;
  }

  pfPct(): number {
    const c = this.char()!;
    return c.poderFogo.max > 0 ? Math.round((c.poderFogo.current / c.poderFogo.max) * 100) : 0;
  }

  // ── Vantagens ───────────────────────────────────────────────────

  availableVantagens(): VantagemDef[] {
    const owned = new Set(this.char()!.vantagens);
    return VANTAGENS_CATALOG.filter(v => !owned.has(v.name));
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

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
