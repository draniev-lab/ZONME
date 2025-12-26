
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Convert array to a map for easy lookup
export const PlaceHolderImages: Record<string, ImagePlaceholder> = 
  data.placeholderImages.reduce((acc, image) => {
    acc[image.id] = image;
    return acc;
  }, {} as Record<string, ImagePlaceholder>);

// Also export the array if needed elsewhere
export const PlaceHolderImagesArray: ImagePlaceholder[] = data.placeholderImages;

    