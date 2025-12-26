
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Trash2, Youtube, Rotate3d, XCircle } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Property } from "@/lib/types";
import { FileUpload } from "@/components/file-upload";
import Image from "next/image";

const propertySchema = z.object({
  title: z.string().min(10, "Le titre doit faire au moins 10 caractères."),
  description: z.string().min(20, "La description doit faire au moins 20 caractères."),
  type: z.enum(["Maison", "Appartement", "Terrain", "Immeuble", "Commercial"], {
    required_error: "Le type de bien est requis.",
  }),
  status: z.enum(["Vente", "Location"], {
    required_error: "Le statut est requis.",
  }),
  price: z.coerce.number().min(1, "Le prix doit être supérieur à 0."),
  address: z.string().min(5, "L'adresse est requise."),
  city: z.string().min(2, "La ville est requise."),
  area: z.coerce.number().min(1, "La superficie est requise."),
  bedrooms: z.coerce.number().min(0).default(0),
  bathrooms: z.coerce.number().min(0).default(0),
  salons: z.coerce.number().min(0).default(0),
  kitchens: z.coerce.number().min(0).default(0),
  videoUrl: z.string().url("Veuillez entrer une URL de vidéo valide.").optional().or(z.literal('')),
  tourUrl: z.string().url("Veuillez entrer une URL de visite virtuelle valide.").optional().or(z.literal('')),
  tags: z.string().optional(),
  imageUrls: z.array(z.string()).min(1, "Veuillez sélectionner au moins une image.").max(5, "Vous ne pouvez pas ajouter plus de 5 images."),
  documentUrls: z.array(z.object({ value: z.string().url({ message: "Veuillez entrer une URL valide." }) })).optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const { id: propertyId } = params;
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const router = useRouter();
  const { data: property, loading: propertyLoading } = useDoc<Property>('properties', propertyId);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
  });

   const [imageUrls, setImageUrls] = useState<string[]>([]);
  
    const handleUploadComplete = (url: string) => {
        if (imageUrls.length < 5) {
            const newImageUrls = [...imageUrls, url];
            setImageUrls(newImageUrls);
            form.setValue("imageUrls", newImageUrls, { shouldValidate: true });
        } else {
            toast({
                variant: "destructive",
                title: "Limite atteinte",
                description: "Vous ne pouvez téléverser que 5 images au maximum.",
            });
        }
    };
  
    const handleRemoveImage = (urlToRemove: string) => {
        const newImageUrls = imageUrls.filter(url => url !== urlToRemove);
        setImageUrls(newImageUrls);
        form.setValue("imageUrls", newImageUrls, { shouldValidate: true });
    }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documentUrls",
  });
  
  useEffect(() => {
    if (property) {
      if (!userLoading && user?.uid !== property.ownerId) {
        toast({ variant: "destructive", title: "Accès non autorisé" });
        router.push('/dashboard');
        return;
      }
      
      form.reset({
        title: property.title,
        description: property.description,
        type: property.type,
        status: property.status as "Vente" | "Location",
        price: property.price,
        address: property.address,
        city: property.city,
        area: property.area,
        bedrooms: property.features.bedrooms,
        bathrooms: property.features.bathrooms,
        salons: property.features.salons,
        kitchens: property.features.kitchens,
        videoUrl: property.videoUrl,
        tourUrl: property.tourUrl,
        tags: property.tags?.join(', '),
        documentUrls: property.documentUrls?.map(url => ({ value: url })) || [],
        imageUrls: property.imageUrls || [],
      });
      setImageUrls(property.imageUrls || []);
    }
  }, [property, form, user, userLoading, router, toast]);

  const onSubmit = async (data: PropertyFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour modifier une annonce.",
      });
      return;
    }

    try {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const propertyRef = doc(firestore, "properties", propertyId);
      await updateDoc(propertyRef, {
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        price: data.price,
        address: data.address,
        city: data.city,
        area: data.area,
        features: {
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          salons: data.salons,
          kitchens: data.kitchens,
        },
        videoUrl: data.videoUrl || "",
        tourUrl: data.tourUrl || "",
        tags: tagsArray,
        imageUrls: data.imageUrls,
        documentUrls: data.documentUrls?.map(doc => doc.value).filter(Boolean) || [],
        validated: false, 
      });

      toast({
        title: "Annonce modifiée !",
        description: "Votre annonce a été mise à jour et est en attente de re-validation.",
      });
      router.push(`/properties/${propertyId}`);

    } catch (error) {
       console.error("Error updating document: ", error);
       toast({
            variant: "destructive",
            title: "Oups ! Une erreur est survenue.",
            description: "Impossible de modifier votre annonce. Veuillez réessayer.",
        });
    }
  };
  
  if (propertyLoading || userLoading) {
      return (
          <div className="flex h-[80vh] w-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }
  
  if (!property) {
      return (
          <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
              <h2 className="text-2xl font-bold">Annonce non trouvée</h2>
              <p className="text-muted-foreground">Cette annonce n'existe pas.</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Modifier l'annonce</CardTitle>
          <CardDescription>Mettez à jour les informations de votre bien immobilier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Informations de base</h3>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre de l'annonce</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Villa moderne avec vue sur mer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Décrivez votre bien en détail..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Property Details */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Détails de la propriété</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Type de bien</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                          <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          <SelectItem value="Maison">Maison</SelectItem>
                                          <SelectItem value="Appartement">Appartement</SelectItem>
                                          <SelectItem value="Terrain">Terrain</SelectItem>
                                          <SelectItem value="Immeuble">Immeuble</SelectItem>
                                          <SelectItem value="Commercial">Commercial</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Statut de l'annonce</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                          <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          <SelectItem value="Vente">Vente</SelectItem>
                                          <SelectItem value="Location">Location</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prix</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="en Francs CFA (XOF)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>
              
              {/* Section 3: Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: 123 Rue de la Paix" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Lomé" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              </div>

              {/* Section 4: Characteristics */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Caractéristiques</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Superficie (m²)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 500" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chambres</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 4" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salles d'eau</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="salons"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salons</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 2" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="kitchens"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cuisines</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                  </div>
              </div>
              
                {/* Section 5: Media */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Média</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="imageUrls"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Images du bien</FormLabel>
                                <FormDescription>
                                Téléversez jusqu'à 5 images pour votre annonce.
                                </FormDescription>
                                {imageUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {imageUrls.map(url => (
                                            <div key={url} className="relative w-24 h-24">
                                                <Image src={url} alt="Aperçu du bien" layout="fill" className="object-cover rounded-md" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => handleRemoveImage(url)}>
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {user && imageUrls.length < 5 && (
                                    <FileUpload
                                        userId={user.uid}
                                        folder="property_images"
                                        onUploadComplete={handleUploadComplete}
                                    />
                                )}
                                 <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la vidéo (YouTube, Vimeo, etc.)</FormLabel>
                           <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="https://www.youtube.com/watch?v=..." {...field} className="pl-9" />
                            </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tourUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la visite virtuelle (Matterport, Kuula, etc.)</FormLabel>
                          <div className="relative">
                            <Rotate3d className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="https://my.matterport.com/show/?m=..." {...field} className="pl-9" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: piscine, luxe, rénové" {...field} />
                          </FormControl>
                          <FormDescription>
                            Séparez les tags par des virgules.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Section 6: Documents */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Documents</h3>
                    {fields.map((field, index) => (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={`documentUrls.${index}.value`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                                URL du document {index + 1}
                            </FormLabel>
                            <div className="flex items-center gap-2">
                            <FormControl>
                                <Input placeholder="https://exemple.com/plan-cadastral.pdf" {...field} />
                            </FormControl>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    ))}
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ value: "" })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une URL de document
                    </Button>
                     <FormDescription>
                        Ajoutez des liens vers des documents pertinents (plan cadastral, titre foncier, etc.).
                    </FormDescription>
                </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</>
                  ) : "Mettre à jour l'annonce"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
