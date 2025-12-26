"use client";

import Image from "next/image";
import { PlaceHolderImagesArray, type ImagePlaceholder } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CheckCircle2 } from "lucide-react";

interface ImageIdSelectorProps {
  selectedImageIds: string[];
  onImageSelect: (imageIds: string[]) => void;
}

export function ImageIdSelector({ selectedImageIds, onImageSelect }: ImageIdSelectorProps) {

  const handleToggleImage = (imageId: string) => {
    const isSelected = selectedImageIds.includes(imageId);
    if (isSelected) {
      onImageSelect(selectedImageIds.filter(id => id !== imageId));
    } else {
      onImageSelect([...selectedImageIds, imageId]);
    }
  };

  const propertyImages = PlaceHolderImagesArray.filter(img => img.id.startsWith('property'));

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
      <div className="flex w-max space-x-4 p-4">
        {propertyImages.map((image) => {
          const isSelected = selectedImageIds.includes(image.id);
          return (
            <div
              key={image.id}
              className="relative cursor-pointer group"
              onClick={() => handleToggleImage(image.id)}
            >
              <Image
                src={image.imageUrl}
                alt={image.description}
                width={200}
                height={150}
                className={cn(
                  "h-40 w-52 rounded-md object-cover transition-all",
                  isSelected ? "ring-2 ring-primary ring-offset-2" : "opacity-70 group-hover:opacity-100"
                )}
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              )}
               <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center">
                    <p className="text-xs text-white truncate">{image.description}</p>
                </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

    