
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRecommendationsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { PropertyCard } from "./property-card";
import { Bot, Loader2 } from "lucide-react";
import { useCollection } from "@/firebase";
import { Property } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

const initialState = {
  recommendations: [],
  error: null,
  timestamp: Date.now(),
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full flex items-center gap-2">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Recherche...</span>
        </>
      ) : (
        <>
          <span>Obtenir des recommandations</span>
          <Bot className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export function RecommendationForm() {
  const [state, formAction] = useActionState(getRecommendationsAction, initialState);
  const { data: properties, loading } = useCollection<Property>('properties');
  const { toast } = useToast();
  const { pending } = useFormStatus();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Erreur de recommandation",
        description: state.error,
      });
    }
  }, [state.error, state.timestamp, toast]);
  
  const recommendedProperties = useMemo(() => {
    if (!state.recommendations || !properties) return [];
    return state.recommendations.map(id => properties.find(p => p.id === id)).filter(Boolean) as Property[];
  }, [state.recommendations, properties]);

  return (
    <div className="space-y-8">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="font-headline">Recommandations Intelligentes</CardTitle>
            <CardDescription>
              Laissez notre IA trouver les biens qui vous correspondent. Remplissez vos préférences ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (XOF)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="Ex: 50000000"
                required
                defaultValue="75000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLocation">Lieu préféré</Label>
              <Input
                id="preferredLocation"
                name="preferredLocation"
                placeholder="Ex: Lomé"
                required
                defaultValue="Lomé"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Type de bien</Label>
              <Select name="propertyType" required defaultValue="Maison">
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Appartement">Appartement</SelectItem>
                  <SelectItem value="Terrain">Terrain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {pending && (
         <div>
          <h3 className="mb-4 text-2xl font-headline">Propriétés recommandées pour vous</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
         </div>
      )}

      {!pending && state.recommendations.length > 0 && (
        <div>
          <h3 className="mb-4 text-2xl font-headline">Propriétés recommandées pour vous</h3>
          {loading ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
          ) : recommendedProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProperties.map((property) => (
                property && <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <Card className="flex h-48 items-center justify-center">
                <CardDescription>Aucune propriété correspondante trouvée pour ces critères.</CardDescription>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

    