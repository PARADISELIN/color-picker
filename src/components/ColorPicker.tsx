import { defineComponent } from 'vue'

import { useColorPicker } from './useColorPicker'
import { colorPickerProps } from './types'
import './style.scss'

const ColorPicker = defineComponent({
  name: 'ColorPicker',
  props: colorPickerProps,
  setup(props) {
    const {
      containerRef,
      canvasCircleRef,
      canvasOperationRef,
      containerStyle,
      squareStyle,
      color,
      mousedown,
    } = useColorPicker(props)

    return () => (
      <div class="color-picker" ref={containerRef} style={containerStyle.value}>
        <div class="color-picker__square" style={squareStyle.value}>
          {color.value}
        </div>
        <canvas
          class="color-picker__circle"
          ref={canvasCircleRef}
          width={props.size}
          height={props.size}
          style={{ width: props.size + 'px', height: props.size + 'px' }}
        />
        <canvas
          class="color-picker__operation"
          ref={canvasOperationRef}
          width={props.size}
          height={props.size}
          style={{ width: props.size + 'px', height: props.size + 'px' }}
          onMousedown={mousedown}
        />
      </div>
    )
  },
})

export default ColorPicker
