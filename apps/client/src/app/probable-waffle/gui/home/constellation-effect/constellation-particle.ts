export class ConstellationParticle {
  public readonly color: string;
  public size: number;
  private readonly speedX: number;
  private readonly speedY: number;

  constructor(
    public x: number,
    public y: number,
    hueCol: number
  ) {
    this.speedX = Math.random() * 5 - 1.5;
    this.speedY = Math.random() * 5 - 1.5;
    this.color = "hsl(" + hueCol + ", 100%, 50%)";
    this.size = Math.random() * 50 + 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.size -= 0.1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    const radius = this.size / 2;
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
