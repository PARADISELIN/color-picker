import { defineComponent, ref, onMounted } from 'vue'

import ColorPicker from './components/ColorPicker'

const App = defineComponent({
  name: 'App',
  setup() {
    const color = ref('#fff')

    onMounted(() => {
      setTimeout(() => {
        color.value = '#ff0600'
      }, 3000)
    })

    return () => (
      <div>
        <div>{color.value}</div>
        <ColorPicker v-model={color.value} />
      </div>
    )
  },
})

export default App
