
"use client";

import { useEditor } from '@grapesjs/react';
import { mdiClose, mdiPlus } from '@mdi/js';
import Icon from '@mdi/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import type {
  Property,
  PropertyComposite,
  PropertyRadio,
  PropertySelect,
  PropertySlider,
  PropertyStack
} from 'grapesjs';
import { cn } from '@/lib/utils';

interface StylePropertyFieldProps extends React.HTMLProps<HTMLDivElement> {
  prop: Property;
}

export function StylePropertyField({ prop, ...rest }: StylePropertyFieldProps) {
  const editor = useEditor();
  const handleChange = (value: string) => {
    prop.upValue(value);
  };

  const onChange = (ev: any) => {
    handleChange(ev.target.value);
  };

  const openAssets = () => {
    editor.Assets.open({
      select: (asset, complete) => {
        prop.upValue(asset.getSrc(), { partial: !complete });
        complete && editor.Assets.close();
      },
      types: ['image'],
      accept: 'image/*',
    });
  };

  const type = prop.getType();
  const defValue = prop.getDefaultValue();
  const canClear = prop.canClear();
  const hasValue = prop.hasValue();
  const value = prop.getValue();
  const valueString = hasValue ? value : '';
  const valueWithDef = hasValue ? value : defValue;

  let inputToRender: React.ReactNode;

  switch (type) {
    case 'radio': {
      const radioProp = prop as PropertyRadio;
      inputToRender = (
        <RadioGroup value={value} onValueChange={handleChange} className="flex flex-wrap">
          {radioProp.getOptions().map(option => (
            <div key={radioProp.getOptionId(option)} className="flex items-center space-x-2">
                <RadioGroupItem value={radioProp.getOptionId(option)} id={radioProp.getOptionId(option)} />
                <Label htmlFor={radioProp.getOptionId(option)} className="text-sm">{radioProp.getOptionLabel(option)}</Label>
            </div>
          ))}
        </RadioGroup>
      );
      break;
    }
    case 'select': {
      const selectProp = prop as PropertySelect;
      inputToRender = (
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
                {selectProp.getOptions().map(option => (
                <SelectItem key={selectProp.getOptionId(option)} value={selectProp.getOptionId(option)}>
                    {selectProp.getOptionLabel(option)}
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
              value={valueString}
              onChange={onChange}
              className="h-8 text-sm pl-8"
            />
          </div>
        );
        break;
      }
    case 'slider': {
      const sliderProp = prop as PropertySlider;
      inputToRender = (
        <Slider
          value={[parseFloat(value)]}
          min={sliderProp.getMin()}
          max={sliderProp.getMax()}
          step={sliderProp.getStep()}
          onValueChange={([val]) => handleChange(String(val))}
        />
      );
      break;
    }
    case 'file': {
        inputToRender = (
          <Button onClick={openAssets} variant="outline" size="sm" className='w-full'>Select Image</Button>
        );
        break;
    }
    case 'composite': {
        const compositeProp = prop as PropertyComposite;
        inputToRender = (
          <div className="p-2 bg-muted rounded-md flex flex-wrap">
            {compositeProp.getProperties().map(prop => (
              <StylePropertyField key={prop.getId()} prop={prop} />
            ))}
          </div>
        );
        break;
    }
    case 'stack': {
        const stackProp = prop as PropertyStack;
        const layers = stackProp.getLayers();
        inputToRender = (
          <div className="p-2 gap-2 bg-muted rounded-md flex flex-col min-h-[54px]">
             {layers.map(layer => (
                <div key={layer.getId()} className='p-1 border bg-background rounded-md'>
                    <div className="flex gap-1 items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => layer.select()}>
                            {layer.getLabel()}
                        </Button>
                        <div
                            className="w-4 h-4 rounded-sm border"
                            style={layer.getStylePreview({ camelCase: true })}
                        />
                    </div>
                    {layer.isSelected() && (
                        <div className="p-2 flex flex-wrap">
                            {stackProp.getProperties().map(prop => (
                            <StylePropertyField key={prop.getId()} prop={prop} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
          </div>
        );
        break;
      }
    default: {
        inputToRender = <Input placeholder={defValue} value={valueString} onChange={onChange} className="h-8 text-sm" />;
    }
  }

  return (
    <div {...rest} className={cn('mb-3 px-1 w-full', prop.isFull() ? 'w-full' : 'w-1/2')}>
      <div className={cn('flex mb-1 items-center text-sm', canClear && 'text-primary')}>
        <div className="flex-grow capitalize">{prop.getLabel()}</div>
        {canClear && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => prop.clear()}>
            <Icon path={mdiClose} size={0.7} />
          </Button>
        )}
        {type === 'stack' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => (prop as PropertyStack).addLayer({}, { at: 0 })}>
            <Icon path={mdiPlus} size={0.7} />
          </Button>
        )}
      </div>
      {inputToRender}
    </div>
  );
}
