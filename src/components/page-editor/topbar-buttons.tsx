
"use client";

import { useEditor } from '@grapesjs/react';
import { mdiArrowULeftTop, mdiArrowURightTop, mdiBorderRadius, mdiXml } from '@mdi/js';
import Icon from '@mdi/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandButton {
  id: string;
  iconPath: string;
  options?: Record<string, any>;
  disabled?: () => boolean;
}

export function TopbarButtons({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const editor = useEditor();
  const [, setUpdateCounter] = useState(0);
  const { UndoManager, Commands } = editor;

  const cmdButtons: CommandButton[] = [
    {
      id: 'core:component-outline',
      iconPath: mdiBorderRadius,
    },
    {
      id: 'core:open-code',
      iconPath: mdiXml,
    },
    {
      id: 'core:undo',
      iconPath: mdiArrowULeftTop,
      disabled: () => !UndoManager.hasUndo(),
    },
    {
      id: 'core:redo',
      iconPath: mdiArrowURightTop,
      disabled: () => !UndoManager.hasRedo(),
    },
  ];

  useEffect(() => {
    const cmdEvent = 'run stop';
    const updateEvent = 'update';
    const updateCounter = () => setUpdateCounter(value => value + 1);
    const onCommand = (id: string) => {
      cmdButtons.some(btn => btn.id === id) && updateCounter();
    };

    editor.on(cmdEvent, onCommand);
    editor.on(updateEvent, updateCounter);

    return () => {
      editor.off(cmdEvent, onCommand);
      editor.off(updateEvent, updateCounter);
    };
  }, [editor, cmdButtons]);

  return (
    <div className={cn('flex gap-2', className)}>
      {cmdButtons.map(({ id, iconPath, disabled, options = {} }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8',
            Commands.isActive(id) && 'bg-accent text-accent-foreground',
            disabled?.() && 'opacity-50'
          )}
          onClick={() => (Commands.isActive(id) ? Commands.stop(id) : Commands.run(id, options))}
          disabled={disabled?.()}
        >
          <Icon path={iconPath} size={0.8} />
        </Button>
      ))}
    </div>
  );
}
