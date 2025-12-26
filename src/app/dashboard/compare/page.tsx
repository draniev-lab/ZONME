
"use client";

import { useSearchParams } from "next/navigation";
import { useCollection } from "@/firebase";
import { Property } from "@/lib/types";
import { Suspense, useMemo } from "react";
import { Loader2, Home, MapPin, Square, BedDouble, Bath, ChefHat, VenetianMask, Tag, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

function ComparePageContent() {
  const searchParams = useSearchParams();
  const idsToCompare = searchParams.getAll("ids");

  const { data: properties, loading } = useCollection<Property>("properties");

  const selectedProperties = useMemo(() => {
    if (!properties || idsToCompare.length === 0) return [];
    return idsToCompare
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is Property => !!p);
  }, [properties, idsToCompare]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedProperties.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
        <VenetianMask className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucun bien à comparer</h3>
        <p className="text-muted-foreground">Veuillez sélectionner au moins un bien depuis la page des propriétés.</p>
        <Button asChild className="mt-6">
          <Link href="/properties">Parcourir les biens</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedProperties.map((property) => {
          const image = property.imageUrls?.[0];
          return (
            <Card key={property.id} className="w-full flex-shrink-0">
              <CardHeader className="p-0">
                <Link href={`/properties/${property.id}`}>
                  <div className="relative h-48 w-full">
                    {image && <Image
                      src={image}
                      alt={property.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />}
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="font-headline text-lg truncate">{property.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" /> {property.city}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ScrollArea className="w-full">
        <Table className="min-w-max mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] font-bold">Caractéristique</TableHead>
              {selectedProperties.map(p => <TableHead key={p.id} className="text-right font-semibold">{p.title}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Prix</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right font-bold text-primary">{formatPrice(p.price)}</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><Square className="h-4 w-4 text-muted-foreground" /> Superficie</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right">{p.area} m²</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /> Type</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right">{p.type}</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted-foreground" /> Chambres</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right">{p.features.bedrooms}</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><Bath className="h-4 w-4 text-muted-foreground" /> Salles de bain</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right">{p.features.bathrooms}</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><ChefHat className="h-4 w-4 text-muted-foreground" /> Cuisines</TableCell>
              {selectedProperties.map(p => <TableCell key={p.id} className="text-right">{p.features.kitchens}</TableCell>)}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" /> Tags</TableCell>
              {selectedProperties.map(p => (
                  <TableCell key={p.id} className="text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                          {p.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                  </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Documents</TableCell>
              {selectedProperties.map(p => (
                  <TableCell key={p.id} className="text-right">
                    {p.documentUrls && p.documentUrls.length > 0 ? `${p.documentUrls.length} doc(s)` : 'Aucun'}
                  </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}


export default function ComparePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Comparer les Biens
        </h1>
        <p className="text-muted-foreground">
          Comparez les caractéristiques des biens que vous avez sélectionnés.
        </p>
      </div>
      <Separator />
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <ComparePageContent />
      </Suspense>
    </div>
  );
}
