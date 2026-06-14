import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { EncounterScreenComponent } from './encounter-screen.component';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Character } from '../../../core/models/character.model';
import { DungeonFloor, DungeonRoom } from '../../../core/models/dungeon.model';
import { Enemy } from '../../../core/models/combat.model';

describe('EncounterScreenComponent', () => {
  let fixture: ComponentFixture<EncounterScreenComponent>;

  const character: Character = {
    id: 'hero',
    name: 'Aventureiro',
    class: 'guerreiro',
    race: 'humano',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    forca: { base: 2, current: 2, max: 2 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia: { base: 2, current: 2, max: 2 },
    armadura: 1,
    poderFogo: { base: 0, current: 0, max: 0 },
    pontosVida: { base: 10, current: 10, max: 10 },
    pontosMana: { base: 6, current: 6, max: 6 },
    vantagens: [],
    desvantagens: [],
    gold: 0,
    items: ['Pocao de Cura'],
    statusEffects: [],
    portraitIcon: 'H',
  };

  const room: DungeonRoom = {
    id: 1,
    type: 'monster',
    name: 'Sala de Teste',
    description: 'Uma sala com inimigo.',
    locked: false,
    connections: [],
    col: 0,
    row: 0,
    isVisible: true,
    isCurrent: true,
    cleared: false,
    entered: true,
  };

  const floor: DungeonFloor = {
    floorNumber: 1,
    theme: {
      id: 'allihanna',
      floorNumber: 1,
      godName: 'Allihanna',
      godDomain: 'Natureza',
      godAlignment: 'neutro',
      name: 'Floresta Subterranea',
      description: '',
      guardianName: '',
      guardianDesc: '',
      specialRule: '',
      icon: 'A',
      palette: 'forest',
      monsterTypes: [],
      trapTypes: [],
      treasureTypes: [],
      challengeType: 'combat',
      flavorTexts: [],
    },
    rooms: [room],
    totalRooms: 1,
    bossRoom: 1,
  };

  const enemy: Enemy = {
    id: 'enemy',
    name: 'Lobo',
    icon: 'L',
    flavorText: '',
    hp: 5,
    maxHp: 5,
    forca: 1,
    habilidade: 1,
    resistencia: 1,
    armadura: 1,
    pp: 5,
    xpReward: 1,
    goldReward: 1,
    isBoss: false,
  };

  beforeEach(async () => {
    const fakeGameState = {
      currentRoom: signal(room),
      character: signal(character),
      party: signal([character]),
      currentFloor: signal(floor),
      floorNumber: signal(1),
      pendingEnemies: signal<Enemy[] | null>(null),
      addLog: jasmine.createSpy('addLog'),
      resolveEncounter: jasmine.createSpy('resolveEncounter'),
    };

    const fakeCombat = {
      enemies: signal([enemy]),
      phase: signal('player_turn'),
      log: signal([]),
      abilities: computed(() => []),
      initCombat: jasmine.createSpy('initCombat'),
      playerAttackTarget: jasmine.createSpy('playerAttackTarget'),
      playerUseAbilityTarget: jasmine.createSpy('playerUseAbilityTarget'),
      playerFlee: jasmine.createSpy('playerFlee'),
      canUseAbility: jasmine.createSpy('canUseAbility').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [EncounterScreenComponent],
      providers: [
        { provide: GameStateService, useValue: fakeGameState },
        { provide: CombatService, useValue: fakeCombat },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncounterScreenComponent);
    fixture.detectChanges();
  });

  it('keeps the party column separated from the 1px battle divider', () => {
    const battleField: HTMLElement = fixture.nativeElement.querySelector('.battle-field');
    const children = Array.from(battleField.children) as HTMLElement[];

    expect(children.length).toBe(3);
    expect(children[0].classList).toContain('enemies-side');
    expect(children[1].classList).toContain('battle-divider');
    expect(children[2].classList).toContain('party-side');
  });
});
