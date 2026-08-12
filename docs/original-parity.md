# C++ 原版玩法一致性矩阵

## 固定基线与验收口径

- C++ 原版：[`chrisguo/beijing_fushengji@c57351d45102e0dfbe34ef9f282ce089b4c8a5a2`](https://github.com/chrisguo/beijing_fushengji/tree/c57351d45102e0dfbe34ef9f282ce089b4c8a5a2)
- Web 对照基线：`c9ecb42d1f8956190d2172f46808196d525f5f6f`
- C++ 商品下标 `0 1 2 3 4 5 6 7` → Web `itemId` `2 8 1 5 7 4 6 3`
- 以 C++ 可执行控制流为准；冲突的 `oldhelp`、注释或对话框说明不作为规则来源。
- 下表测试名与当前仓库的 `describe` / `it` 标题一致；“通过”表示严格随机带、状态断言或 UI 集成断言已经覆盖该规则。

## Parity 矩阵

| 规则 | C++ 源码（固定提交中的行） | Web 实现 | 自动验收（文件 > describe > it） | 结论 |
|---|---|---|---|---|
| 初始化：现金 2,000、源码初始债务 5,000、存款 0、健康/名声 100、容量 100、40 回合、空地点 | `SelectionDlg.cpp:326-341, 446-530, 2111-2180`；首次可操作前利息 `1410-1425` 把债务变为 5,500 | `createNewGameState`, `createMarket` | `src/game/engine.test.ts` > `pure original turn engine` > `starts with forty turns and no location` | 通过；Web 首屏直接保存可见债务 5,500 |
| 八种价格的 C++ RNG 顺序与商品映射 | `SelectionDlg.cpp:1187-1212` | `createMarket` | `src/game/random.test.ts` > `Plan 002 random tables` > `returns exact prices with no sold-out items` | 通过 |
| 三次售罄抽签允许重复；最后两回合不售罄且仍生成八种报价 | `SelectionDlg.cpp:1187-1212, 1452-1455` | `createMarket`, `resolveTravel` | `src/game/random.test.ts` > `Plan 002 random tables` > `makes one sold-out item for three identical indexes`；`src/game/engine.test.ts` > `pure original turn engine` > `remaining %i consumes only eight market prices` | 通过 |
| 18 条商业事件、同日多事件、乘除、赠品和强制手机欠款 | `SelectionDlg.cpp:1214-1291` | `MARKET_EVENT_DEFINITIONS`, `resolveMarketEvents` | `src/game/random.test.ts` > `Plan 002 random tables` > `asserts all 18 market rows and exact descriptions`；`src/game/eventResolver.test.ts` > `event resolver parity` > `applies same-item events in log order` | 通过 |
| 12 条健康事件按表扫描，首个命中即停止 | `SelectionDlg.cpp:1550-1600` | `HEALTH_EVENTS`, `resolveHealthEvent` | `src/game/random.test.ts` > `Plan 002 random tables` > `asserts health and cash rows`；`src/game/eventResolver.test.ts` > `event resolver parity` > `resolves health first hit, later hit, and no hit` | 通过 |
| 7 条现金/存款事件、命中即停止；黑客门值及存款方向 | `SelectionDlg.cpp:1781-1860` | `CASH_EVENTS`, `resolveCashEvent` | `src/game/eventResolver.test.ts` > `event resolver parity` > `resolves cash and savings with accurate target logs`；`uses the corrected high-bank hacker direction and exact amounts` | 通过 |
| RNG 上界与调用顺序；相同整数带得到相同状态 | `SelectionDlg.cpp:96-104, 1187-1291, 1550-1635, 1781-1860` | `GameRuntime.nextInt`, `createRandomTape` | `src/game/runtime.test.ts` > `strict integer random tape` > `reports an unexpected upper bound`；`src/game/engine.test.ts` > `pure original turn engine` > `identical state and strict tape produce identical resolution` | 通过 |
| 每日顺序：价格 → 债务/存款利息 → 商业 → 健康/住院/死亡 → 现金/黑客 → 欠债挨打 → 扣回合 | `SelectionDlg.cpp:1410-1425, 1447-1543` | `resolveTravel` | `src/game/engine.test.ts` > `pure original turn engine` > `logs phone, health, hospital, cash, beating in exact order and amount`；`src/game/integration.test.ts` > `Plan008 production integration` > `resolves dense market, health, cash, phone, hacker, and beating events` | 通过 |
| 债务每次移动 +10%，存款 +1%，均使用整数截断 | `SelectionDlg.cpp:1410-1425` | `resolveTravel` | `src/game/engine.test.ts` > `pure original turn engine` > `does not mutate input and applies debt interest before decrement`；`applies savings interest deterministically` | 通过 |
| 健康低于 85 且剩余回合 >3 时强制住院；延迟 1/2 天、增加欠款、健康 +10 | `SelectionDlg.cpp:1600-1621` | `resolveTravel` | `src/game/engine.test.ts` > `pure original turn engine` > `health exactly 84 enters hospital`；`hospital delay 2 consumes RNG in order`；`remaining 3 does not enter hospital` | 通过 |
| 健康 0 存活；仅 `<0` 进入死亡观察；死亡处理返回后外层日循环仍可继续 | `SelectionDlg.cpp:1623-1635`，外层继续 `1461-1543` | `deathObserved`, `TravelResolution.outcome` | `src/game/engine.test.ts` > `pure original turn engine` > `health zero survives`；`negative health remaining two dies after outer cash and turn`；`negative health remaining one observes death but completes` | 通过 |
| 欠债超过 100,000 后扣 30 健康；本次扣减不会回头重做死亡观察 | `SelectionDlg.cpp:1467-1478` | `resolveTravel` | `src/game/engine.test.ts` > `pure original turn engine` > `debt beating can drive health below zero without observing death` | 通过 |
| 无住院时 40 次合法移动耗尽回合 | `SelectionDlg.cpp:1447-1543` | `travelTo`, `resolveTravel` | `src/game/integration.test.ts` > `Plan008 production integration` > `completes forty quiet travels, alternates destinations, and creates one pending score` | 通过，严格带全部消费 |
| 首回合住院延迟 2 天时仅需 38 次合法移动 | `SelectionDlg.cpp:1600-1621` | `remainingTurns`, `travelTo` | `src/game/integration.test.ts` > `Plan008 production integration` > `accounts for a first-turn two-day hospital stay and compounded debt` | 通过，旅行数与欠款逐日手算 |
| 买入现金/容量边界、整数加权均价；卖出按现价回款；售罄不可卖 | `SelectionDlg.cpp:650-715, 753-954` | `buy`, `sell`, `weightedAverage` | `src/game/transactions.test.ts` > `交易 reducers` > `buys cash, capacity, and weighted average price`；`rejects unavailable quote and overselling, including quote zero, preserving fame` | 通过 |
| 卖第 7/5 号商品分别扣名声 7/10；零数量确认仍扣，名声不低于 0 | `SelectionDlg.cpp:890-932` | `sell` | `src/game/transactions.test.ts` > `交易 reducers` > `item seven penalty is independent of quantity, split sales stack, and sell zero still penalizes`；`item five penalty is ten and clamps fame at zero; split sales apply twice` | 通过 |
| 银行存取款 | `SelectionDlg.cpp:1642-1658`；`EnterBank.cpp:49-75`；`BankJiaoyi.cpp:29-64` | `deposit`, `withdraw` | `src/game/transactions.test.ts` > `交易 reducers` > `deposit, withdraw, and debt payment enforce max bounds` | 通过 |
| 邮局还债不得超过现金或欠款 | `SelectionDlg.cpp:1703-1765`；`ReplayLoad.cpp:18-60` | `payDebt` | `src/game/transactions.test.ts` > `交易 reducers` > `debt payment is limited by available cash` | 通过 |
| 手动医院每点 3,500，治疗可从负健康开始且不超过 100 | `SelectionDlg.cpp:1661-1700`；`Hispital.cpp:18-59` | `heal` | `src/game/facilities.test.ts` > `设施 reducers and thunk guards` > `heals three points for 10500, including negative health` | 通过 |
| 租房：至少 30,000；容量 +10，最大 140；现金分段公式 | `SelectionDlg.cpp:2063-2108` | `rentStorage` | `src/game/facilities.test.ts` > `设施 reducers and thunk guards` > `rent boundary cash %i at capacity %i gives cash %i`；`rejects rent at max capacity` | 通过 |
| 网吧：现金至少 15，一局最多 3 次，奖励 `1+RandomNum(10)` | `SelectionDlg.cpp:1983-2016` | `visitInternetCafe`, `cafeReward` | `src/game/facilities.test.ts` > `设施 reducers and thunk guards` > `cafe cash boundary %i`；`cafe rewards RNG zero as one and RNG nine as ten, then caps at three without RNG` | 通过 |
| 十个逻辑槽位、地铁/地面成对名称；切换模式不耗回合 | `SelectionDlg.cpp:1295-1443, 2290-2356` | `LOCATIONS`, `toggleLocationMode` | `src/game/locations.test.ts` > `Plan005 location slots` > `matches the exact subway/surface mapping`；`toggles mode without changing any other state or consuming runtime` | 通过 |
| 机场仅打开信息，不结算、不消耗 RNG | `SelectionDlg.cpp:1767-1777, 1976-1980` | `GameWindow` airport dialog | `src/components/game/GameWindow.test.tsx` > `GameWindow airport integration` > `opens and closes airport information without changing game state` | 通过 |
| 自动结束按当日事件后的报价清仓，再按现金+存款−欠款结算 | `SelectionDlg.cpp:1479-1543, 1892-1953` | `finishGame(true)` | `src/game/scoring.integration.test.ts` > `production scoring flow` > `final market event adjusts liquidation quote exactly` | 通过 |
| “结束本局”按现有流动资产结算且不清仓 | C++ 窗口取消不含自动清仓；Web 按已确认的退出行为独立提供显式动作 | `endEarly`, `finishGame(false)` | `src/game/scoring.integration.test.ts` > `production scoring flow` > `manual qualifying end preserves inventory and computes exact pending score` | 通过；属于已确认的 Web 显式入口 |
| 普通死亡不评分；末日健康死亡仍继续自动结算；末日欠债挨打为负但未观察死亡 | `SelectionDlg.cpp:1629-1635` 与外层 `1461-1543`；评分 `1892-1953` | `endReason`, `deathObserved`, `finishGame` | `src/game/scoring.integration.test.ts` > `production scoring flow` > `ordinary death with two turns left loses without pending score`；`final-day health death completes, submits, and round-trips persistence`；`final debt beating completes without observing death and does not qualify` | 通过 |
| 原版预置 Top 10、财富门槛、同分插前、姓名/健康/名声、10–19 名声标签怪异行为 | `TopPlayerDlg.cpp:14-26, 80-113, 142-313` | `DEFAULT_HIGH_SCORES`, `qualifyScore`, `insertScore`, `fameLabel` | `src/game/scoring.test.ts` > `scoring` > `matches every default leaderboard object exactly`；`inserts a score before an equal existing score`；`maps fame boundary %s` | 通过 |
| schema 6：活动局与榜单独立校验，保留且不读取 v1–v5，损坏一侧不抹除另一侧 | C++ N/A（Web 持久化增强） | `parsePersistedState`, `serializePersistedState`, `createInitialGameState` | `src/game/persistence.test.ts` > `schema 6 persistence envelope` > `round-trips a valid active game and rankings exactly`；`keeps valid rankings but drops an invalid active game`；`src/game/persistence.browser.test.ts` > `browser persistence schema 6 key isolation` > `preserves v1-v5 sentinels while saving and clearing only v6` | 通过 |
| 一条混合整局路径穿插交易/银行/医院/租房/网吧、商业/健康/存款/黑客事件、住院、自动清仓、完整 Top 10 与重载 | 上述 C++ 路径组合 | production store/thunks + schema 6 parser | `src/game/integration.test.ts` > `Plan008 production integration` > `runs the hand-derived forty-day mixed C++ trace through settlement, Top 10, and reload` | 通过；单条严格随机带、38 次旅行、完整终态 |

## 已批准偏差

1. **UI、声音与辅助层**：不复刻 MFC 外观和声音；保留 React/Win98 风格界面、响应式布局、日记、自动保存和安全的 schema 迁移。它们不得改变领域金额、概率、RNG 调用或回合结果。
2. **随机种子**：不复刻特定 Windows CRT `rand()` seed 序列；给定相同整数随机带时，`maxExclusive`、调用顺序、消费量和状态必须一致。
3. **未定义实现行为**：不复刻商业赠品 `exist` 标志未重置、MFC 列表索引/控件损坏、旧编译器作用域问题或其他未定义行为；Web 对每次赠品稳定检查库存。
4. **整数溢出**：不复刻 Win32 32 位溢出。Web 的 engine、selectors 与 persistence 共用 JavaScript 安全整数饱和策略，并以 BigInt 计算需要精确中间值的财富和加权均价。
5. **Web 显式入口**：机场保持信息窗口；“结束本局”是单独的手动结算动作，不等同于自动终局清仓；关闭游戏窗口不自动评分。

## 验收记录

- 自动化：`pnpm test:run`、`pnpm typecheck`、`pnpm build`、`git diff --check` 均通过（最终提交前复核）。
- 浏览器 smoke（本地 Vite + 现有 Chrome profile）：桌面视口已验证自动打开、买卖、地点模式/移动、银行、医院、邮局、租房入口、网吧、机场、帮助与手动结束入口；刷新后 schema 6 精确恢复 `remainingTurns`、现金、存款、地点槽位/模式和网吧次数。390×844 移动 iframe 视口验证页面无横向溢出，游戏窗口可见，taskbar 固定底部且严格单行 30px。自动/普通死亡/末日死亡、Top 10 姓名提交和重载由严格 production-store/jsdom 集成测试覆盖。

维护规则：以后修改 `src/game` 时，必须同步更新本矩阵和对应严格随机带/特征测试；任何脱离原版的规则调整都必须显式记录为偏差。
