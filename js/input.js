export class Input {
  constructor(canvas) {
    this.keys = {};
    this.click = null;
    this.justPressed = {};   // track single-press for toggles

    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      this.click = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    });

    canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      this.click = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };
    });
  }

  getDirection() {
    let x = 0, y = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    y = -1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  y =  1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  x = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x =  1;
    return { x, y };
  }

  consumeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  /** Check if key was just pressed this frame (single trigger) */
  wasJustPressed(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  /** Call at end of frame to clear single-press flags */
  endFrame() {
    this.justPressed = {};
  }
}
