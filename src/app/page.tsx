
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase';
import { PropertyCard } from '@/components/property-card';
import { PropertySearchFilters } from '@/components/property-search-filters';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function Home() {
  const { firestore } = useFirestore();
  
  const propertiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "properties"),
        where("validated", "==", true),
        limit(3)
    );
  }, [firestore]);

  const { data: featuredProperties, loading } = useCollection<Property>(propertiesQuery);
  const heroImage = "https://images.unsplash.com/photo-1678575326996-a1bf09b86158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsdXh1cnklMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc2MzQ3ODkyNnww&ixlib=rb-4.1.0&q=80&w=1080";
  const router = useRouter();

  const handleSearch = (filters: { location: string; type: string; budget: number }) => {
    const queryParams = new URLSearchParams({
        location: filters.location,
        type: filters.type,
        budget: filters.budget.toString()
    }).toString();
    router.push(`/properties?${queryParams}`);
  };

  return (
    <div className="flex flex-col gap-12 md:gap-24">
      <section className="relative h-[70vh] min-h-[500px] w-full">
        <Image
          src={heroImage}
          alt="Luxurious modern house exterior with a pool at dusk"
          fill
          className="object-cover"
          priority
          data-ai-hint="luxury house exterior"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-4 text-center text-primary-foreground">
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl">Trouvez la maison de vos rêves</h1>
          <p className="max-w-2xl text-lg md:text-xl">
            ZoeHouse vous aide à découvrir des propriétés exclusives et à trouver un lieu que vous aimerez.
          </p>
          <div className="w-full max-w-4xl pt-4">
            <PropertySearchFilters onFilterChange={handleSearch} isHomePage={true}/>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="font-headline text-3xl md:text-4xl">Biens en vedette</h2>
          <p className="text-muted-foreground">Découvrez notre sélection de propriétés exceptionnelles.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
          ) : (
            featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} className="transition-all hover:shadow-xl"/>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
