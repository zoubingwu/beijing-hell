# 北京浮生记 · Win98 Web 重制版

将《北京浮生记》完整迁移为现代浏览器游戏，同时保留 Windows 98 桌面与原版游戏窗口风格。

## 技术栈

- React 19
- Redux Toolkit 2
- React Redux 9
- TypeScript 7（严格模式）
- Vite 8

项目不再使用 Parcel、Babel、reackt、husky 或 gh-pages。

## 本地运行

需要 Node.js 24+ 与 pnpm 11+。

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:1234>，双击桌面上的“北京浮生记”图标。

## 构建

```bash
pnpm typecheck
pnpm build
pnpm preview
```

## 玩法

你带着 2,000 元来到北京，同时欠村长 5,500 元。你只能在北京停留 40 天：

1. 在当前地点的黑市低价买进商品。
2. 前往其他地铁站；每次移动消耗一天。
3. 在新地点高价卖出商品。
4. 利用银行保护现金，去医院恢复健康，在邮局偿还每天增长 10% 的债务。
5. 通过租房中介扩大初始 100 件的储物容量。
6. 扛过市场、现金与健康随机事件，在第 40 天按“现金 + 存款 - 债务”结算。

游戏会自动保存到浏览器 localStorage。完成一局且最终资产为正即可进入本机 Top 10。

游戏规则和文案以仓库 `master` 分支的 core / bearyhubot 实现及原版文档为基础；迁移时修复了非法数量交易、最后一站不可达、重复售罄、终局货物无法结算等历史问题。
