
"use client";

import { useCollection, useUser } from "@/firebase";
import { Property, VisitRequest, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CalendarCheck } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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


export default function MyRequestsPage() {
  const { user, loading: userLoading } = useUser();
  const { data: requests, loading: requestsLoading } = useCollection<VisitRequest>(
    user ? `visitRequests` : null
  );
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');
  const { data: users, loading: usersDataLoading } = useCollection<UserProfile>('users');

  const loading = userLoading || requestsLoading || propertiesLoading || usersDataLoading;

  const mySentRequests = useMemo(() => {
    if (loading || !user) return [];

    return requests
        .filter(req => req.userId === user.uid)
        .map(req => {
            const property = properties.find(p => p.id === req.propertyId);
            const owner = users.find(u => u.uid === req.ownerId);
            return {
                ...req,
                property,
                owner
            };
        })
        .filter(req => !!req.property)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  }, [user, requests, properties, users, loading]);

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
          Mes Demandes de Visite
        </h1>
        <p className="text-muted-foreground">
          Suivez le statut de toutes les demandes de visite que vous avez envoyées.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Demandes Envoyées</CardTitle>
          <CardDescription>Liste de toutes vos demandes de visite.</CardDescription>
        </CardHeader>
        <CardContent>
          {mySentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                <CalendarCheck className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune demande envoyée</h3>
                <p className="text-muted-foreground">Vous n'avez envoyé aucune demande de visite pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySentRequests.map(({ id, property, visitDate, status, owner }) => {
                if (!property) return null;

                return (
                    <div key={id} className="block rounded-lg border p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                                <Link href={`/properties/${property.id}`} className="hover:underline">
                                    <p className="font-semibold">{property.title}</p>
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    Date souhaitée: <FormattedVisitDate date={visitDate} />
                                </p>
                                 <p className="text-xs text-muted-foreground mt-1">Propriétaire: {owner?.displayName || 'Inconnu'}</p>
                            </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm">Statut:</span>
                                {getStatusBadge(status)}
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
