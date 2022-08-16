export type HEXColorString = `#${string}`

/**
 * @description HSL 色值元组类型
 * @element [0] R 通道，取值范围 [0, 255]
 * @element [1] G 通道，取值范围 [0, 255]
 * @element [2] B 通道，取值范围 [0, 255]
 */

export type RGBColorTuple = [number, number, number]
/**
 * @description HSL 色值元组类型
 * @element [0] 色相，取值范围 [0, 360]
 * @element [1] 饱和度，取值范围 [0, 1]
 * @element [2] 明度，取值范围 [0, 1]
 */
export type HSLColorTuple = [number, number, number]
