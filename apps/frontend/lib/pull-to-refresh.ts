type TouchPoint = {
  identifier: number;
  clientX: number;
  clientY: number;
};

const INTENT_DISTANCE = 8;

/** Touch gesture state without DOM or React dependencies. Never consumes wheel events. */
export class PullToRefreshGesture {
  private origin: TouchPoint | null = null;
  distance = 0;

  start(touches: ArrayLike<TouchPoint>, scrollTop: number) {
    this.cancel();
    if (touches.length !== 1 || scrollTop > 0) return;
    const { identifier, clientX, clientY } = touches[0];
    this.origin = { identifier, clientX, clientY };
  }

  move(touches: ArrayLike<TouchPoint>, scrollTop: number, maxDistance: number) {
    if (!this.origin) return;
    if (touches.length !== 1 || touches[0].identifier !== this.origin.identifier || scrollTop > 0) {
      this.cancel();
      return;
    }

    const dx = touches[0].clientX - this.origin.clientX;
    const dy = touches[0].clientY - this.origin.clientY;
    if (dy < 0) {
      this.cancel();
      return;
    }
    if (this.distance === 0 && Math.max(Math.abs(dx), dy) < INTENT_DISTANCE) return;
    if (Math.abs(dx) >= dy) {
      this.cancel();
      return;
    }

    this.distance = Math.min(dy * 0.5, maxDistance);
  }

  release(threshold: number) {
    const shouldRefresh = this.origin !== null && this.distance >= threshold;
    this.cancel();
    return shouldRefresh;
  }

  cancel() {
    this.origin = null;
    this.distance = 0;
  }
}
