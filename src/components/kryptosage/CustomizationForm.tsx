
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings2, Check, ChevronsUpDown, RefreshCw, Wand2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CryptoCurrency, TradingTerm } from '@/types';
import { tradingTermOptions, TRADING_TERMS } from '@/types';
import React from 'react';

const formSchema = z.object({
  coinSymbol: z.string().min(1, { message: "Please select a cryptocurrency." }),
  tradingTerm: z.nativeEnum(TRADING_TERMS, {
    required_error: "Please select a trading term.",
  }),
  customizationSettings: z.string().optional(),
});

export type CustomizationFormValues = z.infer<typeof formSchema>;

interface CustomizationFormProps {
  onSubmit: (values: CustomizationFormValues) => void;
  isLoading: boolean;
  availableCoins: CryptoCurrency[];
  isLoadingCoins: boolean;
  initialCoinSymbol?: string;
  onRefreshCoins: () => void;
}

export function CustomizationForm({ onSubmit, isLoading, availableCoins, isLoadingCoins, initialCoinSymbol, onRefreshCoins }: CustomizationFormProps) {
  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinSymbol: initialCoinSymbol || '',
      tradingTerm: TRADING_TERMS.SHORT_TERM,
      customizationSettings: '',
    },
  });

  const [popoverOpen, setPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoadingCoins && availableCoins.length > 0) {
      const currentCoinSymbol = form.getValues("coinSymbol");
      const coinExists = availableCoins.some(c => c.value === currentCoinSymbol);
      
      const targetSymbol = initialCoinSymbol && availableCoins.some(c => c.value === initialCoinSymbol) 
                           ? initialCoinSymbol 
                           : (availableCoins.find(c => c.value === 'BTC') || availableCoins[0])?.value;

      if (targetSymbol && (targetSymbol !== currentCoinSymbol || !coinExists)) {
        form.setValue("coinSymbol", targetSymbol);
      }
    }
  }, [availableCoins, isLoadingCoins, form, initialCoinSymbol]);


  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <Settings2 className="h-7 w-7 text-primary" />
          <CardTitle className="font-headline text-xl">Customize AI Signals</CardTitle>
        </div>
        <CardDescription className="mt-1">
          Select a cryptocurrency, trading term, and tailor the AI signal generation for future trading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="coinSymbol"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel>Cryptocurrency</FormLabel>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={onRefreshCoins} 
                        disabled={isLoadingCoins || isLoading}
                        className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoadingCoins ? 'animate-spin' : ''}`} />
                        Refresh List
                      </Button>
                    </div>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoadingCoins || isLoading}
                          >
                            {isLoadingCoins ? (
                                <div className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading coins...
                                </div>
                            ): field.value && availableCoins.length > 0
                              ? availableCoins.find(
                                  (coin) => coin.value === field.value
                                )?.label || `Select coin (${availableCoins.length} available)`
                              : `Select coin (${availableCoins.length} available)`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto scrollbar-thin">
                        <Command>
                          <CommandInput placeholder="Search coin..." />
                          <CommandList>
                            {isLoadingCoins && <CommandItem disabled className="justify-center">Loading coins...</CommandItem>}
                            {!isLoadingCoins && availableCoins.length === 0 && <CommandItem disabled className="justify-center">No coins available. Try refreshing.</CommandItem>}
                            {!isLoadingCoins && availableCoins.length > 0 && (
                              <CommandGroup>
                                {availableCoins.map((coin) => (
                                  <CommandItem
                                    value={coin.label} 
                                    key={coin.id} 
                                    onSelect={() => {
                                      form.setValue("coinSymbol", coin.value)
                                      setPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        coin.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {coin.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="mt-1 text-xs">
                      Select the cryptocurrency for signal generation. List from CoinMarketCap.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradingTerm"
                render={({ field }) => (
                  <FormItem>
                     <FormLabel className="mb-1 block">Trading Term</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="font-normal">
                          <SelectValue placeholder="Select trading term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradingTermOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="mt-1 text-xs">
                      Select the desired term for trading signals.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="customizationSettings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-1 block">Customization Parameters (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Focus on 1-hour chart patterns. Consider signals with RSI divergence. Aggressive risk profile."
                      className="min-h-[80px] resize-y"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="mt-1 text-xs">
                    Enter specific instructions for the AI (e.g., preferred timeframes, risk tolerance).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || isLoadingCoins} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 h-auto text-base">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Signals...
                </>
              ) : isLoadingCoins ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading Coin Data...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Trading Signals
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
