import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  buy,
  clearJournal,
  deposit,
  endEarly,
  heal,
  payDebt,
  rentStorage,
  restartGame,
  sell,
  travelTo,
  visitInternetCafe,
  withdraw,
} from '../../game/gameSlice';
import { NEWS_HEADLINES, STORAGE_PLANS } from '../../game/data/events';
import { ITEM_BY_ID } from '../../game/data/items';
import { LOCATIONS } from '../../game/data/locations';
import { formatMoney } from '../../game/format';
import {
  selectDayNumber,
  selectGame,
  selectStorageUsed,
  selectTotalWealth,
} from '../../game/selectors';
import type { ItemId, LocationId } from '../../game/types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Win98Dialog } from '../win98/Dialog';
import { SevenSegmentDisplay } from './SevenSegmentDisplay';

type DialogKind =
  | 'bank'
  | 'hospital'
  | 'post'
  | 'rent'
  | 'scores'
  | 'help'
  | 'about'
  | 'leave'
  | 'city'
  | 'restart'
  | 'result'
  | null;

type MenuKind = 'system' | 'places' | 'help' | null;

interface GameWindowProps {
  onClose: () => void;
  onMinimize: () => void;
}

interface NumberDialogProps {
  title: string;
  description: string;
  label: string;
  initialValue: number;
  confirmText: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
}

function NumberDialog({
  title,
  description,
  label,
  initialValue,
  confirmText,
  onConfirm,
  onClose,
}: NumberDialogProps) {
  const [value, setValue] = useState(String(Math.max(0, initialValue)));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm(Number(value));
    onClose();
  };

  return (
    <Win98Dialog title={title} onClose={onClose} width="small">
      <form className="dialogForm" onSubmit={submit}>
        <p>{description}</p>
        <label>
          <span>{label}</span>
          <input
            className="win98Input"
            type="number"
            min="1"
            step="1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
        </label>
        <div className="dialogButtons">
          <button className="win98Button defaultButton" type="submit">{confirmText}</button>
          <button className="win98Button" type="button" onClick={onClose}>取消</button>
        </div>
      </form>
    </Win98Dialog>
  );
}

const PRIMARY_LOCATION_IDS = new Set<LocationId>([
  3, 7, 5, 10, 9, 6, 1, 8, 4, 2,
]);
const PRIMARY_LOCATIONS = LOCATIONS.filter((location) =>
  PRIMARY_LOCATION_IDS.has(location.id),
);
const OTHER_LOCATIONS = LOCATIONS.filter(
  (location) => !PRIMARY_LOCATION_IDS.has(location.id),
);

const HELP_TEXT = [
  '一、在当前地点的黑市里低价买进物品。',
  '二、点击另一个地铁站移动；每次移动消耗一天。',
  '三、观察新地点的价格，把涨价的货物卖掉。',
  '四、现金会遭遇随机损失，存进银行更安全。',
  '五、欠村长的钱每天增加10%利息，超过十万会挨打。',
  '六、健康归零会立即失败；医院每恢复1点收费2500元。',
  '七、出租屋初始只能放100件货，可找中介换大房子。',
  '八、你只能在北京待40天，最后按现金+存款-债务结算。',
] as const;

export function GameWindow({ onClose, onMinimize }: GameWindowProps) {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  const dayNumber = useAppSelector(selectDayNumber);
  const storageUsed = useAppSelector(selectStorageUsed);
  const totalWealth = useAppSelector(selectTotalWealth);
  const [marketSelection, setMarketSelection] = useState<ItemId>(1);
  const [inventorySelection, setInventorySelection] = useState<ItemId | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [dialog, setDialog] = useState<DialogKind>(
    game.status === 'playing' ? null : 'result',
  );
  const [menu, setMenu] = useState<MenuKind>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  useClickOutside(menuRef, closeMenu, menu !== null);

  useEffect(() => {
    if (game.status !== 'playing') setDialog('result');
  }, [game.status]);

  useEffect(() => {
    const element = journalRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [game.journal.length]);

  useEffect(() => {
    const selectionExists = game.inventory.some(
      (item) => item.id === inventorySelection,
    );
    if (game.inventory.length > 0 && !selectionExists) {
      setInventorySelection(game.inventory[0]?.id ?? null);
    } else if (game.inventory.length === 0 && inventorySelection !== null) {
      setInventorySelection(null);
    }
  }, [game.inventory, inventorySelection]);

  const visibleMarket = useMemo(
    () => game.market.filter((item) => item.marketPrice > 0),
    [game.market],
  );
  const selectedMarket = game.market.find((item) => item.id === marketSelection);
  const selectedOwned = game.inventory.find((item) => item.id === inventorySelection);
  const parsedQuantity = Number(quantity);
  const canPlay = game.status === 'playing';
  const currentDay = game.totalDays - game.remainingTurns;
  const news = NEWS_HEADLINES[currentDay % NEWS_HEADLINES.length];

  useEffect(() => {
    if (!visibleMarket.some((item) => item.id === marketSelection)) {
      const firstAvailable = visibleMarket[0];
      if (firstAvailable) setMarketSelection(firstAvailable.id);
    }
  }, [marketSelection, visibleMarket]);

  const maximumBuy = useMemo(() => {
    if (!selectedMarket || selectedMarket.marketPrice <= 0) return 0;
    const affordable = Math.floor(game.cash / selectedMarket.marketPrice);
    return Math.max(0, Math.min(affordable, game.maxStorage - storageUsed));
  }, [game.cash, game.maxStorage, selectedMarket, storageUsed]);

  const executeBuy = () => {
    dispatch(buy({ itemId: marketSelection, quantity: parsedQuantity }));
  };

  const executeSell = () => {
    if (inventorySelection === null) return;
    dispatch(sell({ itemId: inventorySelection, quantity: parsedQuantity }));
  };

  const toggleMenu = (target: Exclude<MenuKind, null>) => {
    setMenu((current) => (current === target ? null : target));
  };

  const openDialog = (target: Exclude<DialogKind, null>) => {
    setMenu(null);
    setDialog(target);
  };

  const confirmRestart = () => {
    dispatch(restartGame());
    setMarketSelection(1);
    setInventorySelection(null);
    setQuantity('1');
    setDialog(null);
  };

  return (
    <div className="gameRoot">
      <nav className="windowMenuBar" ref={menuRef} aria-label="游戏菜单">
        <div
          className="menuSlot"
          onMouseEnter={() => {
            if (menu !== null) setMenu('system');
          }}
        >
          <button type="button" onClick={() => toggleMenu('system')}>系统(<u>S</u>)</button>
          {menu === 'system' ? (
            <div className="menuPopup" role="menu">
              <button type="button" role="menuitem" onClick={() => openDialog('restart')}>新游戏　　Ctrl+N</button>
              <button type="button" role="menuitem" onClick={() => openDialog('scores')}>高手排行</button>
              <div className="menuSeparator" />
              <button type="button" role="menuitem" onClick={() => openDialog('leave')}>结束本局</button>
              <button type="button" role="menuitem" onClick={onClose}>退出</button>
            </div>
          ) : null}
        </div>
        <div
          className="menuSlot"
          onMouseEnter={() => {
            if (menu !== null) setMenu('places');
          }}
        >
          <button type="button" onClick={() => toggleMenu('places')}>重要场所(<u>P</u>)</button>
          {menu === 'places' ? (
            <div className="menuPopup" role="menu">
              <button type="button" role="menuitem" onClick={() => openDialog('bank')}>银行</button>
              <button type="button" role="menuitem" onClick={() => openDialog('hospital')}>医院</button>
              <button type="button" role="menuitem" onClick={() => openDialog('post')}>邮局</button>
              <button type="button" role="menuitem" onClick={() => openDialog('rent')}>租房中介</button>
              <button type="button" role="menuitem" onClick={() => { dispatch(visitInternetCafe()); setMenu(null); }}>网吧</button>
              <button type="button" role="menuitem" onClick={() => openDialog('leave')}>首都国际机场</button>
            </div>
          ) : null}
        </div>
        <div
          className="menuSlot"
          onMouseEnter={() => {
            if (menu !== null) setMenu('help');
          }}
        >
          <button type="button" onClick={() => toggleMenu('help')}>帮助(<u>H</u>)</button>
          {menu === 'help' ? (
            <div className="menuPopup" role="menu">
              <button type="button" role="menuitem" onClick={() => openDialog('help')}>游戏说明</button>
              <button type="button" role="menuitem" onClick={() => openDialog('about')}>关于北京浮生记</button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="gameWorkspace">
        <div className="tradeArea">
          <section className="tradePanel marketPanel" aria-label="地铁门口的黑市">
            <h2>地铁门口的黑市</h2>
            <div className="dataGrid marketGrid" role="listbox" aria-label="黑市商品">
              <div className="dataGridHeader"><span>商品</span><span>黑市价格</span></div>
              {visibleMarket.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`dataGridRow${marketSelection === item.id ? ' selected' : ''}`}
                  onClick={() => setMarketSelection(item.id)}
                  onDoubleClick={() => {
                    setMarketSelection(item.id);
                    setQuantity('1');
                    dispatch(buy({ itemId: item.id, quantity: 1 }));
                  }}
                  role="option"
                  aria-selected={marketSelection === item.id}
                >
                  <span>{item.name}</span>
                  <span>{formatMoney(item.marketPrice)}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="tradeActions" aria-label="交易操作">
            <label htmlFor="trade-quantity">数量</label>
            <input
              id="trade-quantity"
              className="win98Input"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <div className="tradeActionButtons">
              <button
                className="win98Button tradeButton"
                type="button"
                disabled={!canPlay || !selectedOwned}
                onClick={executeSell}
              >
                &lt;= 卖出
              </button>
              <button
                className="win98Button tradeButton"
                type="button"
                disabled={!canPlay || !selectedMarket || selectedMarket.marketPrice === 0}
                onClick={executeBuy}
              >
                买进 =&gt;
              </button>
              <button
                className="win98Button"
                type="button"
                disabled={!canPlay || !selectedOwned}
                onClick={() => setQuantity(String(selectedOwned?.quantity ?? 1))}
              >
                全部卖出
              </button>
              <button
                className="win98Button"
                type="button"
                disabled={!canPlay || maximumBuy === 0}
                onClick={() => setQuantity(String(maximumBuy))}
              >
                最大买进
              </button>
            </div>
          </div>

          <section className="tradePanel inventoryPanel" aria-label="您的出租屋">
            <h2>您的出租屋里　{storageUsed}/{game.maxStorage}</h2>
            <div className="dataGrid inventoryGrid" role="listbox" aria-label="持有商品">
              <div className="dataGridHeader"><span>商品</span><span>买进价格</span><span>数量</span></div>
              {game.inventory.length === 0 ? (
                <div className="emptyInventory">目前空空如也，家徒四壁</div>
              ) : game.inventory.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`dataGridRow${inventorySelection === item.id ? ' selected' : ''}`}
                  onClick={() => setInventorySelection(item.id)}
                  onDoubleClick={() => {
                    setInventorySelection(item.id);
                    setQuantity(String(item.quantity));
                  }}
                  role="option"
                  aria-selected={inventorySelection === item.id}
                >
                  <span>{item.name}</span>
                  <span>{formatMoney(item.averagePrice)}</span>
                  <span>{item.quantity}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <fieldset className="journalPanel">
          <legend>我在北京的岁月</legend>
          <div className="journalScroll" ref={journalRef} aria-live="polite">
            {game.journal.length === 0 ? <p>日记本还是空的。</p> : game.journal.map((entry) => (
              <p key={entry.id} className={`journal-${entry.tone}`}>
                <b>[第{entry.day}天]</b> {entry.text}
              </p>
            ))}
          </div>
          <button className="win98Button journalClear" type="button" onClick={() => dispatch(clearJournal())}>清空日记</button>
        </fieldset>

        <div className="lowerArea">
          <fieldset className="statusPanel">
            <legend>您的状态</legend>
            <div className="statusRows">
              <div className="statusMoneyRow">
                <span>现金：</span>
                <SevenSegmentDisplay
                  value={game.cash}
                  tone="positive"
                  title={`${formatMoney(game.cash)} 元`}
                />
              </div>
              <div className="statusMoneyRow">
                <span>存款：</span>
                <SevenSegmentDisplay
                  value={game.savings}
                  tone="positive"
                  title={`${formatMoney(game.savings)} 元`}
                />
              </div>
              <div className="statusMoneyRow">
                <span>欠债：</span>
                <SevenSegmentDisplay
                  value={game.debt}
                  tone="debt"
                  title={`${formatMoney(game.debt)} 元`}
                />
              </div>
              <div className="statusVitals">
                <div>
                  <span>健康：</span>
                  <SevenSegmentDisplay
                    value={game.hitpoint}
                    tone="positive"
                    title={`健康值 ${game.hitpoint}`}
                    compact
                  />
                </div>
                <div>
                  <span>名声：</span>
                  <SevenSegmentDisplay
                    value={game.fame}
                    tone="positive"
                    title={`名声值 ${game.fame}`}
                    compact
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="locationPanel">
            <legend>北京地铁站</legend>
            <div className="locationGrid">
              {PRIMARY_LOCATIONS.map((target) => (
                <button
                  className={`win98Button locationButton${target.id === game.currentLocationId ? ' current' : ''}`}
                  type="button"
                  key={target.id}
                  disabled={!canPlay || target.id === game.currentLocationId}
                  onClick={() => dispatch(travelTo(target.id))}
                >
                  {target.name}
                </button>
              ))}
            </div>
            <button
              className="win98Button browseCityButton"
              type="button"
              disabled={!canPlay}
              onClick={() => setDialog('city')}
            >
              我要逛京城……
            </button>
          </fieldset>
        </div>

        <div className="facilityBar" aria-label="重要场所">
          <button className="win98Button" type="button" onClick={() => setDialog('bank')}>▣ 银行</button>
          <button className="win98Button" type="button" onClick={() => setDialog('hospital')}>✚ 医院</button>
          <button className="win98Button" type="button" onClick={() => setDialog('post')}>✉ 邮局</button>
          <button className="win98Button" type="button" onClick={() => setDialog('rent')}>⌂ 租房中介</button>
          <button className="win98Button" type="button" onClick={() => dispatch(visitInternetCafe())}>▧ 网吧</button>
          <button className="win98Button" type="button" onClick={() => setDialog('leave')}>✈ 机场</button>
          <button className="win98Button bossButton" type="button" onClick={onMinimize}>老板来了！</button>
        </div>
      </div>

      <div className="newsTicker">
        <b>实时新闻：</b><span>{news}</span><span>{dayNumber}:1.00</span><b>《北京真理报》</b>
      </div>

      {dialog === 'bank' ? (
        <Win98Dialog title="北京银行" onClose={() => setDialog(null)}>
          <div className="placeDialog">
            <p>银行可以保护你的钱不受街头亏钱事件影响。</p>
            <div className="placeStats"><span>身上现金：{formatMoney(game.cash)} 元</span><span>银行存款：{formatMoney(game.savings)} 元</span></div>
            <div className="splitActions">
              <NumberAction
                label="存款金额"
                initial={game.cash}
                button="存入"
                disabled={!canPlay || game.cash <= 0}
                onAction={(value) => dispatch(deposit(value))}
              />
              <NumberAction
                label="取款金额"
                initial={game.savings}
                button="取出"
                disabled={!canPlay || game.savings <= 0}
                onAction={(value) => dispatch(withdraw(value))}
              />
            </div>
            <div className="dialogButtons"><button className="win98Button" type="button" onClick={() => setDialog(null)}>关门</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'hospital' ? (
        <NumberDialog
          title="北京医院"
          description={`你目前有 ${game.hitpoint}/100 点健康。每恢复1点收费2,500元。`}
          label="恢复点数"
          initialValue={Math.min(100 - game.hitpoint, Math.floor(game.cash / 2_500))}
          confirmText="接受治疗"
          onConfirm={(value) => dispatch(heal(value))}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === 'post' ? (
        <NumberDialog
          title="北京邮局"
          description={`村长还等着你还 ${formatMoney(game.debt)} 元。欠款每天增加10%利息。`}
          label="还款金额"
          initialValue={Math.min(game.cash, game.debt)}
          confirmText="寄给村长"
          onConfirm={(value) => dispatch(payDebt(value))}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === 'rent' ? (
        <Win98Dialog title="北京租房中介" onClose={() => setDialog(null)} width="large">
          <div className="rentDialog">
            <p>当前出租屋容量：<b>{game.maxStorage}</b> 件。换更大的房子可以扩大生意。</p>
            <div className="rentPlans">
              {STORAGE_PLANS.map((plan) => (
                <button
                  className="win98Button rentPlan"
                  type="button"
                  key={plan.capacity}
                  disabled={!canPlay || plan.capacity <= game.maxStorage || plan.price > game.cash}
                  onClick={() => {
                    dispatch(rentStorage(plan.capacity));
                    setDialog(null);
                  }}
                >
                  <b>{plan.label}</b>
                  <span>容量：{plan.capacity} 件</span>
                  <span>租金：{formatMoney(plan.price)} 元</span>
                </button>
              ))}
            </div>
            <div className="dialogButtons"><button className="win98Button" type="button" onClick={() => setDialog(null)}>算了</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'city' ? (
        <Win98Dialog title="我要逛京城" onClose={() => setDialog(null)} width="large">
          <div className="cityDialog">
            <p>除了二环地铁的主要生意场所，俺还可以到北京其他地方碰碰运气。</p>
            <div className="cityLocationGrid">
              {OTHER_LOCATIONS.map((target) => (
                <button
                  className={`win98Button${target.id === game.currentLocationId ? ' current' : ''}`}
                  type="button"
                  key={target.id}
                  disabled={!canPlay || target.id === game.currentLocationId}
                  onClick={() => {
                    dispatch(travelTo(target.id));
                    setDialog(null);
                  }}
                >
                  {target.name}
                </button>
              ))}
            </div>
            <div className="dialogButtons"><button className="win98Button" type="button" onClick={() => setDialog(null)}>不逛了</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'scores' ? (
        <Win98Dialog title="北京富人榜 Top 10" onClose={() => setDialog(null)}>
          <div className="scoreDialog">
            {game.highScores.length === 0 ? <p>排行榜还是空的。完成一局并带着正资产回乡即可上榜。</p> : (
              <ol>{game.highScores.map((score) => (
                <li key={score.id}><b>{formatMoney(score.wealth)} 元</b><span>{new Date(score.completedAt).toLocaleDateString('zh-CN')}</span></li>
              ))}</ol>
            )}
            <div className="dialogButtons"><button className="win98Button" type="button" onClick={() => setDialog(null)}>确定</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'help' ? (
        <Win98Dialog title="北京浮生记 · 游戏说明" onClose={() => setDialog(null)} width="large">
          <div className="helpDialog">
            <h3>四十天北京生存指南</h3>
            {HELP_TEXT.map((text) => <p key={text}>{text}</p>)}
            <h3>商品提示</h3>
            <ul>{[...ITEM_BY_ID.values()].map((item) => <li key={item.id}><b>{item.name}：</b>{item.description}</li>)}</ul>
            <div className="dialogButtons"><button className="win98Button" type="button" onClick={() => setDialog(null)}>看明白了</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'about' ? (
        <Win98Dialog title="关于北京浮生记" onClose={() => setDialog(null)}>
          <div className="aboutDialog">
            <div className="aboutIcon">🌐</div>
            <div>
              <h3>北京浮生记 2.0</h3>
              <p>Win98 风格 React + TypeScript 重制版</p>
              <p>原作：Guoly Computing Company（1999-2001）</p>
              <p>本项目规则参考仓库 master 分支。</p>
              <p>
                GitHub：
                <a
                  className="aboutRepoLink"
                  href="https://github.com/zoubingwu/beijing-hell"
                  target="_blank"
                  rel="noreferrer"
                >
                  zoubingwu/beijing-hell
                </a>
              </p>
            </div>
            <div className="dialogButtons"><button className="win98Button defaultButton" type="button" onClick={() => setDialog(null)}>确定</button></div>
          </div>
        </Win98Dialog>
      ) : null}

      {dialog === 'restart' ? (
        <Win98Dialog title="新游戏" onClose={() => setDialog(null)} width="small">
          <div className="confirmDialog"><p>当前进度会被覆盖。真的要从第一天重新开始吗？</p><div className="dialogButtons"><button className="win98Button defaultButton" type="button" onClick={confirmRestart}>是</button><button className="win98Button" type="button" onClick={() => setDialog(null)}>否</button></div></div>
        </Win98Dialog>
      ) : null}

      {dialog === 'leave' ? (
        <Win98Dialog title="首都国际机场" onClose={() => setDialog(null)} width="small">
          <div className="confirmDialog"><p>现在离开会立刻按当前黑市价格卖掉全部货物并结算本局。确定登机吗？</p><div className="dialogButtons"><button className="win98Button defaultButton" type="button" disabled={!canPlay} onClick={() => { dispatch(endEarly()); setDialog(null); }}>离开北京</button><button className="win98Button" type="button" onClick={() => setDialog(null)}>再等等</button></div></div>
        </Win98Dialog>
      ) : null}

      {dialog === 'result' ? (
        <Win98Dialog title={game.status === 'won' ? '衣锦还乡' : '游戏结束'} onClose={() => setDialog(null)}>
          <div className="resultDialog">
            <div className="resultIcon">{game.status === 'won' ? '🏆' : '☹'}</div>
            <h3>
              {game.status === 'won'
                ? '恭喜！你活着离开了北京。'
                : game.hitpoint <= 0
                  ? '健康值归零，本局提前结束。'
                  : '胜败乃兵家常事，英雄请重新来过。'}
            </h3>
            {game.status === 'lost' && game.hitpoint <= 0 ? (
              <p>
                {game.debt > 100_000
                  ? '欠款超过十万元后，村长每天都会叫人来讨债并扣除30点健康。记得及时还款或去医院治疗。'
                  : '你在随机事件中耗尽了健康值。记得留意日记中的健康警告，及时去医院治疗。'}
              </p>
            ) : null}
            <p>最终财富：<b>{formatMoney(game.finalWealth ?? totalWealth)} 元</b></p>
            <div className="dialogButtons"><button className="win98Button defaultButton" type="button" onClick={confirmRestart}>重新开始</button><button className="win98Button" type="button" onClick={() => setDialog('scores')}>富人榜</button></div>
          </div>
        </Win98Dialog>
      ) : null}
    </div>
  );
}

interface NumberActionProps {
  label: string;
  initial: number;
  button: string;
  disabled: boolean;
  onAction: (value: number) => void;
}

function NumberAction({
  label,
  initial,
  button,
  disabled,
  onAction,
}: NumberActionProps) {
  const [value, setValue] = useState(String(Math.max(0, initial)));
  return (
    <form
      className="numberAction"
      onSubmit={(event) => {
        event.preventDefault();
        onAction(Number(value));
      }}
    >
      <label>{label}<input className="win98Input" type="number" min="1" step="1" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <button className="win98Button" type="submit" disabled={disabled}>{button}</button>
    </form>
  );
}
