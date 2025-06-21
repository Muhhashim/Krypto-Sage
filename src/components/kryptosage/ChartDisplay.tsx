
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { LineChartIcon, CandlestickChartIcon, Info } from 'lucide-react';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis, ResponsiveContainer, ComposedChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LineChartDataPoint, CandlestickDataPoint, TradingSignal } from '@/types';
import { useState, useEffect, useMemo } from 'react';

const generateDynamicLineData = (currentPrice?: number, coinSymbol: string = 'Token'): LineChartDataPoint[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let basePriceRandomizer = 50000;
  let volatilityRandomizer = 8000;
  if (coinSymbol === 'ETH') {
    basePriceRandomizer = 3000;
    volatilityRandomizer = 500;
  } else if (coinSymbol === 'SOL') {
    basePriceRandomizer = 150;
    volatilityRandomizer = 30;
  } else if (currentPrice && currentPrice < 500 && currentPrice > 0) { 
    basePriceRandomizer = currentPrice * 0.8;
    volatilityRandomizer = currentPrice * 0.2;
  } else if (currentPrice === 0) {
    basePriceRandomizer = 10;
    volatilityRandomizer = 2;
  } else if (coinSymbol !== 'BTC') {
    basePriceRandomizer = 100;
    volatilityRandomizer = 20;
  }


  let lastPrice = currentPrice 
    ? currentPrice - (Math.random() * (basePriceRandomizer*0.1) - (basePriceRandomizer*0.05)) * 5 
    : basePriceRandomizer + Math.random() * (basePriceRandomizer*0.2) - (basePriceRandomizer*0.1); 
  
  lastPrice = Math.max(0.000001, lastPrice); // Ensure price is positive

  const data: LineChartDataPoint[] = [];
  const priceName = `${coinSymbol} Price`;

  for (let i = 0; i < months.length -1; i++) {
     const change = Math.random() * volatilityRandomizer - (volatilityRandomizer/2);
     lastPrice = Math.max(0.000001, lastPrice + change); 
     data.push({ date: months[i], price: parseFloat(lastPrice.toFixed(Math.max(2, (lastPrice < 1 ? 6 : 2)))), name: priceName });
  }

  if (currentPrice !== undefined) {
    data.push({ date: months[months.length -1], price: parseFloat(currentPrice.toFixed(Math.max(2, (currentPrice < 1 ? 6 : 2)))), name: `${priceName} (Current)` });
  } else {
    const change = Math.random() * volatilityRandomizer - (volatilityRandomizer/2);
    lastPrice = Math.max(0.000001, lastPrice + change);
    data.push({ date: months[months.length -1], price: parseFloat(lastPrice.toFixed(Math.max(2, (lastPrice < 1 ? 6 : 2)))), name: priceName });
  }
  return data;
};

const generateDynamicCandlestickData = (currentPrice?: number, coinSymbol: string = 'Token'): CandlestickDataPoint[] => {
  const data: CandlestickDataPoint[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 5); 

  let basePrice = 60000;
  let fluctuation = 2000;
  if (coinSymbol === 'ETH') { basePrice = 3000; fluctuation = 100;}
  else if (coinSymbol === 'SOL') { basePrice = 150; fluctuation = 10;}
  else if (currentPrice && currentPrice < 500 && currentPrice > 0) {basePrice = currentPrice; fluctuation = currentPrice * 0.1}
  else if (currentPrice === 0) {basePrice = 10; fluctuation = 1;}
  else if (coinSymbol !== 'BTC') {basePrice = 100; fluctuation = 20;}
  
  let lastClose = currentPrice ? currentPrice * (1 - (Math.random() * 0.1 - 0.05)) : basePrice + Math.random() * (basePrice*0.1) - (basePrice*0.05);
  lastClose = Math.max(0.000001, lastClose);


  for (let i = 0; i < 4; i++) { 
    const open = parseFloat(lastClose.toFixed(Math.max(2, (lastClose < 1 ? 6 : 2))));
    const high = parseFloat((open + Math.random() * fluctuation).toFixed(Math.max(2, (open < 1 ? 6 : 2))));
    const lowCandle = parseFloat((open - Math.random() * fluctuation).toFixed(Math.max(2, (open < 1 ? 6 : 2))));
    const low = Math.max(0.000001, lowCandle); 
    const close = parseFloat((low + Math.random() * (high - low)).toFixed(Math.max(2, (low < 1 ? 6 : 2))));
    lastClose = close;
    
    data.push({
      date: currentDate.toISOString().split('T')[0], 
      open, high, low, close,
      name: `${coinSymbol} OHLC`
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

   if (currentPrice !== undefined) {
    const open = parseFloat(lastClose.toFixed(Math.max(2, (lastClose < 1 ? 6 : 2))));
    const highVal = Math.max(open, currentPrice, open + Math.random() * fluctuation * 0.5);
    const lowCandle = Math.min(open, currentPrice, open - Math.random() * fluctuation * 0.5);
    const lowVal = Math.max(0.000001, lowCandle);
    data.push({
      date: currentDate.toISOString().split('T')[0],
      open, 
      high: parseFloat(highVal.toFixed(Math.max(2, (open < 1 ? 6 : 2)))), 
      low: parseFloat(lowVal.toFixed(Math.max(2, (open < 1 ? 6 : 2)))), 
      close: parseFloat(currentPrice.toFixed(Math.max(2, (currentPrice < 1 ? 6 : 2)))),
      name: `${coinSymbol} OHLC (Current)`
    });
  } else { 
    const open = parseFloat(lastClose.toFixed(Math.max(2, (lastClose < 1 ? 6 : 2))));
    const high = parseFloat((open + Math.random() * fluctuation).toFixed(Math.max(2, (open < 1 ? 6 : 2))));
    const lowCandle = parseFloat((open - Math.random() * fluctuation).toFixed(Math.max(2, (open < 1 ? 6 : 2))));
    const low = Math.max(0.000001, lowCandle);
    const close = parseFloat((low + Math.random() * (high - low)).toFixed(Math.max(2, (low < 1 ? 6 : 2))));
     data.push({
      date: currentDate.toISOString().split('T')[0], 
      open, high, low, close,
      name: `${coinSymbol} OHLC`
    });
  }
  return data;
};

interface ChartDisplayProps {
  signals: TradingSignal[];
  marketData: { [symbol: string]: number | undefined } | null;
  selectedCoinSymbol: string;
  selectedCoinName: string;
}

export function ChartDisplay({ signals, marketData, selectedCoinSymbol, selectedCoinName }: ChartDisplayProps) {
  const currentCoinPrice = marketData?.[selectedCoinSymbol];

  const [dynamicLineData, setDynamicLineData] = useState<LineChartDataPoint[]>(generateDynamicLineData(currentCoinPrice, selectedCoinSymbol));
  const [dynamicCandlestickData, setDynamicCandlestickData] = useState<CandlestickDataPoint[]>(generateDynamicCandlestickData(currentCoinPrice, selectedCoinSymbol));

  useEffect(() => {
    const newPrice = marketData?.[selectedCoinSymbol];
    setDynamicLineData(generateDynamicLineData(newPrice, selectedCoinSymbol));
    setDynamicCandlestickData(generateDynamicCandlestickData(newPrice, selectedCoinSymbol));
  }, [signals, marketData, selectedCoinSymbol]);
  
  const lineChartConfig = useMemo(() => ({
    price: {
      label: `${selectedCoinSymbol} Price (USD)`,
      color: 'hsl(var(--accent))',
    },
  }), [selectedCoinSymbol]) satisfies ChartConfig;

  const candlestickChartConfig = useMemo(() => ({
    open: { label: 'Open', color: 'hsl(var(--chart-1))' },
    high: { label: 'High', color: 'hsl(var(--chart-2))' },
    low: { label: 'Low', color: 'hsl(var(--chart-3))' },
    close: { label: 'Close', color: 'hsl(var(--chart-4))' },
  }), []) satisfies ChartConfig;

  const rechartsCandlestickData = useMemo(() => 
    dynamicCandlestickData.map(d => ({
      x: new Date(d.date).getTime(), 
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      name: d.name 
    })), 
  [dynamicCandlestickData]);
  
  const yAxisTickFormatter = (value: number) => {
    if (value === 0) return '$0';
    if (Math.abs(value) < 0.000001 && value !== 0) return `$${value.toExponential(2)}`;
    if (Math.abs(value) < 0.01) return `$${value.toFixed(6)}`;
    if (Math.abs(value) < 1) return `$${value.toFixed(4)}`;
    if (Math.abs(value) < 100) return `$${value.toFixed(2)}`;
    if (Math.abs(value) >= 1000 && Math.abs(value) < 1000000) return `$${(value/1000).toFixed(1)}k`;
    if (Math.abs(value) >= 1000000) return `$${(value/1000000).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  };

  const yAxisDomain = useMemo(() => {
    const linePrices = dynamicLineData.map(d => d.price);
    const candlePrices = dynamicCandlestickData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const allPrices = [...linePrices, ...candlePrices].filter(p => typeof p === 'number' && isFinite(p));

    if (allPrices.length === 0 && (currentCoinPrice === undefined || !isFinite(currentCoinPrice))) return ['auto', 'auto'];
    
    const minPrice = Math.min(...allPrices, currentCoinPrice !== undefined && isFinite(currentCoinPrice) ? currentCoinPrice : Infinity);
    const maxPrice = Math.max(...allPrices, currentCoinPrice !== undefined && isFinite(currentCoinPrice) ? currentCoinPrice : -Infinity);

    if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
      const base = minPrice !== Infinity && isFinite(minPrice) ? minPrice : (currentCoinPrice !== undefined && isFinite(currentCoinPrice) ? currentCoinPrice : 100);
      const padding = base === 0 ? 1 : Math.abs(base * 0.1);
      return [Math.max(0, base - padding), base + padding];
    }

    const range = maxPrice - minPrice;
    const padding = range === 0 ? Math.abs(maxPrice * 0.1) || 1 : range * 0.15; // Add a fallback if range is 0

    return [Math.max(0, minPrice - padding), maxPrice + padding];
  }, [dynamicLineData, dynamicCandlestickData, currentCoinPrice]);


  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 col-span-1 md:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <LineChartIcon className="h-7 w-7 text-primary" />
          <CardTitle className="font-headline text-xl">Market Visualization for {selectedCoinName}</CardTitle>
        </div>
        <CardDescription className="mt-1">
          {currentCoinPrice !== undefined ? `Current ${selectedCoinSymbol} price: $${currentCoinPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (currentCoinPrice < 1 ? 6 : 2))})}` : 'Historical data and market trends.'} <span className="text-xs">(Simulated Dynamic Data)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="line">
              <LineChartIcon className="mr-2 h-4 w-4" /> Price Trend
            </TabsTrigger>
            <TabsTrigger value="candlestick">
              <CandlestickChartIcon className="mr-2 h-4 w-4" /> OHLC Data
            </TabsTrigger>
          </TabsList>
          <TabsContent value="line">
            <ChartContainer config={lineChartConfig} className="h-[350px] w-full">
              <RechartsLineChart data={dynamicLineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    domain={yAxisDomain as [number,number]} 
                    tickFormatter={yAxisTickFormatter}
                    allowDataOverflow={true}
                    tick={{fontSize: 12}}
                    width={70}
                />
                <ChartTooltip
                  cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}}
                  content={<ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name, props) => {
                        const numericValue = Number(value);
                        return (
                            <div className="flex flex-col text-xs">
                                <span className="font-bold">{props.payload?.name || `${selectedCoinSymbol} Price`}</span>
                                <span>{props.payload?.date}: ${numericValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (numericValue < 1 ? 6 : 2))})}</span>
                            </div>
                        )
                    }}
                    itemStyle={{color: 'hsl(var(--foreground))'}}
                    labelStyle={{fontWeight: 'bold', color: 'hsl(var(--primary))'}}
                  />}
                />
                <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2.5} dot={{r: 3, fill: 'var(--color-price)', strokeWidth:1, stroke: 'hsl(var(--background))'}} activeDot={{r:5, fill: 'var(--color-price)', stroke: 'hsl(var(--background))'}} name={`${selectedCoinSymbol} Price`} />
                <ChartLegend content={<ChartLegendContent wrapperStyle={{paddingTop: '10px'}}/>} />
              </RechartsLineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="candlestick">
             <ChartContainer config={candlestickChartConfig} className="h-[350px] w-full">
                <ComposedChart data={rechartsCandlestickData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis 
                        dataKey="x" 
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{fontSize: 12}}
                    />
                    <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        domain={yAxisDomain as [number,number]}
                        orientation="left"
                        tickFormatter={yAxisTickFormatter}
                        allowDataOverflow={true}
                        tick={{fontSize: 12}}
                        width={70}
                    />
                    <ChartTooltip
                      cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label, payload) => { 
                            if (payload && payload.length > 0 && typeof payload[0].payload.x === 'number') {
                               return new Date(payload[0].payload.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            }
                            return String(label);
                          }}
                           formatter={(value, name, props) => {
                                const numericValue = Number(value);
                                const formattedValue = typeof numericValue === 'number' ? `$${numericValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (numericValue < 1 ? 6 : 2))})}` : value;
                                return [formattedValue, name?.toString().charAt(0).toUpperCase() + name?.toString().slice(1) || 'value'];
                            }}
                            itemStyle={{color: 'hsl(var(--foreground))'}}
                            labelStyle={{fontWeight: 'bold', color: 'hsl(var(--primary))'}}
                        />
                      }
                    />
                    <Line type="monotone" dataKey="open" stroke="var(--color-open)" name="Open" dot={false} strokeWidth={1.5}/>
                    <Line type="monotone" dataKey="high" stroke="var(--color-high)" name="High" dot={false} strokeWidth={1.5}/>
                    <Line type="monotone" dataKey="low" stroke="var(--color-low)" name="Low" dot={false} strokeWidth={1.5}/>
                    <Line type="monotone" dataKey="close" stroke="var(--color-close)" name="Close" dot={{r: 3, fill: 'var(--color-close)', strokeWidth:1, stroke: 'hsl(var(--background))'}} activeDot={{r:5, fill: 'var(--color-close)', stroke: 'hsl(var(--background))'}} strokeWidth={2}/>
                    <ChartLegend content={<ChartLegendContent wrapperStyle={{paddingTop: '10px'}}/>} />
                </ComposedChart>
            </ChartContainer>
            <div className="mt-4 p-3 border border-dashed border-border/70 rounded-md flex items-start text-sm text-muted-foreground bg-muted/30">
              <Info size={18} className="mr-2.5 mt-0.5 shrink-0 text-primary" />
              <span>OHLC (Open, High, Low, Close) data for {selectedCoinName} displayed as separate lines. This is simulated dynamic data. Hover over chart points for detailed values.</span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
