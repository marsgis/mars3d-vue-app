/**
 * store 状态管理
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-02-19
 */
import { Store, createStore, useStore } from "vuex"
import { InjectionKey } from "vue"
import { getUserInformation } from "@mars/common/api"

export interface Point {
  name: string
  key?: string
  positions: number[]
  address?: string
  type?: string
  photos?: string
}

export interface Information {
  avatar: string
  email: string
  id: string
  phone: string
  user_name: string
}

export interface GlobalState {
  locate: Point // 当前位置信息
  userToken: any // 用于存储TOKEN
  userInformation: Information
  loginRedirect: string
  userPhone: string
}

export const key: InjectionKey<Store<GlobalState>> = Symbol("global")

export const globalStore = createStore<GlobalState>({
  state: {
    locate: {
      name: "我的位置",
      positions: [117.204844, 31.856972]
    },
    userToken: "",
    userInformation: null,
    loginRedirect: null,
    userPhone: null
  },
  getters: {},
  mutations: {
    updateLocate(state, point: Point) {
      state.locate = point
    },
    // 更新用户Token
    updateUserToke(state, token: any) {
      state.userToken = token
    },
    // 更新用户信息
    updateUserInformation(state, information: any) {
      state.userInformation = information
    },
    updateLoginRedirect(state, loginRedirect: string) {
      state.loginRedirect = loginRedirect
    },
    // 存储用户手机号码
    updateLoginPhone(state, userPhone: string) {
      state.userPhone = userPhone
    }
  },
  actions: {
    async getUserInfo({ commit }) {
      const { code, data } = await getUserInformation()

      if (code === 200) {
        commit("updateUserInformation", data)
      }
    }
  }
})

export function useGlobalStore() {
  const store = useStore(key)
  return {
    store
  }
}
