import { createApp } from "vue"
import { createPinia } from "pinia"
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Upload,
} from "ant-design-vue"
import "ant-design-vue/dist/reset.css"
import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "@/stores/auth"

const app = createApp(App)
const pinia = createPinia()
const components = [
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Upload,
]

app.use(pinia)
app.use(router)
components.forEach((component) => app.use(component))

// 尝试恢复会话
const auth = useAuthStore()
auth.fetchCurrentUser()

app.mount("#app")
