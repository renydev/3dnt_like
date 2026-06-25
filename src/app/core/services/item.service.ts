import { Injectable } from '@angular/core';
import { Item, ItemRarity, ITEM_CATALOG, ALL_ITEMS } from '../models/item.model';

/** Preços base por raridade (em ouro) */
const RARITY_PRICE: Record<ItemRarity, number> = {
  common:   15,
  uncommon: 35,
  rare:     80,
};

function priceFor(item: Item): number {
  return item.price ?? RARITY_PRICE[item.rarity];
}

/** Por enquanto o mercador só vende consumíveis de cura (poções/elixires que restauram PV). */
function isHealingConsumable(item: Item): boolean {
  return item.category === 'consumable' && ((item.healPvDice ?? 0) > 0 || (item.healPvFlat ?? 0) > 0);
}

/** Estoque fixo por faixa de andar */
const STOCK_BY_TIER: Record<number, string[]> = {
  1: ['pocao-cura', 'pocao-mana', 'espada-curta', 'gibao-couro', 'amuleto-protecao'],
  2: ['pocao-cura', 'pocao-mana', 'pocao-cura-maior', 'arco-curto', 'cajado-arcano', 'cota-malha', 'anel-habilidade'],
  3: ['pocao-cura-maior', 'pocao-mana', 'pergaminho-fogo', 'espada-longa', 'armadura-placas', 'colar-resistencia', 'anel-fortuna'],
  4: ['pocao-cura-maior', 'elixir-vigor', 'pergaminho-fogo', 'espada-encantada', 'armadura-placas', 'anel-fortuna'],
};

@Injectable({ providedIn: 'root' })
export class ItemService {

  /** Retorna um item pelo ID. */
  getItem(id: string): Item | undefined {
    return ITEM_CATALOG[id];
  }

  /** Todos os itens do catálogo com preço resolvido. */
  getAllItems(): Item[] {
    return ALL_ITEMS.map(i => ({ ...i, price: priceFor(i) }));
  }

  /** Retorna o estoque do mercador para o andar informado (com preços). */
  getMerchantStock(floor: number): Item[] {
    const tier = floor <= 5 ? 1 : floor <= 10 ? 2 : floor <= 15 ? 3 : 4;
    const ids = STOCK_BY_TIER[tier] ?? STOCK_BY_TIER[1];
    return ids
      .map(id => ITEM_CATALOG[id])
      .filter(Boolean)
      .filter(isHealingConsumable)
      .map(i => ({ ...i, price: priceFor(i) }));
  }

  /** Preço de venda (50% do preço de compra). */
  sellPrice(item: Item): number {
    return Math.floor(priceFor(item) / 2);
  }

  /** Descrição completa de um item incluindo bônus. */
  fullDescription(item: Item): string {
    const parts: string[] = [item.description];
    if (item.vantagemBonus?.length)  parts.push(`Vantagem: ${item.vantagemBonus.join(', ')}`);
    if (item.periciaBonus?.length)   parts.push(`Perícia: ${item.periciaBonus.join(', ')}`);
    return parts.join(' | ');
  }
}
