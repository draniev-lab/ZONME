
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Search, Bell, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export interface SavedSearch {
  id: string;
  filters: {
    location?: string;
    type?: string;
    budget?: number;
    bedrooms?: number;
    bathrooms?: number;
    sortBy?: string;
    aiQuery?: string;
  };
  alertsEnabled: boolean;
  createdAt: number;
}


const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(price);
};

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const searchesFromStorage = localStorage.getItem("zoehouse_saved_searches");
    if (searchesFromStorage) {
      setSavedSearches(JSON.parse(searchesFromStorage).sort((a: SavedSearch, b: SavedSearch) => b.createdAt - a.createdAt));
    }
  }, []);

  const updateStorage = (searches: SavedSearch[]) => {
    localStorage.setItem("zoehouse_saved_searches", JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const handleDeleteSearch = (searchId: string) => {
    const newSearches = savedSearches.filter(s => s.id !== searchId);
    updateStorage(newSearches);
    toast({
      title: "Recherche supprimée",
      description: "La recherche a été retirée de vos sauvegardes.",
    });
  };
  
  const handleToggleAlerts = (searchId: string) => {
    const newSearches = savedSearches.map(s => 
      s.id === searchId ? { ...s, alertsEnabled: !s.alertsEnabled } : s
    );
    updateStorage(newSearches);
    const updatedSearch = newSearches.find(s => s.id === searchId);
    toast({
      title: updatedSearch?.alertsEnabled ? "Alertes activées" : "Alertes désactivées",
      description: `Les notifications pour cette recherche sont maintenant ${updatedSearch?.alertsEnabled ? 'activées' : 'désactivées'}. (Fonctionnalité simulée)`,
    });
  }
  
  const handleRelaunchSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.filters.location) params.set('location', search.filters.location);
    if (search.filters.type && search.filters.type !== 'Tous types') params.set('type', search.filters.type);
    if (search.filters.budget) params.set('budget', search.filters.budget.toString());
    if (search.filters.bedrooms) params.set('bedrooms', search.filters.bedrooms.toString());
    if (search.filters.bathrooms) params.set('bathrooms', search.filters.bathrooms.toString());
    if (search.filters.sortBy) params.set('sortBy', search.filters.sortBy);
    if (search.filters.aiQuery) params.set('aiQuery', search.filters.aiQuery);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Mes Recherches & Alertes
        </h1>
        <p className="text-muted-foreground">
          Retrouvez vos recherches sauvegardées et gérez vos alertes pour ne manquer aucune opportunité.
        </p>
      </div>
      <Separator />
      
      {savedSearches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune recherche sauvegardée</h3>
            <p className="text-muted-foreground">Sauvegardez vos recherches depuis la page des propriétés pour les retrouver ici.</p>
            <Button asChild className="mt-6">
                <Link href="/properties">Faire une nouvelle recherche</Link>
            </Button>
        </Card>
      ) : (
         <Card>
            <CardHeader>
                <CardTitle>Recherches Sauvegardées</CardTitle>
                <CardDescription>Cliquez sur une recherche pour voir les résultats correspondants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {savedSearches.map(search => (
                    <div key={search.id} className="rounded-lg border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div onClick={() => handleRelaunchSearch(search)} className="flex-1 cursor-pointer">
                             <div className="flex flex-wrap items-center gap-2">
                                {search.filters.location && <Badge variant="default">{search.filters.location}</Badge>}
                                {search.filters.type && search.filters.type !== 'Tous types' && <Badge variant="secondary">{search.filters.type}</Badge>}
                                {search.filters.budget && <Badge variant="outline">Max {formatPrice(search.filters.budget)}</Badge>}
                                {search.filters.bedrooms && <Badge variant="outline">{search.filters.bedrooms}+ ch</Badge>}
                                {search.filters.bathrooms && <Badge variant="outline">{search.filters.bathrooms}+ sdb</Badge>}
                                {search.filters.aiQuery && <Badge variant="destructive">IA: "{search.filters.aiQuery}"</Badge>}
                             </div>
                             <p className="text-xs text-muted-foreground mt-2">Cliquez pour relancer cette recherche.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button onClick={() => handleToggleAlerts(search.id)} variant={search.alertsEnabled ? "default" : "secondary"} size="sm" className="w-[120px]">
                                <Bell className="mr-2 h-4 w-4"/>
                                {search.alertsEnabled ? "Alertes ON" : "Alertes OFF"}
                            </Button>
                             <Button onClick={() => handleDeleteSearch(search.id)} variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
         </Card>
      )}
    </div>
  );
}
