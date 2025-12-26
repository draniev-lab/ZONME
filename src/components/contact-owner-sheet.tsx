
"use client";

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useFirestore } from '@/firebase';
import { Loader2, Send } from 'lucide-react';
import type { Property } from '@/lib/types';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface ContactOwnerSheetProps {
    property: Property;
    user: User;
}

export function ContactOwnerSheet({ property, user }: ContactOwnerSheetProps) {
  const [message, setMessage] = useState("Bonjour, je suis intéressé par votre bien et j'aimerais avoir plus d'informations.");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!message.trim()) {
        toast({
            variant: "destructive",
            title: "Message vide",
            description: "Veuillez écrire un message avant de l'envoyer.",
        });
        return;
    }

    if (!firestore) return;
    setIsLoading(true);

    try {
        await addDoc(collection(firestore, "messages"), {
            text: message,
            propertyId: property.id,
            fromId: user.uid,
            toId: property.ownerId,
            participants: [user.uid, property.ownerId],
            createdAt: serverTimestamp(),
            messageType: 'text',
        });

        toast({
            title: "Message envoyé !",
            description: "Votre message a été transmis au propriétaire. Vous pouvez suivre la conversation dans votre messagerie.",
        });
        setMessage("");
        router.push(`/dashboard/messages/${property.id}?with=${property.ownerId}`);
    } catch(error) {
        console.error("Failed to send message: ", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible d'envoyer le message. Veuillez réessayer.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">Contacter le propriétaire</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-headline">Contacter le propriétaire</SheetTitle>
          <SheetDescription>
            Envoyez un message concernant la propriété "{property.title}". Le propriétaire vous répondra dès que possible.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="message" className="text-left">
              Votre message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, je suis intéressé par votre bien..."
              className="col-span-3"
              rows={10}
            />
          </div>
        </div>
        <SheetFooter>
            <SheetClose asChild>
                <Button variant="outline">Annuler</Button>
            </SheetClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer le message
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

    