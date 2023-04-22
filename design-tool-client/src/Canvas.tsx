import React, { useRef, useEffect } from "react";

const Canvas = ({ className }: { className?: string }) => {
  const defaultClasses = "";
  const mergedClasses = `${defaultClasses} ${className}`;
  const ref = useRef<HTMLCanvasElement | null>(null);

  // const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
  // if (!canvasRef.current) return;

  // const scaleAmount = event.deltaY < 0 ? 1.1 : 0.9;
  // const context = canvasRef.current.getContext("2d");

  // if (context) {
  //   context.scale(scaleAmount, scaleAmount);
  //   context.clearRect(0, 0, width, height);
  //   draw(context);
  // }
  // };

  const draw = (context: CanvasRenderingContext2D) => {
    context.fillStyle = "blue";
    context.fillRect(500, 500, 100, 100); // x: 10, y: 10, width: 100, height: 100
    console.log("draw");
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    console.log("Wheel event detected");
  };

  useEffect(() => {
    if (!ref.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    ref.current.width = width;
    ref.current.height = height;

    const context = ref.current.getContext("2d");
    if (context) {
      draw(context);
    }
    const target = ref.current;
    target.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      target.removeEventListener("wheel", handleWheel);
    };
  }, [ref]);

  return (
    <canvas
      className={mergedClasses}
      ref={ref}
      style={{ border: "1px solid black" }}
    />
  );
};

export default Canvas;
