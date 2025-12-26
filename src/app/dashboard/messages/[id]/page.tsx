
"use client";

import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { Message, Property, UserProfile } from "@/lib/types";
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Send, Paperclip, File as FileIcon } from "lucide-react";
import { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";


function FormattedMessageTime({ date }: { date: any }) {
    const [formattedTime, setFormattedTime] = useState("");

    useEffect(() => {
        if (date && typeof window !== 'undefined') {
            const d = date.toDate ? date.toDate() : new Date(date);
            setFormattedTime(format(d, 'HH:mm'));
        }
    }, [date]);

    return <time>{formattedTime}</time>;
}


function ConversationPageContent({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const otherUserUid = searchParams.get('with');

  const { data: property, loading: propertyLoading } = useDoc<Property>('properties', params.id);
  const { data: otherUser, loading: otherUserLoading } = useDoc<UserProfile>('users', otherUserUid || '');
  
  const messagesQuery = useMemo(() => {
    if (!firestore || !params.id || !user?.uid || !otherUserUid) return null;
    
    return query(
        collection(firestore, "messages"),
        where("propertyId", "==", params.id),
        where("participants", "array-contains", user.uid),
        orderBy("createdAt", "asc")
    );
  }, [firestore, params.id, user?.uid, otherUserUid]);

  const { data: messagesData, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  
  const messages = useMemo(() => {
    if (!otherUserUid || !messagesData) return [];
    return messagesData.filter(m => m.participants.includes(otherUserUid));
  }, [messagesData, otherUserUid]);

  const [newMessage, setNewMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const loading = userLoading || propertyLoading || messagesLoading || otherUserLoading;
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent, type: 'text' | 'file' = 'text', content?: string) => {
    e.preventDefault();
    if (!user || !firestore || !property || !otherUser) return;
    
    const messageContent = type === 'text' ? newMessage.trim() : content?.trim();
    if (!messageContent) return;

    setIsSending(true);

    const messageData: Omit<Message, 'id' | 'createdAt'> = {
        propertyId: params.id,
        fromId: user.uid,
        toId: otherUser.uid,
        participants: [user.uid, otherUser.uid],
        createdAt: serverTimestamp() as any, // Temporary cast
        messageType: type,
        text: type === 'text' ? messageContent : `Fichier: ${messageContent.split('/').pop()}`,
        fileUrl: type === 'file' ? messageContent : undefined,
    };

    try {
      await addDoc(collection(firestore, "messages"), messageData);
      if (type === 'text') setNewMessage("");
      if (type === 'file') setFileUrl("");
    } catch (error) {
      console.error("Failed to send message", error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'envoyer le message." });
    } finally {
      setIsSending(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Propriété non trouvée</h2>
        <p className="text-muted-foreground">Cette propriété n'existe pas ou plus.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/messages">Retour aux messages</Link></Button>
      </div>
    )
  }
  
   if (!otherUser) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Destinataire introuvable</h2>
        <p className="text-muted-foreground">Impossible de trouver l'utilisateur avec qui vous essayez de discuter.</p>
        <Button asChild className="mt-4"><Link href="/dashboard/messages">Retour aux messages</Link></Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
       <CardHeader className="flex-shrink-0">
          <Link href={`/properties/${property.id}`} className="hover:underline">
            <CardTitle className="font-headline">{property.title}</CardTitle>
          </Link>
          <CardDescription>Conversation avec {otherUser.displayName} à propos de ce bien.</CardDescription>
        </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isUserMessage = message.fromId === user?.uid;
            const sender = isUserMessage ? user : otherUser;

            return (
              <div key={index} className={cn("flex items-end gap-2", isUserMessage ? "justify-end" : "justify-start")}>
                 {!isUserMessage && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.photoURL || ''} />
                        <AvatarFallback>{sender?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                 )}
                <div className={cn("max-w-xs rounded-lg p-3 md:max-w-md", isUserMessage ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {message.messageType === 'file' && message.fileUrl ? (
                      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                          <FileIcon className="h-4 w-4" />
                          <span>{message.text}</span>
                      </a>
                  ) : (
                    <p className="text-sm">{message.text}</p>
                  )}
                  <div className="mt-1 text-right text-xs opacity-70">
                    <FormattedMessageTime date={message.createdAt} />
                  </div>
                </div>
                 {isUserMessage && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.photoURL || ''} />
                        <AvatarFallback>{sender?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                 )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={(e) => handleSendMessage(e, 'text')} className="flex w-full items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" disabled={!user || !otherUser}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Joindre un fichier</h4>
                            <p className="text-sm text-muted-foreground">
                                Collez l'URL d'un fichier à envoyer.
                            </p>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="file-url">URL du fichier</Label>
                            <Input 
                                id="file-url" 
                                placeholder="https://example.com/mon-fichier.pdf" 
                                className="h-8"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                            />
                         </div>
                         <Button onClick={(e) => handleSendMessage(e, 'file', fileUrl)} size="sm" disabled={isSending || !fileUrl.trim()}>Envoyer le fichier</Button>
                    </div>
                </PopoverContent>
            </Popover>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            autoComplete="off"
            disabled={!user || !otherUser}
          />
          <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}

export default function ConversationPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="flex h-[80vh] w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
            <ConversationPageContent params={params} />
        </Suspense>
    )
}
