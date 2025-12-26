
"use client";

import { useCollection, useUser, useFirestore } from "@/firebase";
import { AgencyProfile, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDoc, query, where, collection, writeBatch, deleteField } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AgencyAgentsPage() {
    const { user, loading: userLoading } = useUser();
    const { firestore } = useFirestore();
    const { toast } = useToast();
    
    const myAgencyQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, "agencies"), 
            where(`agentIds.${user.uid}`, '==', true)
        );
    }, [firestore, user?.uid]);

    const { data: agencies, loading: agenciesLoading } = useCollection<AgencyProfile>(myAgencyQuery);
    const { data: allUsers, loading: usersDataLoading } = useCollection<UserProfile>('users');

    const loading = userLoading || agenciesLoading || usersDataLoading;

    const [newAgentUid, setNewAgentUid] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    
    const myAgency = useMemo(() => {
      if (!agencies || agencies.length === 0) return null;
      return agencies[0];
    }, [agencies]);


    const agencyMembers = useMemo(() => {
        if (!myAgency || !allUsers || allUsers.length === 0) return [];
        const agentUids = Object.keys(myAgency.agentIds || {});
        return allUsers
            .filter(u => agentUids.includes(u.uid))
            .sort((a, b) => {
                if (a.uid === myAgency.ownerId) return -1;
                if (b.uid === myAgency.ownerId) return 1;
                return (a.displayName || '').localeCompare(b.displayName || '');
            });
    }, [myAgency, allUsers]);
    
    const isOwner = myAgency?.ownerId === user?.uid;

    const handleAddAgent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !myAgency || !isOwner || !newAgentUid) {
          toast({ variant: 'destructive', title: "Action non autorisée ou UID manquant" });
          return;
      }
      setIsAdding(true);

      const batch = writeBatch(firestore);

      try {
          const userRef = doc(firestore, 'users', newAgentUid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
              toast({ variant: 'destructive', title: "Utilisateur introuvable", description: "Aucun utilisateur ne correspond à cet UID."});
              setIsAdding(false);
              return;
          }

          if (myAgency.agentIds && myAgency.agentIds[newAgentUid]) {
              toast({ variant: 'destructive', title: "Déjà membre", description: "Cet utilisateur est déjà dans votre agence."});
              setIsAdding(false);
              return;
          }

          const agencyRef = doc(firestore, 'agencies', myAgency.id);
          batch.update(agencyRef, {
              [`agentIds.${newAgentUid}`]: true
          });

          if (userSnap.data().role !== 'admin') {
            batch.update(userRef, {
                role: 'agent',
                agencyId: myAgency.id
            });
          }

          await batch.commit();

          toast({
              title: "Agent ajouté",
              description: `${userSnap.data().displayName} a été ajouté à votre agence.`
          });
          setNewAgentUid("");

      } catch (error) {
          console.error("Error adding agent: ", error);
          toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'ajouter l'agent." });
      } finally {
          setIsAdding(false);
      }
    }

    const handleRemoveAgent = async (agent: UserProfile) => {
        if (!firestore || !myAgency || !isOwner) {
            toast({ variant: 'destructive', title: "Action non autorisée" });
            return;
        }

        const batch = writeBatch(firestore);

        try {
            const agencyRef = doc(firestore, 'agencies', myAgency.id);
            batch.update(agencyRef, {
                [`agentIds.${agent.uid}`]: deleteField()
            });

            const userRef = doc(firestore, 'users', agent.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().role !== 'admin') {
                batch.update(userRef, {
                    role: 'client',
                    agencyId: null
                });
            }
            
            await batch.commit();

            toast({
                title: "Agent retiré",
                description: `${agent.displayName} a été retiré de votre agence.`
            });

        } catch (error) {
            console.error("Error removing agent: ", error);
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de retirer l'agent." });
        }
    }


    if (loading) {
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
          Gestion des Agents
        </h1>
        <p className="text-muted-foreground">
          Ajoutez, modifiez ou supprimez les agents de votre agence.
        </p>
      </div>
      <Separator />
      
      {!myAgency ? (
        <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Vous n'avez pas encore d'agence</h3>
            <p className="text-muted-foreground">Créez votre agence pour commencer à ajouter des agents.</p>
            <Button asChild className="mt-6">
                <Link href="/dashboard/agency/create"><PlusCircle className="mr-2"/> Créer une agence</Link>
            </Button>
        </Card>
      ) : (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{myAgency.name}</CardTitle>
                    <CardDescription>Liste des membres de votre agence.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Membre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agencyMembers.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                        <AvatarImage src={agent.photoURL || undefined} alt={agent.displayName || agent.email} />
                                        <AvatarFallback>{agent.displayName ? agent.displayName.charAt(0) : agent.email.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{agent.displayName || "N/A"}</span>
                                    </div>
                                    </TableCell>
                                    <TableCell>{agent.email}</TableCell>
                                    <TableCell>{agent.uid === myAgency.ownerId ? "Propriétaire" : "Agent"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            disabled={!isOwner || agent.uid === myAgency.ownerId}
                                            onClick={() => handleRemoveAgent(agent)}
                                        >
                                            Retirer
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {isOwner && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ajouter un nouvel agent</CardTitle>
                        <CardDescription>Ajoutez un utilisateur existant à votre agence en utilisant son UID. L'UID d'un utilisateur est visible sur la page de gestion des utilisateurs de l'admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddAgent} className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="agent-uid">UID de l'utilisateur</Label>
                                <Input 
                                    id="agent-uid" 
                                    placeholder="Entrez l'UID de l'utilisateur à ajouter"
                                    value={newAgentUid}
                                    onChange={(e) => setNewAgentUid(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={isAdding || !newAgentUid}>
                                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Ajouter l'agent
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </>
      )}

    </div>
  );
}
