
"use client";

import { useEditor } from '@grapesjs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import type { Trait } from 'grapesjs';
import { cn } from '@/lib/utils';

interface TraitPropertyFieldProps extends React.HTMLProps<HTMLDivElement> {
  trait: Trait;
}

export function TraitPropertyField({ trait, ...rest }: TraitPropertyFieldProps) {
  const editor = useEditor();
  const handleChange = (value: string | boolean) => {
    trait.setValue(value);
  };

  const onChange = (ev: any) => {
    handleChange(ev.target.value);
  };

  const handleButtonClick = () => {
    const command = trait.get('command');
    if (command) {
      typeof command === 'string' ? editor.runCommand(command) : command(editor, trait);
    }
  };

  const type = trait.getType();
  const defValue = trait.getDefault() || trait.get('placeholder');
  const value = trait.getValue();
  const valueWithDef = typeof value !== 'undefined' ? value : defValue;

  let inputToRender: React.ReactNode;

  switch (type) {
    case 'select': {
      inputToRender = (
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
            {trait.getOptions().map(option => (
                <SelectItem key={trait.getOptionId(option)} value={trait.getOptionId(option)}>
                {trait.getOptionLabel(option)}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
      );
      break;
    }
    case 'color': {
      inputToRender = (
        <div className="relative">
           <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <div className='w-4 h-4 rounded-sm border' style={{ backgroundColor: valueWithDef }}>
                  <input
                    type="color"
                    className="w-full h-full cursor-pointer opacity-0"
                    value={valueWithDef}
                    onChange={ev => handleChange(ev.target.value)}
                  />
              </div>
          </div>
          <Input
            placeholder={defValue}
            value={value}
            onChange={onChange}
            className="h-8 text-sm pl-8"
          />
        </div>
      );
      break;
    }
    case 'checkbox': {
      inputToRender = (
        <div className='flex items-center gap-2'>
            <Checkbox checked={!!value} onCheckedChange={handleChange} id={trait.getId()} />
            <Label htmlFor={trait.getId()}>{trait.get('label')}</Label>
        </div>
      );
      break;
    }
    case 'button': {
      inputToRender = (
        <Button onClick={handleButtonClick} className="w-full" size="sm">
          {trait.getLabel()}
        </Button>
      );
      break;
    }
    default: {
      inputToRender = <Input placeholder={defValue} value={value} onChange={onChange} className="h-8 text-sm" />;
    }
  }

  if (type === 'checkbox') {
    return (
        <div {...rest} className={cn('mb-3 px-1 w-full')}>
            {inputToRender}
        </div>
    )
  }

  return (
    <div {...rest} className={cn('mb-3 px-1 w-full')}>
      <div className={cn('flex mb-1 items-center text-sm')}>
        <div className="flex-grow capitalize">{trait.getLabel()}</div>
      </div>
      {inputToRender}
    </div>
  );
}
