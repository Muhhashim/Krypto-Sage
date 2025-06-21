
'use server';

/**
 * @fileOverview Generates crypto trading signals for future trading based on specified term.
 *
 * - generateTradingSignals - A function that generates trading signals.
 * - GenerateTradingSignalsInput - The input type for the generateTradingSignals function.
 * - GenerateTradingSignalsOutput - The return type for the generateTradingSignals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TRADING_TERMS, type TradingTerm } from '@/types';

const GenerateTradingSignalsInputSchema = z.object({
  coinSymbol: z.string().describe('The symbol of the cryptocurrency to analyze (e.g., BTC, ETH).'),
  tradingTerm: z.nativeEnum(TRADING_TERMS).describe('The trading term for the signals (SHORT_TERM, MEDIUM_TERM, LONG_TERM).'),
  aggregatedData: z
    .string()
    .describe('Aggregated cryptocurrency data from various sources for the specified coinSymbol.'),
  customizationSettings: z
    .string()
    .optional()
    .describe('Optional customization settings for the signal generation.'),
});
export type GenerateTradingSignalsInput = z.infer<typeof GenerateTradingSignalsInputSchema>;

const TradingSignalSchema = z.object({
  signalType: z.enum(['BUY', 'SELL']).describe('The type of trading signal (BUY or SELL).'),
  sentiment: z.enum(['BULLISH', 'BEARISH']).describe('The sentiment of the signal (BULLISH or BEARISH).'),
  confidenceLevel: z.number().min(0).max(1).describe('The confidence level of the signal (0-1).'),
  entryPrice: z.number().describe('The suggested numeric entry price for this future trading signal, appropriate for the specified trading term.'),
  targetPrice: z.number().describe('The suggested numeric target (take-profit) price for this future trading signal, appropriate for the specified trading term.'),
  stopLossPrice: z.number().describe('The suggested numeric stop-loss price for this future trading signal, appropriate for the specified trading term.'),
  reason: z.string().describe('The rationale behind the trading signal, including key indicators or patterns relevant to the trading term.'),
  supportingData: z.string().describe('Brief summary of data supporting the trading signal.'),
});

const GenerateTradingSignalsOutputSchema = z.array(TradingSignalSchema).describe('Array of future trading signals for the specified term.');
export type GenerateTradingSignalsOutput = z.infer<typeof GenerateTradingSignalsOutputSchema>;

export async function generateTradingSignals(
  input: GenerateTradingSignalsInput
): Promise<GenerateTradingSignalsOutput> {
  return generateTradingSignalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTradingSignalsPrompt',
  input: {
    schema: GenerateTradingSignalsInputSchema,
  },
  output: {
    schema: GenerateTradingSignalsOutputSchema,
  },
  prompt: `You are an expert cryptocurrency trading signal generator specializing in FUTURE TRADING for {{coinSymbol}} based on a {{tradingTerm}} perspective.

Analyze the provided aggregated cryptocurrency data for {{coinSymbol}} and generate potential future trading signals suitable for the specified {{tradingTerm}}.
Consider technical indicators, market trends, and any provided customization settings.

Aggregated Data for {{coinSymbol}}: {{{aggregatedData}}}
Trading Term: {{tradingTerm}}
Customization Settings: {{{customizationSettings}}}

Generate an array of trading signals. Each signal MUST be for future trading and MUST include:
1.  signalType: "BUY" or "SELL".
2.  sentiment: "BULLISH" or "BEARISH".
3.  confidenceLevel: A number between 0 (low) and 1 (high).
4.  entryPrice: A specific numeric suggested entry price, appropriate for the {{tradingTerm}} horizon.
5.  targetPrice: A specific numeric suggested take-profit price, appropriate for the {{tradingTerm}} horizon.
6.  stopLossPrice: A specific numeric suggested stop-loss price, appropriate for the {{tradingTerm}} horizon.
7.  reason: Clear, concise rationale for the signal, mentioning key indicators or patterns (e.g., RSI, MACD crossover, support/resistance break) relevant to the {{tradingTerm}}.
8.  supportingData: A brief summary of the data points from the aggregated data that support this signal.

Focus only on {{coinSymbol}}. Do not generate signals for other cryptocurrencies.
Ensure all price fields (entryPrice, targetPrice, stopLossPrice) are numeric.
The nature of these prices (e.g., how far apart entry and target are) should reflect the selected {{tradingTerm}}. For example, long-term signals might have wider price targets and stop losses compared to short-term signals.

Output in JSON format.
`,
});

const generateTradingSignalsFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalsFlow',
    inputSchema: GenerateTradingSignalsInputSchema,
    outputSchema: GenerateTradingSignalsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
