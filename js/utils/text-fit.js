function elementOverflows(element) {
  const computedStyle = getComputedStyle(element);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const heightBuffer = Number.isFinite(lineHeight)
    ? Math.max(lineHeight * 0.15, 6)
    : 6;

  return element.scrollHeight > element.clientHeight + heightBuffer ||
    element.scrollWidth > element.clientWidth + 4;
}

function canvasOverflows(canvas) {
  const grid = canvas.querySelector('.ad-grid');
  return [canvas, grid]
    .filter(Boolean)
    .some((node) => (
      node.scrollHeight > node.clientHeight + 4 ||
      node.scrollWidth > node.clientWidth + 4
    ));
}

export function fitTextElements(canvas) {
  const textElements = Array.from(
    canvas.querySelectorAll('.ad-el-headline, .ad-el-subheadline')
  );
  if (!textElements.length) return;

  const states = textElements
    .map((element) => {
      const computedStyle = getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      if (!fontSize || fontSize <= 0) return null;

      const isHeadline = element.classList.contains('ad-el-headline');
      return {
        element,
        isHeadline,
        size: fontSize,
        minSize: fontSize * (isHeadline ? 0.4 : 0.5),
        shrinkFactor: isHeadline ? 0.92 : 0.95,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isHeadline !== b.isHeadline) {
        return a.isHeadline ? -1 : 1;
      }
      return b.size - a.size;
    });

  let iterations = 0;
  while (iterations < 40) {
    const hasOverflow = canvasOverflows(canvas) || states.some(({ element }) => elementOverflows(element));
    if (!hasOverflow) break;

    const target = states.find(({ size, minSize }) => size > minSize + 0.5);
    if (!target) break;

    target.size *= target.shrinkFactor;
    target.element.style.fontSize = `${target.size}px`;
    iterations++;
  }
}
