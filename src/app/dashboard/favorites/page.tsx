
"use client";

import { useCollection, useUser } from "@/firebase";
import { Property } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Loader2, Heart } from "lucide-react";
import { useMemo } from "react";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function FavoritesPage() {
  const { user, loading: userLoading } = useUser();
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');

  const loading = userLoading || propertiesLoading;

  const favoriteProperties = useMemo(() => {
    if (loading || !user) return [];
    return properties.filter(p => p.favoritedBy?.includes(user.uid));
  }, [user, properties, loading]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Mes Favoris
        </h1>
        <p className="text-muted-foreground">
          Retrouvez ici toutes les propriétés que vous avez sauvegardées.
        </p>
      </div>
      <Separator />
      
      {favoriteProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucun favori</h3>
            <p className="text-muted-foreground">Vous n'avez pas encore ajouté de bien à vos favoris.</p>
            <Button asChild className="mt-6">
                <Link href="/properties">Parcourir les biens</Link>
            </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
