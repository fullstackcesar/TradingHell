/**
 * Modelos para la aplicación de trading.
 */

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataResponse {
  symbol: string;
  interval: string;
  candles: CandleData[];
}

export interface IndicatorResult {
  name: string;
  value: number;
  signal: string;
  interpretation: string;
}

export interface PatternResult {
  name: string;
  signal: string;
  confidence: number;
  description: string;
  candle_index?: number; // Índice relativo desde el final (-1, -2, etc.)
}

export interface TrendDetails {
  bullish_factors: string[];
  bearish_factors: string[];
  neutral_factors: string[];
  sma_values: {
    sma_20?: number;
    sma_50?: number;
    sma_200?: number;
  };
  price_change: {
    total: number;
    start_price: number;
    end_price: number;
  };
  scores: {
    bullish: number;
    bearish: number;
  };
  trend: string;
  strength: number;
}

export interface AnalysisResponse {
  symbol: string;
  timeframe: string;
  current_price: number;
  trend: string;
  trend_strength: number;
  trend_details?: TrendDetails;
  indicators: IndicatorResult[];
  patterns: PatternResult[];
  support_levels: number[];
  resistance_levels: number[];
  overall_signal: string;
  signal_strength: number;
  summary: string;
  recommendations: string[];
}

export interface QuestionResponse {
  answer: string;
  sources: string[];
}

export interface TickerInfo {
  symbol: string;
  name?: string;
  currency?: string;
  exchange?: string;
  current_price?: number;
  previous_close?: number;
  day_high?: number;
  day_low?: number;
  volume?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export type SignalType = 'COMPRA FUERTE' | 'COMPRA' | 'NEUTRAL' | 'VENTA' | 'VENTA FUERTE';

export const SIGNAL_CLASSES: Record<string, string> = {
  'COMPRA FUERTE': 'signal-strong-buy',
  'COMPRA': 'signal-buy',
  'NEUTRAL': 'signal-neutral',
  'VENTA': 'signal-sell',
  'VENTA FUERTE': 'signal-strong-sell'
};

export const POPULAR_SYMBOLS = [
  // Acciones USA
  { symbol: 'AAPL', name: 'Apple', market: 'USA' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'USA' },
  { symbol: 'GOOGL', name: 'Google', market: 'USA' },
  { symbol: 'TSLA', name: 'Tesla', market: 'USA' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'USA' },
  { symbol: 'META', name: 'Meta', market: 'USA' },
  { symbol: 'AMZN', name: 'Amazon', market: 'USA' },
  
  // Acciones España
  { symbol: 'SANTANDER', name: 'Banco Santander', market: 'Spain' },
  { symbol: 'BBVA', name: 'BBVA', market: 'Spain' },
  { symbol: 'IBERDROLA', name: 'Iberdrola', market: 'Spain' },
  { symbol: 'TELEFONICA', name: 'Telefónica', market: 'Spain' },
  { symbol: 'INDITEX', name: 'Inditex', market: 'Spain' },
  { symbol: 'REPSOL', name: 'Repsol', market: 'Spain' },
  
  // Forex
  { symbol: 'EURUSD', name: 'EUR/USD', market: 'Forex' },
  { symbol: 'GBPUSD', name: 'GBP/USD', market: 'Forex' },
  { symbol: 'USDJPY', name: 'USD/JPY', market: 'Forex' },
  
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', market: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', market: 'Crypto' },
];

export const TIMEFRAMES = [
  // Minutos
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  // Horas
  { value: '1h', label: '1H' },
  { value: '2h', label: '2H' },
  { value: '4h', label: '4H' },
  { value: '6h', label: '6H' },
  { value: '8h', label: '8H' },
  { value: '12h', label: '12H' },
  // Días/Semanas/Mes
  { value: '1d', label: '1D' },
  { value: '3d', label: '3D' },
  { value: '1w', label: '1S' },
  { value: '1M', label: '1M' },
];

export const PERIODS = [
  { value: '1mo', label: '1 Mes' },
  { value: '3mo', label: '3 Meses' },
  { value: '6mo', label: '6 Meses' },
  { value: '1y', label: '1 Año' },
  { value: '2y', label: '2 Años' },
  { value: '5y', label: '5 Años' },
  { value: 'max', label: 'Máximo' },
];
