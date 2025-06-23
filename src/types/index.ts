
import type { GenerateTradingSignalsOutput } from "@/ai/flows/generate-trading-signals";

export type TradingSignal = GenerateTradingSignalsOutput[0];

export type LineChartDataPoint = {
  date: string;
  price: number;
  volume: number;
  sma?: number;
  name?: string; 
};

export type CandlestickDataPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  name?: string;
};

export interface CryptoCurrency {
  id: number; // Unique ID from CoinMarketCap
  value: string; // e.g., "BTC" (symbol)
  label: string; // e.g., "Bitcoin (BTC)" or "Bitcoin (BTC) (new)"
  name: string; // e.g., "Bitcoin"
  firstHistoricalData?: string; // ISO date string
  isNew?: boolean; 
}

export const TRADING_TERMS = {
  SHORT_TERM: "SHORT_TERM",
  MEDIUM_TERM: "MEDIUM_TERM",
  LONG_TERM: "LONG_TERM",
} as const;

export type TradingTerm = (typeof TRADING_TERMS)[keyof typeof TRADING_TERMS];

export const tradingTermOptions: { value: TradingTerm; label: string }[] = [
  { value: TRADING_TERMS.SHORT_TERM, label: "Short-term Trading" },
  { value: TRADING_TERMS.MEDIUM_TERM, label: "Medium-term Trading" },
  { value: TRADING_TERMS.LONG_TERM, label: "Long-term Trading" },
];

// For CoinMarketCap API response for /v1/cryptocurrency/map
export interface CMCCoinMapItem {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  is_active: number; // 0 or 1
  first_historical_data?: string; // ISO string
  last_historical_data?: string; // ISO string
  platform: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    token_address: string;
  } | null;
}

export interface CMCCoinMapResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: CMCCoinMapItem[];
}

    
