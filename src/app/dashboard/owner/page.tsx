
"use client";

import { useCollection, useUser } from "@/firebase";
import { Property } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Loader2, BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { PropertyStatsCard } from "@/components/property-stats-card";
import { Card } from "@/components/ui/card";

export default function OwnerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');

  const loading = userLoading || propertiesLoading;

  const myProperties = useMemo(() => {
    if (loading || !user) return [];
    return properties.filter(p => p.ownerId === user.uid);
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
          Statistiques de vos Biens
        </h1>
        <p className="text-muted-foreground">
          Analysez la performance de vos annonces.
        </p>
      </div>
      <Separator />

      {myProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune donnée à afficher</h3>
          <p className="text-muted-foreground">Vous n'avez aucune propriété active pour afficher des statistiques.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myProperties.map((property) => (
            <PropertyStatsCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
    
