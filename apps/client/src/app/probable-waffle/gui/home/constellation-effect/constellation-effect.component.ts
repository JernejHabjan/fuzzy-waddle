import { type AfterViewInit, Component, type OnDestroy } from "@angular/core";
import { ConstellationParticle } from "./constellation-particle";

type MousePosition = { x?: number; y?: number };

@Component({
  selector: "probable-waffle-constellation-effect",
  templateUrl: "./constellation-effect.component.html",
  styleUrls: ["./constellation-effect.component.scss"]
})
export class ConstellationEffectComponent implements AfterViewInit, OnDestroy {
  private clickListener?: (e: MouseEvent) => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private destroyed = false;
  private readonly spawnParticleAmount = 1;
  private hueColor = 0;
  private timer!: number;
  private canvas?: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private particles: ConstellationParticle[] = [];

  private mouse: MousePosition = {
    x: undefined,
    y: undefined
  };

  ngAfterViewInit(): void {
    this.canvas = document.getElementById("canvas1") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.particles = [];

    window.addEventListener("resize", () => {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    this.clickListener = (e: MouseEvent) => this.handleMouseEvent(e);
    this.canvas.addEventListener("click", this.clickListener);

    this.mouseMoveListener = (e: MouseEvent) => this.handleMouseEvent(e);
    this.canvas.addEventListener("mousemove", this.mouseMoveListener);

    this.timer = window.setInterval(this.placeRandomParticle, 50);

    this.animate();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
    if (this.clickListener) {
      const canvas = (document.getElementById("canvas1") as HTMLCanvasElement) || undefined;
      canvas?.removeEventListener("click", this.clickListener);
    }
    if (this.mouseMoveListener) {
      const canvas = (document.getElementById("canvas1") as HTMLCanvasElement) || undefined;
      canvas?.removeEventListener("mousemove", this.mouseMoveListener);
    }
    this.destroyed = true;
  }

  /**
   * Removes particle if it is outside the canvas
   * Updates and draws particles
   * Draws lines between particles
   */
  private handleParticles = () => {
    if (!this.canvas) return;
    for (let i = 0; i < this.particles.length; i++) {
      const particleI = this.particles[i];
      if (!particleI) continue;
      const particleRadius = particleI.size / 2;
      const particleOnCanvas =
        particleI.x + particleRadius > 0 &&
        particleI.x - particleRadius < this.canvas.width &&
        particleI.y + particleRadius > 0 &&
        particleI.y - particleRadius < this.canvas.height;
      if (!particleOnCanvas) {
        this.particles.splice(i, 1);
        i--;
      } else {
        particleI.update();
        particleI.draw(this.ctx);
        for (let j = i + 1; j < this.particles.length; j++) {
          const particleJ = this.particles[i + 1];
          if (!particleJ) continue;
          const dx = particleJ.x - particleI.x;
          const dy = particleJ.y - particleI.y;
          const distance = dx * dx + dy * dy;
          if (distance < 10000) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = particleI.color;
            this.ctx.lineWidth = 0.3;
            this.ctx.moveTo(particleI.x, particleI.y);
            this.ctx.lineTo(particleJ.x, particleJ.y);
            this.ctx.stroke();
          }
        }
        if (particleI.size < 0.3) {
          this.particles.splice(i, 1);
          i--;
        }
      }
    }
  };

  private animate = () => {
    if (!this.canvas) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.handleParticles();
    this.hueColor += 2;
    if (!this.destroyed) {
      requestAnimationFrame(this.animate);
    }
  };

  private handleMouseEvent = (e: MouseEvent) => {
    if (!this.canvas) return;

    // get offset dom from canvas
    const rect = this.canvas.getBoundingClientRect();

    // get mouse position
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // todo doesn't work ok at the bottom of the screen
    // mouse.x = e.x;
    // mouse.y = e.y;

    for (let i = 0; i < this.spawnParticleAmount; i++) {
      this.particles.push(new ConstellationParticle(this.mouse.x, this.mouse.y, this.hueColor));
    }
  };

  /**
   * get random point on canvas and place a particle there
   */
  private placeRandomParticle = () => {
    if (!this.canvas) return;

    const mouse: MousePosition = {
      x: undefined,
      y: undefined
    };
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.random() * this.canvas.width;
    const y = Math.random() * this.canvas.height;
    mouse.x = x - rect.left;
    mouse.y = y - rect.top;
    for (let i = 0; i < this.spawnParticleAmount; i++) {
      this.particles.push(new ConstellationParticle(mouse.x, mouse.y, this.hueColor));
    }
  };
}
