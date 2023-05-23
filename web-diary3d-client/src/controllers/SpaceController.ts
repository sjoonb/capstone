import * as THREE from "three";

export type Space = {
  title: string;
  position: THREE.Vector3;
};

interface Callback {
  (value: THREE.Vector3): void;
}

export class SpaceController {
	private callbacks: Callback[] = [];
  private spaces: Space[] = [
    {
      title: "나만의 공간",
      position: new THREE.Vector3(-12, 0, -12),
    },
    {
      title: "친구들과의 공간",
      position: new THREE.Vector3(0, 0, 15),
    },
		{
      title: "가족과의 공간",
      position: new THREE.Vector3(12, 0, -12),
    },
  ];

  constructor() {
    this.initSpaceListElements();
  }

  private initSpaceListElements() {
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "buttonContainer";
    buttonContainer.style.pointerEvents = "none";

    buttonContainer.style.position = "fixed";
    buttonContainer.style.top = "10px";
    buttonContainer.style.right = "10px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";

    buttonContainer.style.backgroundColor = "transparent";
    buttonContainer.style.border = "none";
    buttonContainer.style.outline = "none";
    buttonContainer.style.zIndex = "10";
    buttonContainer.style.pointerEvents = "none";
		buttonContainer.style.fontSize = "24px";

    for (let i = 0; i < this.spaces.length; i++) {
      const button = document.createElement("button");
      button.textContent = `${this.spaces[i].title}`;
      button.style.pointerEvents = "auto";
      button.style.marginBottom = "2px";
      button.style.backgroundColor = "transparent";
      button.style.border = "none";
      button.style.cursor = "pointer";
			button.style.textAlign = "left";

      button.addEventListener("click", (e) => {
        console.log(`Button ${this.spaces[i].title} clicked!`); // Replace this with your function
				this.triggerCallbacks(this.spaces[i].position);
      });

      buttonContainer.appendChild(button);
    }

    document.body.appendChild(buttonContainer);
  }

	public onButtonClick(callback: Callback): void {
    this.callbacks.push(callback);
  }

	private triggerCallbacks(value: THREE.Vector3): void {
    for (const callback of this.callbacks) {
      callback(value);
    }
  }

}
