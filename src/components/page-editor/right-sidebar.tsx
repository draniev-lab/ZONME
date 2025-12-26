
"use client";

import {
  BlocksProvider,
  LayersProvider,
  SelectorsProvider,
  StylesProvider,
  TraitsProvider
} from '@grapesjs/react';
import { mdiBrush, mdiLayers, mdiViewGridPlus, mdiCog } from '@mdi/js';
import Icon from '@mdi/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { StyleManager } from './style-manager';
import { LayerManager } from './layer-manager';
import { BlockManager } from './block-manager';
import { TraitManager } from './trait-manager';
import { SelectorManager } from './selector-manager';

export function PageEditorRightSidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col bg-card text-foreground', className)}>
      <Tabs defaultValue="styles" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-4 rounded-none">
          <TabsTrigger value="styles"><Icon size={0.8} path={mdiBrush} /></TabsTrigger>
          <TabsTrigger value="traits"><Icon size={0.8} path={mdiCog} /></TabsTrigger>
          <TabsTrigger value="layers"><Icon size={0.8} path={mdiLayers} /></TabsTrigger>
          <TabsTrigger value="blocks"><Icon size={0.8} path={mdiViewGridPlus} /></TabsTrigger>
        </TabsList>
        <div className='flex-grow overflow-y-auto'>
            <TabsContent value="styles">
              <SelectorsProvider>
                  {(props) => <SelectorManager {...props} />}
              </SelectorsProvider>
              <StylesProvider>
                  {props => <StyleManager {...props} />}
              </StylesProvider>
            </TabsContent>
            <TabsContent value="traits">
                <TraitsProvider>
                    {props => <TraitManager {...props} />}
                </TraitsProvider>
            </TabsContent>
            <TabsContent value="layers">
                <LayersProvider>
                    {props => <LayerManager {...props} />}
                </LayersProvider>
            </TabsContent>
            <TabsContent value="blocks">
                <BlocksProvider>
                    {props => <BlockManager {...props} />}
                </BlocksProvider>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
