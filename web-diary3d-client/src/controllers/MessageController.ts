import { GameController } from "./GameController";

interface Callback {
  (value: string): void;
}

export class MessageController {
  protected input: HTMLInputElement = document.createElement("input");
  private callbacks: Callback[] = [];

  constructor() {
    this.initInputElements();
    this.startListenKeypress();
  }

  public onMessageSent(callback: Callback): void {
    this.callbacks.push(callback);
  }

  protected triggerCallbacks(value: string): void {
    for (const callback of this.callbacks) {
      callback(value);
    }
  }

  private initInputElements() {
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "전송할 메세지를 입력해 주세요";
    this.input.style.position = "absolute";
    this.input.style.top = "40%";
    this.input.style.left = "50%";
    this.input.style.transform = "translate(-50%, -50%)";
    this.input.style.backgroundColor = "transparent";
    this.input.style.border = "none";
    this.input.style.outline = "none";
    this.input.style.textAlign = "center";
    this.input.style.visibility = "hidden";
    this.input.style.width = "100vw";

    document.body.appendChild(this.input);

    this.input.addEventListener("blur", () => {
      this.input.style.visibility = "hidden";
    });
  }

  private startListenKeypress() {
    document.addEventListener("keypress", (event) => {
      console.log(event.key);
      if (event.key === "Enter") {
        if (document.activeElement === this.input) {
          this.triggerCallbacks(this.input.value);
          this.input.value = "";
          this.input.blur();
        } else {
          this.input.style.visibility = "visible";
          this.input.focus();
        }
      }
    });
  }
}

export class MobileMessageController extends MessageController {
  private messageBtn: HTMLButtonElement;

  constructor() {
    super();
    this.initMessageButton();

    this.messageBtn.addEventListener(
      "touchstart",
      (event) => {
        event.stopPropagation();

        this.input.style.visibility = "visible";
        this.input.focus();
      },
      { capture: true }
    );
  }

  private initMessageButton() {
    this.messageBtn = document.createElement("button");
    this.messageBtn.style.position = "absolute";
    this.messageBtn.style.bottom = "20px";
    this.messageBtn.style.right = "20px";
    this.messageBtn.style.padding = "10px 20px";
    this.messageBtn.style.backgroundColor = "transparent";
    this.messageBtn.style.border = "none";
    this.messageBtn.style.outline = "none";
    this.messageBtn.style.boxShadow = "none";
    this.messageBtn.innerText = "메세지 전송";
    document.body.appendChild(this.messageBtn);
  }
}
