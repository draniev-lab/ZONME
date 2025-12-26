
"use client";

import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { UserProfile, UserDocument } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, BadgeCheck, BadgeAlert, File, BadgeInfo, Contact, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, serverTimestamp, query, where } from "firebase/firestore";
import { useMemo, useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { VerifiedBadge } from "@/components/verified-badge";

const documentSchema = z.object({
  type: z.enum(["CNI", "Passeport", "Selfie"], { required_error: "Veuillez choisir un type de document." }),
  // URL is no longer in the form, it will come from the uploader
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || '');

  const userDocumentsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, "userDocuments"),
        where("userId", "==", user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: documents, loading: documentsLoading } = useCollection<UserDocument>(userDocumentsQuery);
  
  const loading = userLoading || profileLoading || documentsLoading;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
  });

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "agent": return <Badge variant="outline">Agent</Badge>;
      case "owner": return <Badge variant="secondary">Propriétaire</Badge>;
      default: return <Badge variant="default">Client</Badge>;
    }
  }

  const getStatusBadge = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
        case "pending": return <Badge variant="secondary"><BadgeInfo className="mr-1 h-3 w-3"/>En attente</Badge>;
        case "approved": return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><BadgeCheck className="mr-1 h-3 w-3"/>Approuvé</Badge>;
        case "rejected": return <Badge variant="destructive"><BadgeAlert className="mr-1 h-3 w-3"/>Rejeté</Badge>;
    }
  }
  
  const getDocumentIcon = (type: UserDocument['type']) => {
      switch(type) {
          case 'CNI': return <Contact className="h-5 w-5 text-muted-foreground" />;
          case 'Passeport': return <File className="h-5 w-5 text-muted-foreground" />;
          case 'Selfie': return <Camera className="h-5 w-5 text-muted-foreground" />;
      }
  }

  const handleUploadAndSubmit = async (downloadURL: string) => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté." });
        return;
    }
    const type = form.getValues("type");
    if (!type) {
        toast({ variant: "destructive", title: "Erreur de formulaire", description: "Veuillez d'abord sélectionner un type de document." });
        return;
    }

    setIsSubmitting(true);
    try {
        await addDoc(collection(firestore, "userDocuments"), {
            userId: user.uid,
            type: type,
            url: downloadURL,
            status: "pending",
            createdAt: serverTimestamp(),
        });
        toast({ title: "Document soumis", description: "Votre document a été envoyé pour vérification." });
        form.reset({ type: undefined });
    } catch(error) {
        console.error("Error submitting document:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de soumettre le document." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || !userProfile || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName} />
            <AvatarFallback className="text-3xl">{userProfile.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-headline md:text-4xl">
                    {userProfile.displayName}
                </h1>
                {userProfile.isVerified && <VerifiedBadge />}
            </div>

            <p className="text-muted-foreground">
            {userProfile.email}
            </p>
            {getRoleBadge(userProfile.role)}
        </div>
      </div>
      <Separator />

      <Card>
        <CardHeader>
            <CardTitle>Vérification d'Identité (KYC)</CardTitle>
            <CardDescription>Soumettez vos documents pour faire vérifier votre profil et accéder à plus de fonctionnalités.</CardDescription>
        </CardHeader>
         <CardContent className="space-y-6">
            <div>
                <h3 className="font-medium mb-2">Vos documents soumis</h3>
                {documents && documents.length > 0 ? (
                    <div className="space-y-2">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between rounded-md border p-3">
                                <div className="flex items-center gap-3">
                                    {getDocumentIcon(doc.type)}
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{doc.type}</a>
                                </div>
                                {getStatusBadge(doc.status)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Vous n'avez soumis aucun document.</p>
                )}
            </div>
            
            <Separator />
            
            <div>
                <h3 className="font-medium mb-4">Soumettre un nouveau document</h3>
                <Form {...form}>
                    <form className="space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>1. Choisissez le type de document</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="CNI">Carte d'Identité</SelectItem>
                                    <SelectItem value="Passeport">Passeport</SelectItem>
                                    <SelectItem value="Selfie">Selfie</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                          <FormLabel>2. Téléversez le fichier</FormLabel>
                          <FileUpload
                            userId={user.uid}
                            folder="kyc_documents"
                            onUploadComplete={handleUploadAndSubmit}
                            className="mt-2"
                           />
                        </div>
                    </form>
                </Form>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
