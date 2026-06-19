import Phaser from 'phaser';
import { Injector, runInInjectionContext, effect } from '@angular/core';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Enemy } from '../../../core/models/combat.model';
import { Character } from '../../../core/models/character.model';

interface EnemyCard {
  container: Phaser.GameObjects.Container;
  hpBarFill: Phaser.GameObjects.Rectangle;
  lastHp: number;
}

interface PartyCard {
  container: Phaser.GameObjects.Container;
  hpBarFill: Phaser.GameObjects.Rectangle;
  lastHp: number;
}

const BAR_W = 90;
const BAR_H = 8;

/**
 * Cena de combate: renderiza inimigos e grupo, anima dano e trata a
 * seleção de alvo por clique. As ações (atacar/habilidade/itens/fugir)
 * continuam expostas como menu Angular sobre o canvas — a regra de jogo
 * permanece inteiramente em CombatService.
 */
export class CombatScene extends Phaser.Scene {
  private gs!: GameStateService;
  private combat!: CombatService;

  private enemyCards = new Map<string, EnemyCard>();
  private partyCards = new Map<string, PartyCard>();
  private actionLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CombatScene' });
  }

  init(data: { injector: Injector }): void {
    this.gs = data.injector.get(GameStateService);
    this.combat = data.injector.get(CombatService);
    runInInjectionContext(data.injector, () => {
      effect(() => {
        const enemies = this.combat.enemies();
        const phase = this.combat.phase();
        const selected = this.combat.selectedEnemyId();
        if (this.scene.isActive()) this.syncState(enemies, phase, selected);
      });
    });
  }

  preload(): void {
    this.combat.enemies().forEach(e => {
      if (e.sprite && !this.textures.exists(this.spriteKey(e.sprite))) {
        this.load.image(this.spriteKey(e.sprite), `assets/monsters_token/${e.sprite}`);
      }
    });
  }

  private spriteKey(sprite: string): string {
    return `monster_${sprite}`;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b0b18');
    this.actionLabel = this.add.text(16, 16, '', { fontSize: '14px', color: '#aef' });
    this.buildEnemyCards();
    this.buildPartyCards();
    this.highlightSelection(this.combat.selectedEnemyId());
  }

  private buildEnemyCards(): void {
    const enemies = this.combat.enemies();
    const startY = 100;
    enemies.forEach((e, i) => {
      const x = this.scale.width * 0.28;
      const y = startY + i * 90;
      const container = this.add.container(x, y);

      const hasSprite = !!e.sprite && this.textures.exists(this.spriteKey(e.sprite));
      const icon = hasSprite
        ? this.add.image(-60, 0, this.spriteKey(e.sprite!)).setDisplaySize(48, 48)
        : this.add.text(-60, 0, e.icon, { fontSize: '32px' }).setOrigin(0.5);
      const name = this.add.text(-30, -22, e.name, { fontSize: '12px', color: '#faa' });
      const barBg = this.add.rectangle(-30, 0, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
      const barFill = this.add.rectangle(-30, 0, BAR_W, BAR_H, 0xcc2244).setOrigin(0, 0.5);
      const hpText = this.add.text(-30, 10, `${e.hp}/${e.maxHp}`, { fontSize: '10px', color: '#ccc' });

      container.add([icon, name, barBg, barFill, hpText]);
      container.setSize(140, 80);
      container.setInteractive(new Phaser.Geom.Rectangle(-60, -30, 140, 80), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => {
        if (e.hp <= 0 || this.combat.phase() !== 'player_turn') return;
        this.combat.selectedEnemyId.set(e.id);
      });

      this.enemyCards.set(e.id, { container, hpBarFill: barFill, lastHp: e.hp });
    });
  }

  private buildPartyCards(): void {
    const char = this.gs.character();
    const members = char ? [char, ...this.gs.companions()] : this.gs.companions();
    const startY = 100;
    members.forEach((m, i) => {
      const x = this.scale.width * 0.72;
      const y = startY + i * 70;
      const container = this.add.container(x, y);

      const name = this.add.text(-30, -18, m.name.split(',')[0], { fontSize: '12px', color: '#aef' });
      const barBg = this.add.rectangle(-30, 0, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
      const barFill = this.add.rectangle(-30, 0, BAR_W, BAR_H, 0x22cc66).setOrigin(0, 0.5);
      const hpText = this.add.text(-30, 10, `${m.pontosVida.current}/${m.pontosVida.max}`, { fontSize: '10px', color: '#ccc' });

      container.add([name, barBg, barFill, hpText]);
      this.partyCards.set(m.id, { container, hpBarFill: barFill, lastHp: m.pontosVida.current });
    });
  }

  private highlightSelection(selectedId: string | null): void {
    this.enemyCards.forEach((card, id) => {
      card.container.setAlpha(id === selectedId ? 1 : 0.8);
    });
  }

  private syncState(enemies: Enemy[], phase: string, selectedId: string | null): void {
    enemies.forEach(e => {
      const card = this.enemyCards.get(e.id);
      if (!card) return;
      const ratio = Math.max(0, e.hp / e.maxHp);
      card.hpBarFill.width = BAR_W * ratio;
      if (e.hp < card.lastHp) {
        this.cameras.main.shake(150, 0.008);
        this.tweens.add({ targets: card.container, alpha: 0.3, duration: 100, yoyo: true });
      }
      card.lastHp = e.hp;
      if (e.hp <= 0) card.container.setAlpha(0.25);
    });

    const char = this.gs.character();
    const members = char ? [char, ...this.gs.companions()] : this.gs.companions();
    members.forEach((m: Character) => {
      const card = this.partyCards.get(m.id);
      if (!card) return;
      const ratio = m.pontosVida.max > 0 ? Math.max(0, m.pontosVida.current / m.pontosVida.max) : 0;
      card.hpBarFill.width = BAR_W * ratio;
      if (m.pontosVida.current < card.lastHp) {
        this.tweens.add({ targets: card.container, alpha: 0.3, duration: 100, yoyo: true });
      }
      card.lastHp = m.pontosVida.current;
    });

    const labels: Record<string, string> = {
      player_turn: '▶ Seu turno',
      companion_turn: '⚡ Companheiros agem…',
      enemy_turn: '⚡ Inimigos agem…',
      victory: '🏆 Vitória!',
      defeat: '💀 Derrota…',
    };
    this.actionLabel?.setText(labels[phase] ?? '');
    this.highlightSelection(selectedId);
  }
}
