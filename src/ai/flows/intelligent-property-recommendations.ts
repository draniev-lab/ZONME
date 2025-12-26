'use server';

/**
 * @fileOverview An intelligent property recommendation AI agent.
 *
 * - intelligentPropertyRecommendations - A function that handles the property recommendation process.
 * - IntelligentPropertyRecommendationsInput - The input type for the intelligentPropertyRecommendations function.
 * - IntelligentPropertyRecommendationsOutput - The return type for the intelligentPropertyRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyInfoSchema = z.object({
  id: z.string().describe('The unique identifier for the property.'),
  title: z.string().describe('The title of the property listing.'),
  description: z.string().describe('The description of the property.'),
  type: z.string().describe('The type of property (e.g., Maison, Appartement).'),
  price: z.number().describe('The price of the property.'),
  city: z.string().describe('The city where the property is located.'),
  area: z.number().describe('The area of the property in square meters.'),
});

const IntelligentPropertyRecommendationsInputSchema = z.object({
  budget: z.number().describe('The user’s budget for the property.'),
  preferredLocation: z
    .string()
    .describe('The user’s preferred location for the property.'),
  propertyType: z
    .string()
    .describe(
      'The type of property the user is interested in (e.g., house, apartment, land).'
    ),
  properties: z
    .array(PropertyInfoSchema)
    .describe('The list of available properties to choose from.'),
});
export type IntelligentPropertyRecommendationsInput = z.infer<
  typeof IntelligentPropertyRecommendationsInputSchema
>;

const IntelligentPropertyRecommendationsOutputSchema = z.object({
  recommendedProperties: z
    .array(z.string())
    .describe(
      'A list of up to 3 property IDs that are recommended for the user, chosen from the provided list. The list should be ordered by relevance.'
    ),
});
export type IntelligentPropertyRecommendationsOutput = z.infer<
  typeof IntelligentPropertyRecommendationsOutputSchema
>;

export async function intelligentPropertyRecommendations(
  input: IntelligentPropertyRecommendationsInput
): Promise<IntelligentPropertyRecommendationsOutput> {
  return intelligentPropertyRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentPropertyRecommendationsPrompt',
  input: {schema: IntelligentPropertyRecommendationsInputSchema},
  output: {schema: IntelligentPropertyRecommendationsOutputSchema},
  prompt: `You are an AI real estate assistant that provides property recommendations to users.

  Based on the user's preferences and the list of available properties, recommend a list of up to 3 property IDs that best match their needs.

  User Preferences:
  - Budget: {{{budget}}}
  - Preferred Location: {{{preferredLocation}}}
  - Property Type: {{{propertyType}}}

  Available Properties:
  {{#each properties}}
  - ID: {{{this.id}}}, Title: {{{this.title}}}, Type: {{{this.type}}}, Price: {{{this.price}}}, Location: {{{this.city}}}, Area: {{{this.area}}}m², Description: {{{this.description}}}
  {{/each}}

  Analyze the available properties and return a list of the most relevant property IDs for the user. Only recommend properties from the provided list. Return the IDs in order of relevance.`,
});

const intelligentPropertyRecommendationsFlow = ai.defineFlow(
  {
    name: 'intelligentPropertyRecommendationsFlow',
    inputSchema: IntelligentPropertyRecommendationsInputSchema,
    outputSchema: IntelligentPropertyRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
