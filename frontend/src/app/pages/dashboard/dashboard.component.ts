/**
 * Dashboard Component - Página principal con layout optimizado
 */

import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradingService } from '../../services/trading.service';
import { ChartComponent } from '../../components/chart/chart.component';
import { AnalysisComponent } from '../../components/analysis/analysis.component';
import { ChatComponent } from '../../components/chat/chat.component';
import { ActionPanelComponent } from '../../components/action-panel/action-panel.component';
import { MarketExplorerComponent } from '../../components/market-explorer/market-explorer.component';
import { PositionTrackerComponent, NewPositionData } from '../../components/position-tracker/position-tracker.component';
import { OpportunitiesComponent } from '../../components/opportunities/opportunities.component';
import { AlertsComponent } from '../../components/alerts/alerts.component';
import { LearningComponent } from '../../components/learning/learning.component';
import { MarketClocksComponent } from '../../components/market-clocks/market-clocks.component';
import { TIMEFRAMES, PERIODS, TrendDetails } from '../../models/trading.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ChartComponent, AnalysisComponent, ChatComponent, ActionPanelComponent, MarketExplorerComponent, PositionTrackerComponent, OpportunitiesComponent, AlertsComponent, LearningComponent, MarketClocksComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-trading-bg relative">
      <!-- Barra de progreso de carga (solo cuando NO es tiempo real) -->
      @if (tradingService.loadingStep() !== 'idle' && !isRealTime()) {
        <div class="absolute top-0 left-0 right-0 z-50">
          <div class="h-1 bg-trading-card overflow-hidden">
            <div 
              class="h-full transition-all duration-300 ease-out"
              [class]="tradingService.loadingStep() === 'done' ? 'bg-green-500' : 'bg-indigo-500'"
              [style.width.%]="tradingService.loadingProgress()">
            </div>
          </div>
          <div class="flex items-center justify-center gap-2 py-1 bg-trading-card/90 backdrop-blur-sm text-xs">
            @if (tradingService.loadingStep() !== 'done') {
              <span class="animate-spin">⏳</span>
            } @else {
              <span>✅</span>
            }
            <span class="font-medium">{{ tradingService.loadingMessage() }}</span>
            <span class="text-gray-500">({{ tradingService.loadingProgress() }}%)</span>
          </div>
        </div>
      }
      
      <!-- Header minimalista y responsivo -->
      <header class="flex-shrink-0 px-2 sm:px-3 py-2 border-b border-trading-border">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <!-- Logo y símbolo -->
          <div class="flex items-center gap-2 sm:gap-3">
            <h1 class="text-base sm:text-lg font-bold">🔥 <span class="sm:hidden">TH</span><span class="hidden sm:inline">TradingHell</span></h1>
            <span class="text-gray-500 text-xs hidden lg:inline">| {{ currentSymbol() }}</span>
          </div>
          
          <!-- Relojes de mercado (centro) - oculto en móvil -->
          <div class="hidden md:flex order-2 flex-1 justify-center">
            <app-market-clocks [symbol]="currentSymbol()" />
          </div>
          
          <!-- Controles (derecha) -->
          <div class="flex items-center gap-1 sm:gap-2">
            <input
              type="text"
              [(ngModel)]="symbolInput"
              (keydown.enter)="changeSymbol()"
              placeholder="Símbolo"
              class="w-16 sm:w-24 px-1 sm:px-2 py-1 rounded bg-trading-card border border-trading-border 
                     focus:border-indigo-500 focus:outline-none text-xs"
            />
            <select
              [(ngModel)]="selectedTimeframe"
              (ngModelChange)="changeTimeframe($event)"
              class="px-1 sm:px-2 py-1 rounded bg-trading-card border border-trading-border text-xs"
              title="Intervalo de vela">
              @for (tf of timeframes; track tf.value) {
                <option [value]="tf.value">{{ tf.label }}</option>
              }
            </select>
            <select
              [(ngModel)]="selectedPeriod"
              (ngModelChange)="changePeriod($event)"
              class="hidden sm:block px-2 py-1 rounded bg-trading-card border border-trading-border text-xs"
              title="Periodo de historia">
              @for (p of periods; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
            <button
              (click)="refreshAnalysis()"
              [disabled]="tradingService.isLoading()"
              class="p-1 rounded bg-trading-card border border-trading-border hover:border-indigo-500 transition text-xs"
              title="Actualizar análisis técnico">
              📊
            </button>
            
            <!-- Botón tiempo real -->
            <button
              (click)="toggleRealTime()"
              class="px-1 sm:px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
              [class]="isRealTime() 
                ? 'bg-green-500/20 border border-green-500 text-green-400 animate-pulse' 
                : 'bg-trading-card border border-trading-border text-gray-400 hover:border-indigo-500'"
              [title]="isRealTime() ? 'Precio en vivo activo' : 'Activar precio en tiempo real'">
              <span>{{ isRealTime() ? '🟢' : '⚪' }}</span>
              <span class="hidden md:inline">{{ isRealTime() ? 'LIVE' : 'RT' }}</span>
            </button>
          </div>
        </div>
        
        <!-- Reloj de mercado en móvil (debajo del header) -->
        <div class="md:hidden mt-2 flex justify-center">
          <app-market-clocks [symbol]="currentSymbol()" />
        </div>
      </header>
      
      <!-- Tabs principales con scroll horizontal en móvil -->
      <div class="flex-shrink-0 px-2 pt-2 overflow-x-auto scrollbar-hide">
        <div class="flex items-center gap-1 sm:gap-2 min-w-max">
          <button 
            (click)="activeView.set('trading')"
            class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap"
            [class]="activeView() === 'trading' 
              ? 'bg-trading-card text-white border-t border-l border-r border-indigo-500' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'">
            📊 <span class="hidden sm:inline">Trading</span>
          </button>
          <button 
            (click)="activeView.set('scanner')"
            class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            [class]="activeView() === 'scanner' 
              ? 'bg-trading-card text-white border-t border-l border-r border-green-500' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'">
            🎯 <span class="hidden sm:inline">Scanner</span>
            <span class="hidden sm:inline px-1 py-0.5 bg-green-500/30 rounded text-green-400 text-xs">NEW</span>
          </button>
          <button 
            (click)="activeView.set('alerts')"
            class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap"
            [class]="activeView() === 'alerts' 
              ? 'bg-trading-card text-white border-t border-l border-r border-yellow-500' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'">
            🔔 <span class="hidden sm:inline">Alertas</span>
          </button>
          <button 
            (click)="activeView.set('learning')"
            class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap"
            [class]="activeView() === 'learning' 
              ? 'bg-trading-card text-white border-t border-l border-r border-purple-500' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'">
            📚 <span class="hidden sm:inline">Aprender</span>
          </button>
        </div>
      </div>
      
      <!-- Layout principal con paneles redimensionables -->
      <div class="flex-1 grid grid-cols-12 gap-1 sm:gap-2 p-1 sm:p-2">
        
        @if (activeView() === 'trading') {
          <!-- VISTA TRADING: Explorador + Gráfico + Acción + Análisis -->
          
          <!-- Columna izquierda: Explorador + Acción (oculto en móvil, visible en md+) -->
          <div class="hidden md:flex col-span-12 md:col-span-3 lg:col-span-2 flex-col gap-2">
            <app-market-explorer class="explorer-resizable" />
            <app-action-panel 
              class="action-resizable"
              (levelHovered)="onLevelHovered($event)"
              (trendHovered)="onTrendHovered($event)"
              (openPosition)="openPositionTracker($event)"
            />
          </div>
          
          <!-- Columna central: Gráfico -->
          <div class="col-span-12 md:col-span-9 lg:col-span-7 flex flex-col gap-2">
            <app-chart 
              class="chart-resizable"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
            
            <!-- Posiciones abiertas (si hay) -->
            @if (hasOpenPositions()) {
              <app-position-tracker 
                class="positions-resizable"
                [prefillPosition]="pendingPosition()"
                (closePosition)="onClosePosition($event)"
                (positionAdded)="onPositionAdded()"
              />
            }
          </div>
          
          <!-- Columna derecha: Análisis completo (oculto en móvil/tablet, visible en lg+) -->
          <div class="hidden lg:flex col-span-12 lg:col-span-3 flex-col">
            <app-analysis class="analysis-resizable" />
          </div>
          
          <!-- Panel inferior móvil: Acción + Explorer colapsables -->
          <div class="col-span-12 md:hidden flex flex-col gap-2 mt-2">
            <details class="trading-card">
              <summary class="cursor-pointer p-2 text-xs font-bold">📋 Panel de Acción</summary>
              <app-action-panel 
                class="h-64"
                (levelHovered)="onLevelHovered($event)"
                (trendHovered)="onTrendHovered($event)"
                (openPosition)="openPositionTracker($event)"
              />
            </details>
            <details class="trading-card">
              <summary class="cursor-pointer p-2 text-xs font-bold">🔍 Explorador</summary>
              <app-market-explorer class="h-48" />
            </details>
            <details class="trading-card">
              <summary class="cursor-pointer p-2 text-xs font-bold">📊 Análisis</summary>
              <app-analysis class="h-64" />
            </details>
          </div>
        }
        
        @if (activeView() === 'scanner') {
          <!-- VISTA SCANNER: Oportunidades + Gráfico del seleccionado -->
          
          <!-- Columna izquierda: Oportunidades -->
          <div class="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col gap-2">
            <app-opportunities 
              class="opportunities-resizable"
              (symbolSelected)="onOpportunitySelected($event)"
            />
          </div>
          
          <!-- Columna central: Gráfico -->
          <div class="col-span-12 md:col-span-7 lg:col-span-5 flex flex-col gap-2">
            <app-chart 
              class="chart-resizable"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
          </div>
          
          <!-- Columna derecha: Acción (oculto en móvil/tablet, visible en lg+) -->
          <div class="hidden lg:flex col-span-12 lg:col-span-3 flex-col gap-2">
            <app-action-panel 
              class="action-resizable"
              (levelHovered)="onLevelHovered($event)"
              (trendHovered)="onTrendHovered($event)"
              (openPosition)="openPositionTracker($event)"
            />
          </div>
        }
        
        @if (activeView() === 'alerts') {
          <!-- VISTA ALERTAS: Gestión de alertas + Oportunidades -->
          
          <!-- Columna izquierda: Alertas -->
          <div class="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col gap-2">
            <app-alerts class="alerts-resizable" />
          </div>
          
          <!-- Columna central: Gráfico -->
          <div class="col-span-12 md:col-span-7 lg:col-span-5 flex flex-col gap-2">
            <app-chart 
              class="chart-resizable"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
          </div>
          
          <!-- Columna derecha: Oportunidades (oculto en móvil/tablet) -->
          <div class="hidden lg:flex col-span-12 lg:col-span-3 flex-col gap-2">
            <app-opportunities 
              class="opportunities-resizable"
              (symbolSelected)="onOpportunitySelected($event)"
            />
          </div>
        }
        
        @if (activeView() === 'learning') {
          <!-- VISTA APRENDIZAJE: Centro educativo de trading -->
          <div class="col-span-12 min-h-0">
            <app-learning class="h-full" />
          </div>
        }
      </div>
      
      <!-- Barra inferior: Chat colapsable + Alertas -->
      <div class="flex-shrink-0 border-t border-trading-border">
        <div class="flex items-center justify-between px-3 py-1 bg-trading-card cursor-pointer"
             (click)="toggleChat()">
          <span class="text-xs font-medium">
            💬 Asistente IA
            @if (unreadAlerts() > 0) {
              <span class="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                {{ unreadAlerts() }}
              </span>
            }
          </span>
          <span class="text-gray-400 text-xs">{{ isChatOpen() ? '▼' : '▶' }}</span>
        </div>
        
        @if (isChatOpen()) {
          <div class="h-40 border-t border-trading-border">
            <app-chat />
          </div>
        }
      </div>
      
      <!-- Footer minimalista -->
      <footer class="flex-shrink-0 px-3 py-1 text-center text-gray-600 text-xs border-t border-trading-border">
        ⚠️ No es consejo financiero
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      overflow-y: auto;
    }
    
    /* === COMPONENTES REDIMENSIONABLES === */
    /* Estilo base compartido para todos */
    .panel-resizable {
      display: block;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    
    .panel-resizable:hover {
      border-color: rgba(99, 102, 241, 0.4);
    }
    
    /* Gráfico - color indigo */
    app-chart.chart-resizable {
      display: block;
      min-height: 200px;
      height: 450px;
      resize: vertical;
      overflow: hidden;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-chart.chart-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Posiciones - color verde */
    app-position-tracker.positions-resizable {
      display: block;
      min-height: 80px;
      height: 150px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-position-tracker.positions-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(34, 197, 94, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Explorador de mercado - color cyan */
    app-market-explorer.explorer-resizable {
      display: block;
      min-height: 120px;
      height: 280px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-market-explorer.explorer-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(6, 182, 212, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Panel de acción - color amber */
    app-action-panel.action-resizable {
      display: block;
      min-height: 100px;
      height: 220px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-action-panel.action-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(245, 158, 11, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Análisis - color purple */
    app-analysis.analysis-resizable {
      display: block;
      min-height: 200px;
      height: 500px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-analysis.analysis-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(168, 85, 247, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Oportunidades - color emerald */
    app-opportunities.opportunities-resizable {
      display: block;
      min-height: 150px;
      height: 400px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-opportunities.opportunities-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(16, 185, 129, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Alertas - color yellow */
    app-alerts.alerts-resizable {
      display: block;
      min-height: 150px;
      height: 400px;
      resize: vertical;
      overflow: auto;
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    app-alerts.alerts-resizable::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, rgba(234, 179, 8, 0.5) 50%);
      border-radius: 0 0 8px 0;
    }
    
    /* Ocultar scrollbar en tabs móviles */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    
    /* Details/Summary para paneles colapsables en móvil */
    details.trading-card {
      background: rgba(17, 17, 27, 0.95);
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 8px;
    }
    details.trading-card summary {
      list-style: none;
    }
    details.trading-card summary::-webkit-details-marker {
      display: none;
    }
    details.trading-card summary::before {
      content: '▶ ';
      display: inline;
    }
    details.trading-card[open] summary::before {
      content: '▼ ';
    }
    
    /* Responsive: altura mínima del gráfico en móvil */
    @media (max-width: 768px) {
      app-chart.chart-resizable {
        min-height: 250px !important;
        height: 300px !important;
        max-height: none;
      }
    }
  `]
})
export class DashboardComponent implements OnDestroy {
  readonly tradingService = inject(TradingService);
  
  symbolInput = '';
  selectedTimeframe = '1d';
  selectedPeriod = '3mo';
  
  readonly timeframes = TIMEFRAMES;
  readonly periods = PERIODS;
  
  // Tiempo real
  readonly isRealTime = signal(false);
  private realTimeInterval: ReturnType<typeof setInterval> | null = null;
  
  readonly currentSymbol = computed(() => this.tradingService.currentSymbol());
  readonly isChatOpen = signal(false);
  readonly highlightedLevel = signal<{ type: string; price: number } | null>(null);
  readonly trendLinesVisible = signal<TrendDetails | null>(null);
  readonly unreadAlerts = signal(0);
  
  // Vista activa: Trading / Scanner / Alerts / Learning
  readonly activeView = signal<'trading' | 'scanner' | 'alerts' | 'learning'>('trading');
  
  // Patrones para mostrar en el gráfico
  readonly chartPatterns = computed(() => {
    const analysis = this.tradingService.analysis.value();
    return analysis?.patterns || [];
  });
  
  // Posiciones abiertas
  readonly hasOpenPositions = signal(true); // Siempre mostrar para poder añadir
  readonly pendingPosition = signal<NewPositionData | null>(null);
  
  toggleChat(): void {
    this.isChatOpen.update(v => !v);
  }
  
  onLevelHovered(level: { type: string; price: number } | null): void {
    this.highlightedLevel.set(level);
  }
  
  onTrendHovered(trendDetails: TrendDetails | null): void {
    this.trendLinesVisible.set(trendDetails);
  }
  
  openPositionTracker(data: { symbol: string; type: 'LONG' | 'SHORT'; entryPrice: number; stopLoss: number; takeProfit: number }): void {
    this.pendingPosition.set(data);
    this.hasOpenPositions.set(true);
  }
  
  onPositionAdded(): void {
    // Limpiar pending para evitar re-abrir el modal
    this.pendingPosition.set(null);
  }
  
  onClosePosition(id: string): void {
    // Manejar cierre de posición
  }
  
  // Cuando se selecciona una oportunidad del scanner
  onOpportunitySelected(symbol: string): void {
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
  
  refreshAnalysis(): void {
    this.tradingService.refreshAnalysis();
  }
  
  toggleRealTime(): void {
    const newState = !this.isRealTime();
    this.isRealTime.set(newState);
    this.tradingService.isRealTimeMode.set(newState);
    
    if (newState) {
      // Activar auto-refresh de SOLO PRECIO cada 500ms
      this.realTimeInterval = setInterval(() => {
        this.tradingService.refreshPriceOnly();
      }, 500);
    } else {
      // Desactivar
      if (this.realTimeInterval) {
        clearInterval(this.realTimeInterval);
        this.realTimeInterval = null;
      }
    }
  }
  
  ngOnDestroy(): void {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
    }
  }
}
