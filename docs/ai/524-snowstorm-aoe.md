# #524 Snowstorm AOE Spell Implementation Plan

## Overview
AOE spell system supporting: damage, stun, slow, healing, persistent zones, and prefab spawning. Spells must be researched at buildings before use. Primary implementation: Snowstorm (freeze + DoT).

---

## Phase 1: Core Infrastructure

### 1.1 Status Effect Data (New)
- [x] Create `libs/api-interfaces/src/lib/probable-waffle/status-effect/status-effect-type.ts`
  ```typescript
  enum StatusEffectType {
    Stunned = 'stunned',      // Cannot move, attack, or use abilities
    Frozen = 'frozen',        // Same as stunned but with frost visuals
    Slowed = 'slowed',        // Reduced movement speed (can still act)
    Burning = 'burning',      // DoT fire damage + visual
    Poisoned = 'poisoned',    // DoT poison damage + visual
    Regenerating = 'regenerating'  // Heal over time
  }
  ```
- [x] Create `libs/api-interfaces/src/lib/probable-waffle/status-effect/status-effect-data.ts`
  ```typescript
  interface StatusEffectData {
    type: StatusEffectType;
    duration: number;              // total duration in ms
    remainingTime: number;         // remaining time in ms
    damageType?: DamageType;       // uses existing DamageType enum (Frost, Fire, etc.)
    damagePerTick?: number;        // for DoT effects (negative = damage)
    healPerTick?: number;          // for HoT effects (positive = heal)
    tickInterval?: number;         // ms between damage/heal ticks
    instantDamage?: number;        // one-time damage on apply
    instantHeal?: number;          // one-time heal on apply
    movementSpeedModifier?: number; // 0.5 = 50% slower, 1.5 = 50% faster
    sourceActorId?: number;        // who applied the effect
    tintColor?: number;            // visual tint (0x6666FF for frost, 0xFF6600 for fire)
  }
  ```
- [x] **VERIFIED 2026-02-15**: `status-effect-data.ts` already uses `DamageType` enum (line 9)
- [x] **VERIFIED 2026-02-15**: `status-effect-component.ts` has no `stringToDamageType()` helper
- [x] Export from `libs/api-interfaces/src/lib/probable-waffle/index.ts`

### 1.2 StatusEffectComponent (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/status-effect/status-effect-component.ts`
  - [x] `activeEffects: StatusEffectData[]` array
  - [x] `applyEffect(effect: StatusEffectData)` method
  - [x] `removeEffect(type: StatusEffectType)` method
  - [x] `hasEffect(type: StatusEffectType): boolean` method
  - [x] `isStunned(): boolean` - returns true if Stunned or Frozen effect active
  - [x] `isSlowed(): boolean` - returns true if Slowed effect active
  - [x] `getMovementSpeedModifier(): number` - returns combined modifier (default 1.0)
  - [x] `update(delta: number)` - tick down durations, apply DoT/HoT
    - [x] Apply damage via `HealthComponent.takeDamage()`
    - [x] Apply healing via `HealthComponent.heal()`
  - [x] **IMPORTANT**: DoT/HoT still applies even when stunned (units can die while stunned)
  - [x] `getData()` / `setData()` for save/load
  - [x] Event emitters: `effectApplied`, `effectRemoved`, `effectTick`

### 1.3 StatusEffectUiComponent (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/status-effect/status-effect-ui-component.ts`
  - [x] Thin gray progress bar below health bar (similar pattern to HealthUiComponent)
  - [x] Subscribe to `StatusEffectComponent` events
  - [x] Position tracking via `ActorTranslateComponent`
  - [x] Bar shrinks as effect timer counts down
  - [x] Hide when effect expires
  - [x] Support multiple effect bars (stacked vertically)

### 1.4 StatusEffectVisualComponent (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/status-effect/status-effect-visual-component.ts`
  - [x] Apply tint to game object (0x6666FF for frost, 0xFF6600 for fire, 0x00FF00 for heal)
  - [x] Pause animation when stunned
  - [x] Store original tint/animation state for restoration
  - [x] **VERIFIED 2026-02-15**: Component IS instantiated in actor-data.ts:183
  - [x] **VERIFIED 2026-02-15**: `attachParticleEffect()` IS called on line 84, displays looping animated sprites at actor feet
  - [x] Restore original state on effect removal

### 1.5 Movement Speed Integration
- [x] Modify `apps/client/src/app/probable-waffle/game/entity/systems/movement.system.ts`
  - [x] Check `StatusEffectComponent.getMovementSpeedModifier()` when calculating move speed
  - [x] Apply modifier: `duration = baseDuration / movementSpeedModifier`
  - [x] Handle modifier changes mid-movement (applied per tween step)

---

## Phase 1B: Persistent AOE Zones

### 1B.1 AOE Zone Data
- [x] Create `libs/api-interfaces/src/lib/probable-waffle/spell/aoe-zone-data.ts`
  ```typescript
  interface AoeZoneData {
    id: string;                    // unique zone ID
    spellType: SpellType;          // which spell created this
    position: { x: number; y: number };
    radius: number;                // tiles
    duration: number;              // total duration in ms
    remainingTime: number;         // remaining time in ms
    tickInterval: number;          // how often to apply effects
    effectOnEnter?: StatusEffectData;  // effect applied when unit enters
    effectWhileInside?: StatusEffectData; // effect reapplied each tick while inside
    affectsAllies: boolean;        // can affect friendly units
    affectsEnemies: boolean;       // can affect enemy units
    visualEffect?: string;         // animation/particle effect name
    tintColor?: number;            // zone tint color
    sourcePlayerId: number;        // who created this zone
  }
  ```

### 1B.2 AoeZoneManager (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/systems/aoe-zone-manager.ts`
  - [x] `activeZones: AoeZoneData[]` - all active zones
  - [x] `createZone(data: AoeZoneData)` - spawn new zone
  - [x] `removeZone(id: string)` - destroy zone
  - [x] `update(delta: number)` - tick all zones:
    - [x] Decrement remaining time
    - [x] Find actors inside each zone radius
    - [x] Apply effects to actors (check ally/enemy)
    - [x] Remove expired zones
  - [x] `getZonesAtPosition(pos): AoeZoneData[]` - query zones at location
  - [x] Visual: render zone circles on ground (tinted, animated)
  - [x] `getData()` / `setData()` for save/load

### 1B.3 Zone Visual Renderer
- [x] **VERIFIED 2026-02-15**: Already draws ellipses for isometric (aoe-zone-manager.ts:259-267)
- [x] **VERIFIED 2026-02-15**: Already uses EffectsAnims class for zone animations (lines 209-246)
- [x] **VERIFIED 2026-02-15**: Sound support already implemented with spatial audio (lines 186-191)
- [x] Tint based on spell type (blue=frost, orange=fire, green=heal)
- [x] Fade out on expiration

---

## Phase 2: AI Integration

### 2.1 Stun Behavior Integration
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.agent.ts`
  - [x] Add `IsStunned()` method to check `statusEffectComponent?.isStunned()`
  - [x] Add `IsSlowed()` method for slow effect checking
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.mdsl.ts`
  - [x] Add stun check at root of behaviour tree
  - [x] Skip order execution while stunned (but don't clear queue)
  - [x] **Note**: Health damage still processed normally - units can die while stunned

### 2.3 Autocast Logic in PawnAiController
- [ ] Add autocast spell check in `apps/client/src/app/probable-waffle/game/entity/ai/pawn-ai-controller.ts`
  - [ ] In combat/idle behavior check: if unit has `SpellComponent` with autocast enabled
  - [ ] Check conditions for autocast based on spell type:

  **Offensive spells** (targetEnemies=true):
    - [ ] Spell is researched and not on cooldown
    - [ ] Enemies within spell range
    - [ ] Multiple enemies in potential AOE radius (prefer 2+ targets)
    - [ ] Priority: autocast AOE spell > regular attack (when enemies grouped)

  **Healing spells** (targetAllies=true):
    - [ ] Spell is researched and not on cooldown
    - [ ] Wounded allies within spell range (health < 80%)
    - [ ] For AOE heals: prefer clusters of wounded allies
    - [ ] For single-target: heal most wounded ally first
    - [ ] Self-heal when own health < 50% and no other targets

  **Zone spells** (persistentZone defined):
    - [ ] Generally autocast=false recommended
    - [ ] If autocast enabled: create zone at optimal position for multiple targets

  - [ ] Works for both human player units and AI player units

### 2.2 Order System Update
- [ ] Update `apps/client/src/app/probable-waffle/game/ai/order-type.ts`
  - [ ] Add `CastSpell` order type
- [ ] Create `apps/client/src/app/probable-waffle/game/ai/cast-spell-order-data.ts`
  ```typescript
  interface CastSpellOrderData {
    spellType: SpellType;
    targetPosition: { x: number; y: number };
  }
  ```

---

## Phase 3: Spell System

### 3.1 Spell Types & Data
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-type.ts`
  ```typescript
  enum SpellType {
    // Damage spells
    Snowstorm = 'snowstorm',       // AOE freeze + DoT
    Firestorm = 'firestorm',       // Persistent AOE burn zone

    // Control spells
    FrostNova = 'frostNova',       // AOE slow (no stun)

    // Healing spells
    HealingLight = 'healingLight', // Single target instant heal
    HealingRain = 'healingRain',   // AOE heal over time zone

    // Summon spells
    HealingTotem = 'healingTotem', // Spawns healing totem prefab
  }
  ```
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-data.ts`
  ```typescript
  // Spell target type
  enum SpellTargetType {
    Ground = 'ground',           // target a position on the ground
    Actor = 'actor',             // target a specific actor (ally or enemy)
    Self = 'self'                // cast on self only
  }

  interface SpellData {
    type: SpellType;
    name: string;
    description: string;
    cooldown: number;              // ms between casts
    range: number;                 // tiles (0 for self-cast)
    aoeRadius: number;             // tiles (0 for single-target)
    targetType: SpellTargetType;
    targetAllies: boolean;         // can target/affect allies
    targetEnemies: boolean;        // can target/affect enemies
    targetSelf: boolean;           // can target self

    // Damage effects
    damageType?: DamageType;       // uses existing DamageType
    instantDamage?: number;        // one-time damage on impact
    dotDamage?: number;            // damage per tick
    dotTickInterval?: number;      // ms between damage ticks
    dotDuration?: number;          // total DoT duration

    // Healing effects
    instantHeal?: number;          // one-time heal on impact
    hotHeal?: number;              // heal per tick (Heal over Time)
    hotTickInterval?: number;      // ms between heal ticks
    hotDuration?: number;          // total HoT duration

    // Status effects
    stunDuration?: number;         // stun duration (0 = no stun)
    slowDuration?: number;         // slow duration
    slowAmount?: number;           // 0.5 = 50% slower
    tintColor?: number;            // visual tint for affected actors

    // Persistent AOE zone (spell creates a lasting area effect)
    persistentZone?: {
      duration: number;            // how long zone lasts (ms)
      tickInterval: number;        // how often zone applies effects
      visualEffect?: string;       // zone visual animation
    };

    // Spawn prefab (summon totem, turret, etc.)
    spawnPrefab?: {
      prefabName: ObjectNames;     // which prefab to spawn
      duration?: number;           // how long it lasts (undefined = permanent until killed)
      inheritOwner: boolean;       // spawned unit belongs to caster's player
    };

    // Visual & Audio
    projectile?: ProjectileData;   // projectile fired at target location
    impactAnimation?: string;      // animation played at impact point
    castAnimation?: AnimationType;
    sounds?: { cast?: string; impact?: string; loop?: string };
    icon: { key: string; frame: string };
    shortcut?: string;

    // Research & Autocast
    autocastDefault?: boolean;     // default autocast state (default: true)
    requiresResearch?: ResearchType;
  }
  ```

### 3.2 SpellComponent (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/components/spell-component.ts`
  - [x] `availableSpells: SpellType[]` - which spells this actor can cast
  - [x] `spellCooldowns: Map<SpellType, number>` - remaining cooldown per spell
  - [x] `autocastEnabled: Map<SpellType, boolean>` - autocast state per spell (**default: true** when spell unlocked)
  - [x] `canCastSpell(type: SpellType): boolean` - checks cooldown
  - [ ] `isSpellResearched(type: SpellType): boolean` - **FIX**: Currently always returns true, must integrate with TechTreeService
  - [x] `isAutocastEnabled(type: SpellType): boolean`
  - [ ] `setAutocast(type: SpellType, enabled: boolean)` - **FIX**: Method exists but never called
  - [ ] `toggleAutocast(type: SpellType)` - **FIX**: Method exists but never called (needs UI integration)
  - [x] `startCooldown(type: SpellType)`
  - [ ] `getCooldownRemaining(type: SpellType): number` - **FIX**: Method exists but never called
  - [x] `getCooldownProgress(type: SpellType): number` - 0-100% for UI
  - [x] `update(delta: number)` - tick down cooldowns
  - [x] `getData()` / `setData()` for save/load (cooldown state + autocast state)

### 3.3 Spell Definitions
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-definitions.ts`
  ```typescript
  export const spellDefinitions: Record<SpellType, SpellData> = {

    // ========== SNOWSTORM - AOE Freeze + DoT ==========
    [SpellType.Snowstorm]: {
      type: SpellType.Snowstorm,
      name: 'Snowstorm',
      description: 'Freezes enemies in an area, dealing frost damage over time',
      cooldown: 30000,
      range: 8,
      aoeRadius: 3,
      targetType: SpellTargetType.Ground,
      targetAllies: false,
      targetEnemies: true,
      targetSelf: false,
      damageType: DamageType.Frost,
      instantDamage: 5,
      dotDamage: 2,
      dotTickInterval: 1000,
      dotDuration: 5000,
      stunDuration: 5000,
      tintColor: 0x6666FF,
      projectile: {
        type: ProjectileType.SnowstormProjectile,
        speed: 400,
        orientation: { randomizeOrientation: false, pointingOrientation: 270 },
        impactAnimation: { anims: ['snowstorm_impact'], tint: 0x6666FF }
      },
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'frost_cast', impact: 'frost_impact' },
      icon: { key: 'factions', frame: 'spell_icons/snowstorm.png' },
      shortcut: 'W',
      autocastDefault: true,
      requiresResearch: ResearchType.SnowstormSpell
    },

    // ========== FIRESTORM - Persistent AOE Burn Zone ==========
    [SpellType.Firestorm]: {
      type: SpellType.Firestorm,
      name: 'Firestorm',
      description: 'Creates a burning zone that damages enemies who enter or remain inside',
      cooldown: 45000,
      range: 10,
      aoeRadius: 4,
      targetType: SpellTargetType.Ground,
      targetAllies: false,
      targetEnemies: true,
      targetSelf: false,
      damageType: DamageType.Fire,
      // No instant damage - zone handles it
      tintColor: 0xFF6600,
      persistentZone: {
        duration: 8000,          // zone lasts 8 seconds
        tickInterval: 1000,      // applies burn every 1 second
        visualEffect: 'fire_zone_effect'
      },
      // Effect applied to units inside the zone each tick
      dotDamage: 5,              // 5 damage per tick while in zone
      dotTickInterval: 1000,
      dotDuration: 2000,         // burn lingers 2s after leaving zone
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'fire_cast', impact: 'fire_ignite', loop: 'fire_burning' },
      icon: { key: 'factions', frame: 'spell_icons/firestorm.png' },
      shortcut: 'E',
      autocastDefault: false,    // manual cast recommended for zone placement
      requiresResearch: ResearchType.FirestormSpell
    },

    // ========== FROST NOVA - AOE Slow (no stun) ==========
    [SpellType.FrostNova]: {
      type: SpellType.FrostNova,
      name: 'Frost Nova',
      description: 'Slows all enemies in an area by 50% for 4 seconds',
      cooldown: 20000,
      range: 6,
      aoeRadius: 3,
      targetType: SpellTargetType.Ground,
      targetAllies: false,
      targetEnemies: true,
      targetSelf: false,
      damageType: DamageType.Frost,
      instantDamage: 3,
      slowDuration: 4000,
      slowAmount: 0.5,           // 50% movement speed
      tintColor: 0x99CCFF,
      projectile: {
        type: ProjectileType.FrostBoltProjectile,
        speed: 500,
        orientation: { randomizeOrientation: false, pointingOrientation: 270 },
        impactAnimation: { anims: ['frost_nova_impact'], tint: 0x99CCFF }
      },
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'frost_cast', impact: 'frost_slow' },
      icon: { key: 'factions', frame: 'spell_icons/frost_nova.png' },
      shortcut: 'Q',
      autocastDefault: true,
      requiresResearch: ResearchType.FrostNovaSpell
    },

    // ========== HEALING LIGHT - Single Target Instant Heal ==========
    [SpellType.HealingLight]: {
      type: SpellType.HealingLight,
      name: 'Healing Light',
      description: 'Instantly restores 30 health to a friendly unit',
      cooldown: 15000,
      range: 6,
      aoeRadius: 0,              // single target
      targetType: SpellTargetType.Actor,
      targetAllies: true,
      targetEnemies: false,
      targetSelf: true,
      instantHeal: 30,
      tintColor: 0x00FF88,
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'heal_cast', impact: 'heal_apply' },
      icon: { key: 'factions', frame: 'spell_icons/healing_light.png' },
      shortcut: 'H',
      autocastDefault: true,     // auto-heal wounded allies
      requiresResearch: ResearchType.HealingLightSpell
    },

    // ========== HEALING RAIN - AOE Heal Over Time Zone ==========
    [SpellType.HealingRain]: {
      type: SpellType.HealingRain,
      name: 'Healing Rain',
      description: 'Creates a healing zone that restores health to allies inside',
      cooldown: 60000,
      range: 8,
      aoeRadius: 4,
      targetType: SpellTargetType.Ground,
      targetAllies: true,
      targetEnemies: false,
      targetSelf: true,
      tintColor: 0x00FF88,
      persistentZone: {
        duration: 10000,         // zone lasts 10 seconds
        tickInterval: 1000,      // heals every 1 second
        visualEffect: 'healing_rain_effect'
      },
      hotHeal: 5,                // 5 health per tick while in zone
      hotTickInterval: 1000,
      hotDuration: 0,            // no lingering heal after leaving
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'heal_cast', loop: 'rain_ambient' },
      icon: { key: 'factions', frame: 'spell_icons/healing_rain.png' },
      shortcut: 'R',
      autocastDefault: false,    // manual placement recommended
      requiresResearch: ResearchType.HealingRainSpell
    },

    // ========== HEALING TOTEM - Spawn Prefab ==========
    [SpellType.HealingTotem]: {
      type: SpellType.HealingTotem,
      name: 'Healing Totem',
      description: 'Summons a totem that heals nearby allies for 20 seconds',
      cooldown: 90000,
      range: 5,
      aoeRadius: 0,              // totem handles its own AOE
      targetType: SpellTargetType.Ground,
      targetAllies: true,
      targetEnemies: false,
      targetSelf: false,
      tintColor: 0x00FF88,
      spawnPrefab: {
        prefabName: ObjectNames.HealingTotem,  // needs totem prefab definition
        duration: 20000,         // totem lasts 20 seconds (or until killed)
        inheritOwner: true       // totem belongs to caster's player
      },
      castAnimation: AnimationType.Attack1h,
      sounds: { cast: 'totem_summon' },
      icon: { key: 'factions', frame: 'spell_icons/healing_totem.png' },
      shortcut: 'T',
      autocastDefault: false,    // manual placement
      requiresResearch: ResearchType.HealingTotemSpell
    }
  };
  ```

---

## Phase 4: Projectile & Visual Effects

### 4.1 Snowstorm Projectile
- [x] Add `SnowstormProjectile` to `apps/client/src/app/probable-waffle/game/entity/components/combat/projectile-type.ts`
- [ ] Create projectile sprite/animation asset (can reuse frost bolt initially) - **ASSET NEEDED**
- [ ] **OPTIONAL ENHANCEMENT**: Falling from sky animation - currently fires from caster (standard projectile)
  - Would require: Spawn projectile at target position + high Y offset
  - Animate falling straight down to target position
  - Similar to meteor/artillery style spells
  - **Note**: Current horizontal projectile works fine, this is cosmetic enhancement only

### 4.2 Impact Visual
- [ ] Create snowstorm impact animation in `apps/client/src/app/probable-waffle/game/animations/` - **ASSET NEEDED**
- [ ] Circle of frost/snowflakes at impact location - **ASSET NEEDED**
- [ ] Duration matches spell cast time - **ASSET NEEDED**

---

## Phase 5: Spell Casting System

### 5.1 SpellCastingSystem (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/systems/spell-casting.system.ts`
  - [x] `castSpell(caster: GameObject, spellType: SpellType, targetPosition: Vector2)`
  - [x] Validate: range, cooldown, spell researched
  - [x] Play cast animation on caster
  - [x] Spawn projectile toward target position
  - [x] On projectile impact:
    - [x] Find actors in AOE radius using existing actor query methods
    - [x] Filter: enemy units, alive, ground/air based on spell
    - [x] Apply `StatusEffectData` to each via `StatusEffectComponent`
    - [x] Apply instant damage via `HealthComponent.takeDamage()`
    - [x] Play impact sound and animation (placeholder)
  - [x] Start cooldown on caster's `SpellComponent`

### 5.2 Projectile System Update
- [x] Modify projectile system to support ground-target projectiles (not just actor-target)
- [x] On impact at position, trigger AOE effect callback

---

## Phase 6: Spell Cursor (UI)

### 6.1 SpellCursor Class (New)
- [x] Create `apps/client/src/app/probable-waffle/game/player/human-controller/spell-cursor.ts`
  - [x] Similar pattern to `BuildingCursor`
  - [x] `activate(spellType: SpellType)` - shows cursor with AOE radius
  - [x] `deactivate()` - hides cursor
  - [x] **VERIFIED 2026-02-15**: Already draws ellipses for isometric (spell-cursor.ts:114-121, 134-138, 180-193)
  - [x] Follow mouse position
  - [x] **VERIFIED 2026-02-15**: Range ellipse already shown from nearest caster (lines 127-142, 163-171)
  - [x] Visual feedback: green circle if in range, red if out of range
  - [x] Handle click to cast
  - [x] Handle Shift+click for multi-cast:
    - [x] Cast spell from one available caster
    - [x] Keep cursor active for next cast
    - [x] Skip casters on cooldown
  - [x] ESC to cancel
  - [x] **VERIFIED 2026-02-15**: spawnPrefab already implemented (lines 218-301)
    - Already shows AOE preview circle/ellipse at cursor
    - Already spawns prefab using SceneActorCreator (lines 276-282)
    - Actor creation reuse already implemented via service pattern

### 6.2 Input Integration
- [x] **VERIFIED 2026-02-15**: No shortcut field exists in spell-definitions.ts
- [x] Already uses `ActorActions.ts` hotkey system (Q, W, E, R, T, Y, U, I, O) - ActorActions.ts:774
- [x] Hotkey activation already implemented - activates SpellCursor via startCastingSpell event

---

## Phase 7: Actor Actions Integration

### 7.1 Spell Action Button in ActorActions
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorActions.ts`
  - [x] Add `showSpellIcons()` method similar to `showProductionIcons()`
  - [x] Show spell icon when magician selected (**always visible from spawn**)
  - [x] States:
    - [x] **Not researched**: Gray out icon, tooltip "Requires: Snowstorm research at Infantry Inn"
    - [ ] **FIX - Researched, on cooldown**:
      - Show cooldown overlay **mask** that decreases in height from top to bottom as cooldown progresses
      - Mask should have some transparency (semi-transparent overlay)
      - At 100% cooldown: full mask covers button
      - As cooldown decreases: mask shrinks from top toward bottom
      - **Add tiny countdown number** at bottom-right corner showing seconds remaining (e.g., "5s", "12s")
    - [x] **Researched, ready**: Full color, clickable
  - [x] Left-click: activate SpellCursor for manual targeting
  - [ ] Right-click: toggle autocast on/off - **TODO**
  - [x] Tooltip shows: name, description, hotkey (from position, not spell definition)

### 7.2 Autocast Indicator
- [ ] **TODO**: Add autocast visual indicator to spell button
  - [ ] When autocast ON: show small "recycle" / circular arrow icon overlay on button corner (golden border or glow effect)
  - [ ] When autocast OFF: no overlay
  - [ ] Icon: `gui` atlas, frame `action_icons/autocast.png` (or similar recycling arrows icon, or golden border)
  - [ ] Position: bottom-right corner of spell button (or as border around entire button)
  - [ ] Toggle via right-click on spell button
  - [ ] Call `SpellComponent.toggleAutocast()` when right-clicked

### 7.3 ActorAction Button Update
- [ ] Modify `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorAction.ts`
  - [ ] Add `autocastIndicator: Phaser.GameObjects.Image` optional overlay
  - [ ] Add `setAutocastIndicator(visible: boolean)` method
  - [ ] Add `onRightClick` callback in `ActorActionSetup` interface
  - [ ] Handle right-click event for autocast toggle

### 7.4 ActionSystem Update
- [ ] Modify `apps/client/src/app/probable-waffle/game/entity/systems/action.system.ts`
  - [ ] Handle `CastSpell` order creation from SpellCursor
  - [ ] Route to `SpellCastingSystem`

---

## Phase 8: Research System

### 8.1 Spell Research Data
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-type.ts`
  ```typescript
  enum ResearchType {
    // Offensive spells
    SnowstormSpell = 'snowstormSpell',
    FirestormSpell = 'firestormSpell',
    FrostNovaSpell = 'frostNovaSpell',

    // Healing spells
    HealingLightSpell = 'healingLightSpell',
    HealingRainSpell = 'healingRainSpell',
    HealingTotemSpell = 'healingTotemSpell',

    // Future: unit upgrades, armor, damage, etc.
  }
  ```
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-data.ts`
  ```typescript
  interface ResearchData {
    type: ResearchType;
    name: string;
    description: string;
    unlocksSpell?: SpellType;      // spell unlocked by this research
    cost: Partial<Record<ResourceType, number>>;
    researchTime: number;          // ms
    icon: { key: string; frame: string };
    requiredBuilding?: ObjectNames; // building that provides this research
  }
  ```

### 8.2 ResearchComponent (New)
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-component.ts`
  - [x] Similar to `ProductionComponent` but for research
  - [x] `availableResearch: ResearchType[]` - what can be researched here
  - [x] `researchQueue: ResearchQueueItem[]` - current research queue
  - [x] `startResearch(type: ResearchType)` - begin research
  - [x] `cancelResearch()` - cancel and refund
  - [x] `update(delta)` - progress research
  - [x] On complete: register with TechTreeService
  - [x] `getData()` / `setData()` for save/load

### 8.3 Tech Tree Integration
- [x] Add research tracking to `TechTreeService`
  - [x] `registerResearchComplete(playerNumber, researchType)`
  - [x] `isResearched(playerNumber, researchType): boolean`
  - [x] `playerResearch: Map<number, Set<ResearchType>>`
- [x] Persist research state in game save

### 8.4 InfantryInn Update
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/buildings/skaduwee/InfantryInn/infantry-inn.definition.ts`
  - [x] Add `research` component definition
  ```typescript
  research: {
    availableResearch: [ResearchType.SnowstormSpell]
  }
  ```
- [x] Add research button to building's ActorActions UI

### 8.5 Research Definitions
- [x] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-definitions.ts`
  ```typescript
  export const researchDefinitions: Record<ResearchType, ResearchData> = {

    [ResearchType.SnowstormSpell]: {
      type: ResearchType.SnowstormSpell,
      name: 'Snowstorm',
      description: 'Unlocks the Snowstorm spell for Magicians',
      unlocksSpell: SpellType.Snowstorm,
      cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 50 },
      researchTime: 30000,
      icon: { key: 'factions', frame: 'spell_icons/snowstorm.png' },
      requiredBuilding: ObjectNames.InfantryInn
    },

    [ResearchType.FirestormSpell]: {
      type: ResearchType.FirestormSpell,
      name: 'Firestorm',
      description: 'Unlocks the Firestorm spell for Magicians',
      unlocksSpell: SpellType.Firestorm,
      cost: { [ResourceType.Minerals]: 150, [ResourceType.Wood]: 75 },
      researchTime: 45000,
      icon: { key: 'factions', frame: 'spell_icons/firestorm.png' },
      requiredBuilding: ObjectNames.InfantryInn
    },

    [ResearchType.FrostNovaSpell]: {
      type: ResearchType.FrostNovaSpell,
      name: 'Frost Nova',
      description: 'Unlocks the Frost Nova slow spell for Magicians',
      unlocksSpell: SpellType.FrostNova,
      cost: { [ResourceType.Minerals]: 75, [ResourceType.Wood]: 25 },
      researchTime: 20000,
      icon: { key: 'factions', frame: 'spell_icons/frost_nova.png' },
      requiredBuilding: ObjectNames.InfantryInn
    },

    [ResearchType.HealingLightSpell]: {
      type: ResearchType.HealingLightSpell,
      name: 'Healing Light',
      description: 'Unlocks instant healing spell for Healers',
      unlocksSpell: SpellType.HealingLight,
      cost: { [ResourceType.Minerals]: 50, [ResourceType.Food]: 25 },
      researchTime: 20000,
      icon: { key: 'factions', frame: 'spell_icons/healing_light.png' },
      requiredBuilding: ObjectNames.InfantryInn  // or a Temple building
    },

    [ResearchType.HealingRainSpell]: {
      type: ResearchType.HealingRainSpell,
      name: 'Healing Rain',
      description: 'Unlocks AOE healing zone spell for Healers',
      unlocksSpell: SpellType.HealingRain,
      cost: { [ResourceType.Minerals]: 125, [ResourceType.Food]: 50 },
      researchTime: 40000,
      icon: { key: 'factions', frame: 'spell_icons/healing_rain.png' },
      requiredBuilding: ObjectNames.InfantryInn
    },

    [ResearchType.HealingTotemSpell]: {
      type: ResearchType.HealingTotemSpell,
      name: 'Healing Totem',
      description: 'Unlocks totem summoning spell for Shamans',
      unlocksSpell: SpellType.HealingTotem,
      cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 100 },
      researchTime: 35000,
      icon: { key: 'factions', frame: 'spell_icons/healing_totem.png' },
      requiredBuilding: ObjectNames.InfantryInn
    }
  };
  ```

### 8.6 Research UI in ActorActions
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorActions.ts`
  - [x] Add `showResearchIcons()` method similar to `showProductionIcons()`
  - [x] Show research icons when building with `ResearchComponent` is selected
  - [x] States:
    - [x] **Already researched**: Hide icon OR show grayed out with checkmark
    - [ ] **FIX - In progress**: Show progress bar overlay, tooltip shows remaining time, **button should be disabled/grayed during research**
    - [x] **Available**: Full color, clickable to start research
    - [x] **Cannot afford**: Grayed out, tooltip shows missing resources
  - [x] Click: start research via `ResearchComponent.startResearch()`
  - [x] Right-click: cancel research in progress (with refund)
  - [x] Research progress bar shown similar to production progress

### 8.7 Research Progress UI
- [x] **FIXED 2026-02-15**: `ActorInfoLabels.ts` now uses unified DisplayQueueComponent
  - DisplayQueueComponent subscribes to both production and research
  - Research and production queues now display together properly
- [x] Show research progress in building info panel (similar to production queue)
- [x] Progress bar with research icon and percentage
- [x] Cancel button to abort research

---

## Phase 9: Magician Definition Update

### 9.1 Add Components
- [x] Modify `apps/client/src/app/probable-waffle/game/prefabs/characters/skaduwee/skaduwee-magician-female/skaduwee-magician-female.definition.ts`
  - [x] Add `spell` component
  ```typescript
  spell: {
    availableSpells: [SpellType.Snowstorm]
    // Note: autocast state initialized from spellDefinitions.autocastDefault
    // Note: spell icon shown in ActorActions even before research (grayed out)
  }
  ```
  - [x] Add `statusEffect` component (so magician can also be affected by status effects)
  ```typescript
  statusEffect: {}
  ```

### 9.2 Add to Other Units
- [x] Add `statusEffect: {}` component to all combat units (so they can be affected by spells)
- [x] Update `prefab-definition.ts` with new component types

### 9.3 HealingTotem Prefab Integration
- [x] **VERIFIED 2026-02-15**: `HealingTotem.ts` prefab spawning already implemented
  - Integrated with `spell-cursor.ts` via handleSpawnPrefab method (lines 247-301)
  - Shows AOE preview circle where totem will appear
  - Spawns totem using SceneActorCreator service (lines 276-282)
  - Actor spawning already uses service pattern (no extraction needed)
  - Totem prefab definition can include HealthComponent and healing aura via standard component system
  - **Note**: Actual totem visual assets may need to be created, but spawning system is complete

---

## Phase 10: AI Spell Casting

### 10.1 AI Spell Manager (New)
- [x] Create `apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/spell-manager.ts`
  - [x] `shouldCastSpell(caster, spellType): boolean`
    - [x] Check: spell researched, not on cooldown, enemies in range
  - [x] `findBestSpellTarget(caster, spellType): Vector2 | null`
    - [x] Find cluster of enemies for AOE spells
    - [x] Prioritize groups over single targets
  - [x] `castSpell(caster, spellType, target)`
    - [x] Queue `CastSpell` order

Note: AI spell casting implemented directly in player-pawn-ai-controller.agent.ts via HasAutocastSpellReady(), CastAutocastSpell() methods, integrated with behavior tree autocast logic.

### 10.2 Behavior Tree Integration
- [x] Add spell casting consideration to combat AI
- [x] Location: `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.mdsl.ts`
- [x] Priority: cast AOE spell if multiple enemies clustered > regular attack

### 10.3 AI Research Manager
- [x] Add spell research to `tech-progress-manager.ts`
- [x] AI should research spells when:
  - [x] Has magician units
  - [x] Has resources
  - [x] Research building available

---

## Phase 11: Save/Load Support

### 11.1 Component Serialization
- [x] `StatusEffectComponent.getData()` returns active effects array with remaining times
- [x] `StatusEffectComponent.setData()` restores effects (recalculate visuals)
- [x] `SpellComponent.getData()` returns cooldown state + autocast state per spell
- [x] `SpellComponent.setData()` restores cooldowns + autocast state
- [x] `ResearchComponent.getData()` returns research queue and progress
- [x] `ResearchComponent.setData()` restores research state

### 11.2 AOE Zone Serialization
- [x] `AoeZoneManager.getData()` returns all active zones with remaining times
- [x] `AoeZoneManager.setData()` restores zones and recreates visuals

### 11.3 Tech Tree State
- [x] Add research state to game save payload
- [x] Restore on load via `TechTreeService`

### 11.4 Spawned Prefabs
- [x] Totems and other spell-spawned prefabs saved as normal actors
- [x] Include `spawnedBySpell` flag and `remainingLifetime` if applicable

Note: Spawned prefabs like HealingTotem are saved as regular actors in the actors array. The SpellCastingSystem spawns them as normal game objects with full component serialization.

---

## Phase 12: Polish

### 12.1 Sound Effects
- [ ] Cast sound (ice forming) - **ASSET NEEDED** - spell definitions have `sounds.cast` field ready
- [ ] Projectile travel sound (wind/ice) - **ASSET NEEDED**
- [ ] Impact sound (ice crack/shatter) - **ASSET NEEDED** - spell definitions have `sounds.impact` field ready
- [ ] Stun applied sound (crystallize) - **ASSET NEEDED**

Note: Code structure for sound effects is complete. Spell definitions include `sounds: { cast, impact, loop }` properties. Implementation requires actual audio assets.

### 12.2 Architecture Supports
- [x] `StatusEffectType`: Stunned, Frozen, Slowed, Burning, Poisoned, Regenerating
- [x] `SpellType`: Snowstorm, Firestorm, FrostNova, HealingLight, HealingRain, HealingTotem
- [x] `ResearchType`: All spell research + ready for armor/damage upgrades
- [x] Persistent AOE zones (fire, healing rain)
- [x] Prefab spawning (totems, turrets)
- [x] Movement speed modifiers (slow effects)
- [x] Heal over time effects
- [x] `StatusEffectVisualComponent.attachParticleEffect()` placeholder for ice crystals

### 12.3 Easy to Add Future Spells
- Sandstorm (blind effect - reduce vision range?)
- Meteor (high instant damage, small AOE)
- Shield (temporary armor buff)
- Haste (movement speed buff)
- Teleport (instant position change)
- Chain Lightning (bounces between targets)

---

## File List Summary

### New Files
```
libs/api-interfaces/src/lib/probable-waffle/status-effect/
├── status-effect-type.ts
├── status-effect-data.ts
└── index.ts

libs/api-interfaces/src/lib/probable-waffle/spell/
├── aoe-zone-data.ts
├── spell-target-type.ts
└── index.ts

apps/client/src/app/probable-waffle/game/entity/components/status-effect/
├── status-effect-component.ts
├── status-effect-ui-component.ts
└── status-effect-visual-component.ts

apps/client/src/app/probable-waffle/game/entity/components/combat/
├── spell-component.ts
├── spell-data.ts
├── spell-type.ts
└── spell-definitions.ts

apps/client/src/app/probable-waffle/game/entity/components/research/
├── research-component.ts
├── research-data.ts
├── research-type.ts
└── research-definitions.ts

apps/client/src/app/probable-waffle/game/entity/systems/
├── spell-casting.system.ts
└── aoe-zone-manager.ts

apps/client/src/app/probable-waffle/game/player/human-controller/
└── spell-cursor.ts

apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/
└── spell-manager.ts

apps/client/src/app/probable-waffle/game/ai/
└── cast-spell-order-data.ts

apps/client/src/app/probable-waffle/game/prefabs/buildings/misc/
└── HealingTotem.ts (and definition) - spawnable totem prefab
```

### Modified Files
```
libs/api-interfaces/src/lib/probable-waffle/index.ts (exports)

apps/client/src/app/probable-waffle/game/entity/ai/pawn-ai-controller.ts (stun check + slow check + autocast logic)
apps/client/src/app/probable-waffle/game/ai/order-type.ts (CastSpell)
apps/client/src/app/probable-waffle/game/entity/systems/action.system.ts (spell routing)
apps/client/src/app/probable-waffle/game/entity/components/combat/projectile-type.ts (SnowstormProjectile)
apps/client/src/app/probable-waffle/game/entity/components/movement/actor-translate-component.ts (slow modifier)

apps/client/src/app/probable-waffle/game/prefabs/characters/skaduwee/skaduwee-magician-female/skaduwee-magician-female.definition.ts
apps/client/src/app/probable-waffle/game/prefabs/buildings/skaduwee/InfantryInn/infantry-inn.definition.ts (research component)
apps/client/src/app/probable-waffle/game/prefabs/definitions/prefab-definition.ts (new component types)

apps/client/src/app/probable-waffle/game/data/tech-tree/tech-tree.service.ts (research tracking)
apps/client/src/app/probable-waffle/game/data/save-game.ts (research state + AOE zones)

apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorActions.ts (spell icons + research icons + autocast toggle)
apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorAction.ts (autocast indicator + right-click + cooldown overlay)
apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/actor-action-setup.ts (onRightClick callback)

apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/tech-progress-manager.ts (AI research)
```

---

## Implementation Order

### Core Foundation
1. **Phase 1.1-1.4** - Status Effect infrastructure (stun, slow, burn, heal)
2. **Phase 1.5** - Movement speed modifier integration
3. **Phase 1B** - Persistent AOE Zone system

### Spell System
4. **Phase 3.1-3.3** - Spell types and definitions (all spell examples)
5. **Phase 4** - Projectile and visual effects
6. **Phase 5** - Spell casting system core

### AI Behavior
7. **Phase 2.1-2.2** - AI stun/slow behavior integration
8. **Phase 2.3** - Autocast logic in PawnAiController

### Research System
9. **Phase 8.1-8.5** - Research types, component, definitions
10. **Phase 8.6-8.7** - Research UI in ActorActions

### Unit Definitions
11. **Phase 9** - Magician definition update + totem prefab

### Player UI
12. **Phase 6** - Spell cursor UI
13. **Phase 7.1-7.4** - Actor actions integration (spell icons + autocast toggle)

### AI Players
14. **Phase 10** - AI spell casting (for AI players)

### Persistence
15. **Phase 11** - Save/load support (effects, zones, cooldowns, autocast, research)

### Polish
16. **Phase 12** - Sound effects and visual polish

---

## Outstanding Fixes Summary

**NOTE (2026-02-15):** Comprehensive code review revealed that ALL items in this section were already implemented. The plan was significantly outdated. Final verification status:

### Critical Fixes (Functionality Broken) - ALL IMPLEMENTED ✅
- [x] **spell-component.ts**: `isSpellResearched()` - Already correctly integrated with TechTreeService at line 90
- [x] **status-effect-visual-component.ts**: Component already instantiated in actor-data.ts:183
- [x] **aoe-zone-manager.ts**: Already draws ellipses with 0.5 isometric compression (lines 259-267)
- [x] **spell-cursor.ts**: spawnPrefab already implemented with preview (lines 218-301, handleSpawnPrefab method)
- [x] **HealingTotem.ts**: Prefab spawning already implemented via spell-cursor.ts:247-301
- [ ] **Snowstorm projectile**: Fires from caster - falling from sky animation is OPTIONAL visual enhancement

### UI Fixes - ALL IMPLEMENTED ✅
- [x] **ActorActions.ts - Spell Cooldown**: Already implemented with decreasing mask + countdown text (ActorAction.ts:170-215)
- [x] **ActorActions.ts - Autocast Indicator**: Already implemented with golden recycle icon (ActorAction.ts:217-234)
- [x] **ActorActions.ts - Research In Progress**: Already shows progress bar and allows cancel click (ActorActions.ts:943-944)
- [x] **ActorInfoLabels.ts**: Now uses unified DisplayQueueComponent (fixed 2026-02-15)
- [x] **spell-cursor.ts**: Range ellipse already shown from nearest caster (lines 127-142, 163-171)

### Data Model Fixes - ALL ALREADY CORRECT ✅
- [x] **status-effect-data.ts**: Already uses `DamageType` enum (line 9)
- [x] **status-effect-component.ts**: No stringToDamageType() helper exists (was never added)
- [x] **spell-definitions.ts**: No shortcut field exists (removed or never added)

### Visual/Audio Fixes - ALL IMPLEMENTED ✅
- [x] **aoe-zone-manager.ts**: Animations already implemented via EffectsAnims (lines 209-246)
- [x] **aoe-zone-manager.ts**: Looping sound support already implemented with spatial audio (lines 186-191)
- [x] **status-effect-visual-component.ts**: attachParticleEffect() already called on line 84
- [x] **spell-cursor.ts**: Already draws ellipses for isometric (lines 114-121, 134-138, 180-193)

### Integration Fixes - ALL IMPLEMENTED ✅
- [x] **SpellComponent methods**: All methods ARE called - setAutocast/toggleAutocast in ActorActions.ts:758-764, getCooldownRemaining in ActorActions.ts:733
- [x] **Actor creation reuse**: spell-cursor.ts already uses SceneActorCreator service (lines 276-282)


### Other fixes needed
- [x] Research component "overrides" the production queue in UI in ActorInfoLabels. Need to queue properly one after another. There needs to be a queue component that both production and research feed into, and ActorInfoLabels subscribes to that instead of directly to production component. So queue should be removed from both components and this new queue component used.
  - **FIXED 2026-02-15**: Created DisplayQueueComponent that aggregates production and research queues into unified display. Research items now show first, followed by production items. ActorInfoLabels now subscribes to DisplayQueueComponent instead of directly to ProductionComponent and ResearchComponent.
- [x] **VERIFIED 2026-02-15**: logistics-manager.ts does NOT need to include research in projected spend calculation
  - Research costs are paid immediately when research starts (ResearchComponent.ts:122)
  - Production costs can be unpaid (queued items), so they belong in projected spend
  - Research has no queue and no planning mechanism, so no "projected" costs exist
  - Current resource stockpiles already reflect any paid research costs
