import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import type { CSSProperties } from 'vue'

import { hex2rgb, rgb2hex, hsl2rgb, rgb2hsl } from './utils'
import { colorPickerProps } from './types'
import './style.scss'

/**
 * @description 24色相
 */
const HUE_CIRCLE_NUMBER = 24
const DEFAULT_START_COLOR = '#000000'

const ColorPicker = defineComponent({
  name: 'ColorPicker',
  props: colorPickerProps,
  emits: ['update:modelValue', 'change', 'afterChanged'],
  setup(props, { emit }) {
    const rgb = ref<number[]>([])
    const hsl = ref<number[]>([])
    const color = ref('')
    const dragging = ref(false)
    const circleDrag = ref(false)
    const invert = ref(false)

    const containerRef = ref<HTMLElement | null>(null)
    const canvasCircleRef = ref<HTMLCanvasElement | null>(null)
    const canvasOperationRef = ref<HTMLCanvasElement | null>(null)

    /**
     * @description 圆环画布上下文
     */
    const ctxCircle = computed<CanvasRenderingContext2D | null>(() => {
      if (!canvasCircleRef.value) return null
      return canvasCircleRef.value.getContext('2d')
    })
    /**
     * @description 操作画布上下文
     */
    const ctxOperation = computed<CanvasRenderingContext2D | null>(() => {
      if (!canvasOperationRef.value) return null
      return canvasOperationRef.value.getContext('2d')
    })
    /**
     * @description 画布中点坐标
     */
    const mid = computed(() => Math.floor(props.size / 2))
    /**
     * @description 色环宽度
     */
    const circleWidth = computed(() => props.size / 10)
    /**
     * @description 标记点尺寸
     */
    const markerSize = computed(() => circleWidth.value * 0.3)
    /**
     * @description 内原半径（非标准内原半径，因为需要考虑 lineWidth，实际这是中点到圆环宽度一般的距离）
     */
    const radius = computed(() => (props.size - circleWidth.value) / 2)
    /**
     * @description 内方块尺寸
     */
    const squareSize = computed(
      () =>
        Math.floor((radius.value - circleWidth.value / 2) * Math.SQRT1_2) * 2
    )
    /**
     * @description 容器样式
     */
    const containerStyle = computed<CSSProperties>(() => ({
      width: `${props.size}px`,
      height: `${props.size}px`,
    }))
    /**
     * @description 内方块样式
     */
    const squareStyle = computed<CSSProperties>(() => ({
      width: `${squareSize.value}px`,
      height: `${squareSize.value}px`,
      backgroundColor: `${rgb2hex(hsl2rgb([Number(hsl.value[0]), 1, 0.5]))}`,
      left: `${mid.value - squareSize.value / 2}px`,
      top: `${mid.value - squareSize.value / 2}px`,
    }))

    /**
     * @description 抗锯齿
     * @param canvas
     */
    const upscaleCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      const devicePixelRatio = window.devicePixelRatio || 1

      canvas.style.width = `${canvas.width}px`
      canvas.style.height = `${canvas.height}px`
      canvas.width = canvas.width * devicePixelRatio
      canvas.height = canvas.height * devicePixelRatio

      ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    /**
     * @description 绘制色相环
     */
    const drawCircle = () => {
      const ctx = ctxCircle.value
      if (!ctx) return

      const n = HUE_CIRCLE_NUMBER
      const r = radius.value
      const w = circleWidth.value

      // 缝隙模糊系数
      const factor = (8 / r / n) * Math.PI

      let startAngle = 0
      let endAngle = 0
      let startColor: string | undefined = DEFAULT_START_COLOR
      let endColor: string | undefined = undefined

      // 做变换之前先保存状态
      ctx.save()
      ctx.lineWidth = w / r
      ctx.scale(r, r)

      for (let i = 0; i <= n; i++) {
        const d = i / n

        // 弧度
        endAngle = d * Math.PI * 2

        // 坐标计算
        const x1 = Math.sin(startAngle)
        const y1 = -Math.cos(startAngle)
        const x2 = Math.sin(endAngle)
        const y2 = -Math.cos(endAngle)

        // 选择的中点使端点与圆相切
        const middleAngle = (startAngle + endAngle) / 2
        const tan = 1 / Math.cos((endAngle - startAngle) / 2)

        // 贝塞尔曲线控制点坐标
        const cpx = Math.sin(middleAngle) * tan
        const cpy = -Math.cos(middleAngle) * tan

        // New color
        endColor = rgb2hex(hsl2rgb([d, 1, 0.5]))

        if (i > 0) {
          // 在端点之间创建梯度填充
          const grad = ctx.createLinearGradient(x1, y1, x2, y2)
          grad.addColorStop(0, startColor)
          grad.addColorStop(1, endColor)
          ctx.strokeStyle = grad

          // 绘制二次贝塞尔曲线段
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.quadraticCurveTo(cpx, cpy, x2, y2)
          ctx.stroke()
        }

        // 防止曲线连接处出现接缝
        startAngle = endAngle - factor
        startColor = endColor
      }
      ctx.restore()
    }

    /**
     * @description 绘制中心方块的遮罩
     */
    const drawMask = () => {
      const size = squareSize.value
      const sq = squareSize.value / 2

      function calculateMask(
        sizex: number,
        sizey: number,
        outputPixel: (x: number, y: number, c: number, a: number) => void
      ) {
        const isx = 1 / sizex
        const isy = 1 / sizey

        for (let y = 0; y <= sizey; ++y) {
          const l = 1 - y * isy

          for (let x = 0; x <= sizex; ++x) {
            const s = 1 - x * isx

            const a = 1 - 2 * Math.min(l * s, (1 - l) * s)
            const c = a > 0 ? (2 * l - 1 + a) * (0.5 / a) : 0
            outputPixel(x, y, c, a)
          }
        }
      }

      // Create half-resolution buffer.
      const sz = Math.floor(size / 2)
      const buffer = document.createElement('canvas')
      buffer.width = sz + 1
      buffer.height = sz + 1
      const ctx = buffer.getContext('2d') as CanvasRenderingContext2D
      const frame = ctx.getImageData(0, 0, sz + 1, sz + 1)

      let i = 0
      calculateMask(sz, sz, (x, y, c, a) => {
        frame.data[i++] = frame.data[i++] = frame.data[i++] = c * 255
        frame.data[i++] = a * 255
      })

      ctx.putImageData(frame, 0, 0)
      ;(ctxCircle.value as CanvasRenderingContext2D).drawImage(
        buffer,
        0,
        0,
        sz + 1,
        sz + 1,
        -sq,
        -sq,
        sq * 2,
        sq * 2
      )
    }

    /**
     * @description 绘制色盘上的标记点
     */
    const drawMarkers = () => {
      const sz = props.size
      const lw = Math.ceil(markerSize.value / 4)
      const r = markerSize.value - lw + 1
      const angle = Number(hsl.value[0]) * 6.28
      const x1 = Math.sin(angle) * radius.value
      const y1 = -Math.cos(angle) * radius.value
      const x2 = squareSize.value * (0.5 - Number(hsl.value[1]))
      const y2 = squareSize.value * (0.5 - Number(hsl.value[2]))
      const c1 = invert.value ? '#fff' : '#000'
      const c2 = invert.value ? '#000' : '#fff'
      const circles = [
        { x: x1, y: y1, r, c: '#000', lw: lw + 1 },
        { x: x1, y: y1, r: markerSize.value, c: '#fff', lw },
        { x: x2, y: y2, r, c: c2, lw: lw + 1 },
        { x: x2, y: y2, r: markerSize.value, c: c1, lw },
      ]

      // Update the overlay canvas.
      if (ctxOperation.value) {
        ctxOperation.value.clearRect(-mid.value, -mid.value, sz, sz)
        for (let i = 0; i < circles.length; i += 1) {
          const c = circles[i]
          ctxOperation.value.lineWidth = c.lw
          ctxOperation.value.strokeStyle = c.c
          ctxOperation.value.beginPath()
          ctxOperation.value.arc(c.x, c.y, c.r, 0, Math.PI * 2, true)
          ctxOperation.value.stroke()
        }
      }
    }

    const setColor = (hexColor: string) => {
      const unpack = hex2rgb(hexColor)
      if (color.value !== hexColor && unpack) {
        color.value = hexColor
        rgb.value = unpack
        hsl.value = rgb2hsl(rgb.value)
        updateDisplay()
      }
    }

    const setHSL = (hslValue: number[]) => {
      hsl.value = hslValue
      rgb.value = hsl2rgb(hslValue)
      color.value = rgb2hex(rgb.value)
      updateDisplay()
    }

    const updateDisplay = () => {
      // Determine whether labels/markers should invert.
      invert.value =
        rgb.value[0] * 0.3 + rgb.value[1] * 0.59 + rgb.value[2] * 0.11 <= 0.6

      // Draw markers
      drawMarkers()

      emit('update:modelValue', color.value)
    }

    const mousemove = (event: MouseEvent) => {
      const offset = {
        left: containerRef.value?.getBoundingClientRect().left as number,
        top: containerRef.value?.getBoundingClientRect().top as number,
      }

      const pos = {
        x: event.clientX - offset.left - mid.value,
        y: event.clientY - offset.top - mid.value,
      }

      // Set new HSL parameters
      if (circleDrag.value) {
        const hue = Math.atan2(pos.x, -pos.y) / 6.28
        setHSL([(hue + 1) % 1, hsl.value[1], hsl.value[2]])
      } else {
        const sat = Math.max(0, Math.min(1, -(pos.x / squareSize.value) + 0.5))
        const lum = Math.max(0, Math.min(1, -(pos.y / squareSize.value) + 0.5))
        setHSL([hsl.value[0], sat, lum])
      }
    }

    const mouseup = () => {
      document.removeEventListener('mousemove', mousemove)
      document.removeEventListener('mouseup', mouseup)
      dragging.value = false
    }

    const mousedown = (event: MouseEvent) => {
      if (props.disabled) return

      if (!dragging.value) {
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
      }

      dragging.value = true

      const offset = {
        left: containerRef.value?.getBoundingClientRect().left as number,
        top: containerRef.value?.getBoundingClientRect().top as number,
      }

      const pos = {
        x: event.clientX - offset.left - mid.value,
        y: event.clientY - offset.top - mid.value,
      }

      circleDrag.value =
        Math.max(Math.abs(pos.x), Math.abs(pos.y)) > squareSize.value / 2 + 2

      mousemove(event)
    }

    onMounted(() => {
      upscaleCanvas(canvasCircleRef.value)
      upscaleCanvas(canvasOperationRef.value)
      ctxCircle.value?.translate(mid.value, mid.value)
      ctxOperation.value?.translate(mid.value, mid.value)
      drawCircle()
      drawMask()
      setColor(props.modelValue || DEFAULT_START_COLOR)
    })

    watch(
      () => props.modelValue,
      (newValue) => {
        if (!dragging.value) {
          console.log(newValue)
          setColor(newValue)
        }
      }
    )

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
