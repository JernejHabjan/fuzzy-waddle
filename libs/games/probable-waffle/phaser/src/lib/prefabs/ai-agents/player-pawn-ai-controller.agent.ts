import Phaser from "phaser";
import { State } from "mistreevous";
import type {
  IPlayerPawnControllerAgent,
  PlayerPawnCooldownType,
  PlayerPawnRangeType
} from "./player-pawn-ai-controller.agent.interface";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnAgentStatus } from "./pawn-agent-status";
import { PawnAgentMovement } from "./pawn-agent-movement";
import { PawnAgentOrders } from "./pawn-agent-orders";
import { PawnAgentCombat } from "./pawn-agent-combat";
import { PawnAgentResources } from "./pawn-agent-resources";
import { PawnAgentConstruction } from "./pawn-agent-construction";
import { PawnAgentTending } from "./pawn-agent-tending";
import { PawnAgentBoarding } from "./pawn-agent-boarding";
import { PawnAgentSpells } from "./pawn-agent-spells";

/** Behavior-tree entry point. Focused actor-local owners share the original blackboard and read components lazily. */
export class PlayerPawnAiControllerAgent implements IPlayerPawnControllerAgent {
  private readonly status: PawnAgentStatus;
  private readonly movement: PawnAgentMovement;
  private readonly orders: PawnAgentOrders;
  private readonly combat: PawnAgentCombat;
  private readonly resources: PawnAgentResources;
  private readonly construction: PawnAgentConstruction;
  private readonly tending: PawnAgentTending;
  private readonly boarding: PawnAgentBoarding;
  private readonly spells: PawnAgentSpells;

  constructor(gameObject: Phaser.GameObjects.GameObject, blackboard: PawnAiBlackboard) {
    this.status = new PawnAgentStatus(gameObject, blackboard);
    this.orders = new PawnAgentOrders(gameObject, blackboard);
    this.combat = new PawnAgentCombat(gameObject, blackboard, this);
    this.resources = new PawnAgentResources(gameObject, blackboard, this);
    this.construction = new PawnAgentConstruction(gameObject, blackboard, this);
    this.tending = new PawnAgentTending(gameObject, blackboard);
    this.boarding = new PawnAgentBoarding(gameObject, blackboard, this);
    this.spells = new PawnAgentSpells(gameObject);
    this.movement = new PawnAgentMovement(
      gameObject, blackboard, this, () => this.combat.getClosestAttackableVisibleEnemy()
    );
  }

  [propertyName: string]: unknown;

  OrderExistsInQueue() {
    return this.orders.OrderExistsInQueue();
  }

  AssignNextOrderFromQueue() {
    return this.orders.AssignNextOrderFromQueue();
  }

  PlayerOrderIs(orderType: string) {
    return this.orders.PlayerOrderIs(orderType);
  }

  HasAttackComponent() {
    return this.combat.HasAttackComponent();
  }

  TargetIsAlive() {
    return this.status.TargetIsAlive();
  }

  SelfIsAlive() {
    return this.status.SelfIsAlive();
  }

  IsStunned() {
    return this.status.IsStunned();
  }

  IsSlowed() {
    return this.status.IsSlowed();
  }

  InRange(type: PlayerPawnRangeType): Promise<State> {
    return this.movement.InRange(type);
  }

  MoveToTarget(type: PlayerPawnRangeType): Promise<State> {
    return this.movement.MoveToTarget(type);
  }

  MoveToTargetOrLocation(type: PlayerPawnRangeType): Promise<State> {
    return this.movement.MoveToTargetOrLocation(type);
  }

  MoveToLocation() {
    return this.movement.MoveToLocation();
  }

  Stop = (fromNode: string) => this.orders.Stop(fromNode);

  reportInterruptedOrdersOnShutdown(): void {
    return this.orders.reportInterruptedOrdersOnShutdown();
  }

  TargetHasTendableComponent(): boolean {
    return this.tending.TargetHasTendableComponent();
  }

  GrowthReady(): boolean {
    return this.tending.GrowthReady();
  }

  GrowthPercentBelow(threshold: number): boolean {
    return this.tending.GrowthPercentBelow(threshold);
  }

  AssignSelfAsTender(): State {
    return this.tending.AssignSelfAsTender();
  }

  UnassignSelfAsTender(): State {
    return this.tending.UnassignSelfAsTender();
  }

  MoveToRandomSpotOnTarget(): Promise<State> {
    return this.tending.MoveToRandomSpotOnTarget();
  }

  PlaySeedingAnimation(): State {
    return this.tending.PlaySeedingAnimation();
  }

  PlayTendingAnimation(): State {
    return this.tending.PlayTendingAnimation();
  }

  AutoAssignTendOrderIfTendable(): State {
    return this.tending.AutoAssignTendOrderIfTendable();
  }

  Attack() {
    return this.combat.Attack();
  }

  AnyEnemyVisible() {
    return this.combat.AnyEnemyVisible();
  }

  AnyAttackableEnemyVisible() {
    return this.combat.AnyAttackableEnemyVisible();
  }

  AssignAttackableEnemyToCurrentOrder(): State {
    return this.combat.AssignAttackableEnemyToCurrentOrder();
  }

  CanAttackCurrentTarget() {
    return this.combat.CanAttackCurrentTarget();
  }

  AcquireNewResourceSource() {
    return this.resources.AcquireNewResourceSource();
  }

  AcquireNewResourceDrain(): Promise<State> {
    return this.resources.AcquireNewResourceDrain();
  }

  GatherResource(): Promise<State> {
    return this.resources.GatherResource();
  }

  DropOffResources() {
    return this.resources.DropOffResources();
  }

  ContinueGathering() {
    return this.resources.ContinueGathering();
  }

  LeaveConstructionSiteOrCurrentContainer() {
    return this.construction.LeaveConstructionSiteOrCurrentContainer();
  }

  AssignNextBuildOrder(): Promise<State> {
    return this.construction.AssignNextBuildOrder();
  }

  ConstructBuilding() {
    return this.construction.ConstructBuilding();
  }

  CanAssignBuilder(): boolean {
    return this.construction.CanAssignBuilder();
  }

  HasBuilderComponent(): boolean {
    return this.construction.HasBuilderComponent();
  }

  Attacked() {
    return this.combat.Attacked();
  }

  Heal(): State {
    return this.combat.Heal();
  }

  CanHeal(): boolean {
    return this.combat.CanHeal();
  }

  HasHealerComponent(): boolean {
    return this.combat.HasHealerComponent();
  }

  AssignEnemy(source: string): State {
    return this.combat.AssignEnemy(source);
  }

  AssignMoveRandomlyInRange(range: number) {
    return this.movement.AssignMoveRandomlyInRange(range);
  }

  CooldownReady(type: PlayerPawnCooldownType) {
    return this.status.CooldownReady(type);
  }

  TargetExists() {
    return this.status.TargetExists();
  }

  TargetOrLocationExists() {
    return this.status.TargetOrLocationExists();
  }

  TargetHasResources() {
    return this.resources.TargetHasResources();
  }

  AnyHighValueResourceVisible() {
    return this.resources.AnyHighValueResourceVisible();
  }

  GatherHighValueResource() {
    return this.resources.GatherHighValueResource();
  }

  NoEnemiesVisible() {
    return this.combat.NoEnemiesVisible();
  }

  HasHarvestComponent() {
    return this.resources.HasHarvestComponent();
  }

  GatherCapacityFull(): boolean {
    return this.resources.GatherCapacityFull();
  }

  AssignDropOffResourcesOrder(): Promise<State> {
    return this.resources.AssignDropOffResourcesOrder();
  }

  AssignGatherResourcesOrder(): Promise<State> {
    return this.resources.AssignGatherResourcesOrder();
  }

  ConstructionSiteFinished(): boolean {
    return this.construction.ConstructionSiteFinished();
  }

  TargetHealthFull(): boolean {
    return this.construction.TargetHealthFull();
  }

  RepairBuilding(): State {
    return this.construction.RepairBuilding();
  }

  CanAssignRepairer(): boolean {
    return this.construction.CanAssignRepairer();
  }

  Succeed() {
    return State.SUCCEEDED;
  }

  Fail() {
    return State.FAILED;
  }

  Log(message: string): State {
    console.log(message);
    return State.SUCCEEDED;
  }

  HasContainableComponent(): boolean {
    return this.boarding.HasContainableComponent();
  }

  IsWaterUnit(): boolean {
    return this.boarding.IsWaterUnit();
  }

  IsWaterContainerTarget(): boolean {
    return this.boarding.IsWaterContainerTarget();
  }

  IsAlreadyInContainer(): boolean {
    return this.boarding.IsAlreadyInContainer();
  }

  CanBoardContainerNow(): boolean {
    return this.boarding.CanBoardContainerNow();
  }

  BoardContainer(): State {
    return this.boarding.BoardContainer();
  }

  MoveAdjacentToContainer(): Promise<State> {
    return this.boarding.MoveAdjacentToContainer();
  }

  MoveToNearestShoreForContainer(): Promise<State> {
    return this.boarding.MoveToNearestShoreForContainer();
  }

  HasContainerComponent(): boolean {
    return this.boarding.HasContainerComponent();
  }

  HasPendingBoarders(): boolean {
    return this.boarding.HasPendingBoarders();
  }

  MoveToShoreForBoarding(): Promise<State> {
    return this.boarding.MoveToShoreForBoarding();
  }

  LoadPendingBoarders(): State {
    return this.boarding.LoadPendingBoarders();
  }

  HasSpellComponent(): boolean {
    return this.spells.HasSpellComponent();
  }

  HasAutocastSpellReady(): boolean {
    return this.spells.HasAutocastSpellReady();
  }

  CastAutocastSpell(): State {
    return this.spells.CastAutocastSpell();
  }
}
