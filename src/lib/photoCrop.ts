export type PhotoCrop = { zoom: number; horizontal: number; vertical: number }
export const defaultPhotoCrop: PhotoCrop = { zoom: 1, horizontal: 0, vertical: 0 }

export function cropGeometry(imageWidth: number, imageHeight: number, outputWidth: number, outputHeight: number, crop: PhotoCrop) {
  const scale = Math.max(outputWidth / imageWidth, outputHeight / imageHeight) * Math.max(1, Math.min(3, crop.zoom))
  const width = imageWidth * scale
  const height = imageHeight * scale
  const horizontal = Math.max(-100, Math.min(100, crop.horizontal))
  const vertical = Math.max(-100, Math.min(100, crop.vertical))
  return {
    x: width === outputWidth || horizontal === -100 ? 0 : -(width - outputWidth) * (horizontal + 100) / 200,
    y: height === outputHeight || vertical === -100 ? 0 : -(height - outputHeight) * (vertical + 100) / 200,
    width,
    height,
  }
}

export function drawCroppedPhoto(canvas: HTMLCanvasElement, image: HTMLImageElement, crop: PhotoCrop, width: number, height: number) {
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível preparar a imagem.')
  const frame = cropGeometry(image.naturalWidth, image.naturalHeight, width, height, crop)
  context.clearRect(0, 0, width, height)
  context.drawImage(image, frame.x, frame.y, frame.width, frame.height)
}

export async function loadPhoto(source: File | string): Promise<{ image: HTMLImageElement; dispose: () => void }> {
  const temporaryUrl = source instanceof File ? URL.createObjectURL(source) : null
  const image = new Image()
  if (!temporaryUrl) image.crossOrigin = 'anonymous'
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Não foi possível abrir esta foto para edição.'))
      image.src = temporaryUrl ?? source as string
    })
    return { image, dispose: () => { if (temporaryUrl) URL.revokeObjectURL(temporaryUrl) } }
  } catch (error) {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl)
    throw error
  }
}

export async function croppedPhotoBlob(source: File | string, crop: PhotoCrop): Promise<Blob> {
  const { image, dispose } = await loadPhoto(source)
  try {
    const canvas = document.createElement('canvas')
    drawCroppedPhoto(canvas, image, crop, 1600, 1200)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível otimizar a foto.')), 'image/webp', 0.82))
  } finally {
    dispose()
  }
}
