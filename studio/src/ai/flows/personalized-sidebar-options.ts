'use server';

/**
 * @fileOverview This file defines a Genkit flow for personalizing sidebar menu options based on a tourist's travel itinerary and current location.
 *
 * - `getPersonalizedSidebarOptions` - A function that returns personalized sidebar options for a tourist.
 * - `PersonalizedSidebarOptionsInput` - The input type for the `getPersonalizedSidebarOptions` function.
 * - `PersonalizedSidebarOptionsOutput` - The return type for the `getPersonalizedSidebarOptions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedSidebarOptionsInputSchema = z.object({
  travelItinerary: z
    .string()
    .describe('The tourist travel itinerary, including destinations and dates.'),
  currentLocation: z
    .string()
    .describe('The current location of the tourist (e.g., city, landmark).'),
  touristPreferences: z
    .string()
    .optional()
    .describe('Optional preferences of the tourist.'),
});
export type PersonalizedSidebarOptionsInput = z.infer<
  typeof PersonalizedSidebarOptionsInputSchema
>;

const PersonalizedSidebarOptionsOutputSchema = z.object({
  options: z
    .array(z.string())
    .describe('An array of personalized sidebar menu options.'),
});
export type PersonalizedSidebarOptionsOutput = z.infer<
  typeof PersonalizedSidebarOptionsOutputSchema
>;

export async function getPersonalizedSidebarOptions(
  input: PersonalizedSidebarOptionsInput
): Promise<PersonalizedSidebarOptionsOutput> {
  return personalizedSidebarOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSidebarOptionsPrompt',
  input: {schema: PersonalizedSidebarOptionsInputSchema},
  output: {schema: PersonalizedSidebarOptionsOutputSchema},
  prompt: `You are an expert travel assistant specializing in providing personalized sidebar menu options for tourists.

  Based on the tourist's travel itinerary, current location, and any provided preferences, recommend the most relevant sidebar menu options.

  Travel Itinerary: {{{travelItinerary}}}
  Current Location: {{{currentLocation}}}
  Tourist Preferences: {{#if touristPreferences}}{{{touristPreferences}}}{{else}}No preferences provided{{/if}}

  Consider options such as:
  - Access QR Code
  - View Travel Details
  - Update Emergency Contacts
  - Access Help/FAQs
  - Local Attractions
  - Transportation Options
  - Language Translation
  - Currency Converter
  - Emergency Services

  Return ONLY an array of options that are most helpful for the tourist in their current situation. Do not return anything else.
  Options:`,
});

const personalizedSidebarOptionsFlow = ai.defineFlow(
  {
    name: 'personalizedSidebarOptionsFlow',
    inputSchema: PersonalizedSidebarOptionsInputSchema,
    outputSchema: PersonalizedSidebarOptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
