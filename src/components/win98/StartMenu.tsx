import { useRef } from 'react';
import earthIcon from '../../assets/earth.ico';
import { useClickOutside } from '../../hooks/useClickOutside';

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenGame: () => void;
  onNewGame: () => void;
  onOpenGuide: () => void;
}

export function StartMenu({
  open,
  onClose,
  onOpenGame,
  onNewGame,
  onOpenGuide,
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
        <button type="button" role="menuitem" onClick={onOpenGuide}>
          <span className="startMenuGlyph">?</span>
          <span><b>玩法攻略</b><small>游戏说明与新手指南</small></span>
        </button>
      </div>
    </div>
  );
}
