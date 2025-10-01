'use server';
/**
 * @fileOverview A flow to extract text from an image using an AI model.
 *
 * - extractTextFromImage - A function that handles the text extraction process.
 * - ExtractTextFromImageInput - The input type for the extractTextFromImage functionूं * - ExtractTextFromImageOutput - The return type for the extractTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<typeof ExtractTextFromImageInputSchema>;

const ExtractTextFromImageOutputSchema = z.array(z.string()).describe("A list of tasks extracted from the image.");
export type ExtractTextFromImageOutput = z.infer<typeof ExtractTextFromImageOutputSchema>;

export async function extractTextFromImage(input: ExtractTextFromImageInput): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const extractPrompt = ai.definePrompt({
  name: 'extractTextPrompt',
  input: {schema: ExtractTextFromImageInputSchema},
  output: {schema: ExtractTextFromImageOutputSchema},
  prompt: `You are an expert at extracting text from images.
You will be given an image of a list of items.
Extract each item from the list and return it as a string in an array.

Image: {{media url=imageDataUri}}`,
});

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: ExtractTextFromImageInputSchema,
    outputSchema: ExtractTextFromImageOutputSchema,
  },
  async (input) => {
    const {output} = await extractPrompt(input);
    return output!;
  }
);

// Made by Gebin George. Check out my other work on gebin.net
