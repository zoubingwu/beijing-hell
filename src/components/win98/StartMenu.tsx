import { useRef } from 'react';
import earthIcon from '../../assets/earth.ico';
import { useClickOutside } from '../../hooks/useClickOutside';

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenGame: () => void;
  onNewGame: () => void;
}

export function StartMenu({
  open,
  onClose,
  onOpenGame,
  onNewGame,
}: StartMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);

  if (!open) return null;

  return (
    <div ref={ref} className="startMenu" role="menu">
      <div className="startMenuBrand">
        <strong>Windows</strong>
        <span>98</span>
      </div>
      <div className="startMenuItems">
        <button type="button" role="menuitem" onClick={onOpenGame}>
          <img src={earthIcon} alt="" />
          <span><b>北京浮生记</b><small>继续当前游戏</small></span>
        </button>
        <button type="button" role="menuitem" onClick={onNewGame}>
          <span className="startMenuGlyph">▣</span>
          <span><b>新游戏</b><small>从第一天重新开始</small></span>
        </button>
        <div className="startMenuSeparator" />
        <button type="button" role="menuitem" onClick={onOpenGame}>
          <span className="startMenuGlyph">?</span>
          <span><b>游戏帮助</b><small>打开游戏后使用“帮助”菜单</small></span>
        </button>
      </div>
    </div>
  );
}
