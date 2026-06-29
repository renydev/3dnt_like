import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { ItemService } from '../../../core/services/item.service';
import { Item } from '../../../core/models/item.model';
import { rarityColor, rarityLabel, statBonusLabel } from '../../../core/models/item.model';

type Tab = 'buy' | 'sell';

@Component({
  selector: 'app-merchant-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="merchant-overlay">
  <div class="merchant-panel">

    <!-- Cabeçalho -->
    <div class="merchant-header">
      <span class="merchant-icon">🛒</span>
      <div class="merchant-title">
        <h2>Mercador Errante</h2>
        <p class="merchant-subtitle">"Tudo tem um preço, aventureiro..."</p>
      </div>
      <div class="merchant-gold">
        💰 {{ gs.character()?.gold ?? 0 }} {{ currency() }}
      </div>
    </div>

    <!-- Abas -->
    <div class="tabs">
      <button class="tab-btn" [class.active]="tab() === 'buy'" (click)="tab.set('buy')">🛍️ Comprar</button>
      <button class="tab-btn" [class.active]="tab() === 'sell'" (click)="tab.set('sell')">💸 Vender</button>
    </div>

    <!-- Aba Comprar -->
    @if (tab() === 'buy') {
      <div class="item-list">
        @for (item of stock(); track item.id) {
          <div class="item-row" [class.selected]="selected()?.id === item.id" (click)="select(item)">
            <span class="item-icon">{{ item.icon }}</span>
            <div class="item-info">
              <span class="item-name" [style.color]="rarityColor(item.rarity)">{{ item.name }}</span>
              <span class="item-rarity">{{ rarityLabel(item.rarity) }}</span>
            </div>
            <div class="item-right">
              @if (item.statBonus) {
                <span class="item-bonus">{{ statBonusLabel(item.statBonus) }}</span>
              }
              <span class="item-price">{{ item.price }} {{ currency() }}</span>
            </div>
          </div>
        }
      </div>

      @if (selected(); as s) {
        <div class="item-detail">
          <p class="detail-desc">{{ s.description }}</p>
          @if (s.vantagemBonus?.length) {
            <p class="detail-extra">✨ Vantagem: {{ s.vantagemBonus!.join(', ') }}</p>
          }
          @if (s.periciaBonus?.length) {
            <p class="detail-extra">📚 Perícia: {{ s.periciaBonus!.join(', ') }}</p>
          }
          @if (s.healPvDice || s.healPvFlat) {
            <p class="detail-extra">❤️ Cura {{ s.healPvDice ? s.healPvDice + 'd6' : '' }}{{ s.healPvFlat ? '+' + s.healPvFlat : '' }} PV</p>
          }
          @if (s.healPmDice || s.healPmFlat) {
            <p class="detail-extra">💙 Restaura {{ s.healPmDice ? s.healPmDice + 'd6' : '' }}{{ s.healPmFlat ? '+' + s.healPmFlat : '' }} PM</p>
          }
          <div class="detail-actions">
            <span class="can-buy" [class.broke]="(gs.character()?.gold ?? 0) < (s.price ?? 0)">
              {{ (gs.character()?.gold ?? 0) >= (s.price ?? 0) ? '✅ Pode comprar' : '❌ Ouro insuficiente' }}
            </span>
            <button class="btn-buy"
              [disabled]="(gs.character()?.gold ?? 0) < (s.price ?? 0)"
              (click)="buy(s)">
              Comprar por {{ s.price }} {{ currency() }}
            </button>
          </div>
        </div>
      }
    }

    <!-- Aba Vender -->
    @if (tab() === 'sell') {
      <div class="item-list">
        @if (!inventory().length) {
          <p class="empty-msg">Inventário vazio.</p>
        }
        @for (item of inventory(); track item.id) {
          <div class="item-row" [class.selected]="selected()?.id === item.id" (click)="select(item)">
            <span class="item-icon">{{ item.icon }}</span>
            <div class="item-info">
              <span class="item-name" [style.color]="rarityColor(item.rarity)">{{ item.name }}</span>
              <span class="item-rarity">{{ rarityLabel(item.rarity) }}</span>
            </div>
            <span class="item-price sell">{{ itemSvc.sellPrice(item) }} {{ currency() }}</span>
          </div>
        }
      </div>

      @if (selected(); as s) {
        <div class="item-detail">
          <p class="detail-desc">{{ s.description }}</p>
          <div class="detail-actions">
            <button class="btn-sell" (click)="sell(s)">
              Vender por {{ itemSvc.sellPrice(s) }} {{ currency() }}
            </button>
          </div>
        </div>
      }
    }

    <!-- Botão sair -->
    <button class="btn-leave" (click)="gs.closeMerchant()">🚪 Partir</button>
  </div>
</div>
  `,
  styles: [`
    .merchant-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
    }
    .merchant-panel {
      background: #1a1207;
      border: 2px solid #b8860b;
      border-radius: 12px;
      width: min(560px, 96vw);
      max-height: 90vh;
      display: flex; flex-direction: column;
      padding: 20px;
      gap: 12px;
      overflow: hidden;
    }
    .merchant-header {
      display: flex; align-items: center; gap: 12px;
    }
    .merchant-icon { font-size: 2rem; }
    .merchant-title h2 { margin: 0; color: #f5c842; font-size: 1.2rem; }
    .merchant-subtitle { margin: 0; color: #9ca3af; font-size: 0.8rem; font-style: italic; }
    .merchant-gold { margin-left: auto; font-size: 1.1rem; color: #fcd34d; font-weight: bold; }

    .tabs { display: flex; gap: 8px; }
    .tab-btn {
      flex: 1; padding: 8px; border: 1px solid #374151;
      background: #111827; color: #9ca3af; border-radius: 6px; cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

    .item-list {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
      max-height: 240px;
    }
    .item-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 6px; cursor: pointer;
      background: #111827; border: 1px solid #1f2937;
      transition: all 0.15s;
    }
    .item-row:hover { border-color: #374151; background: #1f2937; }
    .item-row.selected { border-color: #b8860b; background: #1f1408; }
    .item-icon { font-size: 1.3rem; width: 28px; text-align: center; }
    .item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-size: 0.9rem; font-weight: bold; }
    .item-rarity { font-size: 0.72rem; color: #6b7280; }
    .item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .item-bonus { font-size: 0.75rem; color: #34d399; }
    .item-price { font-size: 0.88rem; color: #fcd34d; font-weight: bold; }
    .item-price.sell { color: #6ee7b7; margin-left: auto; }

    .item-detail {
      background: #111827; border: 1px solid #374151; border-radius: 8px;
      padding: 12px; display: flex; flex-direction: column; gap: 8px;
    }
    .detail-desc { margin: 0; color: #d1d5db; font-size: 0.85rem; }
    .detail-extra { margin: 0; color: #a78bfa; font-size: 0.8rem; }
    .detail-actions { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
    .can-buy { font-size: 0.8rem; color: #34d399; }
    .can-buy.broke { color: #f87171; }

    .btn-buy {
      padding: 8px 20px; background: #b8860b; color: #000; border: none;
      border-radius: 6px; font-weight: bold; cursor: pointer;
    }
    .btn-buy:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-buy:not(:disabled):hover { background: #f5c842; }

    .btn-sell {
      padding: 8px 20px; background: #059669; color: #fff; border: none;
      border-radius: 6px; font-weight: bold; cursor: pointer;
    }
    .btn-sell:hover { background: #10b981; }

    .btn-leave {
      padding: 10px; background: transparent; color: #9ca3af;
      border: 1px solid #374151; border-radius: 6px; cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-leave:hover { color: #f87171; border-color: #f87171; }

    .empty-msg { color: #6b7280; font-size: 0.85rem; text-align: center; padding: 20px 0; }
  `]
})
export class MerchantScreenComponent {
  gs      = inject(GameStateService);
  itemSvc = inject(ItemService);
  currency = computed(() => this.gs.campaign.activeCampaign().texts.currency);

  tab      = signal<Tab>('buy');
  selected = signal<Item | null>(null);

  stock = computed(() => this.itemSvc.getMerchantStock(this.gs.floorNumber()));
  inventory = computed(() => this.gs.character()?.inventory ?? []);

  rarityColor   = rarityColor;
  rarityLabel   = rarityLabel;
  statBonusLabel = statBonusLabel;

  select(item: Item) {
    this.selected.set(this.selected()?.id === item.id ? null : item);
  }

  buy(item: Item) {
    if (this.gs.buyItem(item)) {
      this.selected.set(null);
    }
  }

  sell(item: Item) {
    this.gs.sellItem(item, this.itemSvc.sellPrice(item));
    this.selected.set(null);
  }
}
