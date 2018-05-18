# 北京浮生记 2018 重制版

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
![travis](https://travis-ci.org/shadeofgod/beijing-hell.svg?branch=master)

## Disclaimer

此游戏基本玩法和数值设计等完全来自郭祥昊 @chrisguo 的[北京浮生记 PC 版](https://github.com/chrisguo/beijing_fushengji)，原作诞生于 2001 年，使用 C++ 编写，仅支持 Windows 平台，且使用图形界面交互。

出于学习和交流的目的，用 JavaScript 完全重写了整个项目，使用 Redux 架构来处理所有的游戏逻辑，并利用了倍恰提供的 API 接口，使得可以在[倍洽](https://bearychat.com/)这样的 IM 工具中通过文字来进行交互。

仅以此机器人纪念一熊最后一次也是我参加的唯一一次 hackathon. :joy:

More features may or may not be added in the future.

GUI or CLI version may or may not be added in the future.

## Introduction

Check the original game documentation [here](http://shadeofgod.github.io/beijing-hell)

### Structure

```
-- packages
 |-- bearyhubot  # 倍洽机器人模块
 |-- core        # 游戏逻辑核心模块
```

注：如果你需要部署到自己的机器人上，你需要在 `./packages/bearyhubot/src/` 目录下添加一个 `token.js` 文件：

```js
export const HUBOT_TOKEN = '<YOUR OWN HUBOT TOKEN>';
```

### Dev

```sh
npm install
npm run prepare
```

## LICENSE

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present, Bingwu Zou
