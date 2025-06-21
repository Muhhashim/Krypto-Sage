
import type { TradingSignal } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, Target, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  signal: TradingSignal;
  coinName: string;
}

export function SignalCard({ signal, coinName }: SignalCardProps) {
  const isBuySignal = signal.signalType === 'BUY';
  const isBullish = signal.sentiment === 'BULLISH';
  const confidencePercentage = signal.confidenceLevel * 100;

  return (
    <Card className={cn(
      "shadow-card hover:shadow-card-hover transition-shadow duration-300 border-l-4 overflow-hidden",
      isBuySignal ? "border-accent" : "border-destructive"
    )}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center space-x-2.5">
            {isBuySignal ? (
              <ArrowUpCircle className="h-7 w-7 text-accent shrink-0" />
            ) : (
              <ArrowDownCircle className="h-7 w-7 text-destructive shrink-0" />
            )}
            <div>
              <CardTitle className={cn(
                "text-lg font-headline leading-tight", 
                isBuySignal ? "text-accent" : "text-destructive"
              )}>
                {signal.signalType} Signal
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                <Coins size={14} className="mr-1.5 text-primary/80"/> {coinName}
              </div>
            </div>
          </div>
           <Badge 
            variant={isBullish ? "default" : "destructive"} 
            className={cn(
              "text-xs whitespace-nowrap px-2.5 py-1", 
              isBullish ? "bg-accent/10 text-accent border-accent/30" : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {isBullish ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
            {signal.sentiment}
          </Badge>
        </div>
         <div className="text-xs text-muted-foreground mt-2">Confidence: {confidencePercentage.toFixed(0)}%</div>
        <Progress value={confidencePercentage} aria-label={`Confidence level: ${confidencePercentage.toFixed(0)}%`} className={cn(isBuySignal ? "[&>div]:bg-accent" : "[&>div]:bg-destructive", "h-1.5 mt-1 rounded-full")} />
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-2">
        <div>
          <h4 className="font-semibold text-sm text-foreground/90">Reasoning:</h4>
          <p className="text-muted-foreground text-sm">{signal.reason}</p>
        </div>

        {(signal.entryPrice || signal.targetPrice || signal.stopLossPrice) && (
          <div className="border-t border-border/70 pt-2.5">
            <div className="flex items-center space-x-2 mb-1.5">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-sm text-foreground/90">Future Trade Levels:</h4>
            </div>
            <ul className="text-muted-foreground text-sm space-y-1 pl-1">
              {signal.entryPrice && (
                <li>
                  <span className="font-medium text-foreground/80">{isBuySignal ? 'Entry (Long) ~ ' : 'Entry (Short) ~ '}</span> ${signal.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (signal.entryPrice < 1 ? 6 : 2))})}
                </li>
              )}
              {signal.targetPrice && (
                <li>
                  <span className="font-medium text-foreground/80">Take Profit:</span> ${signal.targetPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (signal.targetPrice < 1 ? 6 : 2))})}
                </li>
              )}
              {signal.stopLossPrice && (
                <li>
                  <span className="font-medium text-foreground/80">Stop Loss:</span> ${signal.stopLossPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, (signal.stopLossPrice < 1 ? 6 : 2))})}
                </li>
              )}
            </ul>
          </div>
        )}

        {signal.supportingData && (
          <div className="border-t border-border/70 pt-2.5">
            <h4 className="font-semibold text-sm text-foreground/90">Supporting Data Summary:</h4>
            <p className="text-muted-foreground text-sm break-words">{signal.supportingData}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 px-4 py-2.5 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mr-1.5 shrink-0"/>
          <span>Futures trading is high risk. Not financial advice.</span>
        </div>
      </CardFooter>
    </Card>
  );
}
