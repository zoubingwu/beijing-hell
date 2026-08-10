import { useState } from 'react';

interface ShortcutProps {
  title: string;
  icon: string;
  onOpen: () => void;
}

export function Shortcut({ title, icon, onOpen }: ShortcutProps) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      type="button"
      className={`desktopShortcut${selected ? ' selected' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        setSelected(true);
      }}
      onBlur={() => setSelected(false)}
      onDoubleClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={`打开${title}`}
    >
      <img src={icon} alt="" draggable={false} />
      <span>{title}</span>
    </button>
  );
}
