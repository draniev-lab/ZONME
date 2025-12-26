
"use client";

import { StylesResultProps } from '@grapesjs/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StylePropertyField } from './style-property-field';


export function StyleManager({ sectors }: Omit<StylesResultProps, 'Container'>) {
  return (
    <div className="text-left">
      <Accordion type="multiple" collapsible>
        {sectors.map(sector => (
          <AccordionItem value={sector.getId()} key={sector.getId()}>
            <AccordionTrigger className='px-3 py-2 text-sm'>{sector.getName()}</AccordionTrigger>
            <AccordionContent className="p-2 flex flex-wrap">
              {sector.getProperties().map(prop => (
                <StylePropertyField key={prop.getId()} prop={prop} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
