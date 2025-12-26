
"use server";

import { revalidatePath } from "next/cache";
import { intelligentPropertyRecommendations } from "@/ai/flows/intelligent-property-recommendations";
import { intelligentPropertySorting } from "@/ai/flows/intelligent-property-sorting";
import { getDocs, collection, DocumentData, query, where } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

interface RecommendationState {
  recommendations: string[];
  error: string | null;
  timestamp: number;
}

interface SortingState {
  sortedPropertyIds: string[];
  error: string | null;
  timestamp: number;
}

async function getProperties(): Promise<DocumentData[]> {
    const { firestore } = initializeFirebase();
    const propertiesCol = query(collection(firestore, 'properties'), where('validated', '==', true));
    const propertySnapshot = await getDocs(propertiesCol);
    const propertyList = propertySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return propertyList;
}

export async function getRecommendationsAction(
  prevState: RecommendationState,
  formData: FormData
): Promise<RecommendationState> {
  const budget = Number(formData.get("budget"));
  const preferredLocation = formData.get("preferredLocation") as string;
  const propertyType = formData.get("propertyType") as string;

  if (!budget || !preferredLocation || !propertyType) {
    return {
      recommendations: [],
      error: "Veuillez remplir tous les champs pour obtenir une recommandation.",
      timestamp: Date.now(),
    };
  }

  try {
    const properties = await getProperties();
    
    const propertyInfoForAI = properties.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        price: p.price,
        city: p.city,
        area: p.area,
    }));

    const result = await intelligentPropertyRecommendations({
      budget,
      preferredLocation,
      propertyType,
      properties: propertyInfoForAI,
    });
    
    const recommendedPropertyIds = result.recommendedProperties || [];

    revalidatePath("/dashboard/recommendations");
    return { recommendations: recommendedPropertyIds, error: null, timestamp: Date.now() };

  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return {
      recommendations: [],
      error: "Impossible d'obtenir les recommandations de l'IA. Veuillez réessayer.",
      timestamp: Date.now(),
    };
  }
}
