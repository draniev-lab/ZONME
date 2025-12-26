
"use client";

import { useCollection, useUser, useFirestore } from "@/firebase";
import { Property, VisitRequest, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CalendarClock, Check, X, MessageSquare } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { TenantTrustScoreDialog } from "@/components/tenant-trust-score-dialog";


function FormattedVisitDate({ date }: { date: any }) {
    const [formattedDate, setFormattedDate] = useState('Date non spécifiée');

    useEffect(() => {
        if (date && typeof window !== 'undefined') {
            const d = date.toDate ? date.toDate() : new Date(date);
            setFormattedDate(format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr }));
        }
    }, [date]);

    return <time>{formattedDate}</time>;
}


export default function RequestsPage() {
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const { data: requests, loading: requestsLoading } = useCollection<VisitRequest>('visitRequests');
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');
  const { data: users, loading: usersDataLoading } = useCollection<UserProfile>('users');


  const loading = userLoading || requestsLoading || propertiesLoading || usersDataLoading;

  const myRequests = useMemo(() => {
    if (loading || !user) return [];

    return requests
        .filter(req => req.ownerId === user.uid)
        .map(req => ({
            ...req,
            property: properties.find(p => p.id === req.propertyId),
            requester: users.find(u => u.uid === req.userId),
        }))
        .filter(req => !!req.property && !!req.requester)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  }, [user, requests, properties, users, loading]);

  const handleStatusUpdate = async (requestId: string, status: "confirmed" | "cancelled") => {
    if (!firestore) return;
    const requestRef = doc(firestore, "visitRequests", requestId);
    try {
        await updateDoc(requestRef, { status });
        toast({
            title: "Demande mise à jour",
            description: `La demande a été ${status === 'confirmed' ? 'confirmée' : 'annulée'}.`,
        });
    } catch(error) {
        console.error("Error updating request status:", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre à jour la demande.",
        });
    }
  }

  const getStatusBadge = (status: "pending" | "confirmed" | "cancelled") => {
    switch (status) {
        case "pending": return <Badge variant="secondary">En attente</Badge>;
        case "confirmed": return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Confirmée</Badge>;
        case "cancelled": return <Badge variant="destructive">Annulée</Badge>;
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
          Demandes de Visite
        </h1>
        <p className="text-muted-foreground">
          Gérez les demandes de visite pour vos propriétés.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Demandes Reçues</CardTitle>
          <CardDescription>Liste de toutes les demandes de visite pour vos biens.</CardDescription>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune demande</h3>
                <p className="text-muted-foreground">Vous n'avez reçu aucune demande de visite pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map(({ id, property, visitDate, status, requester }) => {
                if (!property || !requester) return null;
                
                const messageLink = `/dashboard/messages/${property.id}?with=${requester.uid}`;

                return (
                    <div key={id} className="block rounded-lg border p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                                <Link href={`/properties/${property.id}`} className="hover:underline">
                                    <p className="font-semibold">{property.title}</p>
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    Date de visite souhaitée: <FormattedVisitDate date={visitDate} />
                                 </p>
                                 <p className="text-sm text-muted-foreground mt-1">
                                    Demandeur: <span className="font-medium text-foreground">{requester.displayName || requester.email}</span>
                                 </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm">Statut:</span>
                                    {getStatusBadge(status)}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
                                <TenantTrustScoreDialog requester={requester} />
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={messageLink}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Contacter
                                    </Link>
                                </Button>
                                {status === "pending" && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(id, "cancelled")}>
                                            <X className="h-4 w-4 mr-2" />
                                            Refuser
                                        </Button>
                                        <Button size="sm" onClick={() => handleStatusUpdate(id, "confirmed")}>
                                            <Check className="h-4 w-4 mr-2" />
                                            Accepter
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
