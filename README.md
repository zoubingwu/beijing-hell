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

打开 <http://localhost:1234> 后会自动打开游戏窗口；若关闭窗口，可双击桌面上的“北京浮生记”图标重新打开。

## 构建

```bash
pnpm typecheck
pnpm build
pnpm preview
```

## 玩法

你带着 2,000 元来到北京，同时欠村长 5,500 元。你只能在北京停留 40 天：

1. 在当前地点的黑市低价买进商品；前往其他站点一次消耗一天。
2. 随机事件不是每日必发，一天可能发生多个商业事件；事件顺序和随机上界遵循原版。
3. 欠款移动后增加10%、存款增加1%利息；医院手动治疗每点3,500元，低健康且余日充足时可能强制住院。
4. 租房要求现金至少30,000元，每次容量+10、最多140；网吧要求现金至少15元且一局最多三次。
5. 手动结束不清仓；机场只提供信息。余日归零时自动按事件后报价清仓，最终按“现金 + 存款 - 债务”结算。
6. 出售第7号或第5号商品会降低名声；死亡是否被观察以及结算原因由领域 `endReason`/`deathObserved` 决定。

游戏会自动保存到浏览器 localStorage。当前使用 schema 6 存档键 `beijing-hell:save:v6`，将活动局与 Top 10 排行榜分离保存；活动局损坏时仅新建活动局，仍保留有效排行榜。旧版 `beijing-hell:save:v1` 至 `beijing-hell:save:v5` 会被刻意保留且不读取、不覆盖。完成一局后，最终资产必须为正且达到当前榜尾门槛（榜单不足十人时只要求为正），才可进入本机 Top 10。

## 原版来源与实现边界

规则逐项对照 C++ 原版仓库固定提交：<https://github.com/chrisguo/beijing_fushengji/tree/c57351d45102e0dfbe34ef9f282ce089b4c8a5a2>（SHA-1：`c57351d45102e0dfbe34ef9f282ce089b4c8a5a2`），详见 [`docs/original-parity.md`](docs/original-parity.md)。Web 版本仅在界面交互、日记呈现和 schema 6 存档持久化层做增强，并记录已批准的可移植性偏差：注入式 RNG（同一调用 tape）、未定义行为，以及 JavaScript 安全整数饱和；UI 不改变玩法。
