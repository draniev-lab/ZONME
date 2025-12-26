
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { ActivityLog } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
import { useMemo } from "react";
import { TimeAgo } from "@/components/time-ago";
import { collection, query, orderBy } from 'firebase/firestore';
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function AdminLogsPage() {
  const { firestore } = useFirestore();

  const logsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: logs, loading } = useCollection<ActivityLog>(logsQuery);

  const getActionBadge = (action: string) => {
    if (action.includes('login')) return <Badge variant="default">Connexion</Badge>;
    if (action.includes('create')) return <Badge variant="secondary">Création</Badge>;
    if (action.includes('approve')) return <Badge className="bg-green-600 hover:bg-green-700">Approbation</Badge>;
    if (action.includes('unapprove')) return <Badge variant="destructive">Révocation</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  }

  const getActionDescription = (log: ActivityLog) => {
    const userDisplayName = <span className="font-medium">{log.userDisplayName}</span>;

    switch (log.action) {
        case 'user_login':
            return <>{userDisplayName} s'est connecté(e).</>;
        case 'property_create':
            return <>{userDisplayName} a créé la propriété <Link href={`/properties/${log.details?.propertyId}`} className="font-semibold underline">{log.details?.title}</Link>.</>;
        case 'property_approve':
            return <>{userDisplayName} a validé la propriété <Link href={`/properties/${log.details?.propertyId}`} className="font-semibold underline">{log.details?.propertyTitle}</Link>.</>;
        case 'property_unapprove':
            return <>{userDisplayName} a dévalidé la propriété <Link href={`/properties/${log.details?.propertyId}`} className="font-semibold underline">{log.details?.propertyTitle}</Link>.</>;
        default:
            return <>{userDisplayName} a effectué l'action : {log.action}</>;
    }
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline md:text-4xl">
          Logs d'Activité
        </h1>
        <p className="text-muted-foreground">
          Suivez les actions importantes réalisées sur la plateforme.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Journal des Activités</CardTitle>
          <CardDescription>Flux en temps réel des actions des utilisateurs.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                <History className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucune activité enregistrée</h3>
                <p className="text-muted-foreground">Les actions des utilisateurs apparaîtront ici.</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getActionDescription(log)}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                          {log.createdAt && <TimeAgo date={log.createdAt?.toDate()} />}
                      </TableCell>
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
