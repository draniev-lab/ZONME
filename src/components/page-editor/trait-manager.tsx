
"use client";

import { TraitsResultProps } from '@grapesjs/react';
import { TraitPropertyField } from './trait-property-field';

export function TraitManager({ traits }: Omit<TraitsResultProps, 'Container'>) {
  return (
    <div className="gjs-custom-trait-manager text-left mt-3 p-1">
      {!traits.length ? (
        <div className='p-2 text-sm text-muted-foreground'>Aucune propriété disponible</div>
      ) : (
        traits.map(trait => <TraitPropertyField key={trait.getId()} trait={trait} />)
      )}
    </div>
  );
}
