import Phaser from 'phaser';
import { Injector, runInInjectionContext, effect } from '@angular/core';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Enemy } from '../../../core/models/combat.model';
import { Character } from '../../../core/models/character.model';
import { powerScaleSymbol } from '../../../core/utils/power-scale';

/** Maior símbolo de Escala de Poder (3D&T) entre os atributos do inimigo, se algum passar de Ningen. */
function enemyScaleBadge(e: Enemy): string {
  const symbols = [e.poder, e.habilidade, e.resistencia, e.armadura].map(powerScaleSymbol).filter(Boolean);
  return symbols.length ? ` ${symbols[0]}` : '';
}

interface EnemyCard {
  container: Phaser.GameObjects.Container;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  lastHp: number;
}

interface PartyCard {
  container: Phaser.GameObjects.Container;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
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
      effect(() => {
        const events = this.combat.hitEvents();
        if (events.length === 0) return;
        this.combat.hitEvents.set([]);
        if (this.scene.isActive()) events.forEach(ev => this.playHitSequence(ev.enemyId, ev.amounts));
      });
      effect(() => {
        const events = this.combat.partyHitEvents();
        if (events.length === 0) return;
        this.combat.partyHitEvents.set([]);
        if (this.scene.isActive()) events.forEach(ev => this.playPartyHitSequence(ev.targetId, ev.amounts));
      });
      effect(() => {
        const events = this.combat.missEvents();
        if (events.length === 0) return;
        this.combat.missEvents.set([]);
        if (this.scene.isActive()) events.forEach(ev => this.playMiss(ev.side, ev.targetId));
      });
      effect(() => {
        const events = this.combat.shieldEvents();
        if (events.length === 0) return;
        this.combat.shieldEvents.set([]);
        if (this.scene.isActive()) events.forEach(ev => this.playShield(ev.isEnemy, ev.targetId));
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
      const name = this.add.text(-30, -22, e.name + enemyScaleBadge(e), { fontSize: '12px', color: '#faa' });
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

      this.enemyCards.set(e.id, { container, hpBarFill: barFill, hpText, lastHp: e.hp });
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
      this.partyCards.set(m.id, { container, hpBarFill: barFill, hpText, lastHp: m.pontosVida.current });
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
      // A barra/HP já refletem o valor final aqui — o tremor e o número flutuante por
      // dado de dano são tratados em playHitSequence() (via combat.hitEvents()), não aqui,
      // pra poder animar "uma porrada por dado" em vez de um único salto na barra.
      const ratio = Math.max(0, e.hp / e.maxHp);
      card.hpBarFill.width = BAR_W * ratio;
      card.hpText.setText(`${Math.max(0, e.hp)}/${e.maxHp}`);
      card.lastHp = e.hp;
      if (e.hp <= 0) card.container.setAlpha(0.25);
    });

    const char = this.gs.character();
    const members = char ? [char, ...this.gs.companions()] : this.gs.companions();
    members.forEach((m: Character) => {
      const card = this.partyCards.get(m.id);
      if (!card) return;
      // Igual aos inimigos: a barra já reflete o valor final, o tremor/número flutuante
      // por dado é tratado em playPartyHitSequence() (via combat.partyHitEvents()).
      const ratio = m.pontosVida.max > 0 ? Math.max(0, m.pontosVida.current / m.pontosVida.max) : 0;
      card.hpBarFill.width = BAR_W * ratio;
      card.hpText.setText(`${Math.max(0, m.pontosVida.current)}/${m.pontosVida.max}`);
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

  /**
   * Anima uma "porrada" por dado de dano contra um inimigo: a barra de PV já está no
   * valor final (syncState já aplicou), então reconstituímos o PV de ANTES do golpe
   * somando de volta o total das porradas, e vamos descontando uma a uma com um
   * pequeno atraso entre elas — tremor de câmera + número flutuante a cada uma.
   */
  private playHitSequence(enemyId: string, amounts: number[]): void {
    const card = this.enemyCards.get(enemyId);
    const enemy = this.combat.enemies().find(e => e.id === enemyId);
    if (!card || !enemy || amounts.length === 0) return;

    const totalHit = amounts.reduce((a, b) => a + b, 0);
    let hpRunning = Math.min(enemy.maxHp, enemy.hp + totalHit);

    amounts.forEach((amount, i) => {
      this.time.delayedCall(i * 260, () => {
        hpRunning = Math.max(0, hpRunning - amount);
        const ratio = enemy.maxHp > 0 ? hpRunning / enemy.maxHp : 0;
        card.hpBarFill.width = BAR_W * ratio;
        card.hpText.setText(`${Math.max(0, hpRunning)}/${enemy.maxHp}`);
        card.lastHp = hpRunning;
        this.punchHit(card.container, '#ff5566', `-${amount}`);
      });
    });
  }

  /** Mesma ideia de playHitSequence(), mas pro lado da party (jogador ou companheiro). */
  private playPartyHitSequence(targetId: string, amounts: number[]): void {
    const card = this.partyCards.get(this.resolvePartyId(targetId));
    if (!card || amounts.length === 0) return;

    const member = this.findPartyMember(targetId);
    if (!member) return;
    const maxHp = member.pontosVida.max;

    const totalHit = amounts.reduce((a, b) => a + b, 0);
    let hpRunning = Math.min(maxHp, member.pontosVida.current + totalHit);

    amounts.forEach((amount, i) => {
      this.time.delayedCall(i * 260, () => {
        hpRunning = Math.max(0, hpRunning - amount);
        const ratio = maxHp > 0 ? hpRunning / maxHp : 0;
        card.hpBarFill.width = BAR_W * ratio;
        card.hpText.setText(`${Math.max(0, hpRunning)}/${maxHp}`);
        card.lastHp = hpRunning;
        this.punchHit(card.container, '#ff8855', `-${amount}`);
      });
    });
  }

  /** Tremor de câmera + flash + "encolhida" no impacto + número flutuante — usado por golpes dos dois lados. */
  private punchHit(container: Phaser.GameObjects.Container, color: string, text: string): void {
    this.cameras.main.shake(120, 0.006);
    this.tweens.add({ targets: container, alpha: 0.3, duration: 90, yoyo: true });
    this.tweens.add({
      targets: container, scaleX: 0.88, scaleY: 1.1, duration: 80, yoyo: true, ease: 'Quad.easeOut',
    });

    const dmgText = this.add.text(container.x, container.y - 30, text, {
      fontSize: '16px', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => dmgText.destroy(),
    });
  }

  /** Esquiva: um leve passo pro lado (sem dano) + texto "Esquivou!" cinza. */
  private playMiss(side: 'enemy' | 'party', targetId: string): void {
    const card = side === 'enemy'
      ? this.enemyCards.get(targetId)?.container
      : this.partyCards.get(this.resolvePartyId(targetId))?.container;
    if (!card) return;

    const dodgeDir = side === 'enemy' ? -1 : 1;
    this.tweens.add({
      targets: card, x: card.x + dodgeDir * 14, duration: 90, yoyo: true, ease: 'Quad.easeOut',
    });

    const missText = this.add.text(card.x, card.y - 30, 'Esquivou!', {
      fontSize: '13px', color: '#9aa0c0', fontStyle: 'italic',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: missText, y: missText.y - 22, alpha: 0, duration: 550, ease: 'Cubic.easeOut',
      onComplete: () => missText.destroy(),
    });
  }

  /** Bloqueio total por Armadura: um anel de escudo se expande em volta do defensor. */
  private playShield(isEnemy: boolean, targetId: string): void {
    const card = isEnemy
      ? this.enemyCards.get(targetId)?.container
      : this.partyCards.get(this.resolvePartyId(targetId))?.container;
    if (!card) return;

    const ring = this.add.circle(card.x, card.y, 18, 0x4ab3ff, 0).setStrokeStyle(3, 0x4ab3ff, 0.9);
    const icon = this.add.text(card.x, card.y, '🛡️', { fontSize: '20px' }).setOrigin(0.5).setAlpha(0);

    ring.setAlpha(0.9);
    this.tweens.add({ targets: icon, alpha: 1, duration: 100, yoyo: true, hold: 200 });
    this.tweens.add({
      targets: ring, radius: 34, alpha: 0, duration: 450, ease: 'Cubic.easeOut',
      onComplete: () => { ring.destroy(); icon.destroy(); },
    });
  }

  /** 'player' (id lógico usado pelos eventos de combate) → id real do personagem nas partyCards. */
  private resolvePartyId(targetId: string): string {
    return targetId === 'player' ? (this.gs.character()?.id ?? targetId) : targetId;
  }

  private findPartyMember(targetId: string): Character | undefined {
    if (targetId === 'player') return this.gs.character() ?? undefined;
    return this.gs.companions().find(c => c.id === targetId);
  }
}
