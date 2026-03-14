import sharp from 'sharp'

interface WatermarkOptions {
  text?: string
  opacity?: number
}

export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = 'VIREL',
    opacity = 0.35,
  } = options

  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width ?? 800
  const height = metadata.height ?? 1200

  // Font size proportional to image width (7%), min 28px
  const dynamicFontSize = Math.max(Math.round(width * 0.07), 28)
  const letterSpacing = Math.round(dynamicFontSize * 0.3)

  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark {
          font-family: Georgia, serif;
          font-size: ${dynamicFontSize}px;
          font-weight: bold;
          fill: white;
          fill-opacity: ${opacity};
          letter-spacing: ${letterSpacing}px;
        }
      </style>
      <text
        class="watermark"
        x="50%"
        y="${height - Math.round(height * 0.06)}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${text}</text>
    </svg>
  `

  const svgBuffer = Buffer.from(svgText)

  const result = await sharp(imageBuffer)
    .composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ])
    .toBuffer()

  return result
}
