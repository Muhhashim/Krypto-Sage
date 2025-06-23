
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { LineChartIcon, CandlestickChartIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LineChartDataPoint, CandlestickDataPoint, TradingSignal } from '@/types';
import { useState, useEffect, useMemo } from 'react';

const SMA_PERIOD = 10;

const calculateSMA = (data: { price: number }[], period: number): (number | undefined)[] => {
  if (data.length < period) return Array(data.length).fill(undefined);

  const sma: (number | undefined)[] = Array(period - 1).fill(undefined);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.price, 0);
    sma.push(parseFloat((sum / period).toFixed(2)));
  }
  return sma;
};


const generateDynamicLineData = (currentPrice?: number, coinSymbol: string = 'Token'): LineChartDataPoint[] => {
  const data: { date: string; price: number; volume: number; sma?: number; name?: string }[] = [];
  const numPoints = 40;
  
  let basePrice = currentPrice || 50000;
  if (!currentPrice) {
    if (coinSymbol === 'ETH') basePrice = 3000;
    else if (coinSymbol === 'SOL') basePrice = 150;
    else if (coinSymbol !== 'BTC') basePrice = 100;
  }

  let lastPrice = basePrice * (1 - (Math.random() * 0.2)); 
  const trend = (basePrice - lastPrice) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const volatility = (Math.random() - 0.5) * lastPrice * 0.03;
    let newPrice = lastPrice + trend + volatility;
    newPrice = Math.max(0.000001, newPrice);
    
    const volumeVolatility = Math.random();
    const baseVolume = 10000000;
    const volume = baseVolume * (1 + volatility) * (1 + volumeVolatility);

    data.push({
      date: `Day ${i + 1}`,
      price: parseFloat(newPrice.toFixed(Math.max(2, newPrice < 1 ? 6 : 2))),
      volume: parseFloat(volume.toFixed(0)),
    });
    lastPrice = newPrice;
  }
  
  data[numPoints - 1].price = parseFloat(basePrice.toFixed(Math.max(2, basePrice < 1 ? 6 : 2)));
  data[numPoints - 1].name = `Current`;
  
  const smaValues = calculateSMA(data, SMA_PERIOD);
  return data.map((d, i) => ({ ...d, sma: smaValues[i] }));
};

const generateDynamicCandlestickData = (currentPrice?: number, coinSymbol: string = 'Token'): CandlestickDataPoint[] => {
    const data: CandlestickDataPoint[] = [];
    const numPoints = 40;

    let basePrice = currentPrice || 60000;
    if (!currentPrice) {
        if (coinSymbol === 'ETH') basePrice = 3000;
        else if (coinSymbol === 'SOL') basePrice = 150;
        else if (coinSymbol !== 'BTC') basePrice = 100;
    }

    let lastClose = basePrice * (1 - (Math.random() * 0.1));
    const trend = (basePrice - lastClose) / numPoints;

    for (let i = 0; i < numPoints; i++) {
        const open = parseFloat(lastClose.toFixed(Math.max(2, lastClose < 1 ? 6 : 2)));
        const volatility = open * 0.03;
        let close = open + trend + (Math.random() - 0.45) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        close = Math.max(0.000001, close);
        
        const volumeVolatility = Math.random();
        const baseVolume = 10000000;
        const volume = baseVolume * (1 + Math.abs(close - open) / open) * (1 + volumeVolatility);

        data.push({
            date: `Day ${i + 1}`,
            open: open,
            high: parseFloat(high.toFixed(Math.max(2, high < 1 ? 6 : 2))),
            low: parseFloat(Math.max(0.000001, low).toFixed(Math.max(2, low < 1 ? 6 : 2))),
            close: parseFloat(close.toFixed(Math.max(2, close < 1 ? 6 : 2))),
            volume: parseFloat(volume.toFixed(0)),
        });
        lastClose = close;
    }
    
    data[numPoints - 1].close = parseFloat(basePrice.toFixed(Math.max(2, basePrice < 1 ? 6 : 2)));
    data[numPoints - 1].name = `Current`;

    return data;
};


const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isRising = close >= open;
  const color = isRising ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
  const wickColor = isRising ? 'hsl(var(--accent) / 0.7)' : 'hsl(var(--destructive) / 0.7)';

  return (
    <g stroke={wickColor} fill={color} strokeWidth="1">
      <path d={`M ${x + width / 2},${y + height} L ${x + width / 2},${y}`} />
      <path d={`M ${x + width / 2},${high} L ${x + width / 2},${low}`} />
      <rect x={x} y={y} width={width} height={height} />
    </g>
  );
};


interface ChartDisplayProps {
  signals: TradingSignal[];
  marketData: { [symbol: string]: number | undefined } | null;
  selectedCoinSymbol: string;
  selectedCoinName: string;
}

const yAxisTickFormatter = (value: number, forVolume: boolean = false) => {
    if (value === 0) return forVolume ? '0' : '$0';
    if (forVolume) {
        if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
        return value.toFixed(0);
    } else {
        if (Math.abs(value) < 0.000001) return `$${value.toExponential(2)}`;
        if (Math.abs(value) < 0.01) return `$${value.toFixed(6)}`;
        if (Math.abs(value) < 1) return `$${value.toFixed(4)}`;
        if (Math.abs(value) < 100) return `$${value.toFixed(2)}`;
        if (Math.abs(value) >= 1000 && Math.abs(value) < 1000000) return `$${(value/1000).toFixed(1)}k`;
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
};

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const priceData = payload.find(p => p.dataKey === 'price')?.payload;
        const ohlcData = payload.find(p => p.dataKey === 'close')?.payload;
        const isCandle = !!ohlcData;
        
        return (
            <div className="rounded-lg border bg-background/90 backdrop-blur-sm p-2.5 shadow-sm min-w-[180px] text-xs">
                <p className="mb-2 text-sm font-medium text-center">{label}</p>
                <div className="space-y-1.5">
                    {isCandle ? (
                        <>
                            <div className="flex justify-between"><span className="text-muted-foreground">Open:</span> <span className="font-semibold">{yAxisTickFormatter(ohlcData.open)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">High:</span> <span className="font-semibold">{yAxisTickFormatter(ohlcData.high)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Low:</span> <span className="font-semibold">{yAxisTickFormatter(ohlcData.low)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Close:</span> <span className="font-semibold">{yAxisTickFormatter(ohlcData.close)}</span></div>
                        </>
                    ) : priceData ? (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold">{yAxisTickFormatter(priceData.price)}</span>
                        </div>
                    ) : null}
                    {priceData?.sma && (
                         <div className="flex justify-between">
                             <span className="text-muted-foreground">SMA ({SMA_PERIOD}):</span>
                             <span className="font-semibold">{yAxisTickFormatter(priceData.sma)}</span>
                         </div>
                    )}
                    {data.volume && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Volume:</span>
                            <span className="font-semibold">{yAxisTickFormatter(data.volume, true)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};


export function ChartDisplay({ signals, marketData, selectedCoinSymbol, selectedCoinName }: ChartDisplayProps) {
  const currentCoinPrice = marketData?.[selectedCoinSymbol];

  const [dynamicLineData, setDynamicLineData] = useState<LineChartDataPoint[]>(generateDynamicLineData(currentCoinPrice, selectedCoinSymbol));
  const [dynamicCandlestickData, setDynamicCandlestickData] = useState<CandlestickDataPoint[]>(generateDynamicCandlestickData(currentCoinPrice, selectedCoinSymbol));

  useEffect(() => {
    const newPrice = marketData?.[selectedCoinSymbol];
    setDynamicLineData(generateDynamicLineData(newPrice, selectedCoinSymbol));
    setDynamicCandlestickData(generateDynamicCandlestickData(newPrice, selectedCoinSymbol));
  }, [marketData, selectedCoinSymbol]);
  
  const chartConfig = useMemo(() => ({
    price: { label: `${selectedCoinSymbol} Price`, color: 'hsl(var(--primary))' },
    sma: { label: `SMA (${SMA_PERIOD})`, color: 'hsl(var(--chart-3))' },
    volume: { label: 'Volume' },
  }), [selectedCoinSymbol]) satisfies ChartConfig;

  const yAxisDomain = useMemo(() => {
    const linePrices = dynamicLineData.flatMap(d => [d.price, d.sma]).filter(p => p !== undefined) as number[];
    const candleHighs = dynamicCandlestickData.map(d => d.high);
    const candleLows = dynamicCandlestickData.map(d => d.low);
    const signalPrices = signals.flatMap(s => [s.entryPrice, s.targetPrice, s.stopLossPrice]);
    
    const allPrices = [...linePrices, ...candleHighs, ...candleLows, ...signalPrices].filter(p => typeof p === 'number' && isFinite(p));
    if (currentCoinPrice !== undefined && isFinite(currentCoinPrice)) {
      allPrices.push(currentCoinPrice);
    }
    
    if (allPrices.length === 0) return ['auto', 'auto'];
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    if (minPrice === maxPrice) {
      const padding = minPrice === 0 ? 1 : Math.abs(minPrice * 0.1);
      return [Math.max(0, minPrice - padding), maxPrice + padding];
    }

    const range = maxPrice - minPrice;
    const padding = range === 0 ? Math.abs(maxPrice * 0.1) || 1 : range * 0.15;

    return [Math.max(0, minPrice - padding), maxPrice + padding];
  }, [dynamicLineData, dynamicCandlestickData, signals, currentCoinPrice]);

  const uniqueSignals = useMemo(() => {
      const seen = new Set();
      return signals.filter(signal => {
          const identifier = `${signal.signalType}-${signal.entryPrice}-${signal.targetPrice}-${signal.stopLossPrice}`;
          if (seen.has(identifier)) {
              return false;
          } else {
              seen.add(identifier);
              return true;
          }
      });
  }, [signals]);

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 col-span-1 lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <LineChartIcon className="h-7 w-7 text-primary" />
          <CardTitle className="font-headline text-xl">Market Visualization for {selectedCoinName}</CardTitle>
        </div>
        <CardDescription className="mt-1">
          {currentCoinPrice !== undefined ? `Current ${selectedCoinSymbol} price: ${yAxisTickFormatter(currentCoinPrice)}` : 'Historical data and market trends.'} <span className="text-xs">(Simulated Dynamic Data)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="line">
              <LineChartIcon className="mr-2 h-4 w-4" /> Price Trend
            </TabsTrigger>
            <TabsTrigger value="candlestick">
              <CandlestickChartIcon className="mr-2 h-4 w-4" /> Candlestick
            </TabsTrigger>
          </TabsList>
          <TabsContent value="line" className="space-y-1">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ComposedChart data={dynamicLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="marketChart">
                 <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" hide/>
                <YAxis 
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))" 
                    domain={yAxisDomain as [number,number]} 
                    tickFormatter={(val) => yAxisTickFormatter(val, false)}
                    allowDataOverflow={true}
                    tick={{fontSize: 12}}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={80}
                />
                <Tooltip
                  cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}}
                  content={<CustomTooltipContent />}
                />
                <Area type="natural" dataKey="price" fill="url(#chartGradient)" stroke="none" />
                <Line type="natural" dataKey="price" stroke="var(--color-price)" strokeWidth={2.5} dot={false} activeDot={{r:5, fill: 'var(--color-price)', stroke: 'hsl(var(--background))'}} name={`${selectedCoinSymbol} Price`} />
                <Line type="natural" dataKey="sma" stroke="var(--color-sma)" strokeWidth={1.5} dot={false} name={`SMA (${SMA_PERIOD})`} />

                {uniqueSignals.map((signal, index) => [
                    signal.entryPrice && <ReferenceLine key={`entry-${index}`} y={signal.entryPrice} label={{ value: `Entry`, position: 'insideTopLeft', fill: 'hsl(var(--foreground))', fontSize: 10 }} stroke="hsl(var(--primary))" strokeDasharray="3 3" />,
                    signal.targetPrice && <ReferenceLine key={`target-${index}`} y={signal.targetPrice} label={{ value: `Target`, position: 'insideTopLeft', fill: 'hsl(var(--accent-foreground))', fontSize: 10 }} stroke="hsl(var(--accent))" strokeDasharray="3 3" />,
                    signal.stopLossPrice && <ReferenceLine key={`stop-${index}`} y={signal.stopLossPrice} label={{ value: `Stop`, position: 'insideTopLeft', fill: 'hsl(var(--destructive-foreground))', fontSize: 10 }} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                ])}
              </ComposedChart>
            </ChartContainer>
            <ChartContainer config={chartConfig} className="h-[100px] w-full">
              <BarChart data={dynamicLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="marketChart">
                 <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                  <XAxis dataKey="date" tickLine={false} axisLine={true} tickMargin={8} tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    orientation="right" 
                    tickFormatter={(val) => yAxisTickFormatter(val, true)} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontSize: 12}} 
                    tickMargin={8} 
                    width={80}
                  />
                  <Tooltip cursor={false} content={() => null} />
                  <Bar dataKey="volume">
                    {dynamicLineData.map((entry, index) => {
                       const prevPrice = index > 0 ? dynamicLineData[index - 1].price : entry.price;
                       const color = entry.price >= prevPrice ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
                       return <Cell key={`cell-${index}`} fill={color} opacity={0.6}/>;
                    })}
                  </Bar>
              </BarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="candlestick" className="space-y-1">
             <ChartContainer config={{}} className="h-[280px] w-full">
                <ComposedChart data={dynamicCandlestickData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="marketChart">
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" hide />
                    <YAxis 
                        orientation="right"
                        stroke="hsl(var(--muted-foreground))" 
                        domain={yAxisDomain as [number,number]}
                        tickFormatter={(val) => yAxisTickFormatter(val, false)}
                        allowDataOverflow={true}
                        tick={{fontSize: 12}}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={80}
                    />
                    <Tooltip
                      cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}}
                      content={<CustomTooltipContent />}
                    />
                    <Bar dataKey="close" shape={<Candlestick />} />
                </ComposedChart>
            </ChartContainer>
             <ChartContainer config={chartConfig} className="h-[100px] w-full">
              <BarChart data={dynamicCandlestickData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="marketChart">
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                  <XAxis dataKey="date" tickLine={false} axisLine={true} tickMargin={8} tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    orientation="right"
                    tickFormatter={(val) => yAxisTickFormatter(val, true)} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontSize: 12}} 
                    tickMargin={8} 
                    width={80}
                  />
                  <Tooltip cursor={false} content={() => null} />
                  <Bar dataKey="volume">
                    {dynamicCandlestickData.map((entry, index) => {
                       const color = entry.close >= entry.open ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
                       return <Cell key={`cell-${index}`} fill={color} opacity={0.6} />;
                    })}
                  </Bar>
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

    
