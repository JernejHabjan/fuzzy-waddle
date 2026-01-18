# Issue #434: Save/Load Camera Position, Selection Groups, and AI Behavior Trees

## Overview
Extend save/load system to persist:
- Camera position per player
- Selection groups (Ctrl+1-9)
- AI behavior tree state for AI players
- Pawn AI behavior tree state

## 1. Data Structure Updates

### 1.1 Update ProbableWafflePlayerControllerData
- [ ] Add `cameraPosition` field to store camera scroll position
  - Add `cameraScrollX?: number`
  - Add `cameraScrollY?: number`
  - Add `cameraZoom?: number`
- [ ] Add `selectionGroups` field to store selection groups
  - Add `selectionGroups?: SelectionGroupData[]`

### 1.2 Create SelectionGroupData Interface
- [ ] Create interface in `libs/api-interfaces/src/lib/game-instance/probable-waffle/component-data.ts`
  - `groupKey: number`
  - `actorIds: string[]`
  - `timestamp: number`

### 1.3 Update ProbableWafflePlayerStateData
- [ ] Add `aiBehaviorTreeState` field for AI players
  - Add `aiBehaviorTreeState?: AIBehaviorTreeStateData`

### 1.4 Create AIBehaviorTreeStateData Interface
- [ ] Create interface in `libs/api-interfaces/src/lib/game-instance/probable-waffle/component-data.ts`
  - `blackboard: PlayerAiBlackboardData`
  - `telemetry?: Record<string, any>`

### 1.5 Create PlayerAiBlackboardData Interface
- [ ] Create interface in `libs/api-interfaces/src/lib/game-instance/probable-waffle/component-data.ts`
  - Include serializable state from PlayerAiBlackboard
  - `currentStrategy?: string`
  - `baseSize?: number`
  - `mapFullyExplored?: boolean`
  - `wantsToSurrender?: boolean`
  - `surrenderOfferedAt?: number`
  - `surrenderRejected?: boolean`
  - `activeTechUpgrades?: number`
  - `lastTechUpgradeAt?: number`
  - `economy?: { resources: Record<ResourceType, number>; reserved: Record<ResourceType, number> }`
  - `production?: { supply: { used: number; max: number; pendingFromQueued: number } }`
  - `strategy?: { current: string; baseSize: number; modeLockedUntil: number }`
  - `cooldowns?: Record<string, number>`
  - Other serializable primitives from blackboard slices

### 1.6 Update BackboardComponentData (Pawn AI)
- [ ] Verify `blackboard: Record<string, any>` already exists
- [ ] No changes needed - already in ActorDefinition

## 2. Save System Implementation

### 2.1 Update SaveGame Class
- [ ] Modify `apps/client/src/app/probable-waffle/game/data/save-game.ts`
- [ ] Add camera save functionality
  - Get camera position from `CameraMovementHandler`
  - Store in player controller data
- [ ] Add selection groups save functionality
  - Get selection groups from `SelectionGroupsComponent`
  - Convert actor references to IDs
  - Store in player controller data
- [ ] Add AI behavior tree save functionality
  - Get AI state from `PlayerAiController`
  - Store in player state data
- [ ] Add pawn AI save functionality (already handled via ActorDefinition)
  - Verify `PawnAiController.getData()` is called during actor save

### 2.2 Update SceneActorCreator.saveAllKnownActorsToGameState()
- [ ] Verify pawn AI blackboard is saved
- [ ] Ensure `BackboardComponentData` is populated from `PawnAiController.getData()`

### 2.3 Save Player-Specific Data
- [ ] Create method to save current player's camera position
  - Access camera from `GameProbableWaffleScene`
  - Get `scrollX`, `scrollY`, `zoom` from main camera
- [ ] Create method to save current player's selection groups
  - Access `SelectionGroupsComponent` from player controller
  - Convert groups to serializable format
- [ ] Create method to save AI player's behavior tree state
  - Access `PlayerAiController` from AI players
  - Get blackboard data
  - Get telemetry snapshot if available

## 3. Load System Implementation

### 3.1 Update LoadGame Class
- [ ] Modify `apps/client/src/app/probable-waffle/game/data/load-game.ts`
- [ ] Add camera restore functionality
  - Restore camera position from player controller data
  - Set camera scroll and zoom
- [ ] Add selection groups restore functionality
  - Restore selection groups from player controller data
  - Convert actor IDs to references
  - Populate `SelectionGroupsComponent`
- [ ] Add AI behavior tree restore functionality
  - Restore AI state from player state data
  - Populate `PlayerAiController` blackboard
- [ ] Add pawn AI restore functionality (already handled via ActorDefinition)
  - Verify `PawnAiController.setData()` is called during actor load

### 3.2 Update Actor Loading
- [ ] Verify `LoadGame.loadActorsFromSaveGame()` calls `PawnAiController.setData()`
- [ ] Ensure pawn AI blackboard is restored from ActorDefinition

### 3.3 Restore Player-Specific Data
- [ ] Create method to restore current player's camera position
  - Wait for scene initialization
  - Set camera position after scene is ready
- [ ] Create method to restore current player's selection groups
  - Wait for actors to be loaded
  - Map actor IDs to game objects
  - Populate selection groups in `SelectionGroupsComponent`
- [ ] Create method to restore AI player's behavior tree state
  - Set blackboard data in `PlayerAiController`
  - Restore telemetry if available

## 4. Component Updates

### 4.1 Update SelectionGroupsComponent
- [ ] Add `getGroups()` method
  - Return serializable groups data
  - Convert actor references to IDs
- [ ] Add `setGroups()` method
  - Accept serializable groups data
  - Convert IDs to actor references
  - Validate actors exist
  - Update internal groups map
- [ ] Add `clearGroups()` method for cleanup

### 4.2 Update CameraMovementHandler
- [ ] Add `getCameraState()` method
  - Return current camera position and zoom
  - Return `{ scrollX, scrollY, zoom }`
- [ ] Add `setCameraState()` method
  - Accept camera state data
  - Set camera position and zoom
  - Validate bounds

### 4.3 Update PlayerAiController
- [ ] Add `getSaveState()` method
  - Return blackboard data
  - Return telemetry snapshot
- [ ] Add `setSaveState()` method
  - Restore blackboard data
  - Restore telemetry if provided
- [ ] Add validation for state restoration

### 4.4 Implement PlayerAiBlackboard getData/setData
- [ ] Implement `getData()` method (currently throws error)
  - Serialize all primitive fields and slices
  - Exclude non-serializable data (GameObject references, functions)
  - Return `PlayerAiBlackboardData` compatible object
  - Include: currentStrategy, baseSize, mapFullyExplored, wantsToSurrender, etc.
  - Include: economy.resources, economy.reserved
  - Include: production.supply
  - Include: strategy slice (current, baseSize, modeLockedUntil)
  - Include: cooldowns
- [ ] Implement `setData()` method (currently throws error)
  - Accept partial blackboard data
  - Accept scene parameter to rebuild GameObject references
  - Restore primitive fields
  - Restore economy state (resources, reserved)
  - Restore production state (supply)
  - Restore strategy state
  - Restore cooldowns
  - Leave GameObject arrays empty (will be repopulated by world state update)
  - Validate data structure

### 4.5 Update PawnAiController
- [ ] Verify `getData()` exports blackboard
- [ ] Verify `setData()` imports blackboard
- [ ] Ensure behavior tree state is maintained

## 5. Integration Points

### 5.1 GameProbableWaffleScene Integration
- [ ] Add camera save/load hooks
- [ ] Add selection groups save/load hooks
- [ ] Add AI behavior tree save/load hooks
- [ ] Coordinate timing of restoration

### 5.2 Player Controller Integration
- [ ] Update human player controller to save/load camera and groups
- [ ] Update AI player controller to save/load behavior tree state
- [ ] Ensure current player data is saved correctly

### 5.3 Scene Initialization Order
- [ ] Ensure actors load before selection groups restore
- [ ] Ensure camera restores after scene is ready
- [ ] Ensure AI state restores before behavior tree resumes

## 6. Event Handling

### 6.1 Save Events
- [ ] Hook into existing "save-game" event
- [ ] Collect all player-specific data
- [ ] Serialize camera, groups, and AI state
- [ ] Store in game instance data

### 6.2 Load Events
- [ ] Hook into existing load game flow
- [ ] Deserialize player-specific data
- [ ] Restore camera, groups, and AI state
- [ ] Emit completion events

### 6.3 CrossSceneCommunicationService
- [ ] Use for selection group events during load
- [ ] Ensure group-selected events fire correctly
- [ ] Maintain consistency across scenes

## 7. Data Validation

### 7.1 Camera Position Validation
- [ ] Validate camera bounds on load
- [ ] Handle missing camera data gracefully
- [ ] Default to spawn point if invalid

### 7.2 Selection Groups Validation
- [ ] Validate actor IDs exist
- [ ] Remove invalid actors from groups
- [ ] Handle empty groups
- [ ] Update group counts

### 7.3 AI State Validation
- [ ] Validate blackboard data structure
- [ ] Handle missing or corrupted AI state
- [ ] Reset behavior tree if state is invalid
- [ ] Verify AI type matches saved data

## 8. Edge Cases

### 8.1 Construction Order Resumption
- [ ] Verify construction sites restore correctly
- [ ] Ensure builder assignments persist
- [ ] Restore construction progress
- [ ] Resume build orders

### 8.2 Multiple Players
- [ ] Save camera position per player
- [ ] Save selection groups per player
- [ ] Handle player-specific data correctly
- [ ] Restore only current player's camera and groups

### 8.3 AI vs Human Players
- [ ] Save AI state only for AI players
- [ ] Save camera/groups only for human players
- [ ] Handle mixed player types
- [ ] Validate player type on load

### 8.4 Killed/Destroyed Actors
- [ ] Remove destroyed actors from selection groups
- [ ] Update groups on load
- [ ] Handle missing actors gracefully

## 9. File Changes Summary

### Files to Modify
- [ ] `libs/api-interfaces/src/lib/game-instance/probable-waffle/component-data.ts`
- [ ] `libs/api-interfaces/src/lib/game-instance/probable-waffle/player.ts`
- [ ] `apps/client/src/app/probable-waffle/game/data/save-game.ts`
- [ ] `apps/client/src/app/probable-waffle/game/data/load-game.ts`
- [ ] `apps/client/src/app/probable-waffle/game/player/human-controller/selection-groups.component.ts`
- [ ] `apps/client/src/app/probable-waffle/game/player/human-controller/cameraMovementHandler.ts`
- [ ] `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-controller.ts`
- [ ] `apps/client/src/app/probable-waffle/game/player/ai-controller/player-ai-blackboard.ts`
- [ ] `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/pawn-ai-controller.ts`
- [ ] `apps/client/src/app/probable-waffle/game/world/scenes/GameProbableWaffleScene.ts`

### Files to Verify
- [ ] `apps/client/src/app/probable-waffle/game/world/services/scene-actor-creator.ts`
- [ ] `apps/client/src/app/probable-waffle/communicators/game-instance-client.service.ts`

## 10. Implementation Order

1. Data structure updates (1.1 - 1.5)
2. Component methods (4.1 - 4.4)
3. Save system (2.1 - 2.3)
4. Load system (3.1 - 3.3)
5. Integration (5.1 - 5.3)
6. Validation (7.1 - 7.3)
7. Edge cases (8.1 - 8.4)
8. Testing and verification

## 11. Known Issues to Address

### Construction Order Issue
- [ ] Investigate construction site restoration
- [ ] Verify builder component state saves
- [ ] Test placing building, saving, loading
- [ ] Ensure construction resumes correctly
- [ ] Verify rally points restore

## 12. Completion Criteria

- [ ] Camera position saves and loads correctly for current player
- [ ] Selection groups (Ctrl+1-9) save and load with valid actors
- [ ] AI player behavior tree state persists across save/load
- [ ] Pawn AI behavior tree state persists across save/load
- [ ] Construction orders resume after load
- [ ] No errors during save/load cycle
- [ ] Destroyed actors removed from groups on load
- [ ] Multiple players' data saves independently
- [ ] Camera bounds validated on load
- [ ] AI state validates on load
