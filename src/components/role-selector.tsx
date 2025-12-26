"use client";

import { useFirestore } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/types";

interface RoleSelectorProps {
    userId: string;
    currentRole: UserProfile['role'];
    disabled?: boolean;
}

export function RoleSelector({ userId, currentRole, disabled = false }: RoleSelectorProps) {
    const { firestore } = useFirestore();
    const { toast } = useToast();

    const handleRoleChange = async (newRole: UserProfile['role']) => {
        if (!firestore) return;
        
        const userRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userRef, {
                role: newRole
            });
            toast({
                title: "Rôle mis à jour",
                description: `L'utilisateur a maintenant le rôle : ${newRole}.`,
            });
        } catch (error) {
            console.error("Failed to update user role:", error);
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de mettre à jour le rôle de l'utilisateur.",
            });
        }
    }

    return (
        <Select 
            defaultValue={currentRole}
            onValueChange={(value) => handleRoleChange(value as UserProfile['role'])}
            disabled={disabled}
        >
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Changer le rôle" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
        </Select>
    )
}
