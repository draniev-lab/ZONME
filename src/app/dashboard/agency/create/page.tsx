
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const agencySchema = z.object({
  name: z.string().min(3, "Le nom de l'agence doit faire au moins 3 caractères."),
});

type AgencyFormValues = z.infer<typeof agencySchema>;

export default function CreateAgencyPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirestore();
  const router = useRouter();
  
  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: "",
    }
  });

  const onSubmit = async (data: AgencyFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour créer une agence.",
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);

      // 1. Create the agency document
      const agencyRef = doc(collection(firestore, "agencies"));
      const agencyData = {
        name: data.name,
        ownerId: user.uid,
        agentIds: { [user.uid]: true }, // The creator is the owner and first agent, use a map
        createdAt: serverTimestamp(),
      };
      batch.set(agencyRef, agencyData);

      // 2. Update user's profile with agencyId and ensure role is 'agent'
      const userRef = doc(firestore, "users", user.uid);
      batch.update(userRef, {
          role: "agent",
          agencyId: agencyRef.id
      });
      
      // Commit the batch
      await batch.commit();

      toast({
        title: "Agence créée !",
        description: `Votre agence "${data.name}" a été créée avec succès.`,
      });
      form.reset();
      router.push(`/dashboard/agency/agents`);

    } catch (error) {
       console.error("Error creating agency: ", error);
       toast({
            variant: "destructive",
            title: "Oups ! Une erreur est survenue.",
            description: "Impossible de créer votre agence. Veuillez réessayer.",
        });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Créer votre agence</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour créer votre agence immobilière.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'agence</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Immo-Succès" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Création...
                    </>
                  ) : "Créer l'agence"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
