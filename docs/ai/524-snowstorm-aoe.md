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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/status-effect/status-effect-visual-component.ts`
  - [ ] Apply tint to game object (0x6666FF for frost, 0xFF6600 for fire, 0x00FF00 for heal)
  - [ ] Pause animation when stunned
  - [ ] Store original tint/animation state for restoration
  - [ ] **Future hook**: `attachParticleEffect(effectName)` - placeholder for ice crystals at feet
  - [ ] Restore original state on effect removal

### 1.5 Movement Speed Integration
- [ ] Modify `apps/client/src/app/probable-waffle/game/entity/components/movement/actor-translate-component.ts`
  - [ ] Check `StatusEffectComponent.getMovementSpeedModifier()` when calculating move speed
  - [ ] Apply modifier: `effectiveSpeed = baseSpeed * movementSpeedModifier`
  - [ ] Handle modifier changes mid-movement

---

## Phase 1B: Persistent AOE Zones

### 1B.1 AOE Zone Data
- [ ] Create `libs/api-interfaces/src/lib/probable-waffle/spell/aoe-zone-data.ts`
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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/systems/aoe-zone-manager.ts`
  - [ ] `activeZones: AoeZoneData[]` - all active zones
  - [ ] `createZone(data: AoeZoneData)` - spawn new zone
  - [ ] `removeZone(id: string)` - destroy zone
  - [ ] `update(delta: number)` - tick all zones:
    - [ ] Decrement remaining time
    - [ ] Find actors inside each zone radius
    - [ ] Apply effects to actors (check ally/enemy)
    - [ ] Remove expired zones
  - [ ] `getZonesAtPosition(pos): AoeZoneData[]` - query zones at location
  - [ ] Visual: render zone circles on ground (tinted, animated)
  - [ ] `getData()` / `setData()` for save/load

### 1B.3 Zone Visual Renderer
- [ ] Create zone visual as Phaser Graphics or Sprite
- [ ] Animated edge (pulsing, particles)
- [ ] Tint based on spell type (blue=frost, orange=fire, green=heal)
- [ ] Fade out on expiration

---

## Phase 2: AI Integration

### 2.1 Stun Behavior Integration
- [ ] Modify `apps/client/src/app/probable-waffle/game/entity/ai/pawn-ai-controller.ts`
  - [ ] Check `statusEffectComponent?.isStunned()` before processing orders
  - [ ] Skip order execution while stunned (but don't clear queue)
  - [ ] Cancel current movement on stun apply
  - [ ] **Note**: Health damage still processed normally - units can die while stunned

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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-type.ts`
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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-data.ts`
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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/components/spell-component.ts`
  - [ ] `availableSpells: SpellType[]` - which spells this actor can cast
  - [ ] `spellCooldowns: Map<SpellType, number>` - remaining cooldown per spell
  - [ ] `autocastEnabled: Map<SpellType, boolean>` - autocast state per spell (**default: true** when spell unlocked)
  - [ ] `canCastSpell(type: SpellType): boolean` - checks cooldown
  - [ ] `isSpellResearched(type: SpellType): boolean` - checks tech tree
  - [ ] `isAutocastEnabled(type: SpellType): boolean`
  - [ ] `setAutocast(type: SpellType, enabled: boolean)`
  - [ ] `toggleAutocast(type: SpellType)` - for UI toggle
  - [ ] `startCooldown(type: SpellType)`
  - [ ] `getCooldownRemaining(type: SpellType): number`
  - [ ] `getCooldownProgress(type: SpellType): number` - 0-100% for UI
  - [ ] `update(delta: number)` - tick down cooldowns
  - [ ] `getData()` / `setData()` for save/load (cooldown state + autocast state)

### 3.3 Spell Definitions
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/spell-definitions.ts`
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
- [ ] Add `SnowstormProjectile` to `apps/client/src/app/probable-waffle/game/entity/components/combat/projectile-type.ts`
- [ ] Create projectile sprite/animation asset (can reuse frost bolt initially)
- [ ] Projectile travels from caster to target position (not a specific actor)

### 4.2 Impact Visual
- [ ] Create snowstorm impact animation in `apps/client/src/app/probable-waffle/game/animations/`
- [ ] Circle of frost/snowflakes at impact location
- [ ] Duration matches spell cast time

---

## Phase 5: Spell Casting System

### 5.1 SpellCastingSystem (New)
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/systems/spell-casting.system.ts`
  - [ ] `castSpell(caster: GameObject, spellType: SpellType, targetPosition: Vector2)`
  - [ ] Validate: range, cooldown, spell researched
  - [ ] Play cast animation on caster
  - [ ] Spawn projectile toward target position
  - [ ] On projectile impact:
    - [ ] Find actors in AOE radius using existing actor query methods
    - [ ] Filter: enemy units, alive, ground/air based on spell
    - [ ] Apply `StatusEffectData` to each via `StatusEffectComponent`
    - [ ] Apply instant damage via `HealthComponent.takeDamage()`
    - [ ] Play impact sound and animation
  - [ ] Start cooldown on caster's `SpellComponent`

### 5.2 Projectile System Update
- [ ] Modify projectile system to support ground-target projectiles (not just actor-target)
- [ ] On impact at position, trigger AOE effect callback

---

## Phase 6: Spell Cursor (UI)

### 6.1 SpellCursor Class (New)
- [ ] Create `apps/client/src/app/probable-waffle/game/player/human-controller/spell-cursor.ts`
  - [ ] Similar pattern to `BuildingCursor`
  - [ ] `activate(spellType: SpellType, casters: GameObject[])` - shows cursor with AOE radius
  - [ ] `deactivate()` - hides cursor
  - [ ] Draw AOE radius circle (tinted based on spell - blue for frost)
  - [ ] Follow mouse position
  - [ ] Show range circle from nearest valid caster
  - [ ] Visual feedback: green circle if in range, red if out of range
  - [ ] Handle click to cast
  - [ ] Handle Shift+click for multi-cast:
    - [ ] Cast spell from one available caster
    - [ ] Keep cursor active for next cast
    - [ ] Skip casters on cooldown
  - [ ] ESC or right-click to cancel

### 6.2 Input Integration
- [ ] Register spell shortcut in input handler
- [ ] When shortcut pressed with magician(s) selected, activate SpellCursor

---

## Phase 7: Actor Actions Integration

### 7.1 Spell Action Button in ActorActions
- [ ] Modify `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorActions.ts`
  - [ ] Add `showSpellIcons()` method similar to `showProductionIcons()`
  - [ ] Show spell icon when magician selected (**always visible from spawn**)
  - [ ] States:
    - [ ] **Not researched**: Gray out icon, tooltip "Requires: Snowstorm research at Infantry Inn"
    - [ ] **Researched, on cooldown**: Show cooldown overlay (sweeping clock), tooltip shows remaining time
    - [ ] **Researched, ready**: Full color, clickable
  - [ ] Left-click: activate SpellCursor for manual targeting
  - [ ] Right-click: toggle autocast on/off
  - [ ] Tooltip shows: name, description, cooldown, damage, AOE radius, shortcut

### 7.2 Autocast Indicator
- [ ] Add autocast visual indicator to spell button
  - [ ] When autocast ON: show small "recycle" / circular arrow icon overlay on button corner
  - [ ] When autocast OFF: no overlay
  - [ ] Icon: `gui` atlas, frame `action_icons/autocast.png` (or similar recycling arrows icon)
  - [ ] Position: bottom-right corner of spell button
  - [ ] Toggle via right-click on spell button

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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-type.ts`
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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-data.ts`
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
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-component.ts`
  - [ ] Similar to `ProductionComponent` but for research
  - [ ] `availableResearch: ResearchType[]` - what can be researched here
  - [ ] `researchQueue: ResearchQueueItem[]` - current research queue
  - [ ] `startResearch(type: ResearchType)` - begin research
  - [ ] `cancelResearch()` - cancel and refund
  - [ ] `update(delta)` - progress research
  - [ ] On complete: register with TechTreeService
  - [ ] `getData()` / `setData()` for save/load

### 8.3 Tech Tree Integration
- [ ] Add research tracking to `TechTreeService`
  - [ ] `registerResearchComplete(playerNumber, researchType)`
  - [ ] `isResearched(playerNumber, researchType): boolean`
  - [ ] `playerResearch: Map<number, Set<ResearchType>>`
- [ ] Persist research state in game save

### 8.4 InfantryInn Update
- [ ] Modify `apps/client/src/app/probable-waffle/game/prefabs/buildings/skaduwee/InfantryInn/infantry-inn.definition.ts`
  - [ ] Add `research` component definition
  ```typescript
  research: {
    availableResearch: [ResearchType.SnowstormSpell]
  }
  ```
- [ ] Add research button to building's ActorActions UI

### 8.5 Research Definitions
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/research/research-definitions.ts`
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
- [ ] Modify `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ActorActions.ts`
  - [ ] Add `showResearchIcons()` method similar to `showProductionIcons()`
  - [ ] Show research icons when building with `ResearchComponent` is selected
  - [ ] States:
    - [ ] **Already researched**: Hide icon OR show grayed out with checkmark
    - [ ] **In progress**: Show progress bar overlay, tooltip shows remaining time
    - [ ] **Available**: Full color, clickable to start research
    - [ ] **Cannot afford**: Grayed out, tooltip shows missing resources
  - [ ] Click: start research via `ResearchComponent.startResearch()`
  - [ ] Right-click: cancel research in progress (with refund)
  - [ ] Research progress bar shown similar to production progress

### 8.7 Research Progress UI
- [ ] Show research progress in building info panel (similar to production queue)
- [ ] Progress bar with research icon and percentage
- [ ] Cancel button to abort research

---

## Phase 9: Magician Definition Update

### 9.1 Add Components
- [ ] Modify `apps/client/src/app/probable-waffle/game/prefabs/characters/skaduwee/skaduwee-magician-female/skaduwee-magician-female.definition.ts`
  - [ ] Add `spell` component
  ```typescript
  spell: {
    availableSpells: [SpellType.Snowstorm]
    // Note: autocast state initialized from spellDefinitions.autocastDefault
    // Note: spell icon shown in ActorActions even before research (grayed out)
  }
  ```
  - [ ] Add `statusEffect` component (so magician can also be affected by status effects)
  ```typescript
  statusEffect: {}
  ```

### 9.2 Add to Other Units
- [ ] Add `statusEffect: {}` component to all combat units (so they can be affected by spells)
- [ ] Update `prefab-definition.ts` with new component types

---

## Phase 10: AI Spell Casting

### 10.1 AI Spell Manager (New)
- [ ] Create `apps/client/src/app/probable-waffle/game/player/ai-controller/ai-behavior/spell-manager.ts`
  - [ ] `shouldCastSpell(caster, spellType): boolean`
    - [ ] Check: spell researched, not on cooldown, enemies in range
  - [ ] `findBestSpellTarget(caster, spellType): Vector2 | null`
    - [ ] Find cluster of enemies for AOE spells
    - [ ] Prioritize groups over single targets
  - [ ] `castSpell(caster, spellType, target)`
    - [ ] Queue `CastSpell` order

### 10.2 Behavior Tree Integration
- [ ] Add spell casting consideration to combat AI
- [ ] Location: `apps/client/src/app/probable-waffle/game/entity/ai/` behavior trees
- [ ] Priority: cast AOE spell if multiple enemies clustered > regular attack

### 10.3 AI Research Manager
- [ ] Add spell research to `tech-progress-manager.ts`
- [ ] AI should research spells when:
  - [ ] Has magician units
  - [ ] Has resources
  - [ ] Research building available

---

## Phase 11: Save/Load Support

### 11.1 Component Serialization
- [ ] `StatusEffectComponent.getData()` returns active effects array with remaining times
- [ ] `StatusEffectComponent.setData()` restores effects (recalculate visuals)
- [ ] `SpellComponent.getData()` returns cooldown state + autocast state per spell
- [ ] `SpellComponent.setData()` restores cooldowns + autocast state
- [ ] `ResearchComponent.getData()` returns research queue and progress
- [ ] `ResearchComponent.setData()` restores research state

### 11.2 AOE Zone Serialization
- [ ] `AoeZoneManager.getData()` returns all active zones with remaining times
- [ ] `AoeZoneManager.setData()` restores zones and recreates visuals

### 11.3 Tech Tree State
- [ ] Add research state to game save payload
- [ ] Restore on load via `TechTreeService`

### 11.4 Spawned Prefabs
- [ ] Totems and other spell-spawned prefabs saved as normal actors
- [ ] Include `spawnedBySpell` flag and `remainingLifetime` if applicable

---

## Phase 12: Polish

### 12.1 Sound Effects
- [ ] Cast sound (ice forming)
- [ ] Projectile travel sound (wind/ice)
- [ ] Impact sound (ice crack/shatter)
- [ ] Stun applied sound (crystallize)

### 12.2 Architecture Supports
- [x] `StatusEffectType`: Stunned, Frozen, Slowed, Burning, Poisoned, Regenerating
- [x] `SpellType`: Snowstorm, Firestorm, FrostNova, HealingLight, HealingRain, HealingTotem
- [x] `ResearchType`: All spell research + ready for armor/damage upgrades
- [x] Persistent AOE zones (fire, healing rain)
- [x] Prefab spawning (totems, turrets)
- [x] Movement speed modifiers (slow effects)
- [x] Heal over time effects
- [ ] `StatusEffectVisualComponent.attachParticleEffect()` placeholder for ice crystals

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
