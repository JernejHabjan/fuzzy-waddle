# #147 - Deterministic Lock-Stepping Implementation Plan

## Overview
Implement deterministic lock-stepping for ProbableWaffle multiplayer game using seed-based randomness synchronized across all players via gameInstanceId.

## Prerequisites
- [ ] Review Phaser GameConfig seed documentation (https://newdocs.phaser.io/docs/3.60.0/Phaser.Types.Core.GameConfig)
- [ ] Identify gameInstanceId usage in current codebase
- [ ] Map all Math.random() usages in ProbableWaffle

## Phase 1: Core Infrastructure

### 1.1 Seed Configuration
- [ ] Add `seed` property to `probableWaffleGameConfig` (game-config.ts)
- [ ] Create seed generation utility that derives from gameInstanceId
- [ ] Ensure seed is identical across all clients for same game instance
- [ ] Pass gameInstanceId to game config initialization

### 1.2 Random Number Generator Service
- [ ] Create `RandomService` in `apps/client/src/app/probable-waffle/game/world/services/random.service.ts`
- [ ] Initialize with Phaser.Math.RandomDataGenerator using derived seed
- [ ] Expose methods: `random()`, `between(min, max)`, `pick(array)`, `shuffle(array)`, `frac()`
- [ ] Make service injectable in Phaser scenes
- [ ] Add to ProbableWaffleSceneData services array

### 1.3 Game Data Integration
- [ ] Pass gameInstanceId to game config via ProbableWaffleGameData
- [ ] Update ProbableWaffleGameComponent to provide seed to config
- [ ] Ensure seed is set before game instance creation

## Phase 2: Replace Math.random() Usages

### 2.1 Navigation Service
**File**: `apps/client/src/app/probable-waffle/game/world/services/navigation.service.ts`
- [ ] Line 472: `randomTileInNavigableRadius` - replace Math.random()
- [ ] Line 514: `randomTileInRadius` - replace Math.random()
- [ ] Inject RandomService dependency
- [ ] Update both methods to use RandomService.between()

### 2.2 Audio Service
**File**: `apps/client/src/app/probable-waffle/game/world/services/audio.service.ts`
- [ ] Line 54: `shuffleOstQueue` - replace Math.random() sort
- [ ] Inject RandomService dependency
- [ ] Use RandomService.shuffle() method

### 2.3 Map Effects
**File**: `apps/client/src/app/probable-waffle/game/world/scenes/game-maps/MapEmberEnclave.ts`
- [ ] Line 266: Cloud alpha randomization - replace Math.random()
- [ ] Use RandomService.frac() for alpha values

**File**: `apps/client/src/app/probable-waffle/game/world/scenes/effects/LavaParticles.ts`
- [ ] Line 12: Particle frequency - replace Math.random()
- [ ] Use RandomService.between() for frequency calculation

### 2.4 Prefabs - Resources
**File**: `apps/client/src/app/probable-waffle/game/prefabs/outside/resources/stone-pile/StonePile.ts`
- [ ] Line 24: Frame selection - replace Math.floor(Math.random())
- [ ] Line 27: Flip decision - replace Math.random()
- [ ] Use RandomService.pick() for frame
- [ ] Use RandomService.frac() for flip

**File**: `apps/client/src/app/probable-waffle/game/prefabs/outside/resources/minerals/Minerals.ts`
- [ ] Line 30: Frame selection - replace Math.floor(Math.random())
- [ ] Line 33: Flip decision - replace Math.random()
- [ ] Use RandomService.pick() for frame
- [ ] Use RandomService.frac() for flip

### 2.5 Prefabs - Foliage
**File**: `apps/client/src/app/probable-waffle/game/prefabs/outside/foliage/bushes/components/spawn-berry.component.ts`
- [ ] Line 21: Berry frame selection - replace Math.floor(Math.random())
- [ ] Use RandomService.pick() for frames

### 2.6 Prefabs - Animals
**File**: `apps/client/src/app/probable-waffle/game/prefabs/animals/toxic-frog/ToxicFrog.ts`
- [ ] Line 27: Frog type selection - replace Math.floor(Math.random())
- [ ] Use RandomService.pick() for frog types

**File**: `apps/client/src/app/probable-waffle/game/prefabs/animals/hedgehog/Hedgehog.ts`
- [ ] Line 76: Sound selection - replace Math.random()
- [ ] Use RandomService.frac() for sound probability

### 2.7 Prefabs - Buildings
**File**: `apps/client/src/app/probable-waffle/game/prefabs/buildings/misc/SoundEffectMarker.ts`
- [ ] Line 67: Sound definition selection - replace Math.floor(Math.random())
- [ ] Use RandomService.pick() for sound definitions

### 2.8 AI Controller
**File**: `apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/base-planner.ts`
- [ ] Line 139: Task ID generation - replace Math.random()
- [ ] Use RandomService for unique ID generation

**File**: `apps/client/src/app/probable-waffle/game/player/ai-controller/cooldown-manager.ts`
- [ ] Line 32: Jitter calculation - replace Math.random()
- [ ] Use RandomService.frac() for jitter

**File**: `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-blackboard.ts`
- [ ] Line 352: Memo ID generation - replace Math.random()
- [ ] Use RandomService for unique ID generation

**File**: `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-controller.agent.ts`
- [ ] Line 638-639: Building placement X offset - replace Math.floor(Math.random())
- [ ] Line 642-643: Building placement Y offset - replace Math.floor(Math.random())
- [ ] Use RandomService.between() for offsets

### 2.9 GUI Components (Non-gameplay)
**File**: `apps/client/src/app/probable-waffle/gui/home/constellation-effect/constellation-effect.component.ts`
- [ ] Line 155: Star position - Math.random() (cosmetic, low priority)
- [ ] Consider if deterministic is needed for UI effects

## Phase 3: Phaser Built-in Random Usage

### 3.1 Physics and Particles
- [ ] Audit Phaser particle emitter random configurations
- [ ] Review tween random delays
- [ ] Check sprite animation random start frames
- [ ] Ensure all use scene.sys.game.config.seed

### 3.2 Game Setup Helpers
**File**: `libs/api-interfaces/src/lib/probable-waffle/game-setup.helpers.ts`
- [ ] Review PhaserMath usage
- [ ] Replace with seeded RNG if used for gameplay

## Phase 4: Documentation

### 5.1 Code Documentation
- [ ] Document RandomService API
- [ ] Add JSDoc comments to seed generation
- [ ] Comment deterministic requirements in critical systems
- [ ] Update game config comments

### 5.2 Architecture Documentation
- [ ] Document seed derivation from gameInstanceId
- [ ] Explain lock-stepping approach
- [ ] List all deterministic systems
- [ ] Document debugging procedures

## Phase 5: Edge Cases

### 6.1 Seed Management
- [ ] Handle missing/null gameInstanceId
- [ ] Default seed for single-player/testing
- [ ] Seed validation on game start
- [ ] Error handling for seed mismatch

### 6.2 Migration Path
- [ ] Backward compatibility for existing games
- [ ] Graceful degradation if seed unavailable
- [ ] Migration strategy for saved games

### 6.3 Performance
- [ ] Verify RandomService overhead
- [ ] Check seed initialization timing
- [ ] Optimize frequent random calls
- [ ] Profile RNG performance

## Implementation Order

1. RandomService creation and integration
2. Game config seed setup
3. Replace Math.random() in services (navigation, audio)
4. Replace Math.random() in prefabs (resources, animals, buildings)
5. Replace Math.random() in AI controller
6. Phaser built-in random audit
7. Documentation

## Files to Create
- `apps/client/src/app/probable-waffle/game/world/services/random.service.ts`
- `apps/client/src/app/probable-waffle/game/world/services/random.service.spec.ts` (if needed later)

## Files to Modify
- `apps/client/src/app/probable-waffle/game/world/const/game-config.ts`
- `apps/client/src/app/probable-waffle/gui/main/probable-waffle-game.component.ts`
- `apps/client/src/app/probable-waffle/game/world/services/navigation.service.ts`
- `apps/client/src/app/probable-waffle/game/world/services/audio.service.ts`
- `apps/client/src/app/probable-waffle/game/world/scenes/game-maps/MapEmberEnclave.ts`
- `apps/client/src/app/probable-waffle/game/world/scenes/effects/LavaParticles.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/outside/resources/stone-pile/StonePile.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/outside/resources/minerals/Minerals.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/outside/foliage/bushes/components/spawn-berry.component.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/animals/toxic-frog/ToxicFrog.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/animals/hedgehog/Hedgehog.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/buildings/misc/SoundEffectMarker.ts`
- `apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/base-planner.ts`
- `apps/client/src/app/probable-waffle/game/player/ai-controller/cooldown-manager.ts`
- `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-blackboard.ts`
- `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-controller.agent.ts`

## Progress Tracking

**Status**: Not Started
**Last Updated**: 2026-01-18
**Completed Items**: 0/78
