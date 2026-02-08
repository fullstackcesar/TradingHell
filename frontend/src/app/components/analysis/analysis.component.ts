/**
 * Analysis Component - Muestra el análisis técnico
 */

import { Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';
import { SIGNAL_CLASSES } from '../../models/trading.models';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="trading-card h-full overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">📊 Análisis Técnico</h2>
      
      @if (tradingService.analysis.isLoading()) {
        <div class="flex items-center justify-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      } @else if (analysis()) {
        <!-- Señal Principal -->
        <div class="mb-6 p-4 rounded-lg bg-gradient-to-r from-trading-card to-trading-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Señal</p>
              <p class="text-2xl font-bold" [class]="signalColor()">
                {{ analysis()!.overall_signal }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-400 text-sm">Confianza</p>
              <p class="text-2xl font-bold">{{ analysis()!.signal_strength | number:'1.0-0' }}%</p>
            </div>
          </div>
          
          <!-- Barra de confianza -->
          <div class="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500"
              [class]="signalBarColor()"
              [style.width.%]="analysis()!.signal_strength">
            </div>
          </div>
        </div>
        
        <!-- Tendencia -->
        <div class="mb-4 p-3 rounded-lg bg-trading-border/30">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Tendencia</span>
            <span class="font-semibold" [class]="trendColor()">
              {{ trendEmoji() }} {{ analysis()!.trend }}
            </span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            Fuerza: {{ analysis()!.trend_strength | number:'1.0-0' }}%
          </div>
        </div>
        
        <!-- Precio actual -->
        <div class="mb-4 p-3 rounded-lg bg-trading-border/30">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Precio actual</span>
            <span class="font-semibold text-lg">
              {{ analysis()!.current_price | number:'1.2-4' }}
            </span>
          </div>
        </div>
        
        <!-- Soportes y Resistencias -->
        @if (analysis()!.support_levels.length || analysis()!.resistance_levels.length) {
          <div class="mb-4 grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p class="text-green-400 text-sm mb-2">🛡️ Soportes</p>
              @for (level of analysis()!.support_levels; track level) {
                <p class="text-sm">{{ level | number:'1.2-4' }}</p>
              } @empty {
                <p class="text-gray-500 text-sm">-</p>
              }
            </div>
            <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p class="text-red-400 text-sm mb-2">🎯 Resistencias</p>
              @for (level of analysis()!.resistance_levels; track level) {
                <p class="text-sm">{{ level | number:'1.2-4' }}</p>
              } @empty {
                <p class="text-gray-500 text-sm">-</p>
              }
            </div>
          </div>
        }
        
        <!-- Indicadores -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-400 mb-2">📈 Indicadores</h3>
          <div class="space-y-2">
            @for (indicator of analysis()!.indicators; track indicator.name) {
              <div class="p-2 rounded bg-trading-border/20 flex items-center justify-between">
                <span class="text-sm">{{ indicator.name }}</span>
                <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(indicator.signal)">
                  {{ indicator.signal }}
                </span>
              </div>
            }
          </div>
        </div>
        
        <!-- Patrones detectados -->
        @if (analysis()!.patterns.length) {
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-400 mb-2">🕯️ Patrones de Velas</h3>
            <div class="space-y-2">
              @for (pattern of analysis()!.patterns; track pattern.name) {
                <div class="p-2 rounded bg-trading-border/20">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">{{ pattern.name }}</span>
                    <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(pattern.signal)">
                      {{ pattern.confidence | number:'1.0-0' }}%
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ pattern.description }}</p>
                </div>
              }
            </div>
          </div>
        }
        
        <!-- Recomendaciones -->
        <div>
          <h3 class="text-sm font-semibold text-gray-400 mb-2">💡 Recomendaciones</h3>
          <div class="space-y-2">
            @for (rec of analysis()!.recommendations; track rec) {
              <p class="text-sm text-gray-300">{{ rec }}</p>
            }
          </div>
        </div>
      } @else {
        <div class="text-center text-gray-500 py-8">
          Selecciona un símbolo para ver el análisis
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnalysisComponent {
  readonly tradingService = inject(TradingService);
  
  readonly analysis = computed(() => this.tradingService.analysis.value());
  
  readonly signalColor = computed(() => {
    const signal = this.analysis()?.overall_signal;
    if (!signal) return 'text-gray-400';
    if (signal.includes('COMPRA')) return 'text-green-400';
    if (signal.includes('VENTA')) return 'text-red-400';
    return 'text-yellow-400';
  });
  
  readonly signalBarColor = computed(() => {
    const signal = this.analysis()?.overall_signal;
    if (!signal) return 'bg-gray-500';
    if (signal.includes('COMPRA')) return 'bg-green-500';
    if (signal.includes('VENTA')) return 'bg-red-500';
    return 'bg-yellow-500';
  });
  
  readonly trendColor = computed(() => {
    const trend = this.analysis()?.trend;
    if (trend === 'ALCISTA') return 'text-green-400';
    if (trend === 'BAJISTA') return 'text-red-400';
    return 'text-yellow-400';
  });
  
  readonly trendEmoji = computed(() => {
    const trend = this.analysis()?.trend;
    if (trend === 'ALCISTA') return '📈';
    if (trend === 'BAJISTA') return '📉';
    return '➡️';
  });
  
  getSignalClass(signal: string): string {
    return SIGNAL_CLASSES[signal] || 'bg-gray-500/20 text-gray-400';
  }
}
