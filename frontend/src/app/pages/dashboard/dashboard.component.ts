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
import { TIMEFRAMES, PERIODS, TrendDetails } from '../../models/trading.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ChartComponent, AnalysisComponent, ChatComponent, ActionPanelComponent, MarketExplorerComponent, PositionTrackerComponent, OpportunitiesComponent, AlertsComponent, LearningComponent],
  template: `
    <div class="h-screen flex flex-col overflow-hidden bg-trading-bg relative">
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
      
      <!-- Header minimalista -->
      <header class="flex-shrink-0 px-3 py-2 border-b border-trading-border flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold">🔥 TradingHell</h1>
          <span class="text-gray-500 text-xs hidden md:inline">| {{ currentSymbol() }}</span>
        </div>
        
        <div class="flex items-center gap-2">
          <input
            type="text"
            [(ngModel)]="symbolInput"
            (keydown.enter)="changeSymbol()"
            placeholder="Símbolo..."
            class="w-24 px-2 py-1 rounded bg-trading-card border border-trading-border 
                   focus:border-indigo-500 focus:outline-none text-xs"
          />
          <select
            [(ngModel)]="selectedTimeframe"
            (ngModelChange)="changeTimeframe($event)"
            class="px-2 py-1 rounded bg-trading-card border border-trading-border text-xs"
            title="Intervalo de vela">
            @for (tf of timeframes; track tf.value) {
              <option [value]="tf.value">{{ tf.label }}</option>
            }
          </select>
          <select
            [(ngModel)]="selectedPeriod"
            (ngModelChange)="changePeriod($event)"
            class="px-2 py-1 rounded bg-trading-card border border-trading-border text-xs"
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
          
          <!-- Botón tiempo real (solo precio) -->
          <button
            (click)="toggleRealTime()"
            class="px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
            [class]="isRealTime() 
              ? 'bg-green-500/20 border border-green-500 text-green-400 animate-pulse' 
              : 'bg-trading-card border border-trading-border text-gray-400 hover:border-indigo-500'"
            [title]="isRealTime() ? 'Precio en vivo activo' : 'Activar precio en tiempo real'">
            <span>{{ isRealTime() ? '🟢' : '⚪' }}</span>
            <span class="hidden sm:inline">{{ isRealTime() ? 'PRECIO VIVO' : 'Precio RT' }}</span>
          </button>
        </div>
      </header>
      
      <!-- Tabs principales: Trading / Oportunidades -->
      <div class="flex-shrink-0 px-2 pt-2 flex items-center gap-2">
        <button 
          (click)="activeView.set('trading')"
          class="px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all"
          [class]="activeView() === 'trading' 
            ? 'bg-trading-card text-white border-t border-l border-r border-indigo-500' 
            : 'bg-gray-800/50 text-gray-400 hover:text-white'">
          📊 Trading
        </button>
        <button 
          (click)="activeView.set('scanner')"
          class="px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1"
          [class]="activeView() === 'scanner' 
            ? 'bg-trading-card text-white border-t border-l border-r border-green-500' 
            : 'bg-gray-800/50 text-gray-400 hover:text-white'">
          🎯 Scanner
          <span class="px-1.5 py-0.5 bg-green-500/30 rounded text-green-400 text-xs">NEW</span>
        </button>
        <button 
          (click)="activeView.set('alerts')"
          class="px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all"
          [class]="activeView() === 'alerts' 
            ? 'bg-trading-card text-white border-t border-l border-r border-yellow-500' 
            : 'bg-gray-800/50 text-gray-400 hover:text-white'">
          🔔 Alertas
        </button>
        <button 
          (click)="activeView.set('learning')"
          class="px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all"
          [class]="activeView() === 'learning' 
            ? 'bg-trading-card text-white border-t border-l border-r border-purple-500' 
            : 'bg-gray-800/50 text-gray-400 hover:text-white'">
          📚 Aprender
        </button>
      </div>
      
      <!-- Layout principal con paneles redimensionables -->
      <div class="flex-1 grid grid-cols-12 gap-2 p-2 min-h-0">
        
        @if (activeView() === 'trading') {
          <!-- VISTA TRADING: Explorador + Gráfico + Acción + Análisis -->
          
          <!-- Columna izquierda: Explorador + Acción -->
          <div class="col-span-12 lg:col-span-2 flex flex-col gap-2 min-h-0 overflow-visible resizable-col">
            <app-market-explorer class="flex-shrink-0 resizable-panel" />
            <app-action-panel 
              class="flex-1 min-h-0 resizable-panel"
              (levelHovered)="onLevelHovered($event)"
              (trendHovered)="onTrendHovered($event)"
              (openPosition)="openPositionTracker($event)"
            />
          </div>
          
          <!-- Columna central: Gráfico -->
          <div class="col-span-12 lg:col-span-7 flex flex-col gap-2 min-h-0">
            <app-chart 
              class="flex-1 min-h-0 resizable-panel"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
            
            <!-- Posiciones abiertas (si hay) -->
            @if (hasOpenPositions()) {
              <app-position-tracker 
                class="flex-shrink-0 resizable-panel" style="max-height: 150px;"
                [prefillPosition]="pendingPosition()"
                (closePosition)="onClosePosition($event)"
                (positionAdded)="onPositionAdded()"
              />
            }
          </div>
          
          <!-- Columna derecha: Análisis completo -->
          <div class="col-span-12 lg:col-span-3 flex flex-col min-h-0 overflow-visible resizable-col">
            <app-analysis class="flex-1 resizable-panel" />
          </div>
        }
        
        @if (activeView() === 'scanner') {
          <!-- VISTA SCANNER: Oportunidades + Gráfico del seleccionado -->
          
          <!-- Columna izquierda: Oportunidades -->
          <div class="col-span-12 lg:col-span-4 flex flex-col gap-2 min-h-0">
            <app-opportunities 
              class="flex-1"
              (symbolSelected)="onOpportunitySelected($event)"
            />
          </div>
          
          <!-- Columna central: Gráfico + Acción del seleccionado -->
          <div class="col-span-12 lg:col-span-5 flex flex-col gap-2 min-h-0">
            <app-chart 
              class="flex-1 min-h-0 resizable-panel"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
          </div>
          
          <!-- Columna derecha: Acción + Análisis resumido -->
          <div class="col-span-12 lg:col-span-3 flex flex-col gap-2 min-h-0">
            <app-action-panel 
              class="flex-1 min-h-0"
              (levelHovered)="onLevelHovered($event)"
              (trendHovered)="onTrendHovered($event)"
              (openPosition)="openPositionTracker($event)"
            />
          </div>
        }
        
        @if (activeView() === 'alerts') {
          <!-- VISTA ALERTAS: Gestión de alertas + Oportunidades -->
          
          <!-- Columna izquierda: Alertas -->
          <div class="col-span-12 lg:col-span-4 flex flex-col gap-2 min-h-0">
            <app-alerts class="flex-1" />
          </div>
          
          <!-- Columna central: Gráfico -->
          <div class="col-span-12 lg:col-span-5 flex flex-col gap-2 min-h-0">
            <app-chart 
              class="flex-1 min-h-0 resizable-panel"
              [highlightedLevel]="highlightedLevel()" 
              [patterns]="chartPatterns()"
              [showTrendLines]="trendLinesVisible()"
            />
          </div>
          
          <!-- Columna derecha: Oportunidades resumidas -->
          <div class="col-span-12 lg:col-span-3 flex flex-col gap-2 min-h-0">
            <app-opportunities 
              class="flex-1"
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
      height: 100vh;
      overflow: hidden;
    }
    
    /* Paneles redimensionables */
    .resizable-panel {
      resize: both;
      overflow: auto;
      min-width: 150px;
      min-height: 80px;
      position: relative;
    }
    
    /* El gráfico necesita más altura mínima */
    app-chart.resizable-panel {
      min-height: 200px;
    }
    
    .resizable-panel::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.3) 50%);
      border-radius: 0 0 4px 0;
      opacity: 0.5;
      transition: opacity 0.2s;
    }
    
    .resizable-panel:hover::after {
      opacity: 1;
      background: linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.6) 50%);
    }
    
    .resizable-col {
      resize: horizontal;
      overflow: visible;
      min-width: 150px;
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
