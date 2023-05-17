
export const saveCanvasState = (data: any) => {
  fetch("http://localhost:3333/canvas/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export async function fetchCanvasState() {
  try {
    const response = await fetch("http://localhost:3333/canvas/load");
    return response.json();
  } catch (error) {
    console.error("Error fetching canvas state:", error);
    return null;
  }
}
