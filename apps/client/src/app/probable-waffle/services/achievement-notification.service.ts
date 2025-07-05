import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject } from "@angular/core";
import { AchievementNotificationComponent } from "../components/achievement-notification/achievement-notification.component";

export interface AchievementNotificationOptions {
  title: string;
  description: string;
  spriteId: string;
  autoHide?: boolean;
  autoHideDuration?: number;
}

@Injectable({
  providedIn: "root"
})
export class AchievementNotificationService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  private activeNotifications: ComponentRef<AchievementNotificationComponent>[] = [];
  private readonly MAX_NOTIFICATIONS = 3;

  /**
   * Shows an achievement notification overlay
   */
  showAchievementNotification(options: AchievementNotificationOptions): void {
    // Manage notification queue - remove oldest if at max
    if (this.activeNotifications.length >= this.MAX_NOTIFICATIONS) {
      const oldest = this.activeNotifications.shift();
      this.removeNotification(oldest);
    }

    // Create component dynamically
    const notificationComponentRef = this.createNotificationComponent(options);

    // Add to tracking array
    this.activeNotifications.push(notificationComponentRef);

    // Set up auto-removal when the animation completes
    if (options.autoHide !== false) {
      const duration = options.autoHideDuration || 5000;
      setTimeout(() => {
        this.removeNotification(notificationComponentRef);
      }, duration);
    }
  }

  /**
   * Creates and attaches the notification component to the DOM
   */
  private createNotificationComponent(
    options: AchievementNotificationOptions
  ): ComponentRef<AchievementNotificationComponent> {
    // Create the component
    const componentRef = createComponent(AchievementNotificationComponent, {
      environmentInjector: this.injector
    });

    // Set inputs
    componentRef.instance.title = options.title;
    componentRef.instance.description = options.description;
    componentRef.instance.spriteId = options.spriteId;
    componentRef.instance.autoHide = options.autoHide !== false;
    if (options.autoHideDuration) {
      componentRef.instance.autoHideDuration = options.autoHideDuration;
    }

    // Append to the DOM
    document.body.appendChild(componentRef.location.nativeElement);

    // Attach to change detection
    this.appRef.attachView(componentRef.hostView);

    return componentRef;
  }

  /**
   * Removes a notification component
   */
  private removeNotification(componentRef?: ComponentRef<AchievementNotificationComponent>): void {
    if (!componentRef) return;

    // Remove from our tracking array
    const index = this.activeNotifications.indexOf(componentRef);
    if (index > -1) {
      this.activeNotifications.splice(index, 1);
    }

    // Trigger the hide animation
    componentRef.instance.hide();

    // Clean up after animation finishes
    setTimeout(() => {
      // Detach from change detection
      this.appRef.detachView(componentRef.hostView);

      // Remove from DOM
      componentRef.location.nativeElement.remove();

      // Destroy the component
      componentRef.destroy();
    }, 350); // A bit longer than animation duration to ensure completion
  }

  /**
   * Clears all active notifications
   */
  clearAll(): void {
    [...this.activeNotifications].forEach((notification) => {
      this.removeNotification(notification);
    });
    this.activeNotifications = [];
  }
}
