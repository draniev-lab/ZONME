
"use client";

import { useDoc } from "@/firebase";
import { Property } from "@/lib/types";
import { useSearchParams, notFound } from "next/navigation";
import { Loader2, CheckCircle, Home, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

function SuccessContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const { data: property, loading } = useDoc<Property>('properties', propertyId || '');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement des détails de la réservation...</p>
      </div>
    );
  }

  if (!property) {
    notFound();
  }

  const image = property.imageUrls?.[0];

  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="font-headline text-3xl md:text-4xl">Réservation Réussie !</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Félicitations ! Vous avez réservé avec succès le bien suivant. Le propriétaire a été notifié.
      </p>

      <Card className="mt-8 w-full max-w-sm text-left overflow-hidden">
         {image && (
            <div className="relative h-48 w-full">
                <Image
                    src={image}
                    alt={property.title}
                    fill
                    className="object-cover"
                />
            </div>
         )}
        <CardHeader>
          <CardTitle className="truncate">{property.title}</CardTitle>
          <CardDescription>{property.address}, {property.city}</CardDescription>
        </CardHeader>
        <CardContent>
            <Separator />
            <div className="flex justify-between items-center py-2 text-sm">
                <span className="font-medium text-muted-foreground">Statut</span>
                <span className="font-bold text-primary">Réservé</span>
            </div>
            <Separator />
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex items-center gap-2">
          <Link href={`/properties/${property.id}`}>
            <Home className="h-4 w-4" />
            <span>Voir l'annonce</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex items-center gap-2">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            <span>Aller au tableau de bord</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}


export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
        <Suspense fallback={<div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>}>
            <SuccessContent />
        </Suspense>
    </div>
  );
}
