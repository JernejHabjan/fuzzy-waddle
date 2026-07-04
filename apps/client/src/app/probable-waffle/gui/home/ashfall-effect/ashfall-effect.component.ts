import { ChangeDetectionStrategy, Component, ElementRef, type AfterViewInit, type OnDestroy, viewChild } from "@angular/core";

type DriftParticle = {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
};

type GemPulse = {
  xFactor: number;
  yFactor: number;
  radius: number;
  glowColor: string;
  fillColor: string;
  phase: number;
};

@Component({
  selector: "probable-waffle-ashfall-effect",
  templateUrl: "./ashfall-effect.component.html",
  styleUrls: ["./ashfall-effect.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AshfallEffectComponent implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private resizeListener?: () => void;
  private ashParticles: DriftParticle[] = [];
  private emberParticles: DriftParticle[] = [];
  private readonly gems: GemPulse[] = [
    { xFactor: 0.34, yFactor: 0.86, radius: 18, glowColor: "78, 199, 173", fillColor: "#4ec7ad", phase: 0 },
    { xFactor: 0.5, yFactor: 0.82, radius: 20, glowColor: "240, 196, 107", fillColor: "#f0c46b", phase: 1.5 },
    { xFactor: 0.66, yFactor: 0.86, radius: 18, glowColor: "217, 106, 63", fillColor: "#d96a3f", phase: 3 }
  ];
  private frame = 0;

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef()?.nativeElement;
    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.resizeCanvas();
    this.seedParticles();

    this.resizeListener = () => {
      this.resizeCanvas();
      this.seedParticles();
    };
    window.addEventListener("resize", this.resizeListener);

    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
  }

  private resizeCanvas(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private seedParticles(): void {
    if (!this.canvas) {
      return;
    }

    const ashCount = Math.max(90, Math.floor((this.canvas.width * this.canvas.height) / 18000));
    const emberCount = Math.max(18, Math.floor((this.canvas.width * this.canvas.height) / 70000));

    this.ashParticles = Array.from({ length: ashCount }, () => this.createAshParticle(true));
    this.emberParticles = Array.from({ length: emberCount }, () => this.createEmberParticle(true));
  }

  private createAshParticle(initial = false): DriftParticle {
    if (!this.canvas) {
      return { x: 0, y: 0, radius: 0, speedX: 0, speedY: 0, opacity: 0, color: "rgba(0, 0, 0, 0)" };
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20,
      radius: Math.random() * 2.4 + 0.6,
      speedX: Math.random() * 0.45 - 0.2,
      speedY: Math.random() * 0.9 + 0.35,
      opacity: Math.random() * 0.35 + 0.08,
      color: "rgba(214, 204, 190, 1)"
    };
  }

  private createEmberParticle(initial = false): DriftParticle {
    if (!this.canvas) {
      return { x: 0, y: 0, radius: 0, speedX: 0, speedY: 0, opacity: 0, color: "rgba(0, 0, 0, 0)" };
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const crater = this.getCraterMetrics(width, height);
    const craterWidth = width * 0.1;
    const craterX = crater.x + (Math.random() - 0.5) * craterWidth;
    const craterY = crater.y + Math.random() * height * 0.015;

    return {
      x: craterX,
      y: initial ? craterY - Math.random() * height * 0.7 : craterY,
      radius: Math.random() * 2.8 + 0.8,
      speedX: Math.random() * 0.8 - 0.4,
      speedY: -(Math.random() * 2.4 + 1.2),
      opacity: Math.random() * 0.45 + 0.18,
      color: Math.random() > 0.55 ? "rgba(255, 163, 82, 1)" : "rgba(255, 102, 56, 1)"
    };
  }

  private getCraterMetrics(width: number, height: number): { x: number; y: number; width: number; glowRadius: number } {
    return {
      x: width * 0.5,
      y: height * 0.76,
      width: width * 0.08,
      glowRadius: width * 0.085
    };
  }

  private animate = (): void => {
    if (!this.canvas || !this.ctx) {
      return;
    }

    this.frame += 1;
    this.drawScene();
    this.animationFrameId = window.requestAnimationFrame(this.animate);
  };

  private drawScene(): void {
    if (!this.canvas || !this.ctx) {
      return;
    }

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const sky = this.ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#0f1115");
    sky.addColorStop(0.45, "#1a1616");
    sky.addColorStop(1, "#241816");
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, width, height);

    const glow = this.ctx.createRadialGradient(width * 0.5, height * 0.62, 0, width * 0.5, height * 0.62, width * 0.32);
    glow.addColorStop(0, "rgba(255, 110, 60, 0.26)");
    glow.addColorStop(0.45, "rgba(181, 56, 24, 0.12)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, width, height);

    this.drawSmokeBands(width, height);
    this.drawVolcano(width, height);
    this.drawGems(width, height);
    this.updateAsh(width, height);
    this.updateEmbers(width, height);
  }

  private drawSmokeBands(width: number, height: number): void {
    if (!this.ctx) {
      return;
    }

    for (let i = 0; i < 4; i++) {
      const offset = (this.frame * (0.08 + i * 0.01)) % (width * 0.4);
      const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.4, `rgba(44, 40, 38, ${0.08 + i * 0.025})`);
      gradient.addColorStop(0.7, `rgba(77, 60, 47, ${0.04 + i * 0.015})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.ellipse(width * 0.35 + offset - width * 0.2, height * (0.18 + i * 0.1), width * 0.42, height * 0.06, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawVolcano(width: number, height: number): void {
    if (!this.ctx) {
      return;
    }

    const crater = this.getCraterMetrics(width, height);
    const baseY = height * 0.95;
    const craterY = crater.y;

    const mountain = this.ctx.createLinearGradient(0, craterY, 0, baseY);
    mountain.addColorStop(0, "#3c302d");
    mountain.addColorStop(0.5, "#221b1b");
    mountain.addColorStop(1, "#120f12");

    this.ctx.fillStyle = mountain;
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.16, baseY);
    this.ctx.quadraticCurveTo(width * 0.31, height * 0.84, width * 0.43, craterY);
    this.ctx.quadraticCurveTo(width * 0.48, height * 0.71, crater.x, craterY);
    this.ctx.quadraticCurveTo(width * 0.52, height * 0.71, width * 0.57, craterY);
    this.ctx.quadraticCurveTo(width * 0.69, height * 0.84, width * 0.84, baseY);
    this.ctx.closePath();
    this.ctx.fill();

    const lavaGlow = this.ctx.createRadialGradient(crater.x, craterY, 0, crater.x, craterY, crater.glowRadius);
    lavaGlow.addColorStop(0, "rgba(255, 176, 82, 0.9)");
    lavaGlow.addColorStop(0.5, "rgba(255, 102, 56, 0.58)");
    lavaGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    this.ctx.fillStyle = lavaGlow;
    this.ctx.beginPath();
    this.ctx.ellipse(crater.x, craterY, crater.width, height * 0.026, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawGems(width: number, height: number): void {
    if (!this.ctx)      return;

    this.gems.forEach((gem) => {
      const ctx = this.ctx;
      if (!ctx)  return;
      const pulse = (Math.sin(this.frame * 0.03 + gem.phase) + 1) / 2;
      const x = width * gem.xFactor;
      const y = height * gem.yFactor;
      const glowRadius = gem.radius + pulse * 10;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius * 2.2);
      glow.addColorStop(0, `rgba(${gem.glowColor}, ${0.34 + pulse * 0.12})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = gem.fillColor;
      ctx.beginPath();
      ctx.moveTo(x, y - gem.radius);
      ctx.lineTo(x + gem.radius * 0.75, y);
      ctx.lineTo(x, y + gem.radius);
      ctx.lineTo(x - gem.radius * 0.75, y);
      ctx.closePath();
      ctx.fill();
    });
  }

  private updateAsh(width: number, height: number): void {
    if (!this.ctx) {
      return;
    }

    this.ashParticles = this.ashParticles.map((particle) => {
      const nextX = particle.x + particle.speedX + Math.sin((this.frame + particle.y) * 0.002) * 0.15;
      const nextY = particle.y + particle.speedY;
      const wrapped = nextY > height + 20 || nextX < -20 || nextX > width + 20;

      return wrapped
        ? this.createAshParticle()
        : {
            ...particle,
            x: nextX,
            y: nextY
          };
    });

    this.ashParticles.forEach((particle) => {
      if (!this.ctx) {
        return;
      }

      this.ctx.fillStyle = particle.color.replace("1)", `${particle.opacity})`);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private updateEmbers(width: number, height: number): void {
    if (!this.ctx) {
      return;
    }

    this.emberParticles = this.emberParticles.map((particle) => {
      const nextX = particle.x + particle.speedX + Math.sin((this.frame + particle.y) * 0.01) * 0.2;
      const nextY = particle.y + particle.speedY;
      const nextOpacity = Math.max(0, particle.opacity - 0.0025);
      const reset = nextY < height * 0.04 || nextOpacity <= 0.02;

      return reset
        ? this.createEmberParticle()
        : {
            ...particle,
            x: nextX,
            y: nextY,
            opacity: nextOpacity
          };
    });

    this.emberParticles.forEach((particle) => {
      if (!this.ctx) {
        return;
      }

      const glow = this.ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 3.5
      );
      glow.addColorStop(0, particle.color.replace("1)", `${particle.opacity})`));
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");

      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius * 3.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
