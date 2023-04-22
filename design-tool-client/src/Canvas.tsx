import React, { useRef, useEffect, useState } from "react";

const Canvas = ({ className }: { className?: string }) => {
  const defaultClasses = "";
  const mergedClasses = `${defaultClasses} ${className}`;
  const ref = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [translation, setTranslation] = useState({ x: 0, y: 0 });

  const draw = (
    context: CanvasRenderingContext2D,
    zoom: number,
    translation: { x: number; y: number }
  ) => {
    context.save();
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.translate(translation.x, translation.y);
    context.scale(zoom, zoom);
    context.fillStyle = "blue";
    context.fillRect(500, 500, 100, 100);
    context.restore();
    console.log("draw");
  };

  const updateCanvasDimensions = () => {
    if (!ref.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ref.current.width = width;
    ref.current.height = height;

    const context = ref.current.getContext("2d");
    if (context) {
      draw(context, zoom, translation);
    }
  };

  const handleWheel = (event: WheelEvent) => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();

      const canvasBounds = ref.current?.getBoundingClientRect();
      const mouseX = event.clientX - (canvasBounds?.left || 0);
      const mouseY = event.clientY - (canvasBounds?.top || 0);

      const scaleAmount = event.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = zoom * scaleAmount;

      const translationX = mouseX - scaleAmount * (mouseX - translation.x);
      const translationY = mouseY - scaleAmount * (mouseY - translation.y);

      setZoom(newZoom);
      setTranslation({ x: translationX, y: translationY });
    }
  };

  useEffect(() => {
    if (!ref.current) return;
    updateCanvasDimensions();

    const target = ref.current;

    target.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", updateCanvasDimensions);

    return () => {
      console.log('calle?');
      target.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", updateCanvasDimensions);
    };
  }, [ref, zoom, translation]);

  return (
    <canvas
      className={mergedClasses}
      ref={ref}
      style={{ border: "1px solid black" }}
    />
  );
};

export default Canvas;
