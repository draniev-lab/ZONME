
"use client";

import { SelectorsResultProps } from '@grapesjs/react';
import { mdiClose, mdiPlus } from '@mdi/js';
import Icon from '@mdi/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function SelectorManager({
  selectors,
  selectedState,
  states,
  targets,
  setState,
  addSelector,
  removeSelector
}: Omit<SelectorsResultProps, 'Container'>) {
  const addNewSelector = () => {
    const next = selectors.length + 1;
    addSelector({ name: `new-${next}`, label: `New ${next}` });
  };

  const targetStr = targets.join(', ');

  return (
    <div className="gjs-custom-selector-manager p-2 flex flex-col gap-2 text-left">
      <div className="flex items-center">
        <div className="flex-grow">Classes</div>
         <Select value={selectedState} onValueChange={setState}>
            <SelectTrigger className="h-8 text-sm w-[120px]">
                <SelectValue placeholder="- État -" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="">- État -</SelectItem>
                {states.map(state => (
                <SelectItem value={state.id} key={state.id}>
                    {state.getName()}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          'flex items-center gap-2 flex-wrap p-2 bg-muted border rounded min-h-[45px]',
        )}
      >
        {targetStr ? (
          <Button onClick={addNewSelector} variant="ghost" size="icon" className="h-7 w-7">
            <Icon size={0.7} path={mdiPlus} />
          </Button>
        ) : (
          <div className="opacity-70 text-sm">Sélectionnez un élément</div>
        )}
        {selectors.map(selector => (
          <div
            key={selector.toString()}
            className="px-2 py-1 flex items-center gap-1 whitespace-nowrap bg-primary/20 rounded-md text-sm"
          >
            <div>{selector.getLabel()}</div>
            <button type="button" onClick={() => removeSelector(selector)}>
              <Icon size={0.7} path={mdiClose} />
            </button>
          </div>
        ))}
      </div>
      <div className='text-xs text-muted-foreground truncate'>
        Appliqué à : <span className="font-semibold text-foreground">{targetStr || 'rien'}</span>
      </div>
    </div>
  );
}
