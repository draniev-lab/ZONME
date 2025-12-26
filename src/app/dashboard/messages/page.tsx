
"use client";

import { useCollection, useUser } from "@/firebase";
import { Message, Property, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { TimeAgo } from "@/components/time-ago";

export default function MessagesPage() {
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();

  const messagesQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'messages'), 
        where('participants', 'array-contains', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: userMessages, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  const { data: properties, loading: propertiesLoading } = useCollection<Property>('properties');
  const { data: users, loading: usersDataLoading } = useCollection<UserProfile>('users');

  const loading = userLoading || messagesLoading || propertiesLoading || usersDataLoading;

  const conversations = useMemo(() => {
    if (loading || !user || !userMessages) return [];

    const groupedByConversation: Record<string, Message> = {};
    
    userMessages.forEach(message => {
        const otherUserId = message.fromId === user.uid ? message.toId : message.fromId;
        const propertyId = message.propertyId;
        const key = `${propertyId}_${otherUserId}`;
        
        if (!groupedByConversation[key]) {
            groupedByConversation[key] = message;
        }
    });

    return Object.values(groupedByConversation).map((lastMessage) => {
        const property = properties.find(p => p.id === lastMessage.propertyId);
        const otherUserId = lastMessage.fromId === user.uid ? lastMessage.toId : lastMessage.fromId;
        const otherUser = users.find(u => u.uid === otherUserId);
        const key = `${lastMessage.propertyId}_${otherUserId}`;

        return {
            key,
            property,
            lastMessage,
            otherUser,
        }
    }).filter(c => c.property && c.otherUser);

  }, [user, userMessages, properties, users, loading]);
  
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
          Messagerie
        </h1>
        <p className="text-muted-foreground">
          Consultez vos conversations avec les propriétaires et les acheteurs.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Liste de toutes vos conversations.</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Aucun message</h3>
                <p className="text-muted-foreground">Vous n'avez aucune conversation pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map(({ key, property, lastMessage, otherUser }) => {
                if (!property || !otherUser) return null;
                
                const conversationLink = `/dashboard/messages/${property.id}?with=${otherUser?.uid}`;
                const imageUrl = property.imageUrls?.[0];

                return (
                    <Link href={conversationLink} key={key} className="block rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border">
                               {imageUrl && <AvatarImage src={imageUrl} alt={property.title} />}
                               <AvatarFallback>{property.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between">
                                    <p className="font-semibold truncate">{property.title}</p>
                                    <TimeAgo date={lastMessage.createdAt?.toDate()} className="text-xs text-muted-foreground flex-shrink-0" />
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {lastMessage.fromId === user?.uid && 'Vous: '}{lastMessage.text}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <User className="h-3 w-3" />
                                    <span>Conversation avec {otherUser?.displayName || "un utilisateur"}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
