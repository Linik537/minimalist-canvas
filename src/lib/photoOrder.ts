export function normalizePhotoOrder(order: string[], photoIds: string[]) {
  const available = new Set(photoIds)
  return [...order.filter(id => available.has(id)), ...photoIds.filter(id => !order.includes(id))]
}

export function movePhotoId(order: string[], photoId: string, targetIndex: number) {
  const from = order.indexOf(photoId)
  if (from < 0 || targetIndex < 0 || targetIndex >= order.length || from === targetIndex) return order
  const next = [...order]
  next.splice(from, 1)
  next.splice(targetIndex, 0, photoId)
  return next
}

export function movePhotoBy(order: string[], photoId: string, delta: number) {
  return movePhotoId(order, photoId, order.indexOf(photoId) + delta)
}
