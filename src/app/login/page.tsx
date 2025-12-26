
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Facebook, Mail, Loader2, Phone, Send } from "lucide-react";
import { useFirestore } from "@/firebase";
import { GoogleAuthProvider, FacebookAuthProvider, signInWithEmailAndPassword, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, User, AuthErrorCodes } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { UserProfile } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

type LoginSchema = z.infer<typeof loginSchema>;

const phoneLoginSchema = z.object({
    phone: z.string().regex(/^[0-9]{8,15}$/, "Numéro de téléphone invalide."),
});

type PhoneLoginSchema = z.infer<typeof phoneLoginSchema>;

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691c2.242-4.333 6.641-7.447 11.694-8.084l-5.657 5.657C9.839 13.437 7.727 13.77 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.043 36.372 44 30.563 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );

export default function LoginPage() {
  const { auth, firestore } = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enter_phone' | 'enter_code'>('enter_phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState('');
  
  useEffect(() => {
    if (!auth) return;
    // Check if recaptchaVerifier is already initialized to avoid re-creating it
    if (window.recaptchaVerifier) return;
    
    // Ensure the container exists before initializing
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) return;

    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
    });

  }, [auth]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const phoneForm = useForm<PhoneLoginSchema>({
    resolver: zodResolver(phoneLoginSchema),
  });

  const handleSuccessfulLogin = (userProfile: UserProfile) => {
    toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${userProfile.displayName}.`,
    });

    if (userProfile.role === 'admin') {
        router.push("/dashboard/admin");
    } else {
        router.push("/dashboard");
    }
  };

  const createUserProfileIfNeeded = async (user: User): Promise<UserProfile | null> => {
    if (!firestore) throw new Error("Firestore is not initialized.");
    const userRef = doc(firestore, "users", user.uid);
    let userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUserProfile: Omit<UserProfile, 'id'> = {
            uid: user.uid,
            email: user.email || `phone-${user.uid}@zoe.house`,
            displayName: user.displayName || user.phoneNumber || "Utilisateur Anonyme",
            role: 'client',
            createdAt: serverTimestamp() as any,
            ...(user.photoURL && { photoURL: user.photoURL }),
        };
        await setDoc(userRef, newUserProfile);
        userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;
    }
    
    return { id: userSnap.id, ...userSnap.data() } as UserProfile;
  };

  const handleProviderSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
      if (!auth || !firestore) return;
      if (provider.providerId === "google.com") setGoogleLoading(true);
      else setFacebookLoading(true);

      try {
        const result = await signInWithPopup(auth, provider);
        const userProfile = await createUserProfileIfNeeded(result.user);
        if (userProfile) {
            handleSuccessfulLogin(userProfile);
        } else {
             toast({ variant: "destructive", title: "Erreur de profil", description: "Impossible de créer ou de trouver votre profil utilisateur." });
        }
      } catch (error: any) {
        console.error("Provider Sign In Error:", error);
        let description = "Impossible de se connecter. Veuillez réessayer.";
        if (error.code === 'auth/account-exists-with-different-credential') {
            description = "Un compte existe déjà avec cet e-mail. Essayez de vous connecter avec un autre fournisseur."
        } else if (error.code === 'auth/unauthorized-domain') {
            description = "Ce domaine n'est pas autorisé pour l'authentification. L'administrateur doit l'ajouter dans la console Firebase.";
        }
        toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: description,
        });
      } finally {
        if (provider.providerId === "google.com") setGoogleLoading(false);
        else setFacebookLoading(false);
      }
  }

  const onEmailSignIn: SubmitHandler<LoginSchema> = async (data) => {
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Erreur de configuration", description: "Le service d'authentification n'est pas prêt." });
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userProfile = await createUserProfileIfNeeded(userCredential.user);
      if (userProfile) {
          handleSuccessfulLogin(userProfile);
      } else {
          toast({ variant: "destructive", title: "Erreur de profil", description: "Impossible de trouver votre profil utilisateur après la connexion." });
      }
    } catch (error: any) {
        console.error("Email Sign In Error:", error);
        let title = "Erreur de connexion";
        let description = "Un problème est survenu. Veuillez réessayer.";

        switch (error.code) {
            case AuthErrorCodes.INVALID_CREDENTIAL:
            case "auth/user-not-found":
            case "auth/wrong-password":
                title = "Identifiants invalides";
                description = "L'adresse e-mail ou le mot de passe que vous avez entré est incorrect.";
                break;
            case AuthErrorCodes.NETWORK_REQUEST_FAILED:
                title = "Erreur réseau";
                description = "Impossible de se connecter aux serveurs de Firebase. Vérifiez votre connexion internet.";
                break;
            default:
                description = `Erreur: ${error.message}`;
        }
        
        toast({
            variant: "destructive",
            title: title,
            description: description,
        });
    }
  };
  
  const onPhoneSignIn: SubmitHandler<PhoneLoginSchema> = async (data) => {
    if (!auth || !window.recaptchaVerifier) return;
    
    const submitButton = document.querySelector<HTMLButtonElement>('#phone-submit-button');
    if(submitButton) submitButton.disabled = true;

    const fullPhoneNumber = `+228${data.phone}`;
    setPhoneNumber(data.phone);

    try {
        const result = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
        setConfirmationResult(result);
        setPhoneStep('enter_code');
        toast({
            title: "Code envoyé",
            description: `Un code a été envoyé au ${fullPhoneNumber}.`,
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        toast({
            variant: "destructive",
            title: "Erreur d'envoi du code",
            description: "Impossible d'envoyer le code. Vérifiez le numéro et réessayez.",
        });
        if (window.grecaptcha && window.recaptchaVerifier) {
            window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
        }
    } finally {
         if(submitButton) submitButton.disabled = false;
    }
  }

  const onOtpVerify = async () => {
    if (!confirmationResult || !otp || otp.length < 6 || !firestore) return;

    try {
        const result = await confirmationResult.confirm(otp);
        const userProfile = await createUserProfileIfNeeded(result.user);
        if (userProfile) {
            handleSuccessfulLogin(userProfile);
        } else {
             toast({ variant: "destructive", title: "Erreur de profil", description: "Impossible de créer ou de trouver votre profil utilisateur." });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        toast({
            variant: 'destructive',
            title: 'Code invalide',
            description: "Le code que vous avez entré est incorrect. Veuillez réessayer.",
        });
    }
  }


  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Bienvenue sur ZoeHouse</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre espace</CardDescription>
        </CardHeader>
        <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2"><Mail className="h-4 w-4"/> Email</TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2"><Phone className="h-4 w-4"/> Téléphone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <form onSubmit={handleSubmit(onEmailSignIn)}>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input id="email-login" type="email" placeholder="nom@exemple.com" {...register("email")} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Mot de passe oublié ?
                        </Link>
                    </div>
                    <Input id="password" type="password" {...register("password")} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span>Se connecter</span>}
                    </Button>
                </CardFooter>
                </form>
            </TabsContent>
            <TabsContent value="phone">
                 {phoneStep === 'enter_phone' ? (
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSignIn)}>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Numéro de téléphone</Label>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-sm text-muted-foreground">+228</span>
                                    <Input id="phone" type="tel" placeholder="9_ __ __ __" {...phoneForm.register("phone")} className="rounded-l-none" />
                                </div>
                                {phoneForm.formState.errors.phone && <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button id="phone-submit-button" type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
                                {phoneForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Envoyer le code
                            </Button>
                        </CardFooter>
                    </form>
                 ) : (
                    <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
                        <Label>Entrez le code de vérification</Label>
                        <p className="text-sm text-center text-muted-foreground">
                            Nous avons envoyé un code à <br/> <span className="font-semibold text-foreground">+228 {phoneNumber}</span>
                        </p>
                        <InputOTP maxLength={6} value={otp} onChange={setOtp} onComplete={onOtpVerify}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                        <Button variant="link" size="sm" onClick={() => setPhoneStep('enter_phone')}>
                            Changer de numéro
                        </Button>
                    </CardContent>
                 )}
            </TabsContent>
        </Tabs>
        <div className="flex flex-col gap-4 p-6 pt-0">
            <div className="relative w-full">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OU CONTINUER AVEC
              </span>
            </div>
            <div className="grid w-full grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleProviderSignIn(new GoogleAuthProvider())} disabled={googleLoading || isSubmitting} className="flex items-center gap-2">
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Google</span>
              </Button>
              <Button variant="outline" onClick={() => handleProviderSignIn(new FacebookAuthProvider())} disabled={facebookLoading || isSubmitting} className="flex items-center gap-2">
                 {facebookLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Facebook className="h-5 w-5 text-blue-600" />
                )}
                <span>Facebook</span>
              </Button>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Inscrivez-vous
              </Link>
            </p>
        </div>
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier & { widgetId?: string };
    grecaptcha: any;
  }
}

    