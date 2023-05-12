import { useRef } from "react";
import "./App.css";
import FabricCanvas from "./FabricCanvas";

function App() {
  const fabricCanvasRef = useRef<{
    addObject: (type: string, imageUrl?: string) => void;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FabricCanvas ref={fabricCanvasRef} />
      <div className="fixed flex bottom-0 left-0 gap-x-2 m-4">
        <button
          onClick={() => {
            fabricCanvasRef?.current?.addObject("textbox");
          }}
        >
          텍스트 넣기
        </button>
        <button
          onClick={() => {
            fabricCanvasRef?.current?.addObject("sticker");
          }}
        >
          스티커 넣기
        </button>
        <button
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          이미지 넣기
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.files) {
              return;
            }
            const file = event.target.files[0];

            if (!file.type.startsWith("image/")) {
              console.log("Uploaded file is not an image.");
              return;
            }

            const reader = new FileReader();

            reader.onload = function (f) {
              if (!f.target) {
                return;
              }
              const imageUrl = f.target?.result as string;
              fabricCanvasRef?.current?.addObject("image", imageUrl);

              event.target.value = "";
            };

            reader.readAsDataURL(file);
          }}
        ></input>
      </div>
    </div>
  );
}

export default App;
