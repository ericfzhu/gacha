export const ANDROID_TOUCH_ACTION = Object.freeze({
  DOWN: 0,
  UP: 1,
  MOVE: 2,
  CANCEL: 3,
  POINTER_DOWN: 5,
  POINTER_UP: 6,
  MASK: 0xff,
  INDEX_SHIFT: 8,
});

export function createPadTouchFrame({
  x,
  y,
  rawAction,
  pointerCount = 1,
  eventTime = 0,
}, {
  viewScale = 1,
  statusBarHeight = 0,
} = {}) {
  const action = rawAction & ANDROID_TOUCH_ACTION.MASK;
  const adjustedY = y - (viewScale * 2 + statusBarHeight);
  return {
    x,
    y: adjustedY,
    pointerIndex: 0,
    reserved: 0,
    pointerCount,
    rawAction,
    eventTime: BigInt(Math.trunc(eventTime)),
    action,
    jniArguments: [x, adjustedY, 0, 0, pointerCount, rawAction, BigInt(Math.trunc(eventTime)), action],
  };
}

export class PadBrowserInputModel {
  constructor(metrics = {}) {
    this.metrics = { viewScale: 1, statusBarHeight: 0, ...metrics };
    this.pointers = new Map();
  }

  setMetrics(metrics) {
    Object.assign(this.metrics, metrics);
  }

  begin(pointerId, x, y, eventTime) {
    const index = this.pointers.size;
    this.pointers.set(pointerId, { x, y });
    const action = index === 0 ? ANDROID_TOUCH_ACTION.DOWN : ANDROID_TOUCH_ACTION.POINTER_DOWN;
    return this.#frame(action | (index << ANDROID_TOUCH_ACTION.INDEX_SHIFT), eventTime);
  }

  move(pointerId, x, y, eventTime) {
    if (!this.pointers.has(pointerId)) return null;
    this.pointers.set(pointerId, { x, y });
    return this.#frame(ANDROID_TOUCH_ACTION.MOVE, eventTime);
  }

  end(pointerId, x, y, eventTime) {
    if (!this.pointers.has(pointerId)) return null;
    this.pointers.set(pointerId, { x, y });
    const index = [...this.pointers.keys()].indexOf(pointerId);
    const action = this.pointers.size === 1 ? ANDROID_TOUCH_ACTION.UP : ANDROID_TOUCH_ACTION.POINTER_UP;
    const frame = this.#frame(action | (index << ANDROID_TOUCH_ACTION.INDEX_SHIFT), eventTime);
    this.pointers.delete(pointerId);
    return frame;
  }

  cancel(eventTime) {
    if (!this.pointers.size) return null;
    const frame = this.#frame(ANDROID_TOUCH_ACTION.CANCEL, eventTime);
    this.pointers.clear();
    return frame;
  }

  #frame(rawAction, eventTime) {
    const primary = this.pointers.values().next().value;
    return createPadTouchFrame({
      x: primary.x,
      y: primary.y,
      rawAction,
      pointerCount: this.pointers.size,
      eventTime,
    }, this.metrics);
  }
}
