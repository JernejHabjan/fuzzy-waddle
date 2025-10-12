export interface TelemetrySnapshot {
  counters: Record<string, number>;
  spans: Record<string, { avg: number; last: number; count: number }>;
  events: Array<{ t: number; type: string; data?: any }>;
  frame: number;
}

export class TelemetrySink {
  private counters: Record<string, number> = {};
  private spanAcc: Record<string, { total: number; count: number; last: number }> = {};
  private events: Array<{ t: number; type: string; data?: any }> = [];
  private frame = 0;

  recordCounter(name: string, delta = 1) {
    this.counters[name] = (this.counters[name] || 0) + delta;
  }

  withSpan<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const dur = performance.now() - start;
      const acc = this.spanAcc[name] || { total: 0, count: 0, last: 0 };
      acc.total += dur;
      acc.count++;
      acc.last = dur;
      this.spanAcc[name] = acc;
    }
  }

  recordEvent(type: string, data?: any) {
    this.events.push({ t: performance.now(), type, data });
    if (this.events.length > 256) this.events.splice(0, this.events.length - 256);
  }

  nextFrame() {
    this.frame++;
  }

  snapshot(): TelemetrySnapshot {
    const spans: TelemetrySnapshot["spans"] = {};
    Object.entries(this.spanAcc).forEach(([k, v]) => {
      spans[k] = { avg: v.total / v.count, last: v.last, count: v.count };
    });
    return { counters: { ...this.counters }, spans, events: [...this.events], frame: this.frame };
  }
}
