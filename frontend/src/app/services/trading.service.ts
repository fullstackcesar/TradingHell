/**
 * Trading Service - Comunicación con el backend FastAPI
 * Usa Angular 21 Signals y Resource API
 */

import { Injectable, signal, computed, resource, ResourceRef } from '@angular/core';
import { 
  AnalysisResponse, 
  ChartDataResponse, 
  QuestionResponse,
  TickerInfo
} from '../models/trading.models';

const API_BASE = 'http://localhost:8000/api';

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  
  // Signals para el estado
  readonly currentSymbol = signal<string>('AAPL');
  readonly currentInterval = signal<string>('1d');
  readonly currentPeriod = signal<string>('6mo');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
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
        this.error.set(null);
        
        const response = await fetch(
          `${API_BASE}/chart/${params.params.symbol}?interval=${params.params.interval}&period=${params.params.period}`
        );
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json() as ChartDataResponse;
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
        const response = await fetch(
          `${API_BASE}/analyze/${params.params.symbol}?interval=${params.params.interval}&period=${params.params.period}`
        );
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json() as AnalysisResponse;
      } catch (e) {
        console.error('Error en análisis:', e);
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
