
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { auth } = useAuth();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onForgotPassword: SubmitHandler<ForgotPasswordSchema> = async (data) => {
    if (!auth) {
        toast({ variant: "destructive", title: "Erreur", description: "Le service d'authentification n'est pas disponible." });
        return;
    }
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Email envoyé !",
        description: "Si un compte existe pour cette adresse, un email de réinitialisation de mot de passe a été envoyé.",
      });
    } catch (error: any) {
      console.error("Erreur de réinitialisation:", error);
      // We still show a success message to prevent user enumeration attacks
      toast({
        title: "Email envoyé !",
        description: "Si un compte existe pour cette adresse, un email de réinitialisation de mot de passe a été envoyé.",
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit(onForgotPassword)}>
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
                    <KeyRound className="h-8 w-8" /> Mot de passe oublié
                </CardTitle>
                <CardDescription>Entrez votre email pour recevoir un lien de réinitialisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nom@exemple.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} 
                <span>Envoyer l'email</span>
                </Button>
                 <p className="text-center text-sm text-muted-foreground">
                    Vous vous souvenez de votre mot de passe ?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Se connecter
                    </Link>
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    