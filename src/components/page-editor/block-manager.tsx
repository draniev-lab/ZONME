
"use client";

import { BlocksResultProps } from '@grapesjs/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';

export function BlockManager({ mapCategoryBlocks, dragStart, dragStop }: CustomBlockManagerProps) {
  return (
    <div className="gjs-custom-block-manager text-left">
        <Accordion type="multiple" defaultValue={Array.from(mapCategoryBlocks.keys())} className="w-full">
            {Array.from(mapCategoryBlocks).map(([category, blocks]) => (
                <AccordionItem value={category} key={category}>
                     <AccordionTrigger className="px-3 py-2 text-sm">{category}</AccordionTrigger>
                     <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 p-2">
                            {blocks.map(block => (
                            <div
                                key={block.getId()}
                                draggable
                                className={cn(
                                'flex flex-col items-center border rounded cursor-pointer py-2 px-5 transition-colors bg-card',
                                'hover:bg-accent'
                                )}
                                onDragStart={ev => dragStart(block, ev.nativeEvent)}
                                onDragEnd={() => dragStop(false)}
                            >
                                <div className="h-10 w-10" dangerouslySetInnerHTML={{ __html: block.getMedia()! }} />
                                <div className="text-xs text-center w-full" title={block.getLabel()}>
                                {block.getLabel()}
                                </div>
                            </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
      </Accordion>
    </div>
  );
}

export type CustomBlockManagerProps = Pick<BlocksResultProps, 'mapCategoryBlocks' | 'dragStart' | 'dragStop'>;
