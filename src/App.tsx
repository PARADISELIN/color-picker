import { defineComponent } from 'vue'

import ColorPicker from './components/ColorPicker'

const App = defineComponent({
  name: 'App',
  setup() {
    return () => (
      <div>
        <ColorPicker />
      </div>
    )
  },
})

export default App
