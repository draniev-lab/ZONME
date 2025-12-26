
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Bath, BedDouble, Calendar as CalendarIcon, ChefHat, Home, LandPlot, MapPin, Square, User, Loader2, CreditCard, FileText, Youtube, Rotate3d, Building, CheckCircle, Ban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDoc, useUser, useFirestore } from '@/firebase';
import type { Property, UserProfile } from '@/lib/types';
import { ContactOwnerSheet } from '@/components/contact-owner-sheet';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { VerifiedBadge } from '@/components/verified-badge';

const YouTubeEmbed = ({ videoUrl }: { videoUrl: string }) => {
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return <p className="text-red-500">URL de vidéo YouTube invalide.</p>;

    return (
        <div className="aspect-video w-full">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className='rounded-lg'
            ></iframe>
        </div>
    );
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  const { data: property, loading } = useDoc<Property>('properties', params.id);
  const { data: owner } = useDoc<UserProfile>('users', property?.ownerId);
  const { user, loading: userLoading } = useUser();
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid || '');
  const { firestore } = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading && property && !property.validated && userProfile?.role !== 'admin' && user?.uid !== property.ownerId) {
      toast({
        variant: "destructive",
        title: "Annonce non disponible",
        description: "Cette annonce est en cours de validation.",
      });
      router.replace('/properties');
    }
  }, [loading, property, user, userProfile, router, toast]);

  if (loading || userLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    notFound();
  }
  
  const ownerImage = owner?.photoURL;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRequestVisit = async () => {
    if (!selectedDate || !user || !firestore || !property) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez vous connecter et sélectionner une date.",
        });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        await addDoc(collection(firestore, "visitRequests"), {
            propertyId: property.id,
            userId: user.uid,
            ownerId: property.ownerId,
            visitDate: selectedDate,
            status: "pending",
            createdAt: serverTimestamp(),
        });

        toast({
            title: "Demande de visite envoyée !",
            description: `Votre demande pour le ${format(selectedDate, 'PPP', { locale: fr })} a été transmise au propriétaire.`,
        });
        setSelectedDate(undefined);

    } catch (error) {
        console.error("Failed to create visit request", error);
        toast({
            variant: "destructive",
            title: "Oups !",
            description: "Impossible d'envoyer la demande de visite. Veuillez réessayer.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const featureIcons = {
    bedrooms: <BedDouble className="h-5 w-5 text-primary" />,
    bathrooms: <Bath className="h-5 w-5 text-primary" />,
    salons: <Home className="h-5 w-5 text-primary" />,
    kitchens: <ChefHat className="h-5 w-5 text-primary" />,
    area: <Square className="h-5 w-5 text-primary" />,
    type: {
      'Maison': <Home className="h-5 w-5 text-primary" />,
      'Appartement': <Building className="h-5 w-5 text-primary" />,
      'Terrain': <LandPlot className="h-5 w-5 text-primary" />,
      'Commercial': <LandPlot className="h-5 w-5 text-primary" />,
      'Immeuble': <Building className="h-5 w-5 text-primary" />,
    }
  };

  const isOwner = user?.uid === property.ownerId;
  const isReserved = property.status === 'Réservation';
  
  const images = property.imageUrls || [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
       {!property.validated && (
        <div className="mb-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800">
          <p className="font-bold">Annonce en attente</p>
          <p>Cette annonce est en cours de validation par nos administrateurs et n'est pas encore visible publiquement.</p>
        </div>
      )}
       {isReserved && (
        <div className="mb-4 rounded-lg border-l-4 border-blue-500 bg-blue-100 p-4 text-blue-800 flex items-center gap-4">
            <Ban className="h-6 w-6 text-blue-800"/>
            <div>
                <p className="font-bold">Propriété Réservée</p>
                <p>Ce bien est actuellement réservé et n'est pas disponible pour de nouvelles demandes.</p>
            </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Image Carousel */}
          <Card className="mb-6 overflow-hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-64 md:h-[500px]">
                      <Image
                        src={imageUrl}
                        alt={`Image ${index + 1} for ${property.title}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">{property.type}</Badge>
                  <CardTitle className="font-headline text-2xl md:text-4xl">{property.title}</CardTitle>
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>{property.address}, {property.city}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary">{formatPrice(property.price)}</div>
                  {property.status === 'Location' && <div className="text-sm font-medium text-primary/80">/mois</div>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              
              <div className="mb-6">
                <h3 className="mb-4 font-body text-xl font-bold">Caractéristiques</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                   <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.type[property.type]}
                    <div>
                      <div className="font-semibold">{property.type}</div>
                      <div className="text-xs text-muted-foreground">Type</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.area}
                    <div>
                      <div className="font-semibold">{property.area} m²</div>
                      <div className="text-xs text-muted-foreground">Superficie</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.bedrooms}
                    <div>
                      <div className="font-semibold">{property.features.bedrooms}</div>
                      <div className="text-xs text-muted-foreground">Chambres</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.bathrooms}
                    <div>
                      <div className="font-semibold">{property.features.bathrooms}</div>
                      <div className="text-xs text-muted-foreground">Salles de bain</div>
                    </div>
                  </div>
                   <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.salons}
                    <div>
                      <div className="font-semibold">{property.features.salons}</div>
                      <div className="text-xs text-muted-foreground">Salons</div>
                    </div>
                  </div>
                   <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    {featureIcons.kitchens}
                    <div>
                      <div className="font-semibold">{property.features.kitchens}</div>
                      <div className="text-xs text-muted-foreground">Cuisines</div>
                    </div>
                  </div>
                </div>
              </div>

               <Separator className="my-6" />

              <div className="mb-6 space-y-2">
                <h3 className="font-body text-xl font-bold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
              </div>
              
              {property.videoUrl && (
                  <div className="mb-6">
                    <Separator className="my-6" />
                    <h3 className="mb-4 font-body text-xl font-bold flex items-center gap-2"><Youtube className="h-6 w-6 text-red-600"/> Visite Vidéo</h3>
                    <YouTubeEmbed videoUrl={property.videoUrl} />
                  </div>
              )}
              
               {property.tourUrl && (
                <div className="mb-6">
                   <Separator className="my-6" />
                    <h3 className="mb-4 font-body text-xl font-bold flex items-center gap-2"><Rotate3d className="h-6 w-6 text-primary"/> Visite Virtuelle 360°</h3>
                    <Button asChild>
                        <a href={property.tourUrl} target="_blank" rel="noopener noreferrer">
                            Lancer la visite immersive
                        </a>
                    </Button>
                </div>
              )}

              
              {property.tags && property.tags.length > 0 && (
                <div className="mb-6">
                  <Separator className="my-6" />
                  <h3 className="mb-4 font-body text-xl font-bold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {property.documentUrls && property.documentUrls.length > 0 && (
                <div>
                  <Separator className="my-6" />
                  <h3 className="mb-4 font-body text-xl font-bold">Documents</h3>
                  <div className="space-y-2">
                    {property.documentUrls.map((url, index) => (
                      <Button asChild variant="secondary" key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Document {index + 1}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
               <Avatar className="h-16 w-16">
                 <AvatarImage src={ownerImage} alt={owner?.displayName || "Propriétaire"} />
                 <AvatarFallback>{owner?.displayName?.charAt(0) || 'P'}</AvatarFallback>
               </Avatar>
               <div>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-body font-bold">{owner?.displayName || "Propriétaire"}</CardTitle>
                    {owner?.isVerified && <VerifiedBadge />}
                </div>
                <CardDescription>Membre depuis {owner?.createdAt ? format(owner.createdAt.toDate(), 'MMMM yyyy', { locale: fr }) : '...'}</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                { !isOwner && user && <ContactOwnerSheet property={property} user={user} /> }
                { !isOwner && user && property.status !== 'Location' && (
                    <Button asChild variant="default" disabled={isReserved || !property.validated} className="w-full">
                        <Link href={`/checkout/${property.id}`}>
                            <CreditCard className="mr-2 h-4 w-4"/>
                            {isReserved ? "Déjà Réservé" : "Réserver ce bien"}
                        </Link>
                    </Button>
                ) }
                { isOwner && <Button disabled className='w-full'>C'est votre annonce</Button> }
                 { !user && <Button asChild className="w-full"><Link href="/login">Connectez-vous pour contacter</Link></Button> }
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-xl font-bold">Planifier une visite</CardTitle>
              <CardDescription>Choisissez une date qui vous convient.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={[{ before: new Date() }]}
                className="rounded-md border"
                locale={fr}
              />
              <Button 
                className="mt-4 w-full" 
                disabled={!selectedDate || isSubmitting || !user || isOwner || isReserved || !property.validated}
                onClick={handleRequestVisit}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                {selectedDate ? `Demander pour le ${format(selectedDate, 'd MMM')}` : 'Choisir une date'}
              </Button>
               {isOwner && <p className="text-xs text-muted-foreground mt-2">Vous ne pouvez pas demander de visite pour votre propre bien.</p>}
               {!user && <p className="text-xs text-muted-foreground mt-2">Vous devez être connecté pour demander une visite.</p>}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
