import type { ExtractPropTypes } from 'vue'

const DEFAULT_SIZE = 300
const DEFAULT_COLOR = '#000000'

export const colorPickerProps = {
  size: {
    type: Number,
    default: DEFAULT_SIZE,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  value: {
    type: String,
    default: DEFAULT_COLOR,
  },
} as const

export type ColorPickerProps = ExtractPropTypes<typeof colorPickerProps>
