
"use client";

import { useEffect, useState } from 'react';
import { Property } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from './ui/badge';

interface PropertyStatsCardProps {
    property: Property;
}

export function PropertyStatsCard({ property }: PropertyStatsCardProps) {
    const [views, setViews] = useState(0);

    useEffect(() => {
        // Simulate fetching views data, or generate a random number
        // In a real app, this might come from an analytics service or Firestore field
        setViews(Math.floor(Math.random() * (property.price / 100000)));
    }, [property.price]);

    const favorites = property.favoritedBy?.length || 0;
    const imageUrl = property.imageUrls?.[0] || 'https://picsum.photos/seed/default/600/400';

    return (
        <Card>
            <CardHeader>
                <div className="relative h-40 w-full mb-2">
                    <Image
                        src={imageUrl}
                        alt={property.title}
                        fill
                        className="object-cover rounded-lg"
                    />
                     <Badge variant="default" className="absolute right-2 top-2 bg-primary/80 backdrop-blur-sm">
                        {property.status}
                    </Badge>
                </div>
                <CardTitle className="text-lg font-headline truncate">{property.title}</CardTitle>
                <CardDescription className='text-xs'>ID: {property.id}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold">{views}</p>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Eye className="h-4 w-4"/> Vues</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{favorites}</p>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Heart className="h-4 w-4"/> Favoris</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Link href={`/properties/${property.id}`} className="text-sm text-primary hover:underline w-full text-center">
                    Voir l'annonce
                 </Link>
            </CardFooter>
        </Card>
    )
}
