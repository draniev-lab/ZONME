
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { UserProfile, UserDocument } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileCheck, Check, X, BadgeCheck, BadgeAlert, BadgeInfo } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminDocumentsPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: documents, loading: documentsLoading } = useCollection<UserDocument>('userDocuments');
  const { firestore } = useFirestore();
  const { toast } = useToast();

  const loading = usersLoading || documentsLoading;

  const documentsWithUsers = useMemo(() => {
    if (loading || !documents || !users) return [];
    return documents.map(doc => {
      const user = users.find(u => u.uid === doc.userId);
      return { ...doc, user };
    }).filter(d => d.user); // Filter out docs where user is not found
  }, [documents, users, loading]);
  
  const handleStatusChange = async (docId: string, newStatus: 'approved' | 'rejected') => {
    if (!firestore) return;

    const docRef = doc(firestore, 'userDocuments', docId);
    try {
      await updateDoc(docRef, { status: newStatus });
      toast({
          title: "Statut mis à jour",
          description: `Le document a été ${newStatus === 'approved' ? 'approuvé' : 'rejeté'}.`
      });
    } catch (error) {
      console.error("Error updating document status:", error);
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du document."
      });
    }
  }

  const getStatusBadge = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
        case "pending": return <Badge variant="secondary"><BadgeInfo className="mr-1 h-3 w-3"/>En attente</Badge>;
        case "approved": return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><BadgeCheck className="mr-1 h-3 w-3"/>Approuvé</Badge>;
        case "rejected": return <Badge variant="destructive"><BadgeAlert className="mr-1 h-3 w-3"/>Rejeté</Badge>;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Validation des Documents (KYC)
        </h1>
        <p className="text-muted-foreground">
          Vérifiez et validez les documents d'identité soumis par les utilisateurs.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Documents à Vérifier</CardTitle>
          <CardDescription>Liste des documents en attente de validation.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type de Document</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsWithUsers.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={doc.user?.photoURL || undefined} alt={doc.user?.displayName || 'User'} />
                            <AvatarFallback>{doc.user?.displayName ? doc.user.displayName.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <span>{doc.user?.displayName || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                          {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">Voir</a>
                          </Button>
                          {doc.status === 'pending' && (
                              <>
                                  <Button variant="destructive" size="sm" onClick={() => handleStatusChange(doc.id, 'rejected')}>
                                      <X className="mr-2 h-4 w-4"/> Rejeter
                                  </Button>
                                  <Button size="sm" onClick={() => handleStatusChange(doc.id, 'approved')}>
                                      <Check className="mr-2 h-4 w-4"/> Approuver
                                  </Button>
                              </>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
           {documentsWithUsers.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                <FileCheck className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucun document à vérifier</h3>
                <p className="text-muted-foreground">Il n'y a aucun document en attente de validation pour le moment.</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
