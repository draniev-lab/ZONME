"use client";

import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PropertyCard } from "@/components/property-card";
import { PerformanceChart } from "@/components/performance-chart";
import { Separator } from "@/components/ui/separator";
import { useCollection } from "@/firebase";
import { useUser } from "@/firebase";
import { Property } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";


function PropertyCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-48 rounded bg-muted"></div>
                    <div className="space-y-2">
                        <div className="h-4 rounded bg-muted"></div>
                        <div className="h-4 w-3/4 rounded bg-muted"></div>
                    </div>
                    <div className="flex justify-between">
                        <div className="h-4 w-1/4 rounded bg-muted"></div>
                        <div className="h-4 w-1/4 rounded bg-muted"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');

  const loading = userLoading || propertiesLoading;

  const { myProperties, favoriteProperties } = useMemo(() => {
    if (loading || !user) {
      return { myProperties: [], favoriteProperties: [] };
    }
    const my = properties.filter(p => p.ownerId === user.uid);
    const favs = properties.filter(p => p.favoritedBy?.includes(user.uid));
    return { myProperties: my, favoriteProperties: favs };
  }, [properties, user, loading]);

  if (loading || !user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue {user.displayName || user.email}, sur votre espace personnel ZoeHouse.
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-headline">Vos Biens Favoris</h2>
            <p className="text-muted-foreground">Les propriétés que vous avez sauvegardées.</p>
        </div>
        {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
        ) : favoriteProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favoriteProperties.slice(0,3).map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
        ): (
            <Card className="flex h-48 items-center justify-center text-center">
                <CardContent className="pt-6">
                    <p className="mb-4 text-muted-foreground">Aucun bien en favori pour le moment.</p>
                    <Button asChild>
                        <Link href="/properties">Parcourir les biens</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
            <div>
                <h2 className="text-2xl font-headline">Vos Biens Publiés</h2>
                <p className="text-muted-foreground">Gérez les propriétés que vous avez mises en vente ou en location.</p>
            </div>
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    <PropertyCardSkeleton />
                    <PropertyCardSkeleton />
                </div>
            ) : myProperties.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {myProperties.slice(0,2).map(p => <PropertyCard key={p.id} property={p} />)}
                </div>
            ) : (
                <Card className="flex h-48 items-center justify-center text-center">
                     <CardContent className="pt-6">
                        <p className="mb-4 text-muted-foreground">Vous n'avez publié aucun bien.</p>
                         <Button asChild>
                            <Link href="/submit-property">Déposer une annonce</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-headline">Statistiques</h2>
                <p className="text-muted-foreground">Performance de vos annonces.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Vues par mois</CardTitle>
                    <CardDescription>Performance de vos annonces sur les 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PerformanceChart />
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}