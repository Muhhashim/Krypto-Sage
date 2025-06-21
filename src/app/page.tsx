
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/kryptosage/Header';
import { Footer } from '@/components/kryptosage/Footer';
import { CustomizationForm, type CustomizationFormValues } from '@/components/kryptosage/CustomizationForm';
import { SignalCard } from '@/components/kryptosage/SignalCard';
import { ChartDisplay } from '@/components/kryptosage/ChartDisplay';
import type { TradingSignal, CryptoCurrency, TradingTerm } from '@/types';
import { handleGenerateSignalsAction, getAvailableCoinsAction } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotMessageSquare, ListChecks, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const DEFAULT_FALLBACK_COIN: CryptoCurrency = { id: 1, value: "BTC", label: "Bitcoin (BTC)", name: "Bitcoin" };

export default function KryptoSageDashboard() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<{ [symbol: string]: number | undefined } | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>(DEFAULT_FALLBACK_COIN.value); 
  const [availableCoins, setAvailableCoins] = useState<CryptoCurrency[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchCoins = useCallback(async () => {
    setIsLoadingCoins(true);
    const result = await getAvailableCoinsAction();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error Fetching Coin List",
        description: result.error,
      });
      setAvailableCoins([DEFAULT_FALLBACK_COIN]); 
    } else {
      setAvailableCoins(result.coins.length > 0 ? result.coins : [DEFAULT_FALLBACK_COIN]);
      if (result.coins.length > 0 && !result.coins.find(c => c.value === selectedCoinSymbol)) {
        setSelectedCoinSymbol(result.coins.find(c => c.value === 'BTC')?.value || result.coins[0].value);
      } else if (result.coins.length === 0) {
        setSelectedCoinSymbol(DEFAULT_FALLBACK_COIN.value);
      }
    }
    setIsLoadingCoins(false);
  }, [toast, selectedCoinSymbol]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const handleFormSubmit = async (values: CustomizationFormValues) => {
    setIsLoading(true);
    setMarketData(null); 
    setSignals([]); 
    setSelectedCoinSymbol(values.coinSymbol);

    const result = await handleGenerateSignalsAction(
      values.coinSymbol, 
      values.tradingTerm,
      values.customizationSettings
    );

    setIsLoading(false);

    if (result.latestPrices) {
      setMarketData(result.latestPrices);
    }

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error Generating Signals",
        description: result.error,
      });
      setSignals([]); 
    } else if (result.signals) {
      if (result.signals.length === 0) {
        toast({
          title: "No Signals Generated",
          description: `The AI did not generate any specific trading signals for ${selectedCoinName} based on the current data and settings. Try adjusting your customization parameters or check back later.`,
        });
      } else {
        toast({
          title: "Signals Generated Successfully!",
          description: `Received ${result.signals.length} new trading signal(s) for ${selectedCoinName}.`,
        });
      }
      setSignals(result.signals);
    }
  };
  
  const selectedCoinName = useMemo(() => {
    return availableCoins.find(c => c.value === selectedCoinSymbol)?.name || selectedCoinSymbol;
  }, [selectedCoinSymbol, availableCoins]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-8">
        <CustomizationForm 
          onSubmit={handleFormSubmit} 
          isLoading={isLoading} 
          availableCoins={availableCoins}
          isLoadingCoins={isLoadingCoins}
          initialCoinSymbol={selectedCoinSymbol}
          onRefreshCoins={fetchCoins}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <ChartDisplay 
              signals={signals} 
              marketData={marketData} 
              selectedCoinSymbol={selectedCoinSymbol} 
              selectedCoinName={selectedCoinName}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <ListChecks className="h-7 w-7 text-primary" />
                  <CardTitle className="font-headline text-xl">Trading Signals for {selectedCoinName}</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  AI-generated future trading signals with stop loss and take profit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent scrollbar-thumb-rounded-full">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <BotMessageSquare className="h-12 w-12 mb-4 animate-pulse text-primary" />
                    <p className="font-semibold text-lg">AI is analyzing the markets for {selectedCoinName}...</p>
                    <p className="text-sm">Please wait while signals are being generated.</p>
                  </div>
                )}
                {!isLoading && signals.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <AlertCircle className="h-12 w-12 mb-4 text-primary/70" />
                    <p className="font-semibold text-lg">No signals to display yet for {selectedCoinName}.</p>
                    <p className="text-sm">Use the form above to generate trading signals.</p>
                  </div>
                )}
                <AnimatePresence>
                  {!isLoading && signals.map((signal, index) => (
                    <motion.div
                      key={`${signal.signalType}-${signal.sentiment}-${signal.confidenceLevel}-${index}-${signal.reason}-${selectedCoinSymbol}`} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <SignalCard signal={signal} coinName={selectedCoinName} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
