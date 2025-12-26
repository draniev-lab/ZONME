"use client";

import { useCollection } from "@/firebase";
import { UserProfile, Property, VisitRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, Home, ShieldCheck, CalendarClock } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>("users");
  const { data: properties, loading: propertiesLoading } = useCollection<Property>("properties");
  const { data: visitRequests, loading: requestsLoading } = useCollection<VisitRequest>("visitRequests");

  const loading = usersLoading || propertiesLoading || requestsLoading;

  const pendingValidationCount = properties.filter(p => !p.validated).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Tableau de Bord Administrateur
        </h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme ZoeHouse.
        </p>
      </div>
      <Separator />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs Totaux
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total d'inscrits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Propriétés Totales
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              Annonces sur la plateforme
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annonces à Valider</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingValidationCount}</div>
            <p className="text-xs text-muted-foreground">
              Propriétés en attente d'approbation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Visite</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Toutes les demandes confondues
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
