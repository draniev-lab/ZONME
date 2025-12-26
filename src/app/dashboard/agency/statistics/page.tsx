
"use client";

import { useCollection, useUser, useFirestore, useDoc } from "@/firebase";
import { AgencyProfile, Property, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, Eye, Heart, BarChart3, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AgencyPerformanceChart } from "@/components/agency-performance-chart";
import { collection, query, where } from 'firebase/firestore';
import { ScrollArea } from "@/components/ui/scroll-area";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(price);
};


export default function AgencyStatisticsPage() {
    const { user, loading: userLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    const { firestore } = useFirestore();
    const isAdmin = userProfile?.role === 'admin';
    
    const myAgencyQuery = useMemo(() => {
        if (!firestore || !user?.uid || isAdmin) return null; // Les admins n'ont pas besoin de cette requête
        return query(
            collection(firestore, "agencies"), 
            where(`agentIds.${user.uid}`, '==', true)
        );
    }, [firestore, user?.uid, isAdmin]);

    const { data: agencies, loading: agenciesLoading } = useCollection<AgencyProfile>(myAgencyQuery);
    const { data: allProperties, loading: propertiesLoading } = useCollection<Property>('properties');
    const { data: allAgencies, loading: allAgenciesLoading } = useCollection<AgencyProfile>(isAdmin ? 'agencies' : null);

    const loading = userLoading || profileLoading || agenciesLoading || propertiesLoading || (isAdmin && allAgenciesLoading);

    const myAgency = useMemo(() => {
      if (isAdmin) return null; // L'admin n'a pas UNE agence spécifique
      if (!agencies || agencies.length === 0) return null;
      return agencies[0];
    }, [agencies, isAdmin]);


    const agencyProperties = useMemo(() => {
        if (!allProperties) return [];
        
        if (isAdmin) {
            // L'admin voit toutes les propriétés de toutes les agences
            const allAgentUids = new Set(allAgencies?.flatMap(a => Object.keys(a.agentIds)) || []);
            return allProperties.filter(p => allAgentUids.has(p.ownerId));
        }

        if (!myAgency || !myAgency.agentIds) return [];
        // Un agent ne voit que les propriétés de son agence
        const agentUids = Object.keys(myAgency.agentIds);
        return allProperties.filter(p => agentUids.includes(p.ownerId));
    }, [myAgency, allProperties, isAdmin, allAgencies]);

    const [propertyViews, setPropertyViews] = useState<Record<string, number>>({});

    useEffect(() => {
        if (agencyProperties.length > 0) {
            const newViews: Record<string, number> = {};
            agencyProperties.forEach(p => {
                // Simulate fetching views data, but make it deterministic based on stable property data
                const stableSeed = p.price + p.area;
                newViews[p.id] = Math.floor((stableSeed / 100000) % 5000) + (p.favoritedBy?.length || 0) * 10;
            });
            setPropertyViews(newViews);
        }
    }, [agencyProperties]);

    const totalViews = useMemo(() => Object.values(propertyViews).reduce((acc, v) => acc + v, 0), [propertyViews]);
    const totalFavorites = useMemo(() => agencyProperties.reduce((acc, p) => acc + (p.favoritedBy?.length || 0), 0), [agencyProperties]);
    const totalAgents = useMemo(() => {
        if (isAdmin) {
             return new Set(allAgencies?.flatMap(a => Object.keys(a.agentIds)) || []).size;
        }
        return myAgency?.agentIds ? Object.keys(myAgency.agentIds).length : 0;
    }, [isAdmin, allAgencies, myAgency]);


  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (!myAgency && !isAdmin) {
      return (
         <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline md:text-4xl">
                Statistiques de l'Agence
                </h1>
                <p className="text-muted-foreground">
                Analysez les performances de vos annonces et de vos agents.
                </p>
            </div>
            <Separator />
            <Card className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune agence trouvée</h3>
                    <p className="text-muted-foreground">Vous devez faire partie d'une agence pour voir les statistiques.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard/agency/create"><PlusCircle className="mr-2 h-4 w-4"/>Créer une agence</Link>
                    </Button>
            </Card>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          {isAdmin ? "Statistiques Globales des Agences" : "Statistiques de l'Agence"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Vue d'ensemble de toutes les agences sur la plateforme." : "Analysez les performances de vos annonces et de vos agents."}
        </p>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Biens Publiés
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyProperties.length}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total d'annonces
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vues Totales
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Vues sur toutes les annonces
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoris Totals</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFavorites}</div>
            <p className="text-xs text-muted-foreground">
              Total des mises en favoris
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Agents sur la plateforme" : "Membres de l'agence"}
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Performance des Annonces</CardTitle>
                    <CardDescription>Détails des vues et favoris par propriété.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Propriété</TableHead>
                                <TableHead className="text-right">Vues</TableHead>
                                <TableHead className="text-right">Favoris</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agencyProperties.map((prop) => (
                                <TableRow key={prop.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/properties/${prop.id}`} className="hover:underline truncate block max-w-xs">
                                            {prop.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right">{propertyViews[prop.id]?.toLocaleString() || 0}</TableCell>
                                    <TableCell className="text-right">{prop.favoritedBy?.length || 0}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Vues Mensuelles</CardTitle>
                    <CardDescription>Performance globale des annonces sur les 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AgencyPerformanceChart />
                </CardContent>
             </Card>

       </div>
    </div>
  );
}
