'use server';

/**
 * @fileOverview An AI agent for calculating a tenant's trust score.
 *
 * - calculateTenantTrustScore - A function that handles the trust score calculation process.
 * - TenantTrustScoreInput - The input type for the calculateTenantTrustScore function.
 * - TenantTrustScoreOutput - The return type for the calculateTenantTrustScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInfoSchema = z.object({
  type: z.string().describe('The type of document (e.g., CNI, Passeport, Selfie).'),
  status: z.string().describe('The verification status of the document (e.g., pending, approved, rejected).'),
});

const TenantTrustScoreInputSchema = z.object({
    isZoeVerified: z.boolean().describe("Whether the user has the 'Zoe Verified' badge."),
    accountAgeInDays: z.number().describe("The age of the user's account in days."),
    submittedDocuments: z.array(DocumentInfoSchema).describe("A list of documents the user has submitted for KYC.")
});
export type TenantTrustScoreInput = z.infer<typeof TenantTrustScoreInputSchema>;

const TenantTrustScoreOutputSchema = z.object({
  score: z
    .number()
    .describe('A numerical trust score from 0 to 100, where 100 is the most trustworthy.'),
  summary: z
    .string()
    .describe('A brief, human-readable summary explaining the score and highlighting key factors.'),
});
export type TenantTrustScoreOutput = z.infer<typeof TenantTrustScoreOutputSchema>;

export async function calculateTenantTrustScore(
  input: TenantTrustScoreInput
): Promise<TenantTrustScoreOutput> {
  return tenantTrustScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tenantTrustScorePrompt',
  input: {schema: TenantTrustScoreInputSchema},
  output: {schema: TenantTrustScoreOutputSchema},
  prompt: `You are a tenant risk assessment expert for a real estate platform. Your task is to calculate a trust score for a potential tenant based on the data provided. The score should be between 0 and 100.

  Analyze the following tenant data:
  - Has 'Zoe Verified' Badge: {{{isZoeVerified}}}
  - Account Age: {{{accountAgeInDays}}} days
  - Submitted KYC Documents:
  {{#if submittedDocuments}}
    {{#each submittedDocuments}}
    - Type: {{{this.type}}}, Status: {{{this.status}}}
    {{/each}}
  {{else}}
    No documents submitted.
  {{/if}}

  Scoring Guidelines:
  - Base score starts at 30.
  - 'Zoe Verified' Badge: +40 points. This is a very strong positive signal.
  - Approved Documents: +15 points for each 'approved' document (CNI, Passeport). An approved 'Selfie' adds +5.
  - Pending Documents: +5 points for each 'pending' document. It shows initiative.
  - Rejected Documents: -10 points for each 'rejected' document.
  - No Documents: -20 points.
  - Account Age: +1 point for every 60 days of account age, maxing out at +10 points.

  Calculate the final score and provide a brief, professional summary explaining the key factors that influenced the score (e.g., "High score due to verified status and multiple approved documents," or "Low score due to lack of document submission.").`,
});

const tenantTrustScoreFlow = ai.defineFlow(
  {
    name: 'tenantTrustScoreFlow',
    inputSchema: TenantTrustScoreInputSchema,
    outputSchema: TenantTrustScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the score is clamped between 0 and 100
    if (output) {
        output.score = Math.max(0, Math.min(100, output.score));
    }
    return output!;
  }
);
