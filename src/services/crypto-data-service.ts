
'use server';

/**
 * @fileOverview Service for fetching real-time cryptocurrency data from CoinMarketCap.
 */

import type { CMCCoinMapItem, CMCCoinMapResponse } from '@/types';

const COINMARKETCAP_API_BASE_URL = 'https://pro-api.coinmarketcap.com';

interface CMCCoinQuote {
  price: number;
  volume_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  last_updated: string;
}

interface CMCSingleCoinData { // Renamed from CMCCoinData to avoid confusion with map item
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: {
    [currency: string]: CMCCoinQuote; 
  };
}

interface CMCAPIResponseForQuotes { // Renamed to be specific
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: {
    [symbol: string]: CMCSingleCoinData[]; // For single symbol query like /v2/cryptocurrency/quotes/latest?symbol=BTC
  };
}


export interface FetchedCryptoData {
  aggregatedString: string;
  latestPrices: { [symbol: string]: number | undefined };
}

/**
 * Fetches real-time cryptocurrency data for specified coin symbols from CoinMarketCap.
 * 
 * @param coinSymbols An array of symbols of the cryptocurrencies to fetch (e.g., ["BTC", "ETH"]).
 * @returns An object containing an aggregated data string for the AI and latest prices for charts.
 * @throws Will throw an error if the API call fails after an API key is confirmed to be present.
 */
export async function fetchRealCryptoData(coinSymbols: string[]): Promise<FetchedCryptoData> {
  const apiKey = process.env.CRYPTO_API_KEY;

  if (!apiKey) {
    console.warn(`CRYPTO_API_KEY is NOT SET in environment variables. Using placeholder data for ${coinSymbols.join(',')}. Please set your CoinMarketCap API key in .env for live data.`);
    
    const latestPrices: { [symbol: string]: number | undefined } = {};
    let placeholderAggregatedString = `Placeholder Data: Timestamp: ${new Date().toISOString()}. Please configure your CoinMarketCap API key.`;

    coinSymbols.forEach(symbol => {
      const placeholderPrice = symbol === 'ETH' ? 3000 : (symbol === 'SOL' ? 150 : 50000);
      latestPrices[symbol] = placeholderPrice;
      placeholderAggregatedString += ` ${symbol} is around $${placeholderPrice}. Market is stable.`;
    });
    
    return {
      aggregatedString: placeholderAggregatedString,
      latestPrices: latestPrices
    };
  } else {
    console.log("CRYPTO_API_KEY FOUND in environment variables.");
  }

  const symbolsQueryParam = coinSymbols.join(',');
  let fetchedPrices: { [symbol: string]: number | undefined } = {};
  let aggregatedData = `Market data for ${symbolsQueryParam} from CoinMarketCap. `;

  try {
    console.log(`Attempting to fetch data from CoinMarketCap for symbols: ${symbolsQueryParam}`);
    const response = await fetch(`${COINMARKETCAP_API_BASE_URL}/v2/cryptocurrency/quotes/latest?symbol=${symbolsQueryParam}&convert=USD`, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinMarketCap API request failed for ${symbolsQueryParam} with status ${response.status}: ${errorBody}`);
      throw new Error(`CoinMarketCap API request for ${symbolsQueryParam} failed: ${response.status} - ${errorBody}`);
    }

    const result = (await response.json()) as CMCAPIResponseForQuotes;

    if (result.status.error_code !== 0) {
      console.error(`CoinMarketCap API error for ${symbolsQueryParam}: ${result.status.error_message || 'Unknown API error'}`);
      throw new Error(`CoinMarketCap API error for ${symbolsQueryParam}: ${result.status.error_message || 'Unknown API error'}`);
    }
    
    console.log(`CoinMarketCap API request successful for ${symbolsQueryParam}. Timestamp: ${new Date(result.status.timestamp).toLocaleString()}`);
    aggregatedData += `Timestamp: ${new Date(result.status.timestamp).toLocaleString()}. `;

    for (const symbol of coinSymbols) {
      const coinDataArray = result.data[symbol];
      const coinData = coinDataArray?.[0];
      if (coinData && coinData.quote.USD) {
        const quote = coinData.quote.USD;
        fetchedPrices[symbol] = quote.price;
        aggregatedData += `Current ${coinData.name} (${symbol}) price is $${quote.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (quote.price < 1 ? 6 : 2))})} (24h change: ${quote.percent_change_24h.toFixed(2)}%). Volume (24h): $${quote.volume_24h.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. Market Cap: $${quote.market_cap.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. `;
      } else {
        aggregatedData += `${symbol} data not available from API. `;
        fetchedPrices[symbol] = undefined;
      }
    }
    
    return {
      aggregatedString: aggregatedData.trim(),
      latestPrices: fetchedPrices
    };

  } catch (error) {
    console.error(`Error in fetchRealCryptoData for ${symbolsQueryParam} during API call or processing:`, error);
    const apiErrorMessage = error instanceof Error ? error.message : "An unknown API error occurred during data fetch.";
    
    // Fallback to placeholder if API call fails but key was present
    coinSymbols.forEach(symbol => {
        if (fetchedPrices[symbol] === undefined) {
            const placeholderPrice = symbol === 'ETH' ? 3000 : (symbol === 'SOL' ? 150 : 50000);
            fetchedPrices[symbol] = placeholderPrice; // Provide a default for chart
             aggregatedData += `${symbol} using placeholder due to API error. Price: $${placeholderPrice}. `;
        }
    });
    
    // Ensure the error is still thrown so UI can be notified
    // throw new Error(`Failed to fetch or process live cryptocurrency data for ${symbolsQueryParam}: ${apiErrorMessage}`);
    // Instead of throwing, let's return placeholder data and the error message can be handled by the action
     return {
      aggregatedString: aggregatedData.trim() + ` ERROR_NOTE: ${apiErrorMessage}`,
      latestPrices: fetchedPrices,
    };
  }
}

/**
 * Fetches a list of all active cryptocurrencies from CoinMarketCap.
 * @returns A promise that resolves to an array of CMCCoinMapItem.
 * @throws Will throw an error if the API call fails.
 */
export async function fetchAllCoinsFromCMC(): Promise<CMCCoinMapItem[]> {
  const apiKey = process.env.CRYPTO_API_KEY;

  if (!apiKey) {
    console.warn("CRYPTO_API_KEY is NOT SET. Cannot fetch all coins. Returning empty list.");
    return [];
  }
  console.log("Attempting to fetch all coins from CoinMarketCap /v1/cryptocurrency/map");

  try {
    // Fetch a large number of coins. Max limit for /map is 5000.
    // Consider pagination if more than 5000 coins are needed, though 5000 covers most.
    const response = await fetch(`${COINMARKETCAP_API_BASE_URL}/v1/cryptocurrency/map?listing_status=active&limit=5000&aux=first_historical_data`, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
      cache: 'no-store', // Or consider 'force-cache' with revalidation strategy for less frequent updates
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoinMarketCap API request to /map failed with status ${response.status}: ${errorBody}`);
      throw new Error(`CoinMarketCap API request to /map failed: ${response.status} - ${errorBody}`);
    }

    const result = (await response.json()) as CMCCoinMapResponse;

    if (result.status.error_code !== 0) {
      console.error(`CoinMarketCap API error for /map: ${result.status.error_message || 'Unknown API error'}`);
      throw new Error(`CoinMarketCap API error for /map: ${result.status.error_message || 'Unknown API error'}`);
    }
    
    console.log(`Successfully fetched ${result.data.length} coins from CoinMarketCap /map.`);
    return result.data;
  } catch (error) {
    console.error('Error in fetchAllCoinsFromCMC:', error);
    // In case of error, return empty or throw, depending on desired handling
    // For now, re-throwing to be caught by the action.
    throw error; 
  }
}
