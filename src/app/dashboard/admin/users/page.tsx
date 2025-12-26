
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RoleSelector } from "@/components/role-selector";
import { useUser } from "@/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { VerifiedBadge } from "@/components/verified-badge";

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const { user: currentUser } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();

  const roleVariant: { [key in UserProfile['role']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    admin: 'destructive',
    owner: 'secondary',
    agent: 'outline',
    client: 'default'
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return format(date.toDate(), "d MMM yyyy", { locale: fr });
  }

  const handleVerificationToggle = async (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    try {
      await updateDoc(userRef, { isVerified: !currentStatus });
      toast({
        title: "Statut de vérification mis à jour",
        description: `L'utilisateur est maintenant ${!currentStatus ? 'vérifié' : 'non vérifié'}.`
      });
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de vérification."
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Gestion des Utilisateurs
        </h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs et leurs rôles sur la plateforme.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>Liste de tous les utilisateurs inscrits.</CardDescription>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Vérifié</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="text-right">UID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email} />
                            <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{user.displayName || "N/A"}</span>
                            {user.isVerified && <VerifiedBadge />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                       <TableCell>
                        <Checkbox
                          checked={!!user.isVerified}
                          onCheckedChange={(checked) => handleVerificationToggle(user.id, !!user.isVerified)}
                          disabled={user.uid === currentUser?.uid}
                          aria-label="Vérification"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleVariant[user.role] || 'outline'}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                          <RoleSelector userId={user.id} currentRole={user.role} disabled={user.uid === currentUser?.uid}/>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs truncate max-w-[100px]">{user.uid}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
