
"use client";

import { useMemo, useState } from "react";
import { useUser, useCollection, useFirestore, useDoc } from "@/firebase";
import { AgencyProfile, Property, AppSettings, StripeCheckoutSession } from "@/lib/types";
import AgencyOwnerLayout from "../owner-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, onSnapshot } from 'firebase/firestore';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";


const PRICE_PER_PROPERTY = 10000; // 10,000 XOF per property

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
};

export default function AgencyBillingPage() {
    const { user, loading: userLoading } = useUser();
    const { firestore } = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    
    const { data: settings, loading: settingsLoading } = useDoc<AppSettings>('settings', 'app');
    
    const myAgencyQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, "agencies"), 
            where('ownerId', '==', user.uid)
        );
    }, [firestore, user?.uid]);

    const { data: agencies, loading: agenciesLoading } = useCollection<AgencyProfile>(myAgencyQuery);
    const { data: allProperties, loading: propertiesLoading } = useCollection<Property>('properties');

    const loading = userLoading || agenciesLoading || propertiesLoading || settingsLoading;
    const [isPaying, setIsPaying] = useState(false);

    const myAgency = useMemo(() => {
      if (!agencies || agencies.length === 0) return null;
      return agencies[0];
    }, [agencies]);

    const agencyProperties = useMemo(() => {
        if (!myAgency || !allProperties) return [];
        const agentUids = Object.keys(myAgency.agentIds || {});
        return allProperties.filter(p => agentUids.includes(p.ownerId));
    }, [myAgency, allProperties]);

    const totalAmount = agencyProperties.length * PRICE_PER_PROPERTY;
    
    const handlePayBill = async () => {
        const priceId = settings?.agencySubscriptionPriceId;
        if (!user || !firestore || !myAgency || !priceId) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de procéder au paiement. La configuration est incomplète." });
            return;
        }
        setIsPaying(true);

        const successUrl = `${window.location.origin}/dashboard/agency/billing?payment=success`;
        const cancelUrl = `${window.location.origin}/dashboard/agency/billing?payment=canceled`;

        const checkoutSessionData: Omit<StripeCheckoutSession, 'url' | 'error'> = {
            price: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: 'subscription',
        };

        try {
            const sessionRef = await addDoc(
                collection(firestore, 'customers', user.uid, 'checkout_sessions'),
                checkoutSessionData
            );

            const unsubscribe = onSnapshot(sessionRef, (snap) => {
                const data = snap.data() as StripeCheckoutSession;
                if (data?.url) {
                    unsubscribe();
                    router.push(data.url);
                } else if (data?.error) {
                    unsubscribe();
                    console.error("Stripe Checkout Error:", data.error.message);
                    toast({ variant: 'destructive', title: "Erreur de paiement", description: data.error.message });
                    setIsPaying(false);
                }
            });

        } catch (error) {
            console.error("Failed to create checkout session:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "Une erreur est survenue lors de l'initialisation du paiement." });
            setIsPaying(false);
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
        <AgencyOwnerLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-headline md:text-4xl">
                    Facturation de l'Agence
                    </h1>
                    <p className="text-muted-foreground">
                    Consultez et réglez la facturation mensuelle de votre agence.
                    </p>
                </div>
                <Separator />
                
                <Card>
                    <CardHeader>
                        <CardTitle>Facture de {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</CardTitle>
                        <CardDescription>Facturation basée sur le nombre de biens actifs publiés par votre agence.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>
                                            <div className="font-medium">Nombre de biens actifs</div>
                                            <div className="text-sm text-muted-foreground">
                                                {agencyProperties.length} biens x {formatPrice(PRICE_PER_PROPERTY)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{formatPrice(totalAmount)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </ScrollArea>
                         <Separator className="my-4"/>
                         <div className="flex justify-end items-center text-lg font-bold">
                            <span>Total à Payer :</span>
                            <span className="ml-4 text-2xl text-primary">{formatPrice(totalAmount)}</span>
                         </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-end gap-2">
                        <Button className="w-full sm:w-auto" onClick={handlePayBill} disabled={isPaying || totalAmount === 0 || !settings?.agencySubscriptionPriceId}>
                            {isPaying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Paiement en cours...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Payer la facture
                                </>
                            )}
                        </Button>
                         {!settings?.agencySubscriptionPriceId && (
                            <p className="text-xs text-destructive text-right">L'administrateur doit configurer un ID de prix pour l'abonnement.</p>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </AgencyOwnerLayout>
    )
}
