import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Item, equipSlotLabel, rarityLabel, rarityColor, statBonusLabel } from '../../../core/models/item.model';

@Component({
  selector: 'app-backpack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backpack.component.html',
  styleUrl: './backpack.component.scss',
})
export class BackpackComponent {
  private gs     = inject(GameStateService);
  private combat = inject(CombatService);

  inventory  = computed(() => this.gs.character()?.inventory ?? []);
  inCombat   = computed(() => this.gs.screen() === 'encounter');
  phase      = this.combat.phase;

  close(): void { this.gs.backpackOpen.set(false); }

  equip(item: Item): void {
    if (this.inCombat()) return;
    this.gs.equipItem(item);
  }

  use(item: Item): void {
    if (item.category !== 'consumable') return;
    if (this.inCombat() && !item.usableInCombat) return;
    if (!this.inCombat() && item.usableInCombat === false) return;

    const used = this.gs.useConsumable(item);
    if (used && this.inCombat() && this.phase() === 'player_turn') {
      this.combat.afterPlayerAction();
    }
  }

  canUse(item: Item): boolean {
    if (item.category !== 'consumable') return false;
    if (this.inCombat()) return !!item.usableInCombat && this.phase() === 'player_turn';
    return true;
  }

  canEquip(item: Item): boolean {
    return item.category === 'equipment' && !this.inCombat();
  }

  drop(item: Item): void {
    this.gs.character.update(c => {
      if (!c) return c;
      const idx = c.inventory.findIndex(i => i.id === item.id);
      if (idx === -1) return c;
      const inv = [...c.inventory];
      inv.splice(idx, 1);
      return { ...c, inventory: inv };
    });
    this.gs.addLog(`🗑️ ${item.icon} ${item.name} descartado.`);
  }

  bonusText(item: Item): string {
    return item.statBonus ? statBonusLabel(item.statBonus) : '';
  }

  slotLabel(item: Item): string {
    return item.slot ? equipSlotLabel(item.slot) : '';
  }

  rarityLabel  = rarityLabel;
  rarityColor  = rarityColor;
}
