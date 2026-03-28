import sharp from 'sharp'

interface WatermarkOptions {
  text?: string
  opacity?: number
}

export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const { text = 'VAUREL', opacity = 0.07 } = options

  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width ?? 800
  const height = metadata.height ?? 1200

  const tileW = 300
  const tileH = 160
  const fontSize = 11
  const ls = 5
  const cx = tileW / 2
  const cy = tileH / 2

  const tileSvg = `<svg width="${tileW}" height="${tileH}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${cx}" y="${cy}"
      text-anchor="middle" dominant-baseline="middle"
      transform="rotate(-30, ${cx}, ${cy})"
      font-family="Georgia, serif"
      font-size="${fontSize}"
      font-weight="300"
      letter-spacing="${ls}"
      fill="white"
      fill-opacity="${opacity}"
    >${text}</text>
  </svg>`

  const tileBuffer = Buffer.from(tileSvg)
  const cols = Math.ceil(width / tileW) + 1
  const rows = Math.ceil(height / tileH) + 1
  const composites: sharp.OverlayOptions[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      composites.push({
        input: tileBuffer,
        top: Math.round(row * tileH - tileH / 2),
        left: Math.round(col * tileW - tileW / 2),
      })
    }
  }

  return sharp(imageBuffer).composite(composites).toBuffer()
}
