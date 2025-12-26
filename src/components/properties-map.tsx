
"use client";

import { Property } from "@/lib/types";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link";

interface PropertiesMapProps {
  properties: Property[];
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(price);
};

export function PropertiesMap({ properties }: PropertiesMapProps) {
  // Using a static map image for now. In a real app, this would be an interactive map library.
  const mapImageUrl = "https://images.unsplash.com/photo-1593644304892-bab7a1b02bcf?q=80&w=2069&auto=format&fit=crop";

  // Define the geographic boundaries for our map area (approximating Togo's coastal region)
  const bounds = {
    minLat: 6.1, 
    maxLat: 7.0,
    minLng: 0.6,
    maxLng: 1.6,
  };

  const getPosition = (property: Property) => {
    const { geolocation } = property;
    if (!geolocation) {
        // Fallback for properties without coordinates
        return { top: `${Math.random() * 80 + 10}%`, left: `${Math.random() * 80 + 10}%` };
    }
    
    // Normalize latitude and longitude to a 0-100 scale within our bounds
    const y = ((geolocation.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    const x = ((geolocation.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;

    // Clamp values between 5% and 95% to avoid markers on the edge
    const clampedY = Math.max(5, Math.min(95, 100 - y)); // Invert Y-axis for screen coordinates (top-left is 0,0)
    const clampedX = Math.max(5, Math.min(95, x));

    return { top: `${clampedY}%`, left: `${clampedX}%` };
  };

  return (
    <TooltipProvider>
      <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden border">
        <Image
          src={mapImageUrl}
          alt="Carte des propriétés"
          layout="fill"
          objectFit="cover"
          className="opacity-80"
          data-ai-hint="satellite map"
        />
        {properties.map((property) => {
          const position = getPosition(property);
          return (
            <Tooltip key={property.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={`/properties/${property.id}`} className="absolute" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}>
                  <div className="h-6 px-2.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-lg transition-transform hover:scale-110 hover:z-10">
                    {formatPrice(property.price)}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-3 h-2 w-2 bg-primary rounded-full shadow-md animate-pulse"></div>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{property.title}</p>
                <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
