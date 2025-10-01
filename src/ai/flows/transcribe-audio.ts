'use server';

/**
 * @fileOverview A flow to transcribe audio and extract tasks.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A short audio recording of someone listing tasks, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.array(z.string()).describe("A list of tasks transcribed from the audio.");
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribePrompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: {schema: z.object({transcription: z.string()})},
  output: {schema: TranscribeAudioOutputSchema},
  prompt: `You are an expert at parsing unstructured text into a list of tasks.
You will be given a transcription of an audio recording.
Extract each distinct task from the text and return it as a string in an array.
If the text is unclear or doesn't contain any tasks, return an empty array.

Transcription:
"{{transcription}}"`,
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    // Note: The 'generate' function for transcription models is not yet available in the playground environment.
    // This is a placeholder and will need to be replaced with a real transcription model call.
    // For now, we will simulate a transcription.
    const {text: transcription} = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `Transcribe the following audio: {{media url=${input.audioDataUri}}}`,
    });
    
    // For demonstration, let's assume a dummy transcription if the model fails.
    const fakeTranscription = "First, I need to buy groceries, then I should probably finish the report for work, and also call the dentist to make an appointment.";
    
    const {output} = await transcribePrompt({transcription: transcription || fakeTranscription});
    return output!;
  }
);

// Made by Gebin George. Check out my other work on gebin.net
