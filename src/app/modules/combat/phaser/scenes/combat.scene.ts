import Phaser from 'phaser';
import { CombatService, CombatConfig } from '../../combat.service';

/**
 * Cena principal de combate turn-based.
 * Recebe CombatConfig via scene.data e devolve CombatResult via CombatService.resolveCombat().
 */
export class CombatScene extends Phaser.Scene {
  private config!: CombatConfig;
  private combatService!: CombatService;

  // Estado de combate
  private characterHp = 0;
  private characterPm = 0;
  private enemyHp = 0;
  private playerTurn = true;
  private busy = false;

  // UI
  private logLines: Phaser.GameObjects.Text[] = [];
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private actionButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'CombatScene' });
  }

  init(data: { config: CombatConfig; service: CombatService }): void {
    this.config = data.config;
    this.combatService = data.service;
    this.characterHp = this.config.character.hpAtual;
    this.characterPm = this.config.character.pmAtual;
    this.enemyHp = this.config.enemy.hpAtual;
  }

  preload(): void {
    if (this.config.enemy.sprite) {
      this.load.image(
        `enemy_sprite`,
        `assets/monsters_token/${this.config.enemy.sprite}`
      );
    }
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    // Fundo
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // Sprite do personagem (emoji)
    this.add.text(W * 0.25, H * 0.3, this.config.character.icon, { fontSize: '64px' }).setOrigin(0.5);

    // Sprite do inimigo: imagem PNG se disponível, senão emoji
    if (this.config.enemy.sprite && this.textures.exists('enemy_sprite')) {
      this.add.image(W * 0.75, H * 0.3, 'enemy_sprite').setOrigin(0.5).setDisplaySize(96, 96);
    } else {
      this.add.text(W * 0.75, H * 0.3, this.config.enemy.icon, { fontSize: '64px' }).setOrigin(0.5);
    }

    // Nomes
    this.add.text(W * 0.25, H * 0.18, this.config.character.nome, { fontSize: '14px', color: '#aef' }).setOrigin(0.5);
    this.add.text(W * 0.75, H * 0.18, this.config.enemy.nome, { fontSize: '14px', color: '#faa' }).setOrigin(0.5);

    // Barras de HP
    this.buildHpBars(W, H);

    // Log
    this.buildLog(W, H);

    // Botões de ação
    this.buildActionButtons(W, H);

    // Decide quem começa
    const charInit = CombatService.initiative(this.config.character.habilidade);
    const enemyInit = CombatService.initiative(this.config.enemy.habilidade);
    this.playerTurn = charInit >= enemyInit;
    this.addLog(`Iniciativa: você (${charInit}) vs ${this.config.enemy.nome} (${enemyInit})`);

    if (!this.playerTurn) {
      this.time.delayedCall(800, () => this.enemyAttack());
    }
  }

  // ── Construção da UI ──────────────────────────────────────────────────────

  private buildHpBars(W: number, H: number): void {
    const barW = W * 0.3;
    const barH = 10;
    const y = H * 0.48;

    // Fundo das barras
    this.add.rectangle(W * 0.25, y, barW, barH, 0x333).setOrigin(0.5);
    this.add.rectangle(W * 0.75, y, barW, barH, 0x333).setOrigin(0.5);

    // Barras preenchidas
    this.playerHpBar = this.add.rectangle(W * 0.25 - barW / 2, y, barW, barH, 0x22cc66).setOrigin(0, 0.5);
    this.enemyHpBar = this.add.rectangle(W * 0.75 - barW / 2, y, barW, barH, 0xcc2244).setOrigin(0, 0.5);

    this.updateHpBars(W, barW);
  }

  private updateHpBars(W: number, barW = this.scale.width * 0.3): void {
    const playerRatio = Math.max(0, this.characterHp / this.config.character.hp);
    const enemyRatio = Math.max(0, this.enemyHp / this.config.enemy.hp);
    this.playerHpBar.setSize(barW * playerRatio, this.playerHpBar.height);
    this.enemyHpBar.setSize(barW * enemyRatio, this.enemyHpBar.height);
  }

  private buildLog(W: number, H: number): void {
    const startY = H * 0.56;
    for (let i = 0; i < 4; i++) {
      this.logLines.push(
        this.add.text(W / 2, startY + i * 16, '', { fontSize: '12px', color: '#ccc' }).setOrigin(0.5)
      );
    }
  }

  private addLog(msg: string): void {
    for (let i = this.logLines.length - 1; i > 0; i--) {
      this.logLines[i].setText(this.logLines[i - 1].text);
      this.logLines[i].setAlpha(1 - i * 0.2);
    }
    this.logLines[0].setText(msg).setAlpha(1);
  }

  private buildActionButtons(W: number, H: number): void {
    const actions = [
      { label: '⚔️ Atacar', key: 'attack' },
      { label: '✨ Habilidade', key: 'ability' },
      { label: '🛡️ Defender', key: 'defend' },
      { label: '🏃 Fugir', key: 'flee' },
    ];

    const startX = W * 0.1;
    const spacing = W * 0.22;

    actions.forEach((a, i) => {
      const btn = this.add
        .text(startX + i * spacing, H * 0.85, a.label, {
          fontSize: '14px',
          backgroundColor: '#2a2a4a',
          padding: { x: 10, y: 6 },
          color: '#fff',
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.handleAction(a.key))
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#3a3a6a' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#2a2a4a' }));
      this.actionButtons.push(btn);
    });
  }

  private setButtonsEnabled(enabled: boolean): void {
    this.actionButtons.forEach(b => b.setAlpha(enabled ? 1 : 0.4));
  }

  // ── Ações do jogador ──────────────────────────────────────────────────────

  private handleAction(key: string): void {
    if (!this.playerTurn || this.busy) return;
    this.busy = true;
    this.setButtonsEnabled(false);

    switch (key) {
      case 'attack':  this.playerAttack(); break;
      case 'ability': this.playerAbility(); break;
      case 'defend':  this.playerDefend(); break;
      case 'flee':    this.playerFlee(); break;
    }
  }

  private playerAttack(): void {
    const dmg = CombatService.physicalDamage(this.config.character.forca, this.config.enemy.armadura);
    this.enemyHp -= dmg;
    this.addLog(`Você atacou ${this.config.enemy.nome} por ${dmg} de dano.`);
    this.updateHpBars(this.scale.width);
    this.cameras.main.shake(150, 0.01);
    this.time.delayedCall(600, () => this.afterPlayerAction());
  }

  private playerAbility(): void {
    const pm = this.config.character.pmAtual;
    if (pm < 1) {
      this.addLog('PF insuficiente!');
      this.busy = false;
      this.setButtonsEnabled(true);
      return;
    }
    const dmg = CombatService.magicDamage(this.config.character.habilidade, this.config.enemy.armadura);
    this.characterPm -= 1;
    this.config.character.pmAtual = this.characterPm;
    this.enemyHp -= dmg;
    this.addLog(`Habilidade especial! ${dmg} de dano mágico.`);
    this.updateHpBars(this.scale.width);
    this.time.delayedCall(600, () => this.afterPlayerAction());
  }

  private playerDefend(): void {
    this.addLog('Você assumiu postura defensiva. (+2 ARM este turno)');
    this.config.character.armadura += 2;
    this.time.delayedCall(600, () => {
      this.config.character.armadura -= 2;
      this.afterPlayerAction();
    });
  }

  private playerFlee(): void {
    const success = CombatService.roll() >= 4;
    if (success) {
      this.addLog('Você fugiu do combate!');
      this.time.delayedCall(800, () =>
        this.combatService.resolveCombat({
          outcome: 'fled',
          xpGained: 0,
          goldGained: 0,
          characterHpRemaining: this.characterHp,
          characterPmRemaining: this.characterPm,
        })
      );
    } else {
      this.addLog('Fuga fracassou!');
      this.time.delayedCall(600, () => this.afterPlayerAction());
    }
  }

  // ── Turno do inimigo ──────────────────────────────────────────────────────

  private enemyAttack(): void {
    this.busy = true;
    this.setButtonsEnabled(false);
    const dmg = CombatService.physicalDamage(this.config.enemy.forca, this.config.character.armadura);
    this.characterHp -= dmg;
    this.config.character.hpAtual = this.characterHp;
    this.addLog(`${this.config.enemy.nome} atacou você por ${dmg} de dano.`);
    this.updateHpBars(this.scale.width);
    this.cameras.main.shake(200, 0.015);

    this.time.delayedCall(700, () => {
      if (this.characterHp <= 0) {
        this.endCombat('defeat');
      } else {
        this.playerTurn = true;
        this.busy = false;
        this.setButtonsEnabled(true);
      }
    });
  }

  private afterPlayerAction(): void {
    if (this.enemyHp <= 0) {
      this.endCombat('victory');
      return;
    }
    this.playerTurn = false;
    this.time.delayedCall(500, () => this.enemyAttack());
  }

  // ── Fim do combate ────────────────────────────────────────────────────────

  private endCombat(outcome: 'victory' | 'defeat'): void {
    this.setButtonsEnabled(false);
    const msg = outcome === 'victory'
      ? `Vitória! +${this.config.enemy.xpRecompensa} XP, +${this.config.enemy.ouroRecompensa} ouro.`
      : 'Você foi derrotado...';
    this.addLog(msg);

    this.time.delayedCall(1500, () =>
      this.combatService.resolveCombat({
        outcome,
        xpGained: outcome === 'victory' ? this.config.enemy.xpRecompensa : 0,
        goldGained: outcome === 'victory' ? this.config.enemy.ouroRecompensa : 0,
        characterHpRemaining: Math.max(0, this.characterHp),
        characterPmRemaining: this.characterPm,
      })
    );
  }
}
