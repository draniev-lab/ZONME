
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, type User, AuthErrorCodes } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, limit, getDoc } from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserProfile } from "@/lib/types";
import Link from "next/link";
import React from "react";

const signupSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(["client", "owner"], { required_error: "Veuillez choisir un type de compte."}),
});

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { auth, firestore } = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      role: "client",
    }
  });

  const createUserProfile = async (user: User, role: 'client' | 'owner'): Promise<UserProfile | null> => {
      if (!firestore) throw new Error("Firestore not initialized");

      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) return { id: userSnap.id, ...userSnap.data() } as UserProfile;

      const usersQuery = query(collection(firestore, "users"), limit(1));
      const usersSnapshot = await getDocs(usersQuery);
      const isFirstUser = usersSnapshot.empty;
      
      const newUserProfile: Omit<UserProfile, 'id'> = {
        uid: user.uid,
        email: user.email || `phone-${user.uid}@zoe.house`,
        displayName: user.displayName || "Utilisateur Anonyme",
        role: isFirstUser ? "admin" : role,
        createdAt: serverTimestamp() as any,
      };
      
      if (user.photoURL) {
        newUserProfile.photoURL = user.photoURL;
      }

      await setDoc(userRef, newUserProfile);
      
      const newSnap = await getDoc(userRef);
      return newSnap.exists() ? { id: newSnap.id, ...newSnap.data() } as UserProfile : null;
  }
  
  const handleSuccessfulLogin = (userProfile: UserProfile | null) => {
    if (!userProfile) {
        toast({ variant: "destructive", title: "Erreur de création de profil", description: "Le profil utilisateur n'a pas pu être lu après sa création." });
        return;
    }
    toast({
        title: "Compte créé avec succès !",
        description: "Vous êtes maintenant connecté.",
    });

    if (userProfile.role === 'admin') {
        router.push("/dashboard/admin");
    } else {
        router.push("/dashboard");
    }
  }

  const onEmailSignUp: SubmitHandler<SignupSchema> = async (data) => {
    if (!firestore || !auth) {
        toast({ variant: "destructive", title: "Erreur", description: "Le service d'authentification n'est pas disponible." });
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
          displayName: data.displayName
      });
      
      // We need to reload the user to get the updated displayName
      await auth.currentUser?.reload();
      const updatedUser = auth.currentUser;

      if (!updatedUser) throw new Error("User not found after update.");

      const userProfile = await createUserProfile(updatedUser, data.role);

      handleSuccessfulLogin(userProfile);

    } catch (error: any) {
      console.error("Erreur d'inscription Email:", error);
      let title = "Erreur d'inscription";
      let description = "Impossible de créer le compte. Veuillez réessayer.";
      let action: React.ReactElement | undefined = undefined;

      if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
        title = "Email déjà utilisé";
        description = "Cette adresse e-mail est déjà associée à un compte.";
        action = (
            <Button variant="secondary" size="sm" asChild>
                <Link href="/login">Se connecter</Link>
            </Button>
        );
      } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
          title = "Mot de passe faible";
          description = "Le mot de passe doit contenir au moins 6 caractères.";
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
        action: action
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Créez votre compte</CardTitle>
          <CardDescription>Rejoignez ZoeHouse pour trouver le bien de vos rêves</CardDescription>
        </CardHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onEmailSignUp)}>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="nom@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Vous êtes</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <RadioGroupItem value="client" />
                        </FormControl>
                        <FormLabel className="font-normal">Client (Acheteur / Locataire)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <RadioGroupItem value="owner" />
                        </FormControl>
                        <FormLabel className="font-normal">Propriétaire</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full flex items-center gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>S'inscrire</span>
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
        </Form>
      </Card>
    </div>
  );
}

    