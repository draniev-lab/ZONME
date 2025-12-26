
'use server';

/**
 * @fileOverview An intelligent property sorting AI agent.
 *
 * - intelligentPropertySorting - A function that handles the property sorting process.
 * - IntelligentPropertySortingInput - The input type for the intelligentPropertySorting function.
 * - IntelligentPropertySortingOutput - The return type for the intelligentPropertySorting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyInfoSchema = z.object({
  id: z.string().describe('The unique identifier for the property.'),
  title: z.string().describe('The title of the property listing.'),
  description: z.string().describe('The description of the property.'),
  tags: z.array(z.string()).describe('A list of tags associated with the property.'),
});

const IntelligentPropertySortingInputSchema = z.object({
  searchQuery: z.string().describe('The user’s natural language search query.'),
  properties: z
    .array(PropertyInfoSchema)
    .describe('The list of available properties to sort.'),
});
export type IntelligentPropertySortingInput = z.infer<
  typeof IntelligentPropertySortingInputSchema
>;

const IntelligentPropertySortingOutputSchema = z.object({
  sortedPropertyIds: z
    .array(z.string())
    .describe(
      'A list of property IDs, sorted by their relevance to the user’s search query.'
    ),
});
export type IntelligentPropertySortingOutput = z.infer<
  typeof IntelligentPropertySortingOutputSchema
>;

export async function intelligentPropertySorting(
  input: IntelligentPropertySortingInput
): Promise<IntelligentPropertySortingOutput> {
  return intelligentPropertySortingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentPropertySortingPrompt',
  input: {schema: IntelligentPropertySortingInputSchema},
  output: {schema: IntelligentPropertySortingOutputSchema},
  prompt: `You are an AI real estate assistant that sorts property listings based on a user's natural language query.

  Analyze the user's query and the provided list of properties. Consider the title, description, and tags of each property to determine its relevance.

  User's Search Query: "{{{searchQuery}}}"

  Available Properties:
  {{#each properties}}
  - ID: {{{this.id}}}, Title: {{{this.title}}}, Description: {{{this.description}}}, Tags: {{#each this.tags}}{{{this}}}{{/each}}
  {{/each}}

  Return a sorted list of all property IDs from the provided list, ordered from most relevant to least relevant based on the user's query.`,
});

const intelligentPropertySortingFlow = ai.defineFlow(
  {
    name: 'intelligentPropertySortingFlow',
    inputSchema: IntelligentPropertySortingInputSchema,
    outputSchema: IntelligentPropertySortingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
