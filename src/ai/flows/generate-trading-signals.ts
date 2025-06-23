
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
    .describe('Aggregated cryptocurrency market data from various sources for the specified coinSymbol.'),
  socialSentiment: z
    .string()
    .describe('A summary of recent news and social media sentiment for the cryptocurrency.'),
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
  reason: z.string().describe('The rationale behind the trading signal, including key indicators, market patterns, or sentiment analysis relevant to the trading term.'),
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

You must perform a deep analysis of the provided market data and social sentiment.

1.  **Market Data for {{coinSymbol}}**: {{{aggregatedData}}}
2.  **Trading Term**: {{tradingTerm}}
3.  **Recent News & Social Sentiment**: {{{socialSentiment}}}
4.  **Customization Settings**: {{{customizationSettings}}}

Analyze the provided market data for technical indicators, volume, and price action. Crucially, you MUST correlate this technical analysis with the provided "Recent News & Social Sentiment" to understand the 'why' behind the market movements.

Generate an array of trading signals. Each signal MUST be for future trading and MUST include:
1.  signalType: "BUY" or "SELL".
2.  sentiment: "BULLISH" or "BEARISH". This should be a combined result of technical analysis and the provided sentiment data.
3.  confidenceLevel: A number between 0 (low) and 1 (high), influenced by how strongly the technicals and sentiment align.
4.  entryPrice: A specific numeric suggested entry price.
5.  targetPrice: A specific numeric suggested take-profit price.
6.  stopLossPrice: A specific numeric suggested stop-loss price.
7.  reason: Clear, concise rationale for the signal, mentioning BOTH key technical indicators (e.g., RSI, MACD) AND the news/sentiment that supports the analysis.
8.  supportingData: A brief summary of the data points from the market and sentiment data that support this signal.

Focus only on {{coinSymbol}}. Ensure all price fields are numeric. The price ranges should reflect the selected {{tradingTerm}}.

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
