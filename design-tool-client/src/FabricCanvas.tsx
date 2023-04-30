import React, { useRef, useEffect } from "react";
import { fabric } from "fabric";

const useCanvasRef = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        selection: false,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "rgb(240, 240, 240)"
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
        const delta = opt.e.deltaY;
        let zoom = fabricCanvas.current.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        fabricCanvas.current.zoomToPoint(
          { x: opt.e.offsetX, y: opt.e.offsetY },
          zoom
        );
        opt.e.preventDefault();
        opt.e.stopPropagation();

        var vpt = fabricCanvas.current.viewportTransform;
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
  useEffect(() => {
    if (!fabricCanvas.current) {
      return;
    }
    const rect = new fabric.Rect({
      left: pos,
      top: pos,
      width: 100,
      height: 100,
      fill: "blue",
    });
    fabricCanvas.current.add(rect);
    fabricCanvas.current.renderAll();
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

const useCanvasObjectMoving = (
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>
) => {
  useEffect(() => {
    const handleObjectMoving = (e: any) => {
      if (!fabricCanvas.current) {
        return;
      }
      const object = e.target as fabric.Rect;
      if (!object) {
        return;
      }
      object.setCoords();
      const boundingRect = object.getBoundingRect();
      const zoom = fabricCanvas.current.getZoom();
      const viewportMatrix = fabricCanvas.current.viewportTransform;

      if (!viewportMatrix) {
        return;
      }

      boundingRect.top = (boundingRect.top - viewportMatrix[5]) / zoom;
      boundingRect.left = (boundingRect.left - viewportMatrix[4]) / zoom;
      boundingRect.width /= zoom;
      boundingRect.height /= zoom;
    };

    fabricCanvas.current?.on("object:moving", handleObjectMoving);

    return () => {
      fabricCanvas.current?.off("object:moving", handleObjectMoving);
    };
  }, [fabricCanvas]);
};

const FabricCanvas = () => {
  const { canvasRef, fabricCanvas } = useCanvasRef();

  const backgroundImageRepeat = 10;
  const centerPos = (1024 * backgroundImageRepeat) / 2 - 1024 / 2;

  useCanvasResize(fabricCanvas);
  useRepeatingBackgroundObjects(fabricCanvas, backgroundImageRepeat);
  useCanvasObjects(fabricCanvas, centerPos);
  useCanvasPanning(fabricCanvas);
  useCanvasZooming(fabricCanvas);
  useCanvasObjectMoving(fabricCanvas);

  useEffect(() => {
    fabricCanvas.current?.absolutePan(new fabric.Point(centerPos, centerPos));
  }, [fabricCanvas]);

  return <canvas ref={canvasRef} style={{ border: "1px solid black" }} />;
};

export default FabricCanvas;
