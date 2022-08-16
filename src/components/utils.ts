import type { HSLColorTuple, RGBColorTuple, HEXColorString } from './types'

function dec2hex(x: number): string {
  return (x < 16 ? '0' : '') + x.toString(16)
}

function hue2rgb(m1: number, m2: number, h: number): number {
  h = (h + 1) % 1
  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6
  if (h * 2 < 1) return m2
  if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6
  return m1
}

/**
 * @description RGBColorTuple 转十六进制颜色字符串
 * @param rgb
 * @returns
 */
export function rgb2hex(rgb: RGBColorTuple): HEXColorString {
  const r = Math.round(rgb[0] * 255)
  const g = Math.round(rgb[1] * 255)
  const b = Math.round(rgb[2] * 255)
  return `#${dec2hex(r) + dec2hex(g) + dec2hex(b)}`
}

/**
 * @description 十六进制颜色字符串转 RGBColorTuple
 * @param color
 * @returns
 */
export function hex2rgb(color: HEXColorString): RGBColorTuple {
  if (!color.startsWith('#') || (color.length !== 4 && color.length !== 7))
    throw new Error('format error')

  if (color.length === 7) {
    return [1, 3, 5].map(
      (i) => parseInt(color.substring(i, i + 2), 16) / 255
    ) as RGBColorTuple
  }

  return [1, 2, 3].map(
    (i) => parseInt(color.substring(i, i + 1), 16) / 15
  ) as RGBColorTuple
}

/**
 * @description RGBColorTuple 转 HSLColorTuple
 * @param rgb
 * @returns
 */
export function rgb2hsl(rgb: RGBColorTuple): HSLColorTuple {
  const r = rgb[0]
  const g = rgb[1]
  const b = rgb[2]

  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (min + max) / 2

  if (l > 0 && l < 1) {
    s = delta / (l < 0.5 ? 2 * l : 2 - 2 * l)
  }

  if (delta > 0) {
    if (max === r && max !== g) h += (g - b) / delta
    if (max === g && max !== b) h += 2 + (b - r) / delta
    if (max === b && max !== r) h += 4 + (r - g) / delta
    h /= 6
  }
  return [h, s, l]
}

/**
 * @description HSLColorTuple 转 RGBColorTuple
 * @param hsl
 * @returns
 */
export function hsl2rgb(hsl: HSLColorTuple): RGBColorTuple {
  const h = hsl[0]
  const s = hsl[1]
  const l = hsl[2]
  const m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s
  const m1 = l * 2 - m2

  return [
    hue2rgb(m1, m2, h + 0.33333),
    hue2rgb(m1, m2, h),
    hue2rgb(m1, m2, h - 0.33333),
  ]
}
