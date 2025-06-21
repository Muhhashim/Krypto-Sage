
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

export async function handleGenerateSignalsAction(
  coinSymbol: string,
  tradingTerm: TradingTerm,
  customizationSettings?: string
): Promise<GenerateSignalsResult> {
  try {
    // Fetch data only for the selected coinSymbol
    const fetchedData = await fetchRealCryptoData([coinSymbol]);
    
    const input: GenerateTradingSignalsInput = {
      coinSymbol: coinSymbol, 
      tradingTerm: tradingTerm,
      aggregatedData: fetchedData.aggregatedString, 
      customizationSettings: customizationSettings || undefined,
    };

    // Artificial delay, you might remove or adjust this
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

