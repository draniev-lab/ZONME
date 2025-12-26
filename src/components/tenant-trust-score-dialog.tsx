
"use client";

import { useState } from "react";
import { UserProfile, UserDocument } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Loader2, ShieldQuestion, BadgeCheck, BadgeAlert, BadgeInfo, File as FileIcon, Contact, Camera } from "lucide-react";
import { useCollection, useFirestore, useDoc } from "@/firebase";
import { calculateTenantTrustScore } from "@/ai/flows/tenant-trust-score-flow";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { VerifiedBadge } from "./verified-badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

interface TenantTrustScoreDialogProps {
  requester: UserProfile;
}

const getDocumentIcon = (type: UserDocument['type']) => {
    switch(type) {
        case 'CNI': return <Contact className="h-4 w-4 text-muted-foreground" />;
        case 'Passeport': return <FileIcon className="h-4 w-4 text-muted-foreground" />;
        case 'Selfie': return <Camera className="h-4 w-4 text-muted-foreground" />;
    }
}

const getStatusBadge = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
        case "pending": return <BadgeInfo className="mr-1 h-3 w-3"/>;
        case "approved": return <BadgeCheck className="mr-1 h-3 w-3 text-green-500"/>;
        case "rejected": return <BadgeAlert className="mr-1 h-3 w-3 text-red-500"/>;
    }
}


export function TenantTrustScoreDialog({ requester }: TenantTrustScoreDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', requester.id);
  const { data: documents, loading: documentsLoading } = useCollection<UserDocument>(`userDocuments`);
  const { firestore } = useFirestore();
  const { toast } = useToast();

  const requesterDocuments = documents.filter(doc => doc.userId === requester.uid);

  const handleCalculateScore = async () => {
    setIsLoading(true);
    try {
        const accountAgeInDays = userProfile?.createdAt 
            ? Math.floor((new Date().getTime() - userProfile.createdAt.toDate().getTime()) / (1000 * 3600 * 24))
            : 0;

        const result = await calculateTenantTrustScore({
            isZoeVerified: !!userProfile?.isVerified,
            accountAgeInDays: accountAgeInDays,
            submittedDocuments: requesterDocuments.map(d => ({ type: d.type, status: d.status }))
        });

        if (result && firestore) {
            const userRef = doc(firestore, "users", requester.uid);
            await updateDoc(userRef, {
                trustScore: result
            });
            toast({
                title: "Score de confiance calculé !",
                description: `Le score pour ${requester.displayName} est de ${result.score}.`
            });
        }
    } catch (error) {
        console.error("Failed to calculate trust score:", error);
        toast({
            variant: "destructive",
            title: "Erreur IA",
            description: "Impossible de calculer le score de confiance pour le moment."
        });
    } finally {
        setIsLoading(false);
    }
  };

  const trustScore = userProfile?.trustScore;
  const scoreColor = trustScore ? (trustScore.score > 70 ? 'bg-green-500' : trustScore.score > 40 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-muted';
  const loading = profileLoading || documentsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <ShieldQuestion className="mr-2 h-4 w-4" />
          Évaluer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Score de Confiance</DialogTitle>
          <DialogDescription>
            Évaluation de la fiabilité du locataire potentiel: <span className="font-bold">{requester.displayName}</span>.
          </DialogDescription>
        </DialogHeader>
        {loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin" /></div> : (
        <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center space-y-2">
                {trustScore ? (
                    <>
                        <div className="relative h-24 w-24">
                             <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path
                                className="text-muted/50"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                />
                                <path
                                className={trustScore.score > 70 ? 'text-green-500' : trustScore.score > 40 ? 'text-yellow-500' : 'text-red-500'}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${trustScore.score}, 100`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{trustScore.score}</span>
                            </div>
                        </div>
                        <p className="text-sm text-center text-muted-foreground">{trustScore.summary}</p>
                    </>
                ) : (
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Aucun score calculé pour cet utilisateur.</p>
                    </div>
                )}
            </div>
            
            <Separator />

            <div className="space-y-2">
                <h4 className="font-semibold text-sm">Facteurs Clés</h4>
                <div className="flex items-center justify-between text-sm">
                    <p>Badge "Zoe Verified"</p>
                    {userProfile?.isVerified ? <VerifiedBadge /> : <span className="text-muted-foreground">Non</span>}
                </div>
                 <div className="space-y-2">
                    <p>Documents Soumis :</p>
                    {requesterDocuments.length > 0 ? (
                         <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                            {requesterDocuments.map(doc => (
                                <li key={doc.id} className="flex items-center gap-2">
                                    {getStatusBadge(doc.status)}
                                    {getDocumentIcon(doc.type)}
                                    <span>{doc.type}</span>
                                </li>
                            ))}
                         </ul>
                    ) : <p className="text-sm text-muted-foreground">Aucun</p>}
                </div>
            </div>

             <Button onClick={handleCalculateScore} disabled={isLoading} className="w-full mt-4">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
                {trustScore ? "Recalculer le score" : "Calculer le score"}
             </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

