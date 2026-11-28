import { ChangeDetectionStrategy, Component, computed, input, output, signal } from "@angular/core";
import { getLevelTutorial } from "./level-tutorial";
import type { TutorialShowcaseSelection } from "@fuzzy-waddle/trump-defense-gameplay";

/** Presents level mechanics before deployment and reports showcase changes to the scene adapter. */
@Component({
  selector: "td-level-tutorial",
  templateUrl: "./level-tutorial.component.html",
  styleUrl: "./level-tutorial.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelTutorialComponent {
  /** Campaign level determines the mechanics and the number of briefing cards. */
  readonly level = input.required<number>();
  /** Active model is passed to the Three.js showcase without coupling this view to the renderer. */
  protected readonly showcaseChange = output<TutorialShowcaseSelection>();
  /** The final card and skip control both hand deployment back to the game owner. */
  protected readonly start = output<void>();
  /** Returning to campaign selection abandons this loaded scene. */
  protected readonly exit = output<void>();
  protected readonly slideIndex = signal(0);
  /** Preview state belongs to the current card and resets whenever navigation changes it. */
  protected readonly showingUpgrade = signal(false);
  protected readonly slides = computed(() => getLevelTutorial(this.level()));
  protected readonly slide = computed(() => this.slides()[this.slideIndex()]!);
  protected readonly isFirst = computed(() => this.slideIndex() === 0);
  protected readonly isLast = computed(() => this.slideIndex() === this.slides().length - 1);

  /** Switches the showcase between authored base and upgrade assets without touching gameplay. */
  protected toggleUpgrade(): void {
    const upgraded = this.slide().upgradedShowcase;
    if (!upgraded) return;
    this.showingUpgrade.update((showing) => !showing);
    this.showcaseChange.emit(this.showingUpgrade() ? upgraded : this.slide().showcase);
  }

  /** Emits the new visual only after changing cards so text and model stay in sync. */
  protected move(direction: -1 | 1): void {
    if (this.isLast() && direction === 1) {
      this.start.emit();
      return;
    }
    const index = Math.max(0, Math.min(this.slides().length - 1, this.slideIndex() + direction));
    this.showingUpgrade.set(false);
    this.slideIndex.set(index);
    this.showcaseChange.emit(this.slide().showcase);
  }
}
