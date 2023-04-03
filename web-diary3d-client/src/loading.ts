export function onLoadingDone() {
  const element = document.getElementById("splash-view");
  element.classList.add("fadeOut");
  setTimeout(() => {
    element.remove();
  }, 1000);
}

export let setProgress = function (value: number) {
  let bar = document.getElementById("progress-bar");
  if (bar) {
    value = Math.min(1, Math.max(0, value));
    bar.style.clipPath = `polygon(0 0, ${value * 100}% 0, ${
      value * 100
    }% 100%, 0% 100%)`;
  }
};
