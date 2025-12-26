
"use client";

import { LayersResultProps } from '@grapesjs/react';
import LayerItem from './layer-item';

export function LayerManager({ root }: Omit<LayersResultProps, 'Container'>) {
  return (
    <div
      className="gjs-custom-layer-manager h-full overflow-y-auto overflow-x-hidden text-sm text-left select-none relative"
    >
      {!!root && <LayerItem component={root} level={-1} />}
    </div>
  );
}
