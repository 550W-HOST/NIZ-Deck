export function layerAfterVerticalWheel(
  layers: readonly number[],
  activeLayer: number,
  deltaX: number,
  deltaY: number,
): number {
  if (layers.length === 0 || deltaY === 0 || Math.abs(deltaY) <= Math.abs(deltaX)) {
    return activeLayer
  }

  const activeIndex = layers.indexOf(activeLayer)
  if (activeIndex === -1) return layers[0] ?? activeLayer

  const direction = deltaY > 0 ? 1 : -1
  const nextIndex = (activeIndex + direction + layers.length) % layers.length
  return layers[nextIndex] ?? activeLayer
}
