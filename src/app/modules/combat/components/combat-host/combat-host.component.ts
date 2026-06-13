import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter
} from '@angular/core';
import Phaser from 'phaser';
import { CombatScene } from '../../phaser/scenes/combat.scene';
import { CombatService, CombatConfig, CombatResult } from '../../combat.service';

@Component({
  selector: 'app-combat-host',
  standalone: true,
  template: '<div #phaserContainer style="width:100%;height:100%"></div>',
  styles: [':host { display:block; width:100%; height:100%; }'],
})
export class CombatHostComponent implements AfterViewInit, OnDestroy {
  @ViewChild('phaserContainer') container!: ElementRef<HTMLDivElement>;
  @Input() config!: CombatConfig;
  @Output() combatResult = new EventEmitter<CombatResult>();

  private game?: Phaser.Game;

  constructor(private combatService: CombatService) {}

  ngAfterViewInit(): void {
    const wrappedConfig: CombatConfig = {
      ...this.config,
      onResult: (result) => {
        this.combatResult.emit(result);
        this.destroyGame();
      },
    };

    this.combatService.startCombat(wrappedConfig);

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 640,
      height: 480,
      backgroundColor: '#1a1a2e',
      parent: this.container.nativeElement,
      scene: [CombatScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    this.game.scene.start('CombatScene', {
      config: wrappedConfig,
      service: this.combatService,
    });
  }

  ngOnDestroy(): void {
    this.destroyGame();
  }

  private destroyGame(): void {
    this.game?.destroy(true);
    this.game = undefined;
  }
}
