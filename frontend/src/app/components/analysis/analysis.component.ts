/**
 * Analysis Component - Muestra el análisis técnico
 */

import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';
import { SIGNAL_CLASSES } from '../../models/trading.models';

// Diccionario de explicaciones de indicadores
const INDICATOR_EXPLANATIONS: Record<string, string> = {
  'RSI': 'RSI (0-100): Mide si el precio está sobrecomprado (>70) o sobrevendido (<30). Si está muy alto, puede bajar pronto. Si está muy bajo, puede subir.',
  'MACD': 'MACD: Compara dos medias móviles. Si la línea MACD cruza hacia arriba la línea de señal = posible subida. Si cruza hacia abajo = posible bajada.',
  'BB': 'Bandas de Bollinger: El precio suele moverse entre la banda superior e inferior. Si toca la superior, puede bajar. Si toca la inferior, puede subir.',
  'BB Superior': 'Banda superior de Bollinger. Si el precio toca esta línea = posible sobrecompra, puede bajar.',
  'BB Media': 'Banda media de Bollinger (SMA 20). Nivel de equilibrio. El precio tiende a volver a esta línea.',
  'BB Inferior': 'Banda inferior de Bollinger. Si el precio toca esta línea = posible sobreventa, puede subir.',
  'SMA': 'SMA (Media Móvil Simple): Muestra el precio promedio de los últimos X días. Si el precio está por encima = tendencia alcista.',
  'SMA 20': 'SMA 20: Media de los últimos 20 períodos. Si el precio está arriba = alcista a corto plazo.',
  'SMA 50': 'SMA 50: Media de los últimos 50 períodos. Si el precio está arriba = alcista a medio plazo.',
  'SMA 200': 'SMA 200: La más importante. Si el precio está arriba = tendencia alcista de largo plazo (bull market).',
  'EMA': 'EMA (Media Móvil Exponencial): Similar a SMA pero da más peso a precios recientes. Reacciona más rápido a cambios.',
  'EMA 20': 'EMA 20: Media exponencial corta. Útil para detectar cambios rápidos de tendencia.',
  'EMA 50': 'EMA 50: Media exponencial media. Equilibrio entre velocidad y estabilidad.',
  'ADX': 'ADX (0-100): Mide la FUERZA de la tendencia, no su dirección. >25 = tendencia fuerte. <20 = mercado sin dirección clara.',
  'STOCH': 'Estocástico (0-100): Similar al RSI. >80 = sobrecompra, <20 = sobreventa. Útil para detectar cambios de dirección.',
  'Estocástico': 'Estocástico (0-100): Similar al RSI. >80 = sobrecompra, <20 = sobreventa. Útil para detectar cambios de dirección.',
  'ATR': 'ATR (Rango Verdadero Promedio): Mide volatilidad. Más alto = más movimiento del precio. Útil para calcular stop loss.',
  'OBV': 'OBV (Volumen en Balance): Si sube con el precio = la subida tiene fuerza. Si baja mientras el precio sube = posible trampa.',
  'VWAP': 'VWAP: Precio promedio ponderado por volumen. Si el precio está por encima = compradores dominan. Por debajo = vendedores.',
  'Volumen': 'Volumen: Cantidad de operaciones. Alto volumen en subida = fuerza real. Bajo volumen = movimiento débil.',
  'Momentum': 'Momentum: Velocidad del cambio de precio. Positivo = el precio acelera hacia arriba. Negativo = acelera hacia abajo.'
};

// Diccionario de patrones de velas con explicaciones visuales
const PATTERN_EXPLANATIONS: Record<string, { emoji: string; explanation: string; signal: string; color: string }> = {
  'DOJI': {
    emoji: '➕',
    explanation: 'Apertura y cierre casi iguales. El mercado está INDECISO. Suele aparecer antes de un cambio de dirección.',
    signal: '⚠️ Esperar siguiente vela',
    color: 'yellow'
  },
  'HAMMER': {
    emoji: '🔨',
    explanation: 'Cuerpo pequeño arriba con mecha larga abajo. Los vendedores intentaron bajar el precio pero los compradores lo recuperaron. En tendencia bajista = posible REBOTE.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'MARTILLO': {
    emoji: '🔨',
    explanation: 'Cuerpo pequeño arriba con mecha larga abajo. Los vendedores intentaron bajar el precio pero los compradores lo recuperaron. En tendencia bajista = posible REBOTE.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'INVERTED_HAMMER': {
    emoji: '🔨⬆️',
    explanation: 'Cuerpo pequeño abajo con mecha larga arriba. Los compradores intentaron subir pero no lo mantuvieron. En tendencia bajista = posible cambio alcista.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'MARTILLO_INVERTIDO': {
    emoji: '🔨⬆️',
    explanation: 'Cuerpo pequeño abajo con mecha larga arriba. Los compradores intentaron subir pero no lo mantuvieron. En tendencia bajista = posible cambio alcista.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'SHOOTING_STAR': {
    emoji: '⭐💫',
    explanation: 'Cuerpo pequeño abajo con mecha larga arriba. Los compradores fracasaron en mantener la subida. En tendencia alcista = posible CAÍDA.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'ESTRELLA_FUGAZ': {
    emoji: '⭐💫',
    explanation: 'Cuerpo pequeño abajo con mecha larga arriba. Los compradores fracasaron en mantener la subida. En tendencia alcista = posible CAÍDA.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'ENGULFING': {
    emoji: '🐋',
    explanation: 'Una vela grande "envuelve" completamente el cuerpo de la anterior. Señal MUY FUERTE de cambio de tendencia.',
    signal: '⚡ Fuerte',
    color: 'purple'
  },
  'ENVOLVENTE': {
    emoji: '🐋',
    explanation: 'Una vela grande "envuelve" completamente el cuerpo de la anterior. Señal MUY FUERTE de cambio de tendencia.',
    signal: '⚡ Fuerte',
    color: 'purple'
  },
  'MORNING_STAR': {
    emoji: '🌅',
    explanation: 'Patrón de 3 velas: 1) Bajista grande 2) Vela pequeña/doji 3) Alcista grande. El amanecer después de la noche = SUBIDA.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'ESTRELLA_MANANA': {
    emoji: '🌅',
    explanation: 'Patrón de 3 velas: 1) Bajista grande 2) Vela pequeña/doji 3) Alcista grande. El amanecer después de la noche = SUBIDA.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'EVENING_STAR': {
    emoji: '🌆',
    explanation: 'Patrón de 3 velas: 1) Alcista grande 2) Vela pequeña/doji 3) Bajista grande. El atardecer después del día = BAJADA.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'ESTRELLA_TARDE': {
    emoji: '🌆',
    explanation: 'Patrón de 3 velas: 1) Alcista grande 2) Vela pequeña/doji 3) Bajista grande. El atardecer después del día = BAJADA.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'HANGING_MAN': {
    emoji: '🧍‍♂️⬇️',
    explanation: 'Igual que el martillo pero aparece en TENDENCIA ALCISTA. Aviso de que la subida puede terminar.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'HOMBRE_COLGADO': {
    emoji: '🧍‍♂️⬇️',
    explanation: 'Igual que el martillo pero aparece en TENDENCIA ALCISTA. Aviso de que la subida puede terminar.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'THREE_WHITE_SOLDIERS': {
    emoji: '💂💂💂',
    explanation: '3 velas alcistas consecutivas, cada una cerrando más alto. Los compradores dominan totalmente = SUBIDA FUERTE.',
    signal: '🟢🟢🟢 Muy alcista',
    color: 'green'
  },
  'TRES_SOLDADOS': {
    emoji: '💂💂💂',
    explanation: '3 velas alcistas consecutivas, cada una cerrando más alto. Los compradores dominan totalmente = SUBIDA FUERTE.',
    signal: '🟢🟢🟢 Muy alcista',
    color: 'green'
  },
  'THREE_BLACK_CROWS': {
    emoji: '🐦‍⬛🐦‍⬛🐦‍⬛',
    explanation: '3 velas bajistas consecutivas, cada una cerrando más bajo. Los vendedores dominan totalmente = CAÍDA FUERTE.',
    signal: '🔴🔴🔴 Muy bajista',
    color: 'red'
  },
  'TRES_CUERVOS': {
    emoji: '🐦‍⬛🐦‍⬛🐦‍⬛',
    explanation: '3 velas bajistas consecutivas, cada una cerrando más bajo. Los vendedores dominan totalmente = CAÍDA FUERTE.',
    signal: '🔴🔴🔴 Muy bajista',
    color: 'red'
  },
  'PIERCING': {
    emoji: '📍',
    explanation: 'Vela alcista que abre por debajo pero cierra por encima de la mitad de la vela bajista anterior. Compradores tomando control.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'PENETRANTE': {
    emoji: '📍',
    explanation: 'Vela alcista que abre por debajo pero cierra por encima de la mitad de la vela bajista anterior. Compradores tomando control.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'DARK_CLOUD': {
    emoji: '🌧️',
    explanation: 'Vela bajista que abre por encima pero cierra por debajo de la mitad de la vela alcista anterior. Vendedores tomando control.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'NUBE_OSCURA': {
    emoji: '🌧️',
    explanation: 'Vela bajista que abre por encima pero cierra por debajo de la mitad de la vela alcista anterior. Vendedores tomando control.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'BULLISH': {
    emoji: '🐂',
    explanation: 'Patrón alcista detectado. El precio tiende a subir.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'BEARISH': {
    emoji: '🐻',
    explanation: 'Patrón bajista detectado. El precio tiende a bajar.',
    signal: '🔴 Bajista',
    color: 'red'
  }
};

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
          <h3 class="text-sm font-semibold text-gray-400 mb-2">📈 Indicadores <span class="text-xs text-gray-500">(click para ver en gráfico)</span></h3>
          <div class="space-y-2">
            @for (indicator of analysis()!.indicators; track indicator.name) {
              <div 
                class="p-2 rounded flex items-center justify-between cursor-pointer relative group transition-all"
                [class]="isIndicatorSelected(indicator.name) 
                  ? 'bg-indigo-600/30 border border-indigo-500' 
                  : 'bg-trading-border/20 hover:bg-trading-border/40'"
                (click)="toggleIndicatorOnChart(indicator.name)"
                (mouseenter)="showIndicatorTooltip(indicator.name)"
                (mouseleave)="hideTooltip()">
                <span class="text-sm flex items-center gap-1">
                  @if (isIndicatorSelected(indicator.name)) {
                    <span class="text-indigo-400">📊</span>
                  }
                  {{ indicator.name }}
                  <span class="text-gray-500 text-xs">❓</span>
                </span>
                <div class="flex items-center gap-2">
                  @if (indicator.value !== undefined) {
                    <span class="text-xs text-gray-500">{{ indicator.value | number:'1.1-1' }}</span>
                  }
                  <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(indicator.signal)">
                    {{ indicator.signal }}
                  </span>
                </div>
                
                <!-- Tooltip -->
                @if (activeTooltip() === indicator.name) {
                  <div class="absolute left-0 bottom-full mb-2 z-50 w-64 p-2 bg-gray-900 border border-indigo-500 rounded-lg shadow-xl text-xs">
                    <p class="text-indigo-400 font-bold mb-1">{{ indicator.name }}</p>
                    <p class="text-gray-300 leading-relaxed">{{ getIndicatorExplanation(indicator.name) }}</p>
                    <p class="text-indigo-300 mt-1 text-xs">👆 Click para {{ isIndicatorSelected(indicator.name) ? 'ocultar' : 'mostrar' }} en gráfico</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
        
        <!-- Patrones detectados -->
        @if (analysis()!.patterns.length) {
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-400 mb-2">🕯️ Patrones de Velas <span class="text-xs text-gray-500">(hover para ver)</span></h3>
            <div class="space-y-2">
              @for (pattern of analysis()!.patterns; track pattern.name) {
                <div 
                  class="p-2 rounded bg-trading-border/20 hover:bg-trading-border/40 cursor-pointer relative group transition-all"
                  (mouseenter)="showPatternTooltip(pattern.name)"
                  (mouseleave)="hidePatternTooltip()">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium flex items-center gap-1">
                      <span class="text-lg">{{ getPatternEmoji(pattern.name) }}</span>
                      {{ pattern.name }}
                      <span class="text-gray-500 text-xs">❓</span>
                    </span>
                    <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(pattern.signal)">
                      {{ pattern.confidence | number:'1.0-0' }}%
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ pattern.description }}</p>
                  
                  <!-- Tooltip visual del patrón -->
                  @if (activePatternTooltip() === pattern.name) {
                    <div 
                      class="absolute left-0 bottom-full mb-2 z-50 w-80 p-3 bg-gray-900 rounded-lg shadow-xl"
                      [class]="getPatternBorderClass(pattern.name)">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-3xl">{{ getPatternEmoji(pattern.name) }}</span>
                        <span class="font-bold" [class]="getPatternTextClass(pattern.name)">{{ pattern.name }}</span>
                      </div>
                      
                      <p class="text-gray-300 text-xs leading-relaxed mb-2">{{ getPatternExplanation(pattern.name) }}</p>
                      
                      <div class="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span class="text-xs font-semibold" [class]="getPatternTextClass(pattern.name)">{{ getPatternSignal(pattern.name) }}</span>
                        <span class="text-xs text-gray-500">Confianza: {{ pattern.confidence }}%</span>
                      </div>
                    </div>
                  }
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
  
  // Tooltip para indicadores
  readonly activeTooltip = signal<string | null>(null);
  
  // Tooltip para patrones de velas
  readonly activePatternTooltip = signal<string | null>(null);
  
  showIndicatorTooltip(name: string): void {
    this.activeTooltip.set(name);
  }
  
  hideTooltip(): void {
    this.activeTooltip.set(null);
  }
  
  showPatternTooltip(name: string): void {
    this.activePatternTooltip.set(name);
  }
  
  hidePatternTooltip(): void {
    this.activePatternTooltip.set(null);
  }
  
  getIndicatorExplanation(name: string): string {
    // Buscar coincidencia parcial
    for (const [key, explanation] of Object.entries(INDICATOR_EXPLANATIONS)) {
      if (name.toUpperCase().includes(key)) {
        return explanation;
      }
    }
    return 'Indicador técnico que ayuda a predecir movimientos del precio.';
  }
  
  private findPatternData(name: string) {
    const normalized = name.toUpperCase().replace(/\s+/g, '_');
    for (const [key, data] of Object.entries(PATTERN_EXPLANATIONS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return data;
      }
    }
    return null;
  }
  
  getPatternEmoji(name: string): string {
    const data = this.findPatternData(name);
    return data?.emoji || '🕯️';
  }
  
  getPatternExplanation(name: string): string {
    const data = this.findPatternData(name);
    return data?.explanation || 'Patrón de velas que puede indicar un cambio en la dirección del precio.';
  }
  
  getPatternSignal(name: string): string {
    const data = this.findPatternData(name);
    return data?.signal || '⚠️ Evaluar contexto';
  }
  
  getPatternBorderClass(name: string): string {
    const data = this.findPatternData(name);
    switch (data?.color) {
      case 'green': return 'border-2 border-green-500';
      case 'red': return 'border-2 border-red-500';
      case 'yellow': return 'border-2 border-yellow-500';
      case 'purple': return 'border-2 border-purple-500';
      default: return 'border border-gray-500';
    }
  }
  
  getPatternTextClass(name: string): string {
    const data = this.findPatternData(name);
    switch (data?.color) {
      case 'green': return 'text-green-400';
      case 'red': return 'text-red-400';
      case 'yellow': return 'text-yellow-400';
      case 'purple': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  }
  
  // Indicador seleccionado para mostrar en gráfico
  isIndicatorSelected(name: string): boolean {
    return this.tradingService.selectedIndicator() === name;
  }
  
  toggleIndicatorOnChart(name: string): void {
    if (this.tradingService.selectedIndicator() === name) {
      this.tradingService.selectIndicator(null);
    } else {
      this.tradingService.selectIndicator(name);
    }
  }
}
