
'use server';

import { generateTradingSignals, GenerateTradingSignalsInput, GenerateTradingSignalsOutput } from '@/ai/flows/generate-trading-signals';
import { fetchRealCryptoData, fetchAllCoinsFromCMC } from '@/services/crypto-data-service';
import type { TradingTerm, CryptoCurrency, CMCCoinMapItem } from '@/types';
import { subDays, isAfter, parseISO } from 'date-fns';


interface GenerateSignalsResult {
  signals: GenerateTradingSignalsOutput | null;
  error: string | null;
  latestPrices?: { [symbol: string]: number | undefined };
}

/**
 * In a real-world application, this function would fetch data from live news APIs,
 * RSS feeds, or social media APIs (e.g., X/Twitter, Reddit). For this project,
 * it simulates a real-time news analysis feed to demonstrate the AI's capability
 * to process and incorporate sentiment data. This placeholder can be replaced
 * with a true data feed in the future.
 */
function getSimulatedSocialSentiment(coinSymbol: string, coinName: string): string {
    const sentiments = [
        { type: "Bullish", text: `Positive regulatory news from the US; SEC rumored to be approving a spot ${coinName} ETF.` },
        { type: "Bullish", text: `Major tech partnership announced for the ${coinName} blockchain, boosting adoption potential.` },
        { type: "Bullish", text: `${coinName} is trending on X (Twitter) after a shoutout from a major tech influencer.` },
        { type: "Bearish", text: `Concerns are growing about network congestion and high transaction fees on the ${coinName} network.` },
        { type: "Bearish", text: `A competing blockchain just launched a 'vampire attack', trying to lure ${coinName}'s developers and users.` },
        { type: "Bearish", text: `A large, early investor wallet has been moving a significant amount of ${coinSymbol} to exchanges, signaling a potential sell-off.` },
        { type: "Neutral", text: `The market is quiet for ${coinName}, with trading volumes lower than average as investors await key inflation data later this week.` },
    ];
    const randomIndex = Math.floor(Math.random() * sentiments.length);
    const selectedSentiment = sentiments[randomIndex];

    return `Current Sentiment: ${selectedSentiment.type}. Key points: ${selectedSentiment.text}`;
}


export async function handleGenerateSignalsAction(
  coinSymbol: string,
  tradingTerm: TradingTerm,
  availableCoins: CryptoCurrency[],
  customizationSettings?: string
): Promise<GenerateSignalsResult> {
  try {
    const coinName = availableCoins.find(c => c.value === coinSymbol)?.name || coinSymbol;

    // Fetch market data
    const fetchedData = await fetchRealCryptoData([coinSymbol]);
    
    // Simulate fetching and summarizing social/news sentiment
    const socialSentiment = getSimulatedSocialSentiment(coinSymbol, coinName);

    const input: GenerateTradingSignalsInput = {
      coinSymbol: coinSymbol, 
      tradingTerm: tradingTerm,
      aggregatedData: fetchedData.aggregatedString,
      socialSentiment: socialSentiment,
      customizationSettings: customizationSettings || undefined,
    };

    // Artificial delay to simulate heavy processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const signals = await generateTradingSignals(input);
    
    if (!signals || signals.length === 0) {
      return { signals: [], error: null, latestPrices: fetchedData.latestPrices }; 
    }

    return { signals, error: null, latestPrices: fetchedData.latestPrices };
  } catch (e) {
    console.error("Error in handleGenerateSignalsAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while generating signals.";
    const defaultPrices: { [key: string]: undefined } = {};
    defaultPrices[coinSymbol] = undefined;
    return { signals: null, error: errorMessage, latestPrices: defaultPrices };
  }
}

interface GetAvailableCoinsResult {
  coins: CryptoCurrency[];
  error: string | null;
}

export async function getAvailableCoinsAction(): Promise<GetAvailableCoinsResult> {
  try {
    const rawCoins: CMCCoinMapItem[] = await fetchAllCoinsFromCMC();
    const sevenDaysAgo = subDays(new Date(), 7);

    const formattedCoins: CryptoCurrency[] = rawCoins
      .filter(coin => coin.id != null && coin.symbol && coin.name) // Ensure id, symbol, and name are present
      .map(coin => {
        let isNew = false;
        if (coin.first_historical_data) {
          try {
            const addedDate = parseISO(coin.first_historical_data);
            if (isAfter(addedDate, sevenDaysAgo)) {
              isNew = true;
            }
          } catch (parseError) {
            console.warn(`Could not parse date for ${coin.symbol}: ${coin.first_historical_data}`, parseError);
          }
        }
        return {
          id: coin.id, // Use CoinMarketCap's unique ID
          value: coin.symbol,
          label: `${coin.name} (${coin.symbol})${isNew ? ' (new)' : ''}`,
          name: coin.name,
          firstHistoricalData: coin.first_historical_data,
          isNew: isNew,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); 

    return { coins: formattedCoins, error: null };
  } catch (e) {
    console.error("Error in getAvailableCoinsAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching coin list.";
    return { coins: [], error: errorMessage };
  }
}
