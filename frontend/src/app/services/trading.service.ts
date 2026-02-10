/**
 * Trading Service - Comunicación con el backend FastAPI
 * Usa Angular 21 Signals y Resource API
 */

import { Injectable, signal, computed, resource, ResourceRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { 
  AnalysisResponse, 
  ChartDataResponse, 
  QuestionResponse,
  TickerInfo
} from '../models/trading.models';

// URL base del API - se puede sobrescribir en runtime via window.__API_URL__
declare global {
  interface Window {
    __API_URL__?: string;
  }
}

function getApiBase(): string {
  // Prioridad: window.__API_URL__ > default
  if (typeof window !== 'undefined' && window.__API_URL__) {
    return window.__API_URL__;
  }
  // Default: localhost:8001 para desarrollo
  return 'http://localhost:8001/api';
}

const API_BASE = getApiBase();

function isCryptoSymbol(symbol: string): boolean {
  // Si termina en USDT, BUSD, USD, etc. es cripto
  return /USDT|BUSD|BTC$|ETH$/.test(symbol.toUpperCase());
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  
  // Signals para el estado
  readonly currentSymbol = signal<string>('BTCUSDT');
  readonly currentInterval = signal<string>('1h');
  readonly currentPeriod = signal<string>('6mo');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Precio en tiempo real (actualizado independientemente del análisis)
  readonly realtimePrice = signal<number | null>(null);
  
  // Modo tiempo real (para no mostrar barra de progreso)
  readonly isRealTimeMode = signal<boolean>(false);
  
  // Sistema de progreso de carga (solo cuando NO es tiempo real)
  readonly loadingStep = signal<'idle' | 'chart' | 'analysis' | 'done'>('idle');
  readonly loadingProgress = computed(() => {
    if (this.isRealTimeMode()) return 0; // No mostrar en tiempo real
    switch (this.loadingStep()) {
      case 'idle': return 0;
      case 'chart': return 35;
      case 'analysis': return 70;
      case 'done': return 100;
    }
  });
  readonly loadingMessage = computed(() => {
    if (this.isRealTimeMode()) return '';
    switch (this.loadingStep()) {
      case 'idle': return '';
      case 'chart': return 'Cargando datos del mercado...';
      case 'analysis': return 'Analizando indicadores...';
      case 'done': return '¡Listo!';
    }
  });
  
  // Indicador seleccionado para mostrar en el gráfico
  readonly selectedIndicator = signal<string | null>(null);
  
  // Computed para la URL del chart
  readonly chartUrl = computed(() => 
    `${API_BASE}/chart/${this.currentSymbol()}?interval=${this.currentInterval()}&period=${this.currentPeriod()}`
  );
  
  // Resource para datos del gráfico (experimental en Angular 19, estable en 21)
  readonly chartData: ResourceRef<ChartDataResponse | undefined> = resource({
    params: () => ({
      symbol: this.currentSymbol(),
      interval: this.currentInterval(),
      period: this.currentPeriod()
    }),
    loader: async (params) => {
      try {
        this.isLoading.set(true);
        this.loadingStep.set('chart');
        this.error.set(null);
        
        const symbol = params.params.symbol;
        const period = params.params.period;
        const interval = params.params.interval;
        const isCrypto = isCryptoSymbol(symbol);
        
        // Calcular límite de velas según periodo e intervalo
        const limit = this.calculateLimit(period, interval);
        
        // Usar Binance para criptos (más rápido)
        let url: string;
        if (isCrypto) {
          url = `${API_BASE}/binance/klines/${symbol}?interval=${interval}&limit=${limit}`;
        } else {
          url = `${API_BASE}/chart/${symbol}?interval=${interval}&period=${period}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Normalizar respuesta de Binance (usa 'data' con objetos que tienen 'time')
        if (isCrypto && data.data) {
          return {
            symbol: symbol,
            candles: data.data.map((k: any) => ({
              date: new Date(k.time * 1000).toISOString(),
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
              volume: k.volume
            })),
            interval: params.params.interval
          } as ChartDataResponse;
        }
        
        return data as ChartDataResponse;
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : 'Error desconocido');
        throw e;
      } finally {
        this.isLoading.set(false);
      }
    }
  });
  
  // Resource para análisis técnico
  readonly analysis: ResourceRef<AnalysisResponse | undefined> = resource({
    params: () => ({
      symbol: this.currentSymbol(),
      interval: this.currentInterval(),
      period: this.currentPeriod()
    }),
    loader: async (params) => {
      try {
        this.loadingStep.set('analysis');
        
        const symbol = params.params.symbol;
        const isCrypto = isCryptoSymbol(symbol);
        
        // Usar endpoint de Binance para criptos (más rápido)
        const endpoint = isCrypto 
          ? `${API_BASE}/binance/analyze/${symbol}?interval=${params.params.interval}`
          : `${API_BASE}/analyze/${symbol}?interval=${params.params.interval}&period=${params.params.period}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json() as AnalysisResponse;
        
        // Marcar como completado
        this.loadingStep.set('done');
        setTimeout(() => this.loadingStep.set('idle'), 1500);
        
        return result;
      } catch (e) {
        console.error('Error en análisis:', e);
        this.loadingStep.set('idle');
        throw e;
      }
    }
  });
  
  /**
   * Cambia el símbolo actual
   */
  setSymbol(symbol: string): void {
    this.currentSymbol.set(symbol.toUpperCase());
  }
  
  /**
   * Calcula el límite de velas según periodo e intervalo
   * Binance máximo = 1000 velas
   */
  private calculateLimit(period: string, interval: string): number {
    // Días aproximados por periodo
    const periodDays: Record<string, number> = {
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      'max': 1000 // máximo de Binance
    };
    
    // Velas por día según intervalo
    const candlesPerDay: Record<string, number> = {
      '1h': 24,
      '4h': 6,
      '1d': 1,
      '1w': 1/7,
    };
    
    const days = periodDays[period] || 90;
    const perDay = candlesPerDay[interval] || 1;
    
    // Calcular y limitar a 1000 (máximo de Binance)
    return Math.min(1000, Math.ceil(days * perDay));
  }
  
  /**
   * Cambia el intervalo de tiempo
   */
  setInterval(interval: string): void {
    this.currentInterval.set(interval);
  }
  
  /**
   * Cambia el período
   */
  setPeriod(period: string): void {
    this.currentPeriod.set(period);
  }
  
  /**
   * Refresca los datos
   */
  refresh(): void {
    this.chartData.reload();
    this.analysis.reload();
  }
  
  /**
   * Refresca solo el análisis (sin velas)
   */
  refreshAnalysis(): void {
    this.analysis.reload();
  }
  
  /**
   * Refresca solo el precio en tiempo real (sin análisis ni velas)
   */
  async refreshPriceOnly(): Promise<void> {
    const symbol = this.currentSymbol();
    const isCrypto = isCryptoSymbol(symbol);
    
    if (!isCrypto) {
      // Para acciones, no tenemos endpoint de precio rápido
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/binance/price/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        this.realtimePrice.set(parseFloat(data.price));
      }
    } catch (e) {
      console.error('Error obteniendo precio:', e);
    }
  }
  
  /**
   * Selecciona un indicador para mostrar en el gráfico
   */
  selectIndicator(name: string | null): void {
    this.selectedIndicator.set(name);
  }
  
  /**
   * Pregunta al asistente RAG
   */
  async askQuestion(question: string): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json() as QuestionResponse;
  }
  
  /**
   * Obtiene información de un ticker
   */
  async getTickerInfo(symbol: string): Promise<TickerInfo> {
    const response = await fetch(`${API_BASE}/ticker/${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json() as TickerInfo;
  }
  
  /**
   * Análisis inteligente con pregunta contextual
   */
  async smartAnalysis(symbol: string, question?: string): Promise<any> {
    let url = `${API_BASE}/smart-analysis?symbol=${symbol}`;
    if (question) {
      url += `&question=${encodeURIComponent(question)}`;
    }
    
    const response = await fetch(url, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  }
}
