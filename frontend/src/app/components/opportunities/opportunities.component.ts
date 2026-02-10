/**
 * Opportunities Component - Panel de Oportunidades de Trading
 * Muestra las mejores oportunidades escaneadas del mercado
 */

import { Component, inject, signal, computed, OnInit, OnDestroy, output } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';

interface Opportunity {
  rank: number;
  symbol: string;
  signal: string;
  score: number;
  price: number;
  change_24h: number;
  entry: number;
  tp: number;
  sl: number;
  rr: number;
  trend: string;
  reasons: string[];
}

interface ScanResult {
  top_opportunities: Opportunity[];
  scan_time: number;
  total_buy: number;
  total_sell: number;
}

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="trading-card h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          🎯 Oportunidades
          @if (isScanning()) {
            <span class="animate-spin">⏳</span>
          }
        </h3>
        <div class="flex items-center gap-2">
          <select 
            class="text-xs px-2 py-1 bg-trading-card border border-trading-border rounded"
            [value]="selectedInterval()"
            (change)="changeInterval($event)">
            <option value="15m">15min</option>
            <option value="1h">1 hora</option>
            <option value="4h">4 horas</option>
            <option value="1d">Diario</option>
          </select>
          <button 
            (click)="scan()"
            [disabled]="isScanning()"
            class="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded font-medium transition disabled:opacity-50">
            🔍 Escanear
          </button>
        </div>
      </div>

      <!-- Resumen -->
      @if (scanResult()) {
        <div class="flex items-center justify-between mb-2 text-xs">
          <div class="flex gap-3">
            <span class="text-green-400">🟢 {{ scanResult()!.total_buy }} compras</span>
            <span class="text-red-400">🔴 {{ scanResult()!.total_sell }} ventas</span>
          </div>
          <span class="text-gray-500">{{ scanResult()!.scan_time }}s</span>
        </div>
      }

      <!-- Lista de oportunidades -->
      <div class="flex-1 overflow-auto space-y-2">
        @for (opp of opportunities(); track opp.symbol) {
          <div 
            class="p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]"
            [class]="getOpportunityClass(opp)"
            (click)="selectOpportunity(opp)">
            
            <!-- Fila superior: símbolo + señal -->
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold" [class]="getScoreColor(opp.score)">
                  #{{ opp.rank }}
                </span>
                <span class="font-bold text-white">{{ opp.symbol }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="px-2 py-0.5 rounded text-xs font-bold"
                  [class]="getSignalClass(opp.signal)">
                  {{ getSignalEmoji(opp.signal) }} {{ opp.signal }}
                </span>
                <span 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  [class]="getScoreBgClass(opp.score)">
                  {{ opp.score | number:'1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Fila de precio -->
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-gray-400">
                {{ opp.price | number:'1.2-2' }} USD
                <span [class]="opp.change_24h >= 0 ? 'text-green-400' : 'text-red-400'">
                  ({{ opp.change_24h >= 0 ? '+' : '' }}{{ opp.change_24h | number:'1.2-2' }}%)
                </span>
              </span>
              <span class="text-gray-500">
                {{ opp.trend }} | R/R {{ opp.rr | number:'1.1-1' }}
              </span>
            </div>

            <!-- Niveles: Entry / TP / SL -->
            <div class="grid grid-cols-3 gap-1 text-xs">
              <div class="text-center p-1 rounded bg-blue-500/20">
                <div class="text-blue-400 font-medium">Entrada</div>
                <div class="text-white font-bold">{{ opp.entry | number:'1.2-2' }}</div>
              </div>
              <div class="text-center p-1 rounded bg-green-500/20">
                <div class="text-green-400 font-medium">TP</div>
                <div class="text-white font-bold">{{ opp.tp | number:'1.2-2' }}</div>
              </div>
              <div class="text-center p-1 rounded bg-red-500/20">
                <div class="text-red-400 font-medium">SL</div>
                <div class="text-white font-bold">{{ opp.sl | number:'1.2-2' }}</div>
              </div>
            </div>

            <!-- Razones (toggle) -->
            @if (expandedSymbol() === opp.symbol) {
              <div class="mt-2 pt-2 border-t border-gray-700">
                <p class="text-xs text-gray-400 mb-1">📋 Razones:</p>
                <ul class="text-xs space-y-1">
                  @for (reason of opp.reasons; track reason) {
                    <li class="text-gray-300">• {{ reason }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        } @empty {
          <div class="flex-1 flex items-center justify-center text-gray-500 text-sm">
            @if (isScanning()) {
              <div class="text-center">
                <div class="animate-pulse text-4xl mb-2">🔍</div>
                <p>Escaneando mercado...</p>
              </div>
            } @else {
              <div class="text-center">
                <div class="text-4xl mb-2">📊</div>
                <p>Pulsa "Escanear" para buscar oportunidades</p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Auto-refresh toggle -->
      <div class="mt-2 pt-2 border-t border-trading-border flex items-center justify-between">
        <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input 
            type="checkbox" 
            [checked]="autoRefresh()"
            (change)="toggleAutoRefresh()"
            class="rounded">
          Auto-escanear cada 5min
        </label>
        @if (lastScan()) {
          <span class="text-xs text-gray-500">
            Último: {{ lastScan() | date:'HH:mm:ss' }}
          </span>
        }
      </div>
    </div>
  `
})
export class OpportunitiesComponent implements OnInit, OnDestroy {
  // Outputs
  symbolSelected = output<string>();

  // State
  readonly opportunities = signal<Opportunity[]>([]);
  readonly scanResult = signal<ScanResult | null>(null);
  readonly isScanning = signal(false);
  readonly selectedInterval = signal('1h');
  readonly expandedSymbol = signal<string | null>(null);
  readonly autoRefresh = signal(false);
  readonly lastScan = signal<Date | null>(null);

  private refreshInterval: any = null;
  private readonly API_BASE = 'http://localhost:8001/api';

  ngOnInit() {
    // Escanear al iniciar
    this.scan();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async scan() {
    if (this.isScanning()) return;
    
    this.isScanning.set(true);
    
    try {
      const response = await fetch(
        `${this.API_BASE}/top-opportunities?limit=10&interval=${this.selectedInterval()}`
      );
      
      if (response.ok) {
        const data: ScanResult = await response.json();
        this.opportunities.set(data.top_opportunities);
        this.scanResult.set(data);
        this.lastScan.set(new Date());
      }
    } catch (error) {
      console.error('Error escaneando:', error);
    } finally {
      this.isScanning.set(false);
    }
  }

  changeInterval(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedInterval.set(select.value);
    this.scan();
  }

  selectOpportunity(opp: Opportunity) {
    // Toggle expanded
    if (this.expandedSymbol() === opp.symbol) {
      this.expandedSymbol.set(null);
    } else {
      this.expandedSymbol.set(opp.symbol);
    }
    
    // Emitir para cambiar el símbolo en el dashboard
    this.symbolSelected.emit(opp.symbol);
  }

  toggleAutoRefresh() {
    this.autoRefresh.set(!this.autoRefresh());
    
    if (this.autoRefresh()) {
      // Escanear cada 5 minutos
      this.refreshInterval = setInterval(() => this.scan(), 5 * 60 * 1000);
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
  }

  getOpportunityClass(opp: Opportunity): string {
    if (opp.signal.includes('COMPRA')) {
      return 'bg-green-500/10 border-green-500/30 hover:border-green-500';
    } else if (opp.signal.includes('VENTA')) {
      return 'bg-red-500/10 border-red-500/30 hover:border-red-500';
    }
    return 'bg-gray-500/10 border-gray-500/30 hover:border-gray-500';
  }

  getSignalClass(signal: string): string {
    if (signal === 'COMPRA FUERTE') return 'bg-green-600 text-white';
    if (signal === 'COMPRA') return 'bg-green-500/30 text-green-400';
    if (signal === 'VENTA FUERTE') return 'bg-red-600 text-white';
    if (signal === 'VENTA') return 'bg-red-500/30 text-red-400';
    return 'bg-gray-500/30 text-gray-400';
  }

  getSignalEmoji(signal: string): string {
    if (signal === 'COMPRA FUERTE') return '🚀';
    if (signal === 'COMPRA') return '📈';
    if (signal === 'VENTA FUERTE') return '💥';
    if (signal === 'VENTA') return '📉';
    return '➡️';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  getScoreBgClass(score: number): string {
    if (score >= 80) return 'bg-green-500/30 text-green-400 border-2 border-green-500';
    if (score >= 60) return 'bg-yellow-500/30 text-yellow-400 border-2 border-yellow-500';
    if (score >= 40) return 'bg-orange-500/30 text-orange-400 border-2 border-orange-500';
    return 'bg-red-500/30 text-red-400 border-2 border-red-500';
  }
}
