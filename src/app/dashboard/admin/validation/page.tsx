
"use client";

import { useCollection, useFirestore, useUser } from "@/firebase";
import { Property } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useActivityLogger } from "@/components/activity-logger";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminValidationPage() {
  const { data: properties, loading } = useCollection<Property>('properties');
  const { firestore } = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { log } = useActivityLogger();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const handleValidationToggle = async (property: Property, currentStatus: boolean) => {
    if (!firestore || !user) return;
    const propertyRef = doc(firestore, 'properties', property.id);
    const newStatus = !currentStatus;
    try {
      await updateDoc(propertyRef, {
        validated: newStatus
      });
      
      if (user) {
        log(user, newStatus ? 'property_approve' : 'property_unapprove', { propertyId: property.id, propertyTitle: property.title });
      }

      toast({
        title: "Statut mis à jour",
        description: `La propriété a été ${newStatus ? 'validée' : 'dévalidée'}.`,
      });
    } catch(error) {
      console.error("Failed to update validation status:", error);
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de validation.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Validation des Annonces
        </h1>
        <p className="text-muted-foreground">
          Validez les nouvelles annonces soumises par les utilisateurs.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Annonces à valider</CardTitle>
          <CardDescription>Liste de toutes les propriétés en attente de validation ou déjà validées.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Propriétaire (ID)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-center">Validé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                              {property.title}
                          </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">{property.ownerId}</TableCell>
                      <TableCell>
                        <Badge variant={property.status === 'Vente' ? 'default' : 'secondary'}>
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(property.price)}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={property.validated}
                          onCheckedChange={() => handleValidationToggle(property, !!property.validated)}
                          aria-label="Validation status"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
