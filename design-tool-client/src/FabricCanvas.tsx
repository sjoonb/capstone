import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { fabric } from "fabric";
import { Textbox } from "fabric/fabric-impl";

const useCanvasRef = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "rgb(240, 240, 240)",
      });
    }
    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  return { canvasRef, fabricCanvas };
};

const useCanvasResize = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  const updateCanvasDimensions = () => {
    if (!fabricCanvas.current) {
      return;
    }
    fabricCanvas.current.setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    window.addEventListener("resize", updateCanvasDimensions);
    return () => {
      window.removeEventListener("resize", updateCanvasDimensions);
    };
  }, [fabricCanvas]);
};

const useCanvasZooming = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  useEffect(() => {
    const handleZoom = (opt: any) => {
      const object = opt.target;
      if (!fabricCanvas.current || !object) {
        return;
      }
      if (opt.e.ctrlKey || opt.e.metaKey) {
        const activeObject = fabricCanvas.current.getActiveObject();
        const wasEditing =
          activeObject &&
          activeObject.type === "textbox" &&
          (activeObject as Textbox).isEditing;

        if (wasEditing) {
          (activeObject as fabric.Textbox).exitEditing();
          fabricCanvas.current.discardActiveObject();
        }

        const delta = opt.e.deltaY;
        let zoom = fabricCanvas.current.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        fabricCanvas.current.zoomToPoint(
          { x: opt.e.offsetX, y: opt.e.offsetY },
          zoom
        );
        console.log("render all");
        opt.e.preventDefault();
        opt.e.stopPropagation();

        const vpt = fabricCanvas.current.viewportTransform;
        if (!vpt) return;
        fabricCanvas.current.setViewportTransform(vpt);
      }
    };

    fabricCanvas.current?.on("mouse:wheel", handleZoom);

    return () => {
      fabricCanvas.current?.off("mouse:wheel", handleZoom);
    };
  }, [fabricCanvas]);
};

const useCanvasPanning = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  useEffect(() => {
    let panning = false;

    const handleMouseDown = (opt: any) => {
      if (opt.e.ctrlKey || opt.e.metaKey) {
        panning = true;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (panning && fabricCanvas.current) {
        const object = opt.target;
        if (!object || object.name != "background") {
          return;
        }
        const delta = new fabric.Point(opt.e.movementX, opt.e.movementY);
        fabricCanvas.current.relativePan(delta);
      }
    };

    const handleMouseUp = () => {
      panning = false;
    };

    fabricCanvas.current?.on("mouse:down", handleMouseDown);
    fabricCanvas.current?.on("mouse:move", handleMouseMove);
    fabricCanvas.current?.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.current?.off("mouse:down", handleMouseDown);
      fabricCanvas.current?.off("mouse:move", handleMouseMove);
      fabricCanvas.current?.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas]);
};

const useCanvasObjects = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>,
  pos: number
) => {
  const size = 100;
  useEffect(() => {
    if (!fabricCanvas.current) {
      return;
    }
    const rect = new fabric.Rect({
      left: pos - size / 2,
      top: pos - size / 2,
      width: size,
      height: size,
      fill: "blue",
    });
    fabricCanvas.current.add(rect);
  }, [fabricCanvas]);
};

const useRemoveObjectOnBackspace = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas.current) {
        return;
      }

      if (e.key === "Backspace") {
        const activeObjects = fabricCanvas.current.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach((object) => {
            fabricCanvas.current?.remove(object);
          });
          fabricCanvas.current.discardActiveObject().requestRenderAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas]);
};

const useRepeatingBackgroundObjects = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>,
  repeat: number
) => {
  useEffect(() => {
    fabric.Image.fromURL("./sketchbook.jpeg", (image) => {
      if (!fabricCanvas.current) {
        return;
      }
      for (let i = 0; i < repeat; i++) {
        for (let j = 0; j < repeat; j++) {
          const clonedImage = new fabric.Image(image.getElement(), {
            left: i * image.width!,
            top: j * image.height!,
            name: "background",
            selectable: false,
            moveCursor: "default",
            hoverCursor: "default",
          });
          fabricCanvas.current.add(clonedImage);
          fabricCanvas.current.sendToBack(clonedImage);
        }
      }
    });
  }, [fabricCanvas]);
};

const useAddObject = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  const getCenterOfViewport = () => {
    if (!fabricCanvas.current) {
      return;
    }
    const zoom = fabricCanvas.current.getZoom();
    const pan = fabricCanvas.current.viewportTransform!;
    const centerX = (-pan[4] + window.innerWidth / 2) / zoom;
    const centerY = (-pan[5] + window.innerHeight / 2) / zoom;
    return new fabric.Point(centerX, centerY);
  };

  console.log("called");

  return useCallback(
    (type: string, imageUrl?: string) => {
      if (!fabricCanvas.current) {
        return;
      }

      const center = getCenterOfViewport();
      if (!center) {
        return;
      }

      let object;

      switch (type) {
        case "sticker":
          object = new fabric.Rect({
            left: center.x,
            top: center.y,
            width: 100,
            height: 100,
            fill: "blue",
          });
          break;
        case "textbox":
          object = new fabric.Textbox("", {
            left: center.x,
            top: center.y,
            width: 150,
            fontSize: 32,
          });
          object.enterEditing();
          break;
        // add case of image
        case "image":
          if (!imageUrl) {
            throw new Error("imageUrl is required");
          }

          fabric.Image.fromURL(imageUrl, function (img) {
            img.set({
              left: center.x,
              top: center.y,
            });
            fabricCanvas.current?.add(img);
            fabricCanvas.current?.renderAll();
            fabricCanvas.current?.setActiveObject(img);
          });

          break;
        default:
          return;
      }
      if (object) {
        fabricCanvas.current.add(object);
        fabricCanvas.current.setActiveObject(object);
      }
      fabricCanvas.current.renderAll();
    },
    [fabricCanvas]
  );
};

type FabricCanvasProps = {
  className?: string;
};

const FabricCanvas = forwardRef((props: FabricCanvasProps, ref) => {
  const { canvasRef, fabricCanvas } = useCanvasRef();

  const imageSize = 1024;
  const backgroundImageRepeatCnt = 10;
  const centerPos = (imageSize * backgroundImageRepeatCnt) / 2;

  const addObject = useAddObject(fabricCanvas);

  useImperativeHandle(ref, () => ({
    addObject,
  }));

  useCanvasResize(fabricCanvas);
  useRepeatingBackgroundObjects(fabricCanvas, backgroundImageRepeatCnt);
  useCanvasObjects(fabricCanvas, centerPos);
  useRemoveObjectOnBackspace(fabricCanvas);
  useCanvasPanning(fabricCanvas);
  useCanvasZooming(fabricCanvas);

  useEffect(() => {
    // first panning to centerPos
    fabricCanvas.current?.absolutePan(
      new fabric.Point(
        centerPos - window.innerWidth / 2,
        centerPos - window.innerHeight / 2
      )
    );
  }, [fabricCanvas]);

  return <canvas ref={canvasRef} className={`${props.className}`} />;
});

export default FabricCanvas;
