/**
 * Position Tracker Component - Seguimiento de posiciones abiertas con alertas
 */

import { Component, inject, signal, computed, output, effect, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradingService } from '../../services/trading.service';

export interface OpenPosition {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  openedAt: Date;
  notes?: string;
}

export interface NewPositionData {
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

@Component({
  selector: 'app-position-tracker',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="trading-card h-full">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold flex items-center gap-2">
          📊 Mis Posiciones
          @if (positions().length > 0) {
            <span class="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">
              {{ positions().length }}
            </span>
          }
        </h3>
        <button 
          (click)="showAddModal.set(true)"
          class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs transition">
          + Añadir
        </button>
      </div>
      
      @if (positions().length === 0) {
        <p class="text-gray-500 text-xs text-center py-2">
          No tienes posiciones abiertas.<br>
          Haz clic en "Añadir" para registrar una operación.
        </p>
      } @else {
        <div class="space-y-1 overflow-auto max-h-24">
          @for (pos of positions(); track pos.id) {
            <div 
              class="p-2 rounded border text-xs"
              [class]="getPositionClass(pos)">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold">{{ pos.symbol }}</span>
                  <span [class]="pos.type === 'LONG' ? 'text-green-400' : 'text-red-400'">
                    {{ pos.type === 'LONG' ? '📈 LONG' : '📉 SHORT' }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-bold" [class]="getPnLColor(pos)">
                    {{ getPnLPercent(pos) | number:'1.2-2' }}%
                  </span>
                  <button 
                    (click)="closePositionClick(pos)"
                    class="p-0.5 hover:bg-gray-700 rounded"
                    title="Cerrar posición">
                    ❌
                  </button>
                </div>
              </div>
              
              <div class="flex items-center justify-between mt-1 text-gray-400">
                <span>Entrada: <span>$</span>{{ pos.entryPrice | number:'1.2-2' }}</span>
                <span>SL: <span>$</span>{{ pos.stopLoss | number:'1.2-2' }}</span>
                <span>TP: <span>$</span>{{ pos.takeProfit | number:'1.2-2' }}</span>
              </div>
              
              <!-- Barra de progreso hacia TP/SL -->
              <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all"
                  [class]="getProgressBarColor(pos)"
                  [style.width.%]="getProgressPercent(pos)">
                </div>
              </div>
              
              <!-- Alertas -->
              @if (getAlert(pos)) {
                <div class="mt-1 p-1 rounded text-xs animate-pulse"
                     [class]="getAlert(pos)!.class">
                  {{ getAlert(pos)!.message }}
                </div>
              }
            </div>
          }
        </div>
      }
      
      <!-- Modal para añadir posición -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" (click)="showAddModal.set(false)">
          <div class="bg-gray-900 border border-gray-700 rounded-lg p-4 w-80" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">📝 Nueva Posición</h3>
            
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-400 block mb-1">Símbolo</label>
                <input 
                  type="text" 
                  [(ngModel)]="newPosition.symbol"
                  [placeholder]="currentSymbol()"
                  class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
              </div>
              
              <div class="flex gap-2">
                <button 
                  (click)="newPosition.type = 'LONG'"
                  [class]="newPosition.type === 'LONG' ? 'bg-green-600 border-green-500' : 'bg-gray-800 border-gray-700'"
                  class="flex-1 py-2 border rounded text-sm font-bold">
                  📈 LONG
                </button>
                <button 
                  (click)="newPosition.type = 'SHORT'"
                  [class]="newPosition.type === 'SHORT' ? 'bg-red-600 border-red-500' : 'bg-gray-800 border-gray-700'"
                  class="flex-1 py-2 border rounded text-sm font-bold">
                  📉 SHORT
                </button>
              </div>
              
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-gray-400 block mb-1">Precio Entrada</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newPosition.entryPrice"
                    [placeholder]="currentPrice().toString()"
                    class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
                </div>
                <div>
                  <label class="text-xs text-gray-400 block mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newPosition.quantity"
                    placeholder="1"
                    class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-gray-400 block mb-1">🛑 Stop Loss</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newPosition.stopLoss"
                    class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
                </div>
                <div>
                  <label class="text-xs text-gray-400 block mb-1">💰 Take Profit</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newPosition.takeProfit"
                    class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
                </div>
              </div>
              
              <div>
                <label class="text-xs text-gray-400 block mb-1">Notas (opcional)</label>
                <input 
                  type="text" 
                  [(ngModel)]="newPosition.notes"
                  placeholder="Ej: Patrón martillo detectado"
                  class="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">
              </div>
            </div>
            
            <div class="flex gap-2 mt-4">
              <button 
                (click)="showAddModal.set(false)"
                class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                Cancelar
              </button>
              <button 
                (click)="addPosition()"
                class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-bold">
                Guardar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PositionTrackerComponent {
  private readonly tradingService = inject(TradingService);
  
  // Input para recibir nueva posición desde fuera
  readonly prefillPosition = input<NewPositionData | null>(null);
  
  readonly closePosition = output<string>();
  readonly positionAdded = output<void>();
  
  readonly positions = signal<OpenPosition[]>([]);
  readonly showAddModal = signal(false);
  
  readonly currentSymbol = computed(() => this.tradingService.currentSymbol());
  readonly currentPrice = computed(() => this.tradingService.analysis.value()?.current_price ?? 0);
  
  newPosition = {
    symbol: '',
    type: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    quantity: 1,
    notes: ''
  };
  
  constructor() {
    // Cargar posiciones del localStorage
    this.loadPositions();
    
    // Verificar alertas cuando cambia el precio
    effect(() => {
      const price = this.currentPrice();
      if (price > 0) {
        this.checkAlerts(price);
      }
    });
    
    // Efecto para manejar datos pre-poblados desde action panel
    effect(() => {
      const prefill = this.prefillPosition();
      if (prefill) {
        this.newPosition = {
          symbol: prefill.symbol,
          type: prefill.type,
          entryPrice: prefill.entryPrice,
          stopLoss: prefill.stopLoss,
          takeProfit: prefill.takeProfit,
          quantity: 1,
          notes: ''
        };
        this.showAddModal.set(true);
      }
    });
  }
  
  private loadPositions(): void {
    try {
      const saved = localStorage.getItem('tradingHell_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.positions.set(parsed.map((p: any) => ({
          ...p,
          openedAt: new Date(p.openedAt)
        })));
      }
    } catch (e) {
      console.error('Error loading positions:', e);
    }
  }
  
  private savePositions(): void {
    localStorage.setItem('tradingHell_positions', JSON.stringify(this.positions()));
  }
  
  addPosition(): void {
    const pos: OpenPosition = {
      id: crypto.randomUUID(),
      symbol: this.newPosition.symbol || this.currentSymbol(),
      type: this.newPosition.type,
      entryPrice: this.newPosition.entryPrice || this.currentPrice(),
      stopLoss: this.newPosition.stopLoss,
      takeProfit: this.newPosition.takeProfit,
      quantity: this.newPosition.quantity || 1,
      openedAt: new Date(),
      notes: this.newPosition.notes || undefined
    };
    
    this.positions.update(p => [...p, pos]);
    this.savePositions();
    this.showAddModal.set(false);
    this.positionAdded.emit();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Reset form
    this.newPosition = {
      symbol: '',
      type: 'LONG',
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      quantity: 1,
      notes: ''
    };
  }
  
  closePositionClick(pos: OpenPosition): void {
    if (confirm(`¿Cerrar posición ${pos.symbol}?`)) {
      this.positions.update(p => p.filter(x => x.id !== pos.id));
      this.savePositions();
      this.closePosition.emit(pos.id);
    }
  }
  
  getPnLPercent(pos: OpenPosition): number {
    const price = this.currentPrice();
    if (pos.symbol !== this.currentSymbol() || price === 0) return 0;
    
    if (pos.type === 'LONG') {
      return ((price - pos.entryPrice) / pos.entryPrice) * 100;
    } else {
      return ((pos.entryPrice - price) / pos.entryPrice) * 100;
    }
  }
  
  getPnLColor(pos: OpenPosition): string {
    const pnl = this.getPnLPercent(pos);
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  }
  
  getPositionClass(pos: OpenPosition): string {
    const alert = this.getAlert(pos);
    if (alert?.type === 'tp') return 'bg-green-500/20 border-green-500';
    if (alert?.type === 'sl') return 'bg-red-500/20 border-red-500';
    return 'bg-gray-800/50 border-gray-700';
  }
  
  getProgressPercent(pos: OpenPosition): number {
    const price = this.currentPrice();
    if (pos.symbol !== this.currentSymbol() || price === 0) return 50;
    
    const range = pos.takeProfit - pos.stopLoss;
    const progress = price - pos.stopLoss;
    return Math.max(0, Math.min(100, (progress / range) * 100));
  }
  
  getProgressBarColor(pos: OpenPosition): string {
    const percent = this.getProgressPercent(pos);
    if (percent > 70) return 'bg-green-500';
    if (percent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  }
  
  getAlert(pos: OpenPosition): { type: string; message: string; class: string } | null {
    const price = this.currentPrice();
    if (pos.symbol !== this.currentSymbol() || price === 0) return null;
    
    if (pos.type === 'LONG') {
      if (price >= pos.takeProfit) {
        return { type: 'tp', message: '🎉 ¡TAKE PROFIT ALCANZADO! Cierra la posición.', class: 'bg-green-500/30 text-green-400' };
      }
      if (price <= pos.stopLoss) {
        return { type: 'sl', message: '⚠️ ¡STOP LOSS TOCADO! Cierra para limitar pérdidas.', class: 'bg-red-500/30 text-red-400' };
      }
      if (price <= pos.stopLoss * 1.02) {
        return { type: 'warning', message: '⚡ Cerca del Stop Loss', class: 'bg-yellow-500/30 text-yellow-400' };
      }
      if (price >= pos.takeProfit * 0.98) {
        return { type: 'near-tp', message: '💰 Cerca del Take Profit', class: 'bg-green-500/20 text-green-400' };
      }
    } else {
      if (price <= pos.takeProfit) {
        return { type: 'tp', message: '🎉 ¡TAKE PROFIT ALCANZADO! Cierra la posición.', class: 'bg-green-500/30 text-green-400' };
      }
      if (price >= pos.stopLoss) {
        return { type: 'sl', message: '⚠️ ¡STOP LOSS TOCADO! Cierra para limitar pérdidas.', class: 'bg-red-500/30 text-red-400' };
      }
    }
    
    return null;
  }
  
  private checkAlerts(price: number): void {
    const positions = this.positions();
    for (const pos of positions) {
      if (pos.symbol !== this.currentSymbol()) continue;
      
      const alert = this.getAlert(pos);
      if (alert?.type === 'tp' || alert?.type === 'sl') {
        // Mostrar notificación del navegador
        this.showNotification(pos, alert);
      }
    }
  }
  
  private showNotification(pos: OpenPosition, alert: { type: string; message: string }): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`TradingHell - ${pos.symbol}`, {
        body: alert.message,
        icon: alert.type === 'tp' ? '💰' : '🛑'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}
