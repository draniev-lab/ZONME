
"use client";

import { useCollection, useUser } from "@/firebase";
import { Property } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Home, Pencil, CheckCircle, Clock, Ban } from "lucide-react";
import { useMemo } from "react";
import { PropertyCard } from "@/components/property-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeletePropertyDialog } from "@/components/delete-property-dialog";
import { Badge } from "@/components/ui/badge";

export default function MyPropertiesPage() {
  const { user, loading: userLoading } = useUser();
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');

  const loading = userLoading || propertiesLoading;

  const myProperties = useMemo(() => {
    if (loading || !user) return [];
    return properties.filter(p => p.ownerId === user.uid);
  }, [user, properties, loading]);

  const getStatusBadge = (property: Property) => {
    if (property.status === 'Réservation') {
        return (
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                <Ban className="h-3 w-3 mr-1" />
                Réservé
            </Badge>
        );
    }
    if (property.validated) {
        return (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Validé
            </Badge>
        );
    }
    return (
        <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
        </Badge>
    );
  }

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
          Mes Biens Immobiliers
        </h1>
        <p className="text-muted-foreground">
          Gérez toutes les propriétés que vous avez publiées.
        </p>
      </div>
      <Separator />
      
      {myProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <Home className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucun bien publié</h3>
            <p className="text-muted-foreground">Vous n'avez pas encore publié de bien immobilier.</p>
            <Button asChild className="mt-6">
                <Link href="/submit-property">Déposer ma première annonce</Link>
            </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myProperties.map((property) => (
            <div key={property.id} className="relative group">
              <PropertyCard property={property} />
               <div className="absolute top-2 left-2 z-10">
                {getStatusBadge(property)}
              </div>
              <div className="absolute top-2 right-2 z-10 hidden group-hover:flex gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                  <Link href={`/dashboard/edit-property/${property.id}`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Modifier</span>
                  </Link>
                </Button>
                <DeletePropertyDialog propertyId={property.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
