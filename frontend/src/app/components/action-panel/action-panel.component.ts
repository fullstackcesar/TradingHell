/**
 * Action Panel Component - El panel que te dice QUÉ HACER
 * Semáforo + Estrategia automática con precios exactos
 */

import { Component, inject, computed, signal, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';

@Component({
  selector: 'app-action-panel',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="trading-card h-full flex flex-col">
      <!-- Semáforo Principal -->
      <div class="text-center mb-3">
        <div 
          class="inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl mb-2 transition-all duration-500"
          [class]="semaphoreClass()">
          {{ semaphoreEmoji() }}
        </div>
        <h2 class="text-2xl font-black" [class]="actionTextColor()">
          {{ actionText() }}
        </h2>
        
        <!-- Barra de confianza visual -->
        <div class="mt-2 px-4">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-gray-500">Confianza</span>
            <span [class]="confidenceColor()" class="font-bold">
              {{ confidence() }}%
              <span class="tooltip-trigger" (mouseenter)="showTooltip('confidence')" (mouseleave)="hideTooltip()">❓</span>
            </span>
          </div>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500 rounded-full"
              [class]="confidenceBarColor()"
              [style.width.%]="confidence()">
            </div>
          </div>
          <p class="text-xs mt-1" [class]="confidenceColor()">
            {{ confidenceLabel() }}
          </p>
        </div>
      </div>

      <!-- Estrategia de Trading -->
      @if (hasStrategy()) {
        <div class="flex-1 space-y-2 overflow-auto">
          <!-- Precio Actual -->
          <div class="p-2 rounded-lg bg-gray-800/50 border border-gray-700">
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-xs">
                💵 Precio Actual
                <span class="tooltip-trigger" (mouseenter)="showTooltip('current')" (mouseleave)="hideTooltip()">❓</span>
              </span>
              <span class="text-lg font-bold text-white">
                <span>$</span>{{ currentPrice() | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Precio de Entrada -->
          @if (action() !== 'ESPERA') {
            <div 
              class="p-2 rounded-lg border-2 cursor-pointer transition-all"
              [class]="isEntryHovered() ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-500/10 border-blue-500/50'"
              (mouseenter)="hoverLevel('entry')"
              (mouseleave)="unhoverLevel()">
              <div class="flex justify-between items-center">
                <span class="text-blue-400 text-xs font-medium">
                  🎯 {{ action() === 'COMPRA' ? 'Compra a' : 'Vende a' }}
                  <span class="tooltip-trigger" (mouseenter)="showTooltip('entry')" (mouseleave)="hideTooltip()">❓</span>
                </span>
                <span class="text-lg font-bold text-blue-400">
                  <span>$</span>{{ entryPrice() | number:'1.2-2' }}
                </span>
              </div>
              <p class="text-xs text-gray-500">
                {{ entryExplanation() }}
              </p>
            </div>
          }

          <!-- Take Profit y Stop Loss en fila -->
          @if (action() !== 'ESPERA') {
            <div class="grid grid-cols-2 gap-2">
              <!-- Take Profit -->
              <div 
                class="p-2 rounded-lg border-2 cursor-pointer transition-all"
                [class]="isTakeProfitHovered() ? 'bg-green-500/20 border-green-500' : 'bg-green-500/10 border-green-500/50'"
                (mouseenter)="hoverLevel('takeProfit')"
                (mouseleave)="unhoverLevel()">
                <div class="flex flex-col">
                  <span class="text-green-400 text-xs font-medium">
                    💰 TP
                    <span class="tooltip-trigger" (mouseenter)="showTooltip('takeprofit')" (mouseleave)="hideTooltip()">❓</span>
                  </span>
                  <span class="text-lg font-bold text-green-400">
                    <span>$</span>{{ takeProfitPrice() | number:'1.2-2' }}
                  </span>
                  <span class="text-xs font-bold text-green-400">
                    +{{ potentialProfit() | number:'1.1-1' }}%
                  </span>
                </div>
              </div>

              <!-- Stop Loss -->
              <div 
                class="p-2 rounded-lg border-2 cursor-pointer transition-all"
                [class]="isStopLossHovered() ? 'bg-red-500/20 border-red-500' : 'bg-red-500/10 border-red-500/50'"
                (mouseenter)="hoverLevel('stopLoss')"
                (mouseleave)="unhoverLevel()">
                <div class="flex flex-col">
                  <span class="text-red-400 text-xs font-medium">
                    🛑 SL
                    <span class="tooltip-trigger" (mouseenter)="showTooltip('stoploss')" (mouseleave)="hideTooltip()">❓</span>
                  </span>
                  <span class="text-lg font-bold text-red-400">
                    <span>$</span>{{ stopLossPrice() | number:'1.2-2' }}
                  </span>
                  <span class="text-xs font-bold text-red-400">
                    -{{ potentialLoss() | number:'1.1-1' }}%
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Risk/Reward -->
          @if (action() !== 'ESPERA') {
            <div class="p-2 rounded-lg bg-purple-500/10 border border-purple-500/50">
              <div class="flex justify-between items-center">
                <span class="text-purple-400 text-xs font-medium">
                  ⚖️ R/R
                  <span class="tooltip-trigger" (mouseenter)="showTooltip('riskReward')" (mouseleave)="hideTooltip()">❓</span>
                </span>
                <span class="text-lg font-bold" [class]="riskRewardColor()">
                  1:{{ riskRewardRatio() | number:'1.1-1' }}
                </span>
              </div>
              <p class="text-xs" [class]="riskRewardColor()">
                {{ riskRewardExplanation() }}
              </p>
            </div>
          }

          <!-- Razones -->
          <div class="p-2 rounded-lg bg-gray-800/30 border border-gray-700">
            <p class="text-xs font-medium text-gray-300 mb-1">📋 ¿Por qué {{ action() }}?</p>
            <ul class="text-xs text-gray-400 space-y-1">
              @for (reason of reasons(); track reason) {
                <li class="flex items-start gap-1">
                  <span class="text-green-400 flex-shrink-0">✓</span>
                  <span>{{ reason }}</span>
                </li>
              } @empty {
                <li class="text-gray-500">Analizando indicadores...</li>
              }
            </ul>
          </div>
        </div>
      } @else {
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin text-4xl mb-2">⏳</div>
            <p class="text-gray-500 text-sm">Analizando mercado...</p>
          </div>
        </div>
      }

      <!-- Botón para registrar operación -->
      @if (action() !== 'ESPERA') {
        <button 
          class="mt-2 w-full py-2 px-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
          [class]="action() === 'COMPRA' 
            ? 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/40' 
            : 'bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/40'"
          (click)="onConfirmPosition()">
          <span class="text-lg">{{ action() === 'COMPRA' ? '✅' : '❌' }}</span>
          {{ action() === 'COMPRA' ? 'He comprado' : 'He vendido' }}
        </button>
      }

      <!-- Tooltip flotante -->
      @if (activeTooltip()) {
        <div class="fixed z-50 p-3 bg-gray-900 border border-indigo-500 rounded-lg shadow-xl max-w-xs text-sm"
             [style.top.px]="tooltipY()"
             [style.left.px]="tooltipX()">
          <p class="text-indigo-400 font-bold mb-1">{{ tooltipTitle() }}</p>
          <p class="text-gray-300 text-xs leading-relaxed">{{ tooltipText() }}</p>
        </div>
      }

      <!-- Disclaimer compacto -->
      <div class="mt-2 p-1.5 rounded bg-yellow-500/10 border border-yellow-500/30">
        <p class="text-yellow-400 text-xs text-center">
          ⚠️ No es consejo financiero
        </p>
      </div>
    </div>
  `,
  styles: [`
    .tooltip-trigger {
      cursor: help;
      opacity: 0.6;
      font-size: 0.7em;
      margin-left: 4px;
    }
    .tooltip-trigger:hover {
      opacity: 1;
    }
  `]
})
export class ActionPanelComponent {
  readonly tradingService = inject(TradingService);
  
  // Outputs para comunicar con el gráfico
  readonly levelHovered = output<{ type: string; price: number } | null>();
  
  // Output para abrir posición
  readonly openPosition = output<{
    symbol: string;
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
  }>();
  
  // Estado del tooltip
  readonly activeTooltip = signal<string | null>(null);
  readonly tooltipX = signal(0);
  readonly tooltipY = signal(0);
  
  // Estado del hover en niveles
  private hoveredLevel = signal<string | null>(null);
  
  readonly isEntryHovered = computed(() => this.hoveredLevel() === 'entry');
  readonly isTakeProfitHovered = computed(() => this.hoveredLevel() === 'takeProfit');
  readonly isStopLossHovered = computed(() => this.hoveredLevel() === 'stopLoss');
  
  // Datos del análisis
  readonly analysis = computed(() => this.tradingService.analysis.value());
  readonly hasStrategy = computed(() => !!this.analysis());
  
  readonly currentPrice = computed(() => this.analysis()?.current_price ?? 0);
  
  readonly action = computed(() => {
    const signal = this.analysis()?.overall_signal;
    if (!signal) return 'ESPERA';
    if (signal.includes('COMPRA')) return 'COMPRA';
    if (signal.includes('VENTA')) return 'VENTA';
    return 'ESPERA';
  });
  
  readonly confidence = computed(() => {
    const strength = this.analysis()?.signal_strength;
    if (typeof strength === 'number') return Math.round(strength);
    return 50;
  });
  
  // Colores y etiquetas para la barra de confianza
  readonly confidenceColor = computed(() => {
    const conf = this.confidence();
    if (conf >= 75) return 'text-green-400';
    if (conf >= 60) return 'text-yellow-400';
    return 'text-red-400';
  });
  
  readonly confidenceBarColor = computed(() => {
    const conf = this.confidence();
    if (conf >= 75) return 'bg-green-500';
    if (conf >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  });
  
  readonly confidenceLabel = computed(() => {
    const conf = this.confidence();
    if (conf >= 80) return '🎯 Señal MUY FUERTE';
    if (conf >= 70) return '✅ Señal FUERTE';
    if (conf >= 60) return '🟡 Señal MODERADA';
    if (conf >= 50) return '⚠️ Señal DÉBIL';
    return '❌ Señal MUY DÉBIL';
  });
  
  // Cálculo automático de precios de entrada, SL y TP
  readonly entryPrice = computed(() => {
    const price = this.currentPrice();
    const action = this.action();
    // Entrada ligeramente mejor que precio actual
    if (action === 'COMPRA') {
      return price * 0.998; // Intenta comprar 0.2% más barato
    } else if (action === 'VENTA') {
      return price * 1.002; // Intenta vender 0.2% más caro
    }
    return price;
  });
  
  readonly stopLossPrice = computed(() => {
    const entry = this.entryPrice();
    const action = this.action();
    const supports = this.analysis()?.support_levels ?? [];
    const resistances = this.analysis()?.resistance_levels ?? [];
    
    if (action === 'COMPRA') {
      // Stop loss por debajo del soporte más cercano
      const nearestSupport = supports.find(s => s < entry) ?? entry * 0.97;
      return Math.min(nearestSupport * 0.99, entry * 0.97); // Máximo 3% pérdida
    } else if (action === 'VENTA') {
      // Stop loss por encima de la resistencia más cercana
      const nearestResistance = resistances.find(r => r > entry) ?? entry * 1.03;
      return Math.max(nearestResistance * 1.01, entry * 1.03); // Máximo 3% pérdida
    }
    return entry;
  });
  
  readonly takeProfitPrice = computed(() => {
    const entry = this.entryPrice();
    const action = this.action();
    const supports = this.analysis()?.support_levels ?? [];
    const resistances = this.analysis()?.resistance_levels ?? [];
    
    if (action === 'COMPRA') {
      // Take profit en la resistencia más cercana o +5%
      const nearestResistance = resistances.find(r => r > entry) ?? entry * 1.05;
      return Math.max(nearestResistance, entry * 1.03);
    } else if (action === 'VENTA') {
      // Take profit en el soporte más cercano o -5%
      const nearestSupport = supports.find(s => s < entry) ?? entry * 0.95;
      return Math.min(nearestSupport, entry * 0.97);
    }
    return entry;
  });
  
  readonly potentialProfit = computed(() => {
    const entry = this.entryPrice();
    const tp = this.takeProfitPrice();
    const action = this.action();
    
    if (action === 'COMPRA') {
      return ((tp - entry) / entry) * 100;
    } else if (action === 'VENTA') {
      return ((entry - tp) / entry) * 100;
    }
    return 0;
  });
  
  readonly potentialLoss = computed(() => {
    const entry = this.entryPrice();
    const sl = this.stopLossPrice();
    const action = this.action();
    
    if (action === 'COMPRA') {
      return ((entry - sl) / entry) * 100;
    } else if (action === 'VENTA') {
      return ((sl - entry) / entry) * 100;
    }
    return 0;
  });
  
  readonly riskRewardRatio = computed(() => {
    const profit = this.potentialProfit();
    const loss = this.potentialLoss();
    if (loss === 0) return 0;
    return profit / loss;
  });
  
  readonly riskRewardColor = computed(() => {
    const ratio = this.riskRewardRatio();
    if (ratio >= 2) return 'text-green-400';
    if (ratio >= 1) return 'text-yellow-400';
    return 'text-red-400';
  });
  
  readonly riskRewardExplanation = computed(() => {
    const ratio = this.riskRewardRatio();
    if (ratio >= 3) return '¡Excelente! Ganas 3x lo que arriesgas';
    if (ratio >= 2) return 'Bueno. Ganas el doble de lo que arriesgas';
    if (ratio >= 1.5) return 'Aceptable. Margen positivo';
    if (ratio >= 1) return 'Justo. Equilibrado';
    return 'Cuidado. Arriesgas más de lo que puedes ganar';
  });
  
  readonly entryExplanation = computed(() => {
    const action = this.action();
    if (action === 'COMPRA') {
      return 'Precio límite sugerido para comprar';
    } else if (action === 'VENTA') {
      return 'Precio límite sugerido para vender';
    }
    return '';
  });
  
  readonly reasons = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];
    
    const reasons: string[] = [];
    const trend = analysis.trend;
    const trendStrength = analysis.trend_strength ?? 0;
    const indicators = analysis.indicators || [];
    const patterns = analysis.patterns || [];
    const action = this.action();
    
    // Tendencia con fuerza
    if (trend === 'ALCISTA' && action === 'COMPRA') {
      if (trendStrength > 70) {
        reasons.push(`📈 Tendencia ALCISTA FUERTE (${trendStrength}%) - El precio viene subiendo consistentemente`);
      } else {
        reasons.push(`📈 Tendencia alcista (${trendStrength}%) - El precio sube pero con menos fuerza`);
      }
    } else if (trend === 'BAJISTA' && action === 'VENTA') {
      if (trendStrength > 70) {
        reasons.push(`📉 Tendencia BAJISTA FUERTE (${trendStrength}%) - El precio viene cayendo consistentemente`);
      } else {
        reasons.push(`📉 Tendencia bajista (${trendStrength}%) - El precio baja pero con menos fuerza`);
      }
    } else if (trend === 'LATERAL') {
      reasons.push('➡️ Tendencia lateral - El precio se mueve sin dirección clara');
    }
    
    // RSI con explicación clara
    const rsiIndicator = indicators.find(ind => ind.name?.toLowerCase().includes('rsi'));
    if (rsiIndicator?.value) {
      const rsi = rsiIndicator.value;
      if (rsi < 30) {
        reasons.push(`🔥 RSI muy bajo (${rsi.toFixed(0)}) = SOBREVENTA - Muchos vendieron, puede rebotar al alza`);
      } else if (rsi < 40) {
        reasons.push(`📊 RSI bajo (${rsi.toFixed(0)}) - Cerca de zona de compra`);
      } else if (rsi > 70) {
        reasons.push(`⚠️ RSI muy alto (${rsi.toFixed(0)}) = SOBRECOMPRA - Muchos compraron, puede caer`);
      } else if (rsi > 60) {
        reasons.push(`📊 RSI alto (${rsi.toFixed(0)}) - Cerca de zona de venta`);
      } else {
        reasons.push(`📊 RSI neutral (${rsi.toFixed(0)}) - En zona equilibrada`);
      }
    }
    
    // MACD con explicación
    const macdIndicator = indicators.find(ind => ind.name?.toLowerCase().includes('macd'));
    if (macdIndicator) {
      const signal = macdIndicator.signal;
      if (signal?.includes('COMPRA')) {
        reasons.push('📊 MACD cruzó al alza - Señal de que el momentum es positivo');
      } else if (signal?.includes('VENTA')) {
        reasons.push('📊 MACD cruzó a la baja - Señal de que el momentum es negativo');
      }
    }
    
    // Patrones de velas
    if (patterns.length > 0) {
      const relevantPatterns = action === 'COMPRA' 
        ? patterns.filter(p => p.signal?.includes('COMPRA'))
        : patterns.filter(p => p.signal?.includes('VENTA'));
      
      if (relevantPatterns.length > 0) {
        const patternNames = relevantPatterns.slice(0, 2).map(p => p.name).join(', ');
        reasons.push(`🕯️ Patrón de velas: ${patternNames}`);
      }
    }
    
    // Soportes y resistencias
    const supports = analysis.support_levels || [];
    const resistances = analysis.resistance_levels || [];
    const price = analysis.current_price;
    
    if (action === 'COMPRA' && supports.length > 0) {
      const nearSupport = supports.find(s => s < price && price - s < price * 0.02);
      if (nearSupport) {
        reasons.push(`🛡️ Cerca de soporte ($${nearSupport.toFixed(2)}) - Zona donde el precio suele rebotar`);
      }
    } else if (action === 'VENTA' && resistances.length > 0) {
      const nearResistance = resistances.find(r => r > price && r - price < price * 0.02);
      if (nearResistance) {
        reasons.push(`🧱 Cerca de resistencia ($${nearResistance.toFixed(2)}) - Zona donde el precio suele frenarse`);
      }
    }
    
    return reasons.slice(0, 5);
  });
  
  // Semáforo visual
  readonly semaphoreClass = computed(() => {
    const action = this.action();
    if (action === 'COMPRA') return 'bg-green-500/20 border-4 border-green-500 shadow-lg shadow-green-500/30';
    if (action === 'VENTA') return 'bg-red-500/20 border-4 border-red-500 shadow-lg shadow-red-500/30';
    return 'bg-yellow-500/20 border-4 border-yellow-500 shadow-lg shadow-yellow-500/30';
  });
  
  readonly semaphoreEmoji = computed(() => {
    const action = this.action();
    if (action === 'COMPRA') return '🟢';
    if (action === 'VENTA') return '🔴';
    return '🟡';
  });
  
  readonly actionText = computed(() => {
    const action = this.action();
    const confidence = this.confidence();
    if (action === 'COMPRA') return confidence > 70 ? '¡COMPRA!' : 'COMPRA';
    if (action === 'VENTA') return confidence > 70 ? '¡VENDE!' : 'VENDE';
    return 'ESPERA';
  });
  
  readonly actionTextColor = computed(() => {
    const action = this.action();
    if (action === 'COMPRA') return 'text-green-400';
    if (action === 'VENTA') return 'text-red-400';
    return 'text-yellow-400';
  });
  
  // Tooltips - Explicaciones CLARAS para principiantes
  readonly tooltipTitle = computed(() => {
    const tip = this.activeTooltip();
    const titles: Record<string, string> = {
      'confidence': '📊 Nivel de Confianza',
      'current': '💵 Precio Actual',
      'entry': '🎯 Precio de Entrada',
      'takeprofit': '💰 Take Profit (TP)',
      'stoploss': '🛑 Stop Loss (SL)',
      'riskReward': '⚖️ Ratio Riesgo/Beneficio'
    };
    return titles[tip ?? ''] ?? '';
  });
  
  readonly tooltipText = computed(() => {
    const tip = this.activeTooltip();
    const confidence = this.confidence();
    const action = this.action();
    
    const texts: Record<string, string> = {
      'confidence': confidence >= 75 
        ? `🟢 SEÑAL MUY FUERTE (${confidence}%). Múltiples indicadores técnicos coinciden. La probabilidad de acierto es alta, pero NUNCA 100%.`
        : confidence >= 60
        ? `🟡 SEÑAL MODERADA (${confidence}%). Algunos indicadores apoyan esta acción. Considera reducir el tamaño de la posición.`
        : `🔴 SEÑAL DÉBIL (${confidence}%). Pocos indicadores coinciden. MUCHO CUIDADO o mejor espera una mejor oportunidad.`,
      
      'current': 'Es el precio al que se compra/vende AHORA MISMO en el mercado. Cambia cada segundo. Si pones una orden "a mercado", se ejecuta a este precio.',
      
      'entry': action === 'COMPRA' 
        ? 'SUGERENCIA: Pon una orden LIMITADA a este precio. Es un poco más bajo que el actual, así compras más barato. Si el precio nunca baja hasta aquí, la orden no se ejecuta (no pasa nada).'
        : 'SUGERENCIA: Pon una orden LIMITADA a este precio. Es un poco más alto que el actual, así vendes más caro. Si el precio nunca sube hasta aquí, la orden no se ejecuta.',
      
      'takeprofit': '¡Tu objetivo de ganancias! Cuando el precio llegue aquí, CIERRA la posición y recoge beneficios. Consejo: No seas codicioso. Es mejor ganar poco que perder esperando más.',
      
      'stoploss': '⚠️ OBLIGATORIO. Si el precio llega aquí, CIERRA inmediatamente para limitar pérdidas. REGLA DE ORO: Nunca operes sin stop loss. Este número es tu pérdida MÁXIMA.',
      
      'riskReward': 'Compara cuánto puedes GANAR vs cuánto puedes PERDER. Ejemplo: 1:2 significa que por cada $1 que arriesgas, puedes ganar $2. Busca SIEMPRE ratios de 1:2 o mejor.'
    };
    return texts[tip ?? ''] ?? '';
  });
  
  showTooltip(type: string): void {
    this.activeTooltip.set(type);
    // Posicionar cerca del cursor
    document.addEventListener('mousemove', this.updateTooltipPosition, { once: true });
  }
  
  hideTooltip(): void {
    this.activeTooltip.set(null);
  }
  
  private updateTooltipPosition = (e: MouseEvent): void => {
    this.tooltipX.set(e.clientX + 10);
    this.tooltipY.set(e.clientY + 10);
  };
  
  // Hover sobre niveles (comunica con el gráfico)
  hoverLevel(level: string): void {
    this.hoveredLevel.set(level);
    
    let price = 0;
    if (level === 'entry') price = this.entryPrice();
    else if (level === 'takeProfit') price = this.takeProfitPrice();
    else if (level === 'stopLoss') price = this.stopLossPrice();
    
    this.levelHovered.emit({ type: level, price });
  }
  
  unhoverLevel(): void {
    this.hoveredLevel.set(null);
    this.levelHovered.emit(null);
  }
  
  onConfirmPosition(): void {
    const action = this.action();
    if (action === 'ESPERA') return;
    
    this.openPosition.emit({
      symbol: this.tradingService.currentSymbol(),
      type: action === 'COMPRA' ? 'LONG' : 'SHORT',
      entryPrice: this.currentPrice(), // Usa precio actual como entrada real
      stopLoss: this.stopLossPrice(),
      takeProfit: this.takeProfitPrice()
    });
  }
}
