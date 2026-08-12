# C++ 原版玩法一致性基线

## 固定基线

- Web v2 基线：`c9ecb42d1f8956190d2172f46808196d525f5f6f`
- C++ 原版基线：`c57351d45102e0dfbe34ef9f282ce089b4c8a5a2`
- C++ index → TS itemId：`0 1 2 3 4 5 6 7` → `2 8 1 5 7 4 6 3`

## 一致性口径

1. 以 C++ 实际执行路径为准，不以冲突的帮助文字、注释或对话框文案为准。
2. 复刻稳定且可观察的怪异行为；不模拟列表控件越界、未定义行为等不稳定实现 bug。
3. 不复现旧 Windows C 运行库 `rand()` 的 seed 序列；给定相同整数随机值序列时，调用上界、顺序和状态结果必须一致。
4. Win32 整数溢出不视为可移植行为；Web 使用有限 JavaScript Number 算术，不静默 clamp。
5. 日记、自动保存和响应式界面不得改变经济、概率、回合或结算结果。

依据：`SelectionDlg.cpp:326-341,527-530,1187-1291,1407-1635,1781-1845`；`TopPlayerDlg.cpp:14-26,80-113,142-313`。

## 执行策略确认

| 策略 | 已确认决定 | 状态 |
|---|---|---|
| 稳定原版 bug | 复刻；未定义行为/列表控件 bug 不复刻 | 已确认 |
| 黑客事件 | 恢复设置开关，默认关闭；关闭时仍消费一次随机门值 | 已确认 |
| 排行榜 | 恢复原版预置 Top 10、姓名、健康和名声字段 | 已确认 |
| 旧 v1 存档 | 进行中的一局不迁移；保留旧 key；旧排行不混入原版 Top 10 | 已确认 |
| 退出行为 | 机场只显示信息；“结束本局”不自动清仓；关闭窗口不自动计分 | 已确认 |

## Parity 矩阵

| 领域 | 状态 | 主要源码依据 | 验收记录 |
|---|---|---|---|
| 初始化 | 已实施（Plan 003） | `SelectionDlg.cpp:326-341,527-530` | 40 回合、空地点、初始债务与市场已覆盖（`src/game/engine.test.ts`） |
| 价格 | 已实施（Plan 002） | `SelectionDlg.cpp:1187-1204` | C++ 顺序与可重复售罄已覆盖 |
| 18 商业事件 | 已接入 Plan003 | `SelectionDlg.cpp:1187-1291` | 18 行频率、整数乘除、赠品与手机欠款；随机事件解析器已集成每日旅行（`src/game/engine.test.ts`） |
| 12 健康事件 | 已接入 Plan003 | `SelectionDlg.cpp:1407-1635` | 顺序扫描、首个命中停止（`src/game/engine.test.ts`） |
| 7 金钱事件 | 已接入 Plan003 | `SelectionDlg.cpp:1781-1845` | 现金/存款整数公式与黑客门值（`src/game/engine.test.ts`） |
| 每日顺序 | 已实施（Plan 003） | `SelectionDlg.cpp:527-530` | 市场→利息→商业→健康→金钱→挨打→扣回合；住院/死亡边界已锁定 |
| 设施 | 已实施（Plan 004） | `SelectionDlg.cpp:882-932,1661-1686,1982-2008,2063-2097` | 手动卖货名声、医院3500/点、租房+10/上限140及网吧三次奖励边界已接入；交易与设施边界见 Plan 004 测试 |
| 地点 | 已实施（Plan 005） | `SelectionDlg.cpp:1295-1437,2290-2356` | 十个 slot，subway/surface 标签切换不耗回合；机场为静态信息（`src/components/game/GameWindow.test.tsx` 集成覆盖） |
| 结算 | 待实施 | `SelectionDlg.cpp` | 待后续计划填写 |
| 排行榜 | 待实施 | `TopPlayerDlg.cpp:14-26,80-113,142-313` | 待后续计划填写 |
| 持久化 | schema 4（Plan 005） | `beijing-hell:save:v4`；v1-v3 key 保留供后续迁移 | `src/game/persistence.browser.test.ts` 验证 v4 独立保存/清理；Plan007 负责迁移 |

> **已批准偏差（Plan 002）**：原版 `DoRandomStuff` 的 `exist` 标志未在每个赠品事件开始时重置，后续赠品可能沿用旧值并触发列表索引未定义行为。Web 解析器按每个赠品重新检查库存，不复刻该不稳定的列表越界行为。

Plan 002 验收测试：`src/game/random.test.ts`、`src/game/eventResolver.test.ts`。
