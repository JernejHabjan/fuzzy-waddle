# Issue #394: Tooltip Cards Enhancement

## Overview
Add two new sections to actor tooltips:
1. **Role Description**: AI-written bullet points in each actor definition explaining what the actor is good for and its intended role
2. **Stats Display**: Automated extraction and display of important RTS stats (build time, combat stats, production capabilities, etc.) using existing `ActorDetails.getActorAttributeIconsAndTexts()` logic

## Files to Modify

### 1. `tooltip-info.ts`
- [ ] `description` field already exists (used for flavor text)
- [ ] `definition` field already exists (used for stats extraction)
- [ ] No changes needed

### 2. `actor-action-setup.ts`
- [ ] No changes needed (already uses `TooltipInfo`)

### 3. Update all actor definitions
**Files**: All `*.definition.ts` files in `apps/client/src/app/probable-waffle/game/prefabs/`

- [ ] Add `tooltipDescription?: string[]` field to `InfoDefinition` type in `info-definition.ts`
- [ ] For each actor definition, add `tooltipDescription` array to `components.info`:
  - [ ] Buildings: What they produce, their role in economy/military
  - [ ] Units: Combat role, special abilities, intended use
  - [ ] Resources: What they provide
- [ ] Keep to 2-4 bullet points per actor
- [ ] Use player-friendly language
- [ ] Focus on gameplay purpose

**Example additions:**
```typescript
// sandhold.definition.ts
info: {
  name: "Sandhold",
  description: "A monument of stone and shadow...",
  tooltipDescription: [
    "Main base of operations",
    "Trains workers for economy",
    "Collects resources"
  ],
  // ...existing fields
}

// tivara-maceman-male.definition.ts
info: {
  name: "Anubian Mauler",
  description: "Cursed warrior in ritual armor...",
  tooltipDescription: [
    "Good at close-range combat",
    "Highly durable frontline unit"
  ],
  // ...existing fields
}
```

### 4. `ActorDefinitionTooltip.ts`

#### Add Role Description Section
- [ ] Add private property: `roleDescriptionText: Phaser.GameObjects.Text`
- [ ] Add role description text object in constructor (after description, before stats)
  - [ ] Style: `fontFamily: "disposabledroid", fontSize: "18px", color: "#ffcc00"`
  - [ ] Origin: `(0.5, 0)`
  - [ ] Word wrap: `300`
  - [ ] Centered at x: `-169.69...`
- [ ] Update `setup()` method:
  - [ ] After setting description, check if `tooltipInfo.definition?.components?.info?.tooltipDescription` exists
  - [ ] Format bullet points with "• " prefix (use Unicode bullet: `\u2022`)
  - [ ] Set text: `roleDescriptionText.setText(tooltipDescription.join('\n'))`
  - [ ] Adjust `yOffset` to account for role description height
  - [ ] Hide if no tooltip description provided

#### Add Stats Section (Already Partially Exists)
- [ ] The `attributesContainer` section already exists and shows some stats
- [ ] Verify it's using `ActorDetails.getActorAttributeIconsAndTexts(definition, undefined)` 
- [ ] Extend to show all important RTS stats:
  - [ ] **Combat Stats** (for units with attacks):
    - [ ] Movement speed (boot icon) - from `translatable.tileMoveDuration`
    - [ ] Attack speed (speed_attack icon) - from `attack.attacks[0].cooldown`
    - [ ] Damage (sword/element icon) - from `attack.attacks[0].damage`
    - [ ] Range (bow icon) - from `attack.attacks[0].range`
    - [ ] Health (heart icon) - from `health.maxHealth`
    - [ ] Armor (shield icon) - from `health.maxArmour`
  - [ ] **Production Stats** (for units/buildings):
    - [ ] Production time (clock/hourglass icon) - from `productionCost.productionTime` (convert to seconds)
    - [ ] Resource costs (resource icons) - already shown in resources section
  - [ ] **Building Stats**:
    - [ ] Vision range (eye icon) - from `vision.range`
    - [ ] Health (heart icon) - from `health.maxHealth`
    - [ ] Armor (shield icon) - from `health.maxArmour`
    - [ ] Production queue size - from `production.capacityPerQueue`
    - [ ] Housing capacity - from `housing.housingCapacity`
    - [ ] Container capacity - from `container.capacity`
  - [ ] **Special Stats**:
    - [ ] Housing cost (house icon) - from `housingCost.housingNeeded`
    - [ ] Gather rate - from `gatherer` component
- [ ] Position stats section after role description
- [ ] Keep existing dynamic positioning logic
- [ ] Add icon for production time (use appropriate texture from GUI assets)

### 5. `info-definition.ts`
**Location**: `apps/client/src/app/probable-waffle/game/entity/components/info-definition.ts`

- [ ] Add `tooltipDescription?: string[]` field to `InfoDefinition` type
- [ ] This will make the field available in all actor definitions

### 6. Update all tooltip usage locations
**Files to search**: `ActorActions.ts`, any files creating `TooltipInfo` objects

- [ ] Verify tooltips are passing `definition` to `TooltipInfo` (already done)
- [ ] No code changes needed - tooltip descriptions come from definitions
- [ ] Stats extraction already uses `ActorDetails.getActorAttributeIconsAndTexts()`

## Implementation Order

1. Add `tooltipDescription` field to `InfoDefinition` type in `info-definition.ts`
2. Update `ActorDefinitionTooltip.ts` to display role description and verify stats section
3. Add `tooltipDescription` arrays to all actor definitions (AI-generated content)
4. Verify tooltips display both sections correctly

## Example Output

### Sandhold Tooltip:
**Role Description:**
- Main base of operations
- Trains workers for economy
- Collects resources

**Stats:**
- ⏱️ 60s build time
- ❤️ 500 HP
- 🛡️ 300 Armor
- 👁️ 20 Vision
- 🏠 +8 Housing
- 📦 Garrison: 2

### Anubian Mauler Tooltip:
**Role Description:**
- Good at close-range combat
- Highly durable frontline unit

**Stats:**
- ⏱️ 5s train time
- ⚔️ 8 Damage
- ⚡ 0.7 atk/s
- 🏹 2 Range
- ❤️ 150 HP
- 👢 2.0 t/s
- 🏠 1 Housing

### Infantry Inn Tooltip:
**Role Description:**
- Trains infantry units
- Produces ranged and melee fighters

**Stats:**
- ⏱️ 20s build time
- ❤️ 400 HP
- 👁️ 15 Vision
- 📋 Queue: 5

### Tivara Worker Tooltip:
**Role Description:**
- Gathers resources
- Constructs buildings

**Stats:**
- ⏱️ 3s train time
- ❤️ 50 HP
- 👢 2.0 t/s
- 🏠 1 Housing

## Notes
- **Role Descriptions**: AI LLM should write these for each actor definition
- Keep descriptions concise (2-4 bullet points per actor)
- Focus on role and purpose, not raw stats (stats are shown in stats section)
- Use player-friendly language
- Use consistent terminology across all tooltips
- **Stats Section**: Automatically extracted using `ActorDetails.getActorAttributeIconsAndTexts()`
- Role description color: Use yellow/gold (`#ffcc00`) to distinguish from flavor description text
- Ensure proper scaling and positioning within tooltip container
- Tooltip should show: Icon → Name → Flavor Description → Role Description → Stats → Resources → Requirements
