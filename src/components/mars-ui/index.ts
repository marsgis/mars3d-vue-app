/**
 * 统一导出公共组件, 按需初始化ant-design-vue
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-01-01
 */
import { App } from "vue"
import MarsPannel from "./mars-pannel/index.vue"
// import MarsIcon from "./mars-icon/index.vue"
// import MarsImage from "./mars-image/index.vue"
// import MarsButton from "./mars-button/index.vue"
// import MarsDivider from "./mars-divider/index.vue"
// import MarsSearch from "./mars-search/index.vue"
import MarsCell from "./mars-cell/index.vue"
import MarsSwitch from "./mars-switch/index.vue"
// import MarsSwipeCell from "./mars-swipe-cell/index.vue"
// import MarsEmpty from "./mars-empty/index.vue"
// import MarsActionSheet from "./mars-action-sheet/index.vue"
// import MarsRadioGrooup from "./mars-radio-group/index.vue"
// import MarsRadio from "./mars-radio/index.vue"
// import MarsNavBar from "./mars-nav-bar/index.vue"
// import MarsField from "./mars-field/index.vue"
// import MarsCheckbox from "./mars-checkbox/index.vue"
// import MarsCollapse from "./mars-collapse/index.vue"
// import MarsCollapseItem from "./mars-collapse-item/index.vue"
// import MarsColorPicker from "./mars-color-picker/index.vue"
// import MarsColorCell from "./mars-color-cell/index.vue"
// import MarsSelect from "./mars-select/index.vue"
// import MarsInputNumber from "./mars-input-number/index.vue"
// import MarsSwitchCell from "./mars-switch-cell/index.vue"
// import MarsSlider from "./mars-slider/index.vue"
// import MarsSliderCell from "./mars-slider-cell/index.vue"
// import MarsTab from "./mars-tab/index.vue"
// import MarsTabs from "./mars-tabs/index.vue"
import MarsPopup from "./mars-popup/index.vue"
// import MarsDropdownItem from "./mars-dropdown-item/index.vue"
// import MarsDropdownMenu from "./mars-dropdown-menu/index.vue"
// import MarsGrid from "./mars-grid/index.vue"
// import MarsGridItem from "./mars-grid-item/index.vue"
// import MarsSidebar from "./mars-sidebar/index.vue"
// import MarsSidebarItem from "./mars-sidebar-item/index.vue"

import MarsMessage, { $message as marsMessage } from "./mars-message"
import MarsDialog, { $dialog as marsDialog } from "./mars-dialog"
// import MarsNotify, { $shownotify as marsShowNotify, $clearNotify as marsClearNotify } from "./mars-notify"
// import MarsLoading, { $hideLoading as marsHideLoading, $showLoading as marsShowLoading } from "./mars-loading"
import {
  Icon,
  Image,
  Button,
  Divider,
  Popup,
  Search,
  Cell,
  CellGroup,
  Switch,
  SwipeCell,
  Empty,
  ActionSheet,
  RadioGroup,
  Radio,
  Col,
  Row,
  Grid,
  GridItem,
  List,
  NavBar,
  Field,
  Form,
  Uploader,
  Checkbox,
  Dialog,
  DatePicker,
  Slider,
  ConfigProvider,
  Sticky,
  DropdownMenu,
  DropdownItem,
  PullRefresh,
  Step,
  Steps,
  Stepper,
  Collapse,
  CollapseItem,
  Tab,
  Tabs,
  Picker,
  Sidebar,
  SidebarItem,
  Progress
} from "vant"
import "./function.less"

export const $dialog = marsDialog
export const $message = marsMessage
// export const $notify = marsShowNotify
// export const $clearNotify = marsClearNotify
// export const $hideLoading = marsHideLoading
// export const $showLoading = marsShowLoading

const components = [
  MarsPannel,
  // MarsIcon,
  // MarsImage,
  // MarsButton,
  // MarsDivider,
  // MarsSearch,
  MarsCell,
  MarsSwitch,
  // MarsSwitchCell,
  // MarsSwipeCell,
  // MarsEmpty,
  // MarsActionSheet,
  // MarsRadioGrooup,
  // MarsRadio,
  // MarsNavBar,
  // MarsField,
  // MarsCheckbox,
  // MarsCollapse,
  // MarsCollapseItem,
  // MarsColorPicker,
  // MarsColorCell,
  // MarsSelect,
  // MarsInputNumber,
  // MarsSlider,
  // MarsSliderCell,
  // MarsTab,
  // MarsTabs,
  MarsPopup
  // MarsDropdownItem,
  // MarsDropdownMenu,
  // MarsGrid,
  // MarsGridItem,
  // MarsSidebar,
  // MarsSidebarItem
]

let marsUIConfig: Record<string, any>

export const getConfig = () => {
  return marsUIConfig
}

export default function (app: App, config: Record<string, any> = {}): App {
  marsUIConfig = config

  app.use(Image)
  app.use(Button)
  app.use(Divider)
  app.use(Popup)
  app.use(Search)
  app.use(Cell)
  app.use(SwipeCell)
  app.use(Switch)
  app.use(Empty)
  app.use(Col)
  app.use(Row)
  app.use(Grid)
  app.use(GridItem)
  app.use(List)
  app.use(ActionSheet)
  app.use(NavBar)
  app.use(Slider)
  app.use(Field)
  app.use(Uploader)
  app.use(Form)
  app.use(DatePicker)
  app.use(CellGroup)
  app.use(Checkbox)
  app.use(Icon)
  app.use(Sticky)
  app.use(Dialog)
  app.use(ConfigProvider)
  app.use(DropdownMenu)
  app.use(DropdownItem)
  app.use(PullRefresh)
  app.use(Step)
  app.use(Steps)
  app.use(Stepper)
  app.use(Collapse)
  app.use(CollapseItem)
  app.use(Radio)
  app.use(RadioGroup)
  app.use(Tabs)
  app.use(Tab)
  app.use(Picker)
  app.use(Sidebar)
  app.use(SidebarItem)
  app.use(Progress)
  components.forEach((comp) => {
    app.component(comp.name, comp)
  })
  // MarsNotify(app)
  MarsMessage(app)
  // MarsLoading(app)
  MarsDialog(app)
  return app
}
