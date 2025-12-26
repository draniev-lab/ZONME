
"use client";

import { useUser, useDoc } from "@/firebase";
import { UserProfile } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AgencyOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const loading = userLoading || profileLoading;

  useEffect(() => {
    if (!loading && !user) {
        router.replace('/login');
        return;
    }
    
    if (!loading && user && userProfile) {
        if (['agent', 'admin'].includes(userProfile.role)) {
            setIsAuthorized(true);
        } else {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: "Vous devez être membre d'une agence ou administrateur pour accéder à cette page."
            });
            router.replace('/dashboard');
        }
    }
  }, [user, userProfile, loading, router, toast]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Vérification des permissions...</p>
      </div>
    );
  }

  return <>{children}</>;
}
