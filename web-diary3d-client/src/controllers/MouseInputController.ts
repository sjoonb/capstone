import * as THREE from "three";

export interface MouseInputController {
  getMouse(): THREE.Vector2;
  getIsMouseDown(): boolean;
}

export class DesktopMouseInputController implements MouseInputController {
  private isMouseDown: boolean = false;
  private mouse = new THREE.Vector2();

  constructor() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mousemove", this.onMouseMove);
  }
  public getMouse(): THREE.Vector2 {
    return this.mouse;
  }

  public getIsMouseDown(): boolean {
    return this.isMouseDown;
  }

  private onMouseDown = (event: any) => {
    this.isMouseDown = true;
    this.onMouseMove(event);
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onMouseMove = (event: any) => {
    if (this.isMouseDown) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  };
}

export class MobileMouseInputController implements MouseInputController {
  private isMouseDown: boolean = false;
  private mouse = new THREE.Vector2();

  constructor() {
    document.addEventListener("touchstart", this.onTouchStart);
    document.addEventListener("touchend", this.onTouchEnd);
    document.addEventListener("touchmove", this.onTouchMove);
  }
  public getMouse(): THREE.Vector2 {
    return this.mouse;
  }

  public getIsMouseDown(): boolean {
    return this.isMouseDown;
  }

  private onTouchStart = (event: any) => {
    this.isMouseDown = true;
    this.onTouchMove(event);
  };

  private onTouchEnd = () => {
    this.isMouseDown = false;
  };

  private onTouchMove = (event: any) => {
    if (this.isMouseDown) {
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  };
}
