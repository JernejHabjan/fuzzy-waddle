import { AfterViewInit, Component, OnDestroy } from '@angular/core';

class Particle {
  private readonly speedX: number;
  private readonly speedY: number;
  public readonly color: string;
  public size: number;
  constructor(public x: number, public y: number, hueCol: number) {
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.color = 'hsl(' + hueCol + ', 100%, 50%)';
    this.size = Math.random() * 5 + 1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.size -= 0.1;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

@Component({
  selector: 'fuzzy-waddle-constellation-effect',
  templateUrl: './constellation-effect.component.html',
  styleUrls: ['./constellation-effect.component.scss']
})
export class ConstellationEffectComponent implements AfterViewInit, OnDestroy {
  private clickListener?: (e: MouseEvent) => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private destroyed = false;
  ngAfterViewInit(): void {
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: Particle[] = [];

    window.addEventListener('resize', function (e) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    let hueCol = 0;

    const mouse: { x?: number; y?: number } = {
      x: undefined,
      y: undefined
    };

    this.clickListener = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(mouse.x, mouse.y, hueCol));
      }
    };
    canvas.addEventListener('click', this.clickListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(mouse.x, mouse.y, hueCol));
      }
    };
    canvas.addEventListener('mousemove', this.mouseMoveListener);

    function handleParticles() {
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const distance = dx * dx + dy * dy;
          if (distance < 10000) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.3;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        if (particles[i].size < 0.3) {
          particles.splice(i, 1);
          i--;
        }
      }
    }

    const animate = ()=> {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);
      handleParticles();
      hueCol += 2;
      if (!this.destroyed) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      const canvas = document.getElementById('canvas1') as HTMLCanvasElement || undefined;
      canvas?.removeEventListener('click', this.clickListener);
    }
    if (this.mouseMoveListener) {
      const canvas = document.getElementById('canvas1') as HTMLCanvasElement || undefined;
      canvas?.removeEventListener('mousemove', this.mouseMoveListener);
    }
    this.destroyed = true;
  }
}
