
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, Bell } from "lucide-react";
import { AppSettings } from "@/lib/types";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

const settingsSchema = z.object({
  reservationFee: z.coerce.number().min(0, "Les frais de réservation ne peuvent pas être négatifs."),
  reservationFeePriceId: z.string().min(1, "L'ID de prix Stripe est requis (ex: price_xxxx)."),
  agencySubscriptionPriceId: z.string().optional(),
  fcmVapidKey: z.string().min(1, "La clé VAPID est requise pour les notifications."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { data: settings, loading: settingsLoading } = useDoc<AppSettings>('settings', 'app');

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      reservationFee: 0,
      reservationFeePriceId: "",
      agencySubscriptionPriceId: "",
      fcmVapidKey: "",
    }
  });
  
  useEffect(() => {
    if (settings) {
        form.reset({
            reservationFee: settings.reservationFee || 0,
            reservationFeePriceId: settings.reservationFeePriceId || "",
            agencySubscriptionPriceId: settings.agencySubscriptionPriceId || "",
            fcmVapidKey: settings.fcmVapidKey || "",
        });
    }
  }, [settings, form]);


  const onSubmit = async (data: SettingsFormValues) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Erreur", description: "Le service Firestore n'est pas disponible." });
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await setDoc(settingsRef, data, { merge: true });

      toast({
        title: "Paramètres sauvegardés !",
        description: "Les paramètres généraux de l'application ont été mis à jour.",
      });

    } catch (error) {
       console.error("Error updating settings: ", error);
       toast({
            variant: "destructive",
            title: "Oups ! Une erreur est survenue.",
            description: "Impossible de sauvegarder les paramètres. Veuillez réessayer.",
        });
    }
  };
  
  if (settingsLoading) {
      return (
          <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline md:text-4xl">
            Paramètres Généraux
            </h1>
            <p className="text-muted-foreground">
            Gérez les paramètres globaux de la plateforme ZoeHouse.
            </p>
        </div>
        <Separator />
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres de Paiement (Stripe)</CardTitle>
                        <CardDescription>Configurez les frais et les identifiants pour l'intégration des paiements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="reservationFee"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frais de réservation (XOF)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Ex: 50000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reservationFeePriceId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID de Prix Stripe (Frais de réservation)</FormLabel>
                                <FormControl>
                                <Input placeholder="Ex: price_1O..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    L'ID du produit de paiement unique pour les frais de réservation.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="agencySubscriptionPriceId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID de Prix Stripe (Abonnement Agence)</FormLabel>
                                <FormControl>
                                <Input placeholder="Ex: price_1P..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    L'ID du produit d'abonnement récurrent pour les agences.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/>Paramètres de Notification</CardTitle>
                        <CardDescription>Configurez la clé pour les notifications push (Firebase Cloud Messaging).</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="fcmVapidKey"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Clé VAPID pour FCM</FormLabel>
                                <FormControl>
                                <Input placeholder="Collez votre clé publique VAPID ici" {...field} />
                                </FormControl>
                                <FormDescription>
                                   Cette clé est nécessaire pour envoyer des notifications push. Vous la trouverez dans votre console Firebase, sous Paramètres du projet {'>'} Cloud Messaging.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Sauvegarde...
                        </>
                    ) : "Sauvegarder les paramètres"}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
