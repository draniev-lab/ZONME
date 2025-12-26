import { Timestamp } from "firebase/firestore";

export type Property = {
  id: string;
  title: string;
  description: string;
  type: 'Terrain' | 'Maison' | 'Appartement' | 'Immeuble' | 'Commercial';
  status: 'Vente' | 'Location' | 'Réservation';
  price: number;
  address: string;
  city: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  area: number;
  features: {
    bedrooms: number;
    bathrooms: number;
    salons: number;
    kitchens: number;
  };
  imageUrls: string[];
  videoUrl?: string;
  tourUrl?: string;
  tags: string[];
  documentUrls?: string[];
  ownerId: string;
  createdAt: Timestamp;
  validated: boolean;
  favoritedBy?: string[];
};


export type Message = {
  id: string;
  text: string;
  propertyId: string;
  fromId: string;
  toId: string;
  participants: string[];
  createdAt: Timestamp;
  messageType: 'text' | 'file';
  fileUrl?: string;
};


export type VisitRequest = {
  id: string;
  propertyId: string;
  userId: string;
  ownerId: string;
  visitDate: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
}

export type TrustScore = {
    score: number;
    summary: string;
}

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'client' | 'owner' | 'agent' | 'admin';
  createdAt: Timestamp;
  stripeId?: string;
  fcmToken?: string;
  agencyId?: string; // ID of the agency this user belongs to, if any
  isVerified?: boolean; // Badge "Zoe Verified"
  trustScore?: TrustScore;
}

export type AgencyProfile = {
    id: string;
    name: string;
    ownerId: string;
    // agentIds is now a map for efficient security rule checks
    agentIds: { [uid: string]: true };
    createdAt: Timestamp;
}

export type UserDocument = {
    id: string;
    userId: string;
    type: 'CNI' | 'Passeport' | 'Selfie';
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

export type AppSettings = {
    id: string;
    reservationFee: number;
    reservationFeePriceId: string;
    agencySubscriptionPriceId?: string;
    fcmVapidKey: string;
}

export type ActivityLog = {
    id: string;
    userId: string;
    userDisplayName: string;
    action: string;
    details?: Record<string, any>;
    createdAt: Timestamp;
};


// Types for Stripe Extension
export type StripeCheckoutSession = {
    price: string;
    success_url: string;
    cancel_url: string;
    mode: 'payment' | 'subscription';
    // Populated by the extension
    url?: string;
    error?: { message: string };
}

    