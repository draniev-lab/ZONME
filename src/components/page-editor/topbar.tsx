
"use client";

import { DevicesProvider, WithEditor } from '@grapesjs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { TopbarButtons } from './topbar-buttons';

export function PageEditorTopbar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-1 bg-background border-b', className)}>
      <DevicesProvider>
        {({ selected, select, devices }) => (
          <Select value={selected} onValueChange={select}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder="Appareil" />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem value={device.id} key={device.id}>
                  {device.getName()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DevicesProvider>
      <WithEditor>
        <TopbarButtons className="ml-auto px-2" />
      </WithEditor>
    </div>
  );
}
