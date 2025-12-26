
'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { PropertyCard } from '@/components/property-card';
import { PropertySearchFilters } from '@/components/property-search-filters';
import type { Property } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Columns3, X, Map, Bookmark, Bot, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PropertiesMap } from '@/components/properties-map';
import { useToast } from '@/hooks/use-toast';
import { SavedSearch } from '../dashboard/searches/page';
import { intelligentPropertySorting } from '@/ai/flows/intelligent-property-sorting';
import { Input } from '@/components/ui/input';

type Filters = {
  location: string;
  type: string;
  budget: number;
  bedrooms: number;
  bathrooms: number;
  sortBy: string;
  aiQuery: string;
};

function PropertiesPageContent() {
  const { firestore } = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [showMap, setShowMap] = useState(false);
  const [sortedProperties, setSortedProperties] = useState<Property[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  
  const getCompareIds = () => searchParams.getAll("ids");
  const [compareIds, setCompareIds] = useState(getCompareIds());

  useEffect(() => {
    setCompareIds(getCompareIds());
  }, [searchParams]);

  const [filters, setFilters] = useState<Filters>({
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || 'Tous types',
    budget: Number(searchParams.get('budget')) || 1000000000,
    bedrooms: Number(searchParams.get('bedrooms')) || 0,
    bathrooms: Number(searchParams.get('bathrooms')) || 0,
    sortBy: searchParams.get('sortBy') || 'createdAt_desc',
    aiQuery: searchParams.get('aiQuery') || '',
  });

  const propertiesQuery = useMemo(() => {
    if (!firestore) return null;

    const constraints: QueryConstraint[] = [
        where('validated', '==', true)
    ];

    if (filters.type && filters.type !== 'Tous types') {
      constraints.push(where('type', '==', filters.type));
    }
    
    const [sortField, sortDirection] = filters.sortBy.split('_');
    if (sortField !== 'ai_sort') {
        constraints.push(orderBy(sortField, sortDirection as 'asc' | 'desc'));
    } else {
        // Fallback sort when AI sort is selected but not yet run
        constraints.push(orderBy('createdAt', 'desc'));
    }


    return query(collection(firestore, 'properties'), ...constraints);
  }, [filters.type, filters.sortBy, firestore]);

  const { data: properties, loading } = useCollection<Property>(propertiesQuery);
  
  const filteredAndSortedProperties = useMemo(() => {
    
    const clientFiltered = properties.filter((property) => {
        const locationMatch =
            filters.location === '' ||
            property.city.toLowerCase().includes(filters.location.toLowerCase()) ||
            property.address.toLowerCase().includes(filters.location.toLowerCase());
        
        const budgetMatch = property.price <= filters.budget;
        const bedroomsMatch = property.features.bedrooms >= filters.bedrooms;
        const bathroomsMatch = property.features.bathrooms >= filters.bathrooms;

        return locationMatch && budgetMatch && bedroomsMatch && bathroomsMatch;
    });

    if (sortedProperties.length > 0 && filters.sortBy === 'ai_sort') {
      // If AI sort has run, respect its order but still apply other filters
      const filteredSortedIds = new Set(clientFiltered.map(p => p.id));
      return sortedProperties.filter(p => filteredSortedIds.has(p.id));
    }
    
    return clientFiltered;

  }, [properties, filters, sortedProperties]);


  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    const params = new URLSearchParams();
    if (updatedFilters.location) params.set('location', updatedFilters.location);
    if (updatedFilters.type !== 'Tous types') params.set('type', updatedFilters.type);
    if (updatedFilters.budget) params.set('budget', updatedFilters.budget.toString());
    if (updatedFilters.bedrooms > 0) params.set('bedrooms', updatedFilters.bedrooms.toString());
    if (updatedFilters.bathrooms > 0) params.set('bathrooms', updatedFilters.bathrooms.toString());
    if (updatedFilters.sortBy) params.set('sortBy', updatedFilters.sortBy);
    if (updatedFilters.aiQuery) params.set('aiQuery', updatedFilters.aiQuery);
    
    compareIds.forEach(id => params.append("ids", id));

    window.history.pushState(null, '', `/properties?${params.toString()}`);
  };

  const handleAiSort = async () => {
    if (!filters.aiQuery || properties.length === 0) return;
    
    setIsSorting(true);
    try {
        const propertyInfoForAI = properties.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            tags: p.tags || []
        }));

        const result = await intelligentPropertySorting({
            searchQuery: filters.aiQuery,
            properties: propertyInfoForAI
        });

        const sortedIds = result.sortedPropertyIds;
        const newSortedProperties = sortedIds.map(id => properties.find(p => p.id === id)).filter(Boolean) as Property[];
        setSortedProperties(newSortedProperties);
        
    } catch (error) {
        console.error("AI sorting failed", error);
        toast({
            variant: "destructive",
            title: "Erreur de tri IA",
            description: "Impossible d'effectuer le tri intelligent. Veuillez réessayer."
        })
    } finally {
        setIsSorting(false);
    }
  }
  
  useEffect(() => {
    if (filters.sortBy === 'ai_sort' && filters.aiQuery) {
        handleAiSort();
    } else {
        setSortedProperties([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy, filters.aiQuery, properties]);

  const clearCompare = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("ids");
    router.push(`/properties?${params.toString()}`);
  }
  
  const handleSaveSearch = () => {
    const searchesFromStorage = localStorage.getItem("zoehouse_saved_searches");
    const currentSearches: SavedSearch[] = searchesFromStorage ? JSON.parse(searchesFromStorage) : [];

    const newSearch: SavedSearch = {
        id: new Date().toISOString(),
        filters: {
            location: filters.location,
            type: filters.type,
            budget: filters.budget,
            bedrooms: filters.bedrooms,
            bathrooms: filters.bathrooms,
            sortBy: filters.sortBy,
            aiQuery: filters.aiQuery,
        },
        alertsEnabled: true,
        createdAt: Date.now()
    };
    
    const updatedSearches = [newSearch, ...currentSearches];
    localStorage.setItem("zoehouse_saved_searches", JSON.stringify(updatedSearches));

    toast({
        title: "Recherche sauvegardée",
        description: "Vos critères de recherche actuels ont été sauvegardés.",
        action: (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/searches">Voir mes recherches</Link>
          </Button>
        )
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="text-center">
          <h1 className="font-headline text-4xl md:text-5xl">Découvrez nos biens</h1>
          <p className="text-muted-foreground">Parcourez notre catalogue complet de propriétés à vendre ou à louer.</p>
        </div>
        <PropertySearchFilters onFilterChange={handleFilterChange} />
        {filters.sortBy === 'ai_sort' && (
          <div className="flex gap-2">
            <Input 
                placeholder="Décrivez votre recherche (ex: maison familiale avec jardin...)"
                value={filters.aiQuery}
                onChange={(e) => handleFilterChange({aiQuery: e.target.value})}
            />
            <Button onClick={handleAiSort} disabled={isSorting}>
                {isSorting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4" />}
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={handleSaveSearch}>
                <Bookmark className="mr-2 h-4 w-4" />
                Sauvegarder la recherche
            </Button>
            <Button variant="outline" onClick={() => setShowMap(!showMap)}>
                <Map className="mr-2 h-4 w-4" />
                {showMap ? "Cacher la carte" : "Afficher la carte"}
            </Button>
        </div>
      </div>

       {compareIds.length > 0 && (
          <div className="sticky top-[70px] z-40 mb-4">
            <div className="container mx-auto flex items-center justify-center rounded-lg border bg-background/90 p-2 shadow-md backdrop-blur-sm">
                <p className="text-sm font-medium">{compareIds.length} bien(s) en comparaison.</p>
                <Button asChild size="sm" className="ml-4">
                  <Link href={`/dashboard/compare?${searchParams.toString()}`}>
                    <Columns3 className="mr-2 h-4 w-4"/>
                    Comparer maintenant
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" className="ml-2" onClick={clearCompare}>
                    <X className="mr-2 h-4 w-4"/>
                    Vider
                </Button>
            </div>
          </div>
      )}

      {showMap && (
        <div className="mb-8 h-[400px] md:h-[500px]">
          <PropertiesMap properties={filteredAndSortedProperties} />
        </div>
      )}

      {loading || isSorting ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      ) : filteredAndSortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <h3 className="text-2xl font-semibold tracking-tight">Aucun bien ne correspond à votre recherche</h3>
            <p className="text-muted-foreground">Essayez d'ajuster vos filtres pour trouver la maison de vos rêves.</p>
        </div>
      )}
    </div>
  );
}


export default function PropertiesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <PropertiesPageContent />
        </Suspense>
    )
}
