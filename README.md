<p align="center">
<img src="//mars3d.cn/logo.png" width="300px" />
</p>

<p align="center">基于Vue3和Mars3D🌎开发的三维地球app</p>

<p align="center">
  <a target="_black" href="https://www.npmjs.com/package/mars3d">
    <img alt="Npm version" src="https://img.shields.io/npm/v/mars3d.svg?style=flat&logo=npm&label=版本号" />
  </a>
  <a target="_black" href="https://www.npmjs.com/package/mars3d">
    <img alt="Npm downloads" src="https://img.shields.io/npm/dt/mars3d?style=flat&logo=npm&label=下载量" />
  </a>
  <a target="_black" href="https://github.com/marsgis/mars3d">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/marsgis/mars3d?style=flat&logo=github" />
  </a>
  <a target="_black" href="https://gitee.com/marsgis/mars3d">
    <img src="https://gitee.com/marsgis/mars3d/badge/star.svg?theme=dark" alt="star" />
  </a>
</p>

## 项目介绍

三维地球 App 是基于[Mars3D 平台](http://mars3d.cn)做的一个移动端应用，提供的一个移动端项目模版，包含常用基础地图功能，方便快速搭建三维地图产品，敏捷开发，可复用，支持各种配置，适合各种场景使用。

## 项目特性

- **最新技术栈**：使用 Vue3/Vite 等前端前沿技术开发
- **TypeScript**: 应用程序级 JavaScript 的语言

## 视频讲解


建议先看一遍视频讲解，再实际操作。您可以
1. [基础讲解-新页面查看高清视频](https://www.bilibili.com/video/BV1iY4y1t7jk/) 
2. [高级讲解-新页面查看高清视频](https://www.bilibili.com/video/BV1CD4y137jK/) 




## 下载运行项目

### 下载代码

- [Github](https://github.com/marsgis/mars3d-vue-app)

```
git clone git@github.com:marsgis/mars3d-vue-app.git
```

- [Gitee](https://gitee.com/marsgis/mars3d-vue-app)：国内码云，下载速度快些。

```
git clone git@gitee.com:marsgis/mars3d-vue-app.git
```

### 运行环境

- 推荐使用 vscode，安装参考[开发环境搭建教程](/guide/start/env.html)
- 安装 vscode 插件，推荐安装 volar（并禁用 vetur）、ESlint 、 Prettier
- 配置 vscode 参数

```json
// setting.json相关配置
{
  "eslint.format.enable": true,
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 运行命令
请将机器Node版本升级到v16及以上版本

#### 首次运行前安装依赖

```
npm install

//或使用代理
npm i --registry=http://registry.taobao.org
```

#### 启动开发环境

```
npm run serve
```

#### 编译构建

```
npm run build
```


### 打包为安卓和苹果app的流程
 
#### 编译发布版文件
1. 执行命令`npm run build:app`
2. 将dist目录内所有文件剪切覆盖至HBuilderX工程，假设是pack目录(移动后有pack\index.html页面)

#### HBuilderX打包apk
1. 通过HBuilderX打开pack目录
2. 根据需要调整manifest.json配置(如id、app名称等)
3. 预览下index.html页面，各项功能正常操作
4. 通过HBuilderX打开菜单“打包”->"云打包"打包pak文件



## 运行效果

访问[三维地球 APP 软件](http://mars3d.cn/project/app/index.html) 在线体验效果和功能(电脑端访问时需要打开 F12 手机模拟)

手机可以扫描直接体验：

<img src="http://marsgis.cn/img/project/mars3d-vue-app/qrcode.png" width = "200" />
 

## 项目架构

### 技术选型

- [node](http://nodejs.org/) 和 [git](https://git-scm.com/) ：项目开发环境
- [Vue3](https://v3.cn.vuejs.org/api/)：开发框架
- [Vite](https://vitejs.dev/)：开发环境
- [TypeScript](https://www.tslang.cn/):开发语言
- [Es6+](http://es6.ruanyifeng.com/) - 熟悉 es6 基本语法
- [Vant](https://youzan.github.io/vant/#/zh-CN/)：UI 控件库
- [ESlint](https://eslint.bootcss.com/)：代码检查工具
- [IconPark](https://iconpark.oceanengine.com/official)：UI 图标库

> 需要有一定的知识储备，包括 vue3.0 中的 composition Api 模式等，建议浏览下[Web 前端知识视频讲解](https://www.bilibili.com/video/BV1xr4y1U73r/)

### 主要目录说明

```
mars3d-vue-app
└───public              静态资源
│   └───config          地图的配置文件等
│   └───img             图片资源
│
└───src                 主要项目代码
│   └───common          公共核心文件
│   └───components      公共组件（重要）
│   └───misc            ts模块定义
│   └───utils           工具方法
│   └───views           存放路由页面（重要）
│   └───main.ts         主入口文件
│   └───routes.ts       路由配置文件
│
│─── package.json        项目配置信息
│─── vite.config.ts      vite 配置文件
│─── tsconfig.js         ts 配置文件
│─── .eslintrc.js        eslint配置文件
└─── index.html          页面入口
```

## 开发中常见问题

### 1. 如何切换 mars3d 到授权版

 参考 [获取Mars3D](http://mars3d.cn/dev/guide/start/download.html)中“从 Mars3D官网 下载获取”章节介绍。

流程大概是：
- 配置后，无需改动源码，在项目代码中使用时与使用npm包是一样的方式，如 `import * as mars3d from "mars3d";`
- 将 npm 安装后的`node_modules/mars3d/`下的所有文件拷贝一份放在`packages/mars3d/`目录。
- 将`mars3d-sdk.rar`离线包内文件 覆盖至`packages/mars3d/dist/`目录下。
- 修改`package.json`中mars3d包配置为：` "mars3d": "file:packages/mars3d",`
 
![image](http://mars3d.cn/dev/img/guide/basics-download-import.jpg)


### 2. 局域网离线使用时注意事项

平台所有代码层面来说支持离线运行和使用的，但需要注意的是离线时的地图服务的相关处理。

如果局域网内有相关地形、卫星底图服务可以按内网服务类型和 URL 地址替换下`config.json`或`构造Map的代码中`的默认地形和底图。

如果局域网内没有相关服务，可以按下面处理：

- 修改 config.json 中`terrain`配置中，将已有的`"show": true`配置，改为`"show": false`
- 修改 config.json 中`basemaps`数组配置中，将已有的`"show": true`的图层，将该值改为`"show": false` ，并将单张图片或离线地图加上`"show": true`，并修改相关 URL 地址。
- 您也可以参考教程[发布三维数据服务](http://mars3d.cn/dev/guide/data/server.html)进行部署离线地图服务，里面也有一些示例离线数据。

## Mars3D 是什么

> `Mars3D平台` 是[火星科技](http://marsgis.cn/)研发的一款基于 WebGL 技术实现的三维客户端开发平台，基于[Cesium](https://cesium.com/cesiumjs/)优化提升与 B/S 架构设计，支持多行业扩展的轻量级高效能 GIS 开发平台，能够免安装、无插件地在浏览器中高效运行，并可快速接入与使用多种 GIS 数据和三维模型，呈现三维空间的可视化，完成平台在不同行业的灵活应用。

> Mars3D 平台可用于构建无插件、跨操作系统、 跨浏览器的三维 GIS 应用程序。平台使用 WebGL 来进行硬件加速图形化，跨平台、跨浏览器来实现真正的动态大数据三维可视化。通过 Mars3D 产品可快速实现浏览器和移动端上美观、流畅的三维地图呈现与空间分析。

### 相关网站

- Mars3D 官网：[http://mars3d.cn](http://mars3d.cn)

- Mars3D 开源项目列表：[https://github.com/marsgis/mars3d](https://github.com/marsgis/mars3d)

## 版权说明

1. Mars3D 平台由[火星科技](http://marsgis.cn/)自主研发，拥有所有权利。
2. 任何个人或组织可以在遵守相关要求下可以免费无限制使用。
