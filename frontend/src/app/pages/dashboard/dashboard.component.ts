/**
 * Dashboard Component - Página principal con todos los widgets
 */

import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';
import { ChartComponent } from '../../components/chart/chart.component';
import { AnalysisComponent } from '../../components/analysis/analysis.component';
import { ChatComponent } from '../../components/chat/chat.component';
import { POPULAR_SYMBOLS, TIMEFRAMES, PERIODS } from '../../models/trading.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ChartComponent, AnalysisComponent, ChatComponent],
  template: `
    <div class="min-h-screen p-4 lg:p-6">
      <!-- Header -->
      <header class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Logo y título -->
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              🔥 TradingHell
            </h1>
            <p class="text-gray-400 text-sm mt-1">
              Tu asistente inteligente de trading
            </p>
          </div>
          
          <!-- Controles -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Selector de símbolo -->
            <div class="flex items-center gap-2">
              <input
                type="text"
                [(ngModel)]="symbolInput"
                (keydown.enter)="changeSymbol()"
                placeholder="Símbolo..."
                class="w-32 px-3 py-2 rounded-lg bg-trading-card border border-trading-border 
                       focus:border-indigo-500 focus:outline-none text-sm"
              />
              <button
                (click)="changeSymbol()"
                class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition">
                Buscar
              </button>
            </div>
            
            <!-- Selector de timeframe -->
            <select
              [(ngModel)]="selectedTimeframe"
              (ngModelChange)="changeTimeframe($event)"
              class="px-3 py-2 rounded-lg bg-trading-card border border-trading-border 
                     focus:border-indigo-500 focus:outline-none text-sm cursor-pointer">
              @for (tf of timeframes; track tf.value) {
                <option [value]="tf.value">{{ tf.label }}</option>
              }
            </select>
            
            <!-- Selector de período -->
            <select
              [(ngModel)]="selectedPeriod"
              (ngModelChange)="changePeriod($event)"
              class="px-3 py-2 rounded-lg bg-trading-card border border-trading-border 
                     focus:border-indigo-500 focus:outline-none text-sm cursor-pointer">
              @for (p of periods; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
            
            <!-- Botón refresh -->
            <button
              (click)="refresh()"
              [disabled]="tradingService.isLoading()"
              class="p-2 rounded-lg bg-trading-card border border-trading-border 
                     hover:border-indigo-500 transition disabled:opacity-50"
              title="Actualizar">
              🔄
            </button>
          </div>
        </div>
        
        <!-- Símbolos populares -->
        <div class="mt-4 flex flex-wrap gap-2">
          @for (sym of popularSymbols; track sym.symbol) {
            <button
              (click)="selectSymbol(sym.symbol)"
              [class]="currentSymbol() === sym.symbol 
                ? 'bg-indigo-600 border-indigo-500' 
                : 'bg-trading-card border-trading-border hover:border-indigo-500'"
              class="px-3 py-1 rounded-full text-xs border transition">
              {{ sym.symbol }}
            </button>
          }
        </div>
      </header>
      
      <!-- Info del símbolo actual -->
      <div class="mb-6 trading-card">
        <div class="flex flex-wrap items-center gap-6">
          <div>
            <span class="text-gray-400 text-sm">Símbolo</span>
            <p class="text-xl font-bold">{{ currentSymbol() }}</p>
          </div>
          
          @if (currentPrice()) {
            <div>
              <span class="text-gray-400 text-sm">Precio</span>
              <p class="text-xl font-bold">{{ currentPrice() | number:'1.2-4' }}</p>
            </div>
          }
          
          @if (trend()) {
            <div>
              <span class="text-gray-400 text-sm">Tendencia</span>
              <p class="text-xl font-bold" [class]="trendColor()">
                {{ trendEmoji() }} {{ trend() }}
              </p>
            </div>
          }
          
          @if (signal()) {
            <div>
              <span class="text-gray-400 text-sm">Señal</span>
              <p class="text-xl font-bold" [class]="signalColor()">
                {{ signal() }}
              </p>
            </div>
          }
        </div>
      </div>
      
      <!-- Grid principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <!-- Gráfico (2 columnas) -->
        <div class="lg:col-span-2">
          <app-chart />
        </div>
        
        <!-- Análisis -->
        <div class="h-[500px] lg:h-auto">
          <app-analysis />
        </div>
        
        <!-- Chat (2 columnas) -->
        <div class="lg:col-span-2 h-[400px]">
          <app-chat />
        </div>
        
        <!-- Tips rápidos -->
        <div class="trading-card">
          <h3 class="text-lg font-semibold mb-4">💡 Tips Rápidos</h3>
          <div class="space-y-3 text-sm text-gray-400">
            <p>• Nunca arriesgues más del 1-2% por operación</p>
            <p>• Espera siempre confirmación de los patrones</p>
            <p>• El volumen confirma los movimientos</p>
            <p>• RSI > 70 = sobrecompra, RSI < 30 = sobreventa</p>
            <p>• Las divergencias son señales muy fiables</p>
          </div>
          
          <div class="mt-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p class="text-yellow-400 text-sm font-medium">⚠️ Aviso</p>
            <p class="text-xs text-gray-400 mt-1">
              Esto es solo análisis técnico educativo. 
              No es consejo financiero. Opera bajo tu propio riesgo.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <footer class="mt-8 text-center text-gray-500 text-sm">
        <p>TradingHell © 2026 - Análisis técnico con IA</p>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent {
  readonly tradingService = inject(TradingService);
  
  // Estado local
  symbolInput = '';
  selectedTimeframe = '1d';
  selectedPeriod = '6mo';
  
  // Datos estáticos
  readonly popularSymbols = POPULAR_SYMBOLS.slice(0, 12);
  readonly timeframes = TIMEFRAMES;
  readonly periods = PERIODS;
  
  // Computed desde el servicio
  readonly currentSymbol = computed(() => this.tradingService.currentSymbol());
  
  readonly currentPrice = computed(() => 
    this.tradingService.analysis.value()?.current_price
  );
  
  readonly trend = computed(() => 
    this.tradingService.analysis.value()?.trend
  );
  
  readonly signal = computed(() => 
    this.tradingService.analysis.value()?.overall_signal
  );
  
  readonly trendColor = computed(() => {
    const t = this.trend();
    if (t === 'ALCISTA') return 'text-green-400';
    if (t === 'BAJISTA') return 'text-red-400';
    return 'text-yellow-400';
  });
  
  readonly trendEmoji = computed(() => {
    const t = this.trend();
    if (t === 'ALCISTA') return '📈';
    if (t === 'BAJISTA') return '📉';
    return '➡️';
  });
  
  readonly signalColor = computed(() => {
    const s = this.signal();
    if (!s) return 'text-gray-400';
    if (s.includes('COMPRA')) return 'text-green-400';
    if (s.includes('VENTA')) return 'text-red-400';
    return 'text-yellow-400';
  });
  
  selectSymbol(symbol: string): void {
    this.tradingService.setSymbol(symbol);
  }
  
  changeSymbol(): void {
    if (this.symbolInput.trim()) {
      this.tradingService.setSymbol(this.symbolInput.trim());
      this.symbolInput = '';
    }
  }
  
  changeTimeframe(tf: string): void {
    this.tradingService.setInterval(tf);
  }
  
  changePeriod(period: string): void {
    this.tradingService.setPeriod(period);
  }
  
  refresh(): void {
    this.tradingService.refresh();
  }
}
