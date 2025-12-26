
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Bath, BedDouble, Search } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
import { Label } from "./ui/label";


type Filters = {
  location: string;
  type: string;
  budget: number;
  bedrooms: number;
  bathrooms: number;
  sortBy: string;
  aiQuery: string;
};

interface PropertySearchFiltersProps {
  onFilterChange: (filters: Partial<Filters>) => void;
  isHomePage?: boolean;
}

export function PropertySearchFilters({ onFilterChange, isHomePage = false }: PropertySearchFiltersProps) {
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || 'Tous types');
  const [budget, setBudget] = useState([Number(searchParams.get('budget')) || 1000000000]);
  const [bedrooms, setBedrooms] = useState(Number(searchParams.get('bedrooms')) || 0);
  const [bathrooms, setBathrooms] = useState(Number(searchParams.get('bathrooms')) || 0);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [aiQuery, setAiQuery] = useState(searchParams.get('aiQuery') || '');


  const handleFilterChange = useCallback(() => {
    onFilterChange({
      location,
      type,
      budget: budget[0],
      bedrooms,
      bathrooms,
      sortBy,
      aiQuery,
    });
  }, [location, type, budget, bedrooms, bathrooms, sortBy, aiQuery, onFilterChange]);


  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      handleFilterChange();
  }

  // Auto-submit on changes only if not on home page
  useEffect(() => {
    if (!isHomePage) {
      const handler = setTimeout(() => {
        handleFilterChange();
      }, 500); // Debounce filters
      return () => clearTimeout(handler);
    }
  }, [location, type, budget, bedrooms, bathrooms, sortBy, aiQuery, isHomePage, handleFilterChange]);

  const AdvancedFilters = () => (
     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        <div>
            <Label htmlFor="bedrooms" className="mb-2 block text-sm font-medium">Chambres</Label>
            <div className="relative">
                <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="bedrooms" 
                    type="number"
                    placeholder="Toutes"
                    className="pl-9"
                    value={bedrooms || ''}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    min={0}
                />
            </div>
        </div>
         <div>
            <Label htmlFor="bathrooms" className="mb-2 block text-sm font-medium">Salles d'eau</Label>
            <div className="relative">
                 <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="bathrooms"
                    type="number"
                    placeholder="Toutes"
                    className="pl-9"
                    value={bathrooms || ''}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    min={0}
                />
            </div>
        </div>
         <div>
            <Label htmlFor="sort" className="mb-2 block text-sm font-medium">Trier par</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_desc">Plus récents</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="ai_sort">Tri Intelligent (IA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
     </div>
  );


  return (
    <Card className={isHomePage ? "bg-background/80 backdrop-blur-sm" : ""}>
      <CardContent className="p-4">
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-5 md:items-end gap-4">
            <div className="md:col-span-2">
                <Label htmlFor="location" className={`mb-2 block text-sm font-medium ${isHomePage ? 'text-primary-foreground' : 'text-foreground'}`}>
                Localisation
                </Label>
                <Input 
                id="location" 
                placeholder="Ex: Lomé, Centre-ville"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="type" className={`mb-2 block text-sm font-medium ${isHomePage ? 'text-primary-foreground' : 'text-foreground'}`}>
                Type de bien
                </Label>
                <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Tous types">Tous types</SelectItem>
                    <SelectItem value="Maison">Maison</SelectItem>
                    <SelectItem value="Appartement">Appartement</SelectItem>
                    <SelectItem value="Terrain">Terrain</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Immeuble">Immeuble</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-2">
                <Label htmlFor="budget" className={`mb-2 block text-sm font-medium ${isHomePage ? 'text-primary-foreground' : 'text-foreground'}`}>
                Budget max: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(budget[0])}
                </Label>
                <Slider
                id="budget"
                min={10000000}
                max={1000000000}
                step={10000000}
                value={budget}
                onValueChange={setBudget}
                className="py-2"
                />
            </div>
            {isHomePage && (
                <div className="md:col-start-5">
                <Button type="submit" className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                </Button>
                </div>
            )}
          </div>

          {!isHomePage && <AdvancedFilters />}

        </form>
      </CardContent>
    </Card>
  );
}
