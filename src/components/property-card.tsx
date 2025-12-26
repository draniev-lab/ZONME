import Image from 'next/image';
import Link from 'next/link';
import { Bath, BedDouble, MapPin, Heart, Columns3 } from 'lucide-react';
import type { Property } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { MouseEvent, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const imageUrl = property.imageUrls?.[0] || 'https://picsum.photos/seed/default/600/400';
  const { user } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getCompareIds = () => searchParams.getAll("ids");
  const [compareIds, setCompareIds] = useState(getCompareIds());
  
  useEffect(() => {
    setCompareIds(getCompareIds());
  }, [searchParams]);

  const isFavorited = user && property.favoritedBy?.includes(user.uid);
  const isComparing = compareIds.includes(property.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const handleFavoriteToggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour ajouter un bien à vos favoris.',
      });
      return;
    }

    const propertyRef = doc(firestore, 'properties', property.id);

    try {
      if (isFavorited) {
        await updateDoc(propertyRef, {
          favoritedBy: arrayRemove(user.uid),
        });
        toast({
          title: 'Favori retiré',
          description: `${property.title} a été retiré de vos favoris.`,
        });
      } else {
        await updateDoc(propertyRef, {
          favoritedBy: arrayUnion(user.uid),
        });
        toast({
          title: 'Favori ajouté !',
          description: `${property.title} a été ajouté à vos favoris.`,
        });
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast({
        variant: 'destructive',
        title: 'Oups !',
        description: 'Une erreur est survenue. Veuillez réessayer.',
      });
    }
  };

  const handleCompareToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let newIds = [...compareIds];

    if (newIds.includes(property.id)) {
      newIds = newIds.filter(id => id !== property.id);
    } else {
      if (newIds.length < 3) {
        newIds.push(property.id);
        toast({
          title: 'Bien ajouté au comparateur',
          description: `"${property.title}" a été ajouté à la comparaison.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Limite atteinte",
          description: "Vous ne pouvez comparer que 3 biens à la fois.",
        });
        return;
      }
    }
    
    setCompareIds(newIds);
    const params = new URLSearchParams(searchParams);
    params.delete("ids");
    newIds.forEach(id => params.append("ids", id));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }


  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-xl flex flex-col group", className)}>
      <Link href={`/properties/${property.id}`} className="flex flex-col flex-grow">
        <div className='relative'>
            <div className="relative h-56 w-full">
              <Image
                src={imageUrl}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <Badge variant="default" className="absolute right-2 top-2 bg-primary/80 backdrop-blur-sm">
                {property.status}
              </Badge>
            </div>
            <div className="absolute top-1 left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                  size="icon" 
                  variant="ghost" 
                  className="rounded-full h-8 w-8 bg-background/50 hover:bg-background/80"
                  onClick={handleFavoriteToggle}
              >
                  <Heart className={cn("h-5 w-5 text-white transition-colors", isFavorited && "fill-red-500 text-red-500")} />
              </Button>
              {pathname.includes("/properties") && (
                  <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full h-8 w-8 bg-background/50 hover:bg-background/80"
                      onClick={handleCompareToggle}
                  >
                      <Columns3 className={cn("h-5 w-5 text-white transition-colors", isComparing && "text-primary")} />
                  </Button>
              )}
          </div>
        </div>

        <div className="flex flex-col flex-grow p-4">
          <h2 className="mb-2 text-lg font-headline leading-tight">
            {property.title}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{property.address}, {property.city}</span>
          </div>
        </div>
      
        <div className="flex items-center justify-between p-4 pt-0 mt-auto">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <BedDouble className="h-5 w-5 text-primary" />
              <span>{property.features.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="h-5 w-5 text-primary" />
              <span>{property.features.bathrooms}</span>
            </div>
          </div>
          <div className="text-lg font-bold text-primary">
            {formatPrice(property.price)}
            {property.status === 'Location' && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
          </div>
        </div>
      </Link>
    </Card>
  );
}
