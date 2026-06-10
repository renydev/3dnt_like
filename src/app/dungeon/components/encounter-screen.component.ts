import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-encounter-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="encounter-screen">
      <div class="encounter-header">
        <span class="encounter-icon">{{ encounterIcon() }}</span>
        <div>
          <h2>{{ room()?.name }}</h2>
          <p>{{ room()?.description }}</p>
        </div>
      </div>

      <!-- MONSTRO / BOSS -->
      @if (room()?.type === 'monster' || room()?.type === 'boss') {
        <div class="encounter-body monster-encounter">
          <div class="encounter-message">
            <strong>⚔️ {{ room()?.type === 'boss' ? 'Confronto com o Chefão!' : 'Combate!' }}</strong>
            Role dados para resolver.
          </div>
          <div class="dice-area">
            <p class="dice-hint">{{ diceHint() }}</p>
            <button class="btn-primary" (click)="rollBattle()" [disabled]="rollResult() !== null">🎲 Rolar Dados</button>
            @if (rollResult() !== null) {
              <div class="roll-result" [class.success]="rollResult()! >= 0" [class.failure]="rollResult()! < 0">
                <span class="result-dice">🎲 {{ rollTotal() }}</span>
                <span class="result-text">{{ rollResult()! >= 0 ? 'Vitória!' : 'Derrota!' }}</span>
              </div>
              @if (rollResult()! >= 0) {
                <button class="btn-victory" (click)="victory()">✅ Continuar</button>
              } @else {
                <button class="btn-defeat" (click)="defeat()">💀 Aceitar Destino</button>
              }
            }
          </div>
        </div>
      }

      <!-- ARMADILHA -->
      @if (room()?.type === 'trap') {
        <div class="encounter-body trap-encounter">
          <div class="encounter-message">
            <strong>⚠️ Armadilha!</strong> Teste de Habilidade para escapar.
          </div>
          <div class="dice-area">
            <p class="dice-hint">Role 1d6 + H({{ char()?.habilidade?.current }}) ≥ {{ trapDifficulty() }} para escapar ileso.</p>
            <button class="btn-primary" (click)="rollTrap()" [disabled]="rollResult() !== null">🎲 Rolar Habilidade</button>
            @if (rollResult() !== null) {
              <div class="roll-result" [class.success]="rollResult()! >= 0" [class.failure]="rollResult()! < 0">
                <span class="result-dice">🎲 {{ rollTotal() }}</span>
                <span class="result-text">{{ rollResult()! >= 0 ? 'Escapou!' : 'Atingido!' }}</span>
              </div>
              <button class="btn-victory" (click)="victory()">Continuar</button>
            }
          </div>
        </div>
      }

      <!-- TESOURO -->
      @if (room()?.type === 'treasure') {
        <div class="encounter-body treasure-encounter">
          <div class="encounter-message"><strong>💰 Tesouro encontrado!</strong></div>
          <div class="treasure-reward">
            <p>Você encontrou: <strong>{{ treasureReward() }}</strong></p>
            <button class="btn-victory" (click)="victory()">✅ Pegar Tesouro</button>
          </div>
        </div>
      }

      <!-- DESCANSO -->
      @if (room()?.type === 'rest') {
        <div class="encounter-body rest-encounter">
          <div class="encounter-message"><strong>🔥 Ponto de Descanso</strong> — Você recupera PV e PM.</div>
          <div class="rest-reward">
            <p>Recuperou <strong>{{ restAmount() }} PV</strong> e todos os PM.</p>
            <button class="btn-victory" (click)="rest()">💤 Descansar</button>
          </div>
        </div>
      }

      <div class="encounter-actions">
        <button class="btn-secondary" (click)="flee()">🏃 Fugir</button>
      </div>
    </div>
  `,
  styles: [`
    .encounter-screen { display: flex; flex-direction: column; gap: 1rem; height: 100%; }
    .encounter-header {
      display: flex; gap: 1rem; align-items: flex-start;
      padding: 1rem; background: rgba(0,0,0,0.4);
      border: 1px solid var(--color-border); border-radius: 6px;
      .encounter-icon { font-size: 2.5rem; }
      h2 { margin: 0; font-family: var(--font-display); color: var(--color-gold); font-size: 1.1rem; }
      p { margin: 0.3rem 0 0; color: var(--color-text-muted); font-size: 0.82rem; font-style: italic; }
    }
    .encounter-body {
      flex: 1; padding: 1rem;
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--color-border); border-radius: 6px;
      &.monster-encounter { border-color: rgba(231,76,60,0.4); }
      &.trap-encounter { border-color: rgba(155,89,182,0.4); }
      &.treasure-encounter { border-color: rgba(212,170,20,0.4); }
      &.rest-encounter { border-color: rgba(230,126,34,0.4); }
    }
    .encounter-message { color: var(--color-text); margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.5; }
    .dice-area { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
    .dice-hint { color: var(--color-text-muted); font-size: 0.82rem; margin: 0; font-style: italic; }
    .roll-result {
      display: flex; gap: 0.75rem; align-items: center;
      padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid;
      animation: slideIn 0.3s ease;
      &.success { border-color: #27ae60; background: rgba(39,174,96,0.1); }
      &.failure { border-color: #e74c3c; background: rgba(231,76,60,0.1); }
      .result-dice { font-size: 1.3rem; }
      .result-text { font-family: var(--font-display); font-size: 1rem; color: var(--color-gold); }
    }
    .treasure-reward, .rest-reward { display: flex; flex-direction: column; gap: 0.5rem; }
    .treasure-reward p, .rest-reward p { color: var(--color-text-muted); font-size: 0.85rem; }
    .treasure-reward strong, .rest-reward strong { color: var(--color-gold); }
    .btn-primary, .btn-victory, .btn-defeat, .btn-secondary {
      padding: 0.6rem 1.2rem; border-radius: 4px; border: none;
      cursor: pointer; font-family: var(--font-display); font-size: 0.85rem;
      letter-spacing: 0.05em; transition: all 0.2s ease;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary { background: linear-gradient(135deg, #1a3a5c, #2980b9); color: #fff; border: 1px solid #3498db; &:hover:not(:disabled) { box-shadow: 0 0 10px rgba(52,152,219,0.4); } }
    .btn-victory { background: linear-gradient(135deg, #1a4a1a, #27ae60); color: #fff; border: 1px solid #2ecc71; &:hover { box-shadow: 0 0 10px rgba(46,204,113,0.4); } }
    .btn-defeat { background: linear-gradient(135deg, #4a1a1a, #c0392b); color: #fff; border: 1px solid #e74c3c; &:hover { box-shadow: 0 0 10px rgba(192,57,43,0.4); } }
    .btn-secondary { background: rgba(0,0,0,0.3); color: var(--color-text-muted); border: 1px solid #333; &:hover { border-color: #555; color: var(--color-text); } }
    .encounter-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EncounterScreenComponent implements OnInit {
  private gameState = inject(GameStateService);
  room = this.gameState.currentRoom;
  char = this.gameState.character;

  rollTotal = signal<number | null>(null);
  rollResult = signal<number | null>(null);
  treasureReward = signal<string>('');
  restAmount = signal<number>(0);

  encounterIcon = computed(() => {
    const icons: Record<string, string> = { monster: '👹', trap: '⚠️', treasure: '💰', rest: '🔥', boss: '💀' };
    return icons[this.room()?.type ?? ''] ?? '❓';
  });

  diceHint = computed(() => {
    const c = this.char();
    const isBoss = this.room()?.type === 'boss';
    if (!c) return '';
    return `Role 2d6 + F(${c.forca.current}) vs ${isBoss ? 'Chefão' : 'Monstro'} — dificuldade ${isBoss ? 9 : 7}`;
  });

  trapDifficulty = computed(() => 3 + this.gameState.floorNumber());

  ngOnInit() {
    this.treasureReward.set(this.generateTreasure());
    this.restAmount.set(Math.floor(Math.random() * 5) + 3);
    this.rollResult.set(null);
    this.rollTotal.set(null);
  }

  rollBattle() {
    const c = this.char();
    if (!c) return;
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const total = d1 + d2 + c.forca.current;
    const difficulty = this.room()?.type === 'boss' ? 9 : 7;
    this.rollTotal.set(total);
    this.rollResult.set(total - difficulty);
    this.gameState.addLog(`🎲 Rolou ${d1}+${d2}+F(${c.forca.current}) = ${total} vs ${difficulty}`);
  }

  rollTrap() {
    const c = this.char();
    if (!c) return;
    const d = Math.ceil(Math.random() * 6);
    const total = d + c.habilidade.current;
    const diff = this.trapDifficulty();
    this.rollTotal.set(total);
    this.rollResult.set(total - diff);
    this.gameState.addLog(`🎲 Armadilha: ${d}+H(${c.habilidade.current}) = ${total} vs ${diff}`);
  }

  victory() { this.gameState.resolveEncounter('victory'); }
  defeat() { this.gameState.resolveEncounter('defeat'); }
  flee() { this.gameState.resolveEncounter('flee'); }

  rest() {
    this.gameState.addLog(`❤️ Descansou e recuperou ${this.restAmount()} PV`);
    this.gameState.resolveEncounter('victory');
  }

  private generateTreasure(): string {
    const items = ['Poção de Cura', 'Saco de Moedas (1d6×10 PO)', 'Pergaminho Mágico', 'Amuleto Protetor', 'Arma +1', 'Armadura Reforçada', 'Gema Preciosa'];
    return items[Math.floor(Math.random() * items.length)];
  }
}
