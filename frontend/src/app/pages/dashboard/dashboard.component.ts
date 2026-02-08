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
import { TIMEFRAMES, PERIODS } from '../../models/trading.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ChartComponent, AnalysisComponent, ChatComponent, ActionPanelComponent, MarketExplorerComponent, PositionTrackerComponent],
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
            (click)="refresh()"
            [disabled]="tradingService.isLoading()"
            class="p-1 rounded bg-trading-card border border-trading-border hover:border-indigo-500 transition text-xs"
            title="Actualizar datos">
            🔄
          </button>
          
          <!-- Botón tiempo real -->
          <button
            (click)="toggleRealTime()"
            class="px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
            [class]="isRealTime() 
              ? 'bg-green-500/20 border border-green-500 text-green-400 animate-pulse' 
              : 'bg-trading-card border border-trading-border text-gray-400 hover:border-indigo-500'"
            [title]="isRealTime() ? 'Desactivar tiempo real' : 'Activar actualización cada 500ms'">
            <span>{{ isRealTime() ? '🟢' : '⚪' }}</span>
            <span class="hidden sm:inline">{{ isRealTime() ? 'EN VIVO' : 'Tiempo Real' }}</span>
          </button>
        </div>
      </header>
      
      <!-- Layout principal sin scroll -->
      <div class="flex-1 grid grid-cols-12 gap-2 p-2 min-h-0">
        
        <!-- Columna izquierda: Explorador + Acción -->
        <div class="col-span-12 lg:col-span-2 flex flex-col gap-2 min-h-0 overflow-auto">
          <app-market-explorer class="flex-shrink-0" />
          <app-action-panel 
            class="flex-1 min-h-0"
            (levelHovered)="onLevelHovered($event)"
            (openPosition)="openPositionTracker($event)"
          />
        </div>
        
        <!-- Columna central: Gráfico -->
        <div class="col-span-12 lg:col-span-7 flex flex-col gap-2 min-h-0">
          <app-chart 
            class="flex-1 min-h-0"
            [highlightedLevel]="highlightedLevel()" 
            [patterns]="chartPatterns()"
          />
          
          <!-- Posiciones abiertas (si hay) -->
          @if (hasOpenPositions()) {
            <app-position-tracker 
              class="flex-shrink-0 max-h-32"
              [prefillPosition]="pendingPosition()"
              (closePosition)="onClosePosition($event)"
              (positionAdded)="onPositionAdded()"
            />
          }
        </div>
        
        <!-- Columna derecha: Análisis completo -->
        <div class="col-span-12 lg:col-span-3 flex flex-col min-h-0 overflow-auto">
          <app-analysis class="flex-1" />
        </div>
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
  readonly unreadAlerts = signal(0);
  
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
  
  toggleRealTime(): void {
    const newState = !this.isRealTime();
    this.isRealTime.set(newState);
    this.tradingService.isRealTimeMode.set(newState);
    
    if (newState) {
      // Activar auto-refresh cada 500ms
      this.realTimeInterval = setInterval(() => {
        if (!this.tradingService.isLoading()) {
          this.tradingService.refresh();
        }
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
