/**
 * Chart Component - Gráfico de velas con marcadores de patrones
 */

import { 
  Component, 
  ElementRef, 
  ViewChild, 
  effect, 
  inject,
  input,
  computed,
  signal,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';
import { PatternResult, TrendDetails } from '../../models/trading.models';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, SeriesMarker } from 'lightweight-charts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="trading-card h-full flex flex-col overflow-hidden">
      <div class="flex items-center justify-between mb-1 flex-shrink-0">
        <h2 class="text-xs font-semibold">📈 {{ tradingService.currentSymbol() }}</h2>
        <div class="flex items-center gap-2 text-xs">
          @if (selectedIndicatorInfo()) {
            <span class="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-400 flex items-center gap-1">
              📊 {{ selectedIndicatorInfo()!.name }}: {{ selectedIndicatorInfo()!.value | number:'1.1-1' }}
              <button (click)="clearIndicator()" class="ml-1 hover:text-white">✕</button>
            </span>
          }
          @if (patterns().length) {
            <span class="text-indigo-400">{{ patterns().length }} patrones</span>
          }
          @if (tradingService.chartData.isLoading()) {
            <span class="text-gray-400">⏳</span>
          }
        </div>
      </div>
      
      <div #chartContainer class="flex-1 w-full rounded overflow-hidden"></div>
      
      <!-- Leyenda de patrones detectados -->
      @if (patterns().length) {
        <div class="mt-1 flex flex-wrap gap-1 flex-shrink-0">
          @for (p of patterns().slice(0, 3); track p.name) {
            <span 
              class="px-1.5 py-0.5 rounded text-xs"
              [class]="p.signal && p.signal.includes('COMPRA') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
              {{ getPatternEmoji(p.signal) }} {{ p.name }}
            </span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;
  
  readonly tradingService = inject(TradingService);
  
  readonly highlightedLevel = input<{ type: string; price: number } | null>(null);
  readonly patterns = input<PatternResult[]>([]);
  readonly showTrendLines = input<TrendDetails | null>(null);
  
  private chart: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private priceLine: any = null;
  private indicatorLine: any = null;
  private currentPriceLine: any = null;
  private markers: SeriesMarker<Time>[] = [];
  private resizeObserver: ResizeObserver | null = null;
  
  // Líneas de SMAs para tendencia
  private sma20Line: any = null;
  private sma50Line: any = null;
  private sma200Line: any = null;
  
  // Signal para indicar que el chart está inicializado
  private chartReady = signal(false);
  
  // Info del indicador seleccionado
  readonly selectedIndicatorInfo = computed(() => {
    const indicatorName = this.tradingService.selectedIndicator();
    if (!indicatorName) return null;
    
    const analysis = this.tradingService.analysis.value();
    if (!analysis?.indicators) return null;
    
    const indicator = analysis.indicators.find(i => i.name === indicatorName);
    return indicator || null;
  });
  
  clearIndicator(): void {
    this.tradingService.selectIndicator(null);
  }
  
  constructor() {
    // Efecto para cargar datos del gráfico - observa tanto el estado ready como los datos
    effect(() => {
      const ready = this.chartReady();
      const data = this.tradingService.chartData.value();
      const isLoading = this.tradingService.chartData.isLoading();
      
      // Solo actualizar si el chart está listo, hay datos, y no está cargando
      if (ready && data?.candles && !isLoading && this.candleSeries && this.chart) {
        console.log('📊 Actualizando chart con', data.candles.length, 'velas');
        this.updateChartData(data.candles);
      }
    });
    
    effect(() => {
      const ready = this.chartReady();
      const level = this.highlightedLevel();
      if (ready && this.chart) {
        this.updateHighlightedLine(level);
      }
    });
    
    // Efecto para actualizar marcadores de patrones
    effect(() => {
      const ready = this.chartReady();
      const pats = this.patterns();
      if (ready && pats && this.candleSeries && this.chart) {
        this.updatePatternMarkers(pats);
      }
    });
    
    // Efecto para mostrar indicador seleccionado
    effect(() => {
      const ready = this.chartReady();
      const info = this.selectedIndicatorInfo();
      if (ready && this.chart) {
        this.updateIndicatorLine(info);
      }
    });
    
    // Efecto para mostrar línea de precio actual (prioriza precio en tiempo real)
    effect(() => {
      const ready = this.chartReady();
      const realtimePrice = this.tradingService.realtimePrice();
      const analysis = this.tradingService.analysis.value();
      const price = realtimePrice || analysis?.current_price;
      
      if (ready && this.chart && this.candleSeries && price) {
        this.updateCurrentPriceLine(price);
      }
    });
    
    // Efecto para mostrar/ocultar líneas de SMAs al hacer hover en tendencia
    effect(() => {
      const ready = this.chartReady();
      const trendDetails = this.showTrendLines();
      if (ready && this.chart && this.candleSeries) {
        this.updateTrendLines(trendDetails);
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Pequeño delay para asegurar que el contenedor tenga dimensiones
    setTimeout(() => {
      this.initChart();
      this.chartReady.set(true);
      console.log('📈 Chart inicializado');
    }, 10);
  }
  
  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
    }
  }
  
  getPatternEmoji(signal: string | undefined): string {
    if (!signal) return '🔹';
    if (signal.includes('COMPRA')) return '🟢';
    if (signal.includes('VENTA')) return '🔴';
    return '🟡';
  }
  
  private updatePatternMarkers(patterns: PatternResult[]): void {
    if (!this.candleSeries) return;
    
    const chartData = this.tradingService.chartData.value();
    if (!chartData?.candles?.length) return;
    
    const totalCandles = chartData.candles.length;
    const tempMarkers: SeriesMarker<Time>[] = [];
    
    // Máximo 6 patrones para no saturar el gráfico
    const patternsToShow = patterns.slice(0, 6);
    
    patternsToShow.forEach((p, i) => {
      const isBullish = p.signal?.includes('COMPRA');
      const isNeutral = p.signal?.includes('NEUTRAL') || p.name.toUpperCase().includes('DOJI');
      
      // Distribuir patrones en diferentes velas para que no se solapen
      // Usar diferentes zonas del gráfico basadas en el tipo de patrón
      let candleOffset: number;
      
      // Los patrones alcistas van en la parte derecha (más reciente)
      // Los bajistas en la parte central-derecha
      // Los neutrales en el medio
      if (isBullish) {
        candleOffset = i * 4; // 0, 4, 8, 12...
      } else if (isNeutral) {
        candleOffset = 2 + i * 5; // 2, 7, 12...
      } else {
        candleOffset = 1 + i * 4; // 1, 5, 9, 13...
      }
      
      const candleIndex = Math.max(0, totalCandles - 1 - candleOffset);
      const candle = chartData.candles[candleIndex];
      
      if (!candle) return;
      
      // Emoji descriptivo del tipo de patrón
      const patternEmoji = this.getPatternTypeEmoji(p.name);
      const shortName = this.getShortPatternName(p.name);
      
      // Determinar color y forma según tipo
      let color: string;
      let shape: 'arrowUp' | 'arrowDown' | 'circle';
      let position: 'belowBar' | 'aboveBar';
      
      if (isBullish) {
        color = '#22c55e'; // Verde
        shape = 'arrowUp';
        position = 'belowBar';
      } else if (isNeutral) {
        color = '#fbbf24'; // Amarillo
        shape = 'circle';
        position = 'aboveBar';
      } else {
        color = '#ef4444'; // Rojo
        shape = 'arrowDown';
        position = 'aboveBar';
      }
      
      tempMarkers.push({
        time: this.parseDate(candle.date) as Time,
        position,
        color,
        shape,
        text: `${patternEmoji} ${shortName}`,
      } as SeriesMarker<Time>);
    });
    
    // Ordenar por tiempo ascendente (requerido por lightweight-charts)
    this.markers = tempMarkers.sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime() / 1000;
      const timeB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime() / 1000;
      return timeA - timeB;
    });
    
    this.candleSeries.setMarkers(this.markers);
  }
  
  private getPatternTypeEmoji(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes('MARTILLO') || upper.includes('HAMMER')) return '🔨';
    if (upper.includes('ESTRELLA') || upper.includes('STAR')) return '⭐';
    if (upper.includes('ENVOLVENTE') || upper.includes('ENGULFING')) return '🌀';
    if (upper.includes('HARAMI')) return '🤰';
    if (upper.includes('DOJI')) return '➕';
    if (upper.includes('SOLDADO') || upper.includes('SOLDIER')) return '🦸';
    if (upper.includes('CUERVO') || upper.includes('CROW')) return '🦢';
    if (upper.includes('NUBE') || upper.includes('CLOUD')) return '☁️';
    if (upper.includes('PENETRANTE') || upper.includes('PIERCING')) return '🗡️';
    if (upper.includes('PINZA') || upper.includes('TWEEZER')) return '🧲';
    if (upper.includes('MARUBOZU')) return '🟩';
    return '🕯️';
  }
  
  private getShortPatternName(name: string): string {
    // Abreviar nombres largos
    const upper = name.toUpperCase();
    if (upper.includes('MARTILLO INVERTIDO') || upper.includes('INVERTED')) return 'M.Inv';
    if (upper.includes('MARTILLO') || upper.includes('HAMMER')) return 'Mart';
    if (upper.includes('TRES SOLDADOS') || upper.includes('THREE WHITE')) return '3Sol';
    if (upper.includes('TRES CUERVOS') || upper.includes('THREE BLACK')) return '3Cue';
    if (upper.includes('ESTRELLA MAÑANA') || upper.includes('MORNING')) return 'E.Mañ';
    if (upper.includes('ESTRELLA TARDE') || upper.includes('EVENING')) return 'E.Tar';
    if (upper.includes('ENVOLVENTE')) return 'Envol';
    if (upper.includes('ENGULFING')) return 'Engul';
    if (upper.includes('HARAMI')) return 'Haram';
    if (upper.includes('DOJI')) return 'Doji';
    if (upper.includes('MARUBOZU')) return 'Marub';
    if (upper.includes('NUBE OSCURA') || upper.includes('DARK CLOUD')) return 'Nube';
    if (upper.includes('PENETRANTE') || upper.includes('PIERCING')) return 'Penet';
    
    // Nombre genérico corto
    return name.length > 8 ? name.substring(0, 6) + '..' : name;
  }
  
  private updateHighlightedLine(level: { type: string; price: number } | null): void {
    if (this.priceLine && this.candleSeries) {
      this.candleSeries.removePriceLine(this.priceLine);
      this.priceLine = null;
    }
    
    if (level && this.candleSeries) {
      const color = this.getLineColor(level.type);
      this.priceLine = this.candleSeries.createPriceLine({
        price: level.price,
        color: color,
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: this.getLevelLabel(level.type),
      });
    }
  }
  
  // Indicadores que son osciladores (0-100) y no se pueden mostrar como línea de precio
  private readonly oscillatorIndicators = ['RSI', 'Estocástico', 'ADX', 'CCI', 'Williams', 'MACD'];
  
  private updateIndicatorLine(info: { name: string; value?: number; signal: string } | null): void {
    // Remover línea anterior si existe
    if (this.indicatorLine && this.candleSeries) {
      this.candleSeries.removePriceLine(this.indicatorLine);
      this.indicatorLine = null;
    }
    
    if (!info?.value || !this.candleSeries) return;
    
    // Los osciladores no se pueden mostrar como línea de precio
    const isOscillator = this.oscillatorIndicators.some(osc => 
      info.name.toLowerCase().includes(osc.toLowerCase())
    );
    
    if (isOscillator) {
      // Los osciladores solo se muestran en el badge superior, no como línea
      console.log(`📊 ${info.name} es un oscilador (${info.value}), se muestra en badge`);
      return;
    }
    
    const analysis = this.tradingService.analysis.value();
    const currentPrice = analysis?.current_price || 0;
    
    // Solo mostrar la línea si el valor está en rango razonable del precio actual (±50%)
    const isInPriceRange = info.value > currentPrice * 0.5 && info.value < currentPrice * 1.5;
    
    if (isInPriceRange) {
      const isBullish = info.signal?.includes('COMPRA');
      const isBearish = info.signal?.includes('VENTA');
      const color = isBullish ? '#22c55e' : isBearish ? '#ef4444' : '#818cf8';
      
      this.indicatorLine = this.candleSeries.createPriceLine({
        price: info.value,
        color: color,
        lineWidth: 2,
        lineStyle: 3, // Dotted
        axisLabelVisible: true,
        title: info.name,
      });
    }
  }
  
  private updateCurrentPriceLine(price: number): void {
    // Remover línea anterior si existe
    if (this.currentPriceLine && this.candleSeries) {
      this.candleSeries.removePriceLine(this.currentPriceLine);
      this.currentPriceLine = null;
    }
    
    if (!price || !this.candleSeries) return;
    
    // Crear línea de precio actual
    this.currentPriceLine = this.candleSeries.createPriceLine({
      price: price,
      color: '#fbbf24', // Amarillo/dorado
      lineWidth: 1,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: '💰 Actual',
    });
  }
  
  private updateTrendLines(trendDetails: TrendDetails | null): void {
    // Siempre remover líneas anteriores
    if (this.sma20Line && this.candleSeries) {
      this.candleSeries.removePriceLine(this.sma20Line);
      this.sma20Line = null;
    }
    if (this.sma50Line && this.candleSeries) {
      this.candleSeries.removePriceLine(this.sma50Line);
      this.sma50Line = null;
    }
    if (this.sma200Line && this.candleSeries) {
      this.candleSeries.removePriceLine(this.sma200Line);
      this.sma200Line = null;
    }
    
    // Si no hay detalles, no mostrar nada
    if (!trendDetails || !this.candleSeries) return;
    
    const sma = trendDetails.sma_values;
    
    // Crear líneas de SMAs con colores distintivos
    if (sma.sma_20) {
      this.sma20Line = this.candleSeries.createPriceLine({
        price: sma.sma_20,
        color: '#f97316', // Naranja - SMA rápida
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: '⚡ SMA 20',
      });
    }
    
    if (sma.sma_50) {
      this.sma50Line = this.candleSeries.createPriceLine({
        price: sma.sma_50,
        color: '#8b5cf6', // Púrpura - SMA media
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: '📊 SMA 50',
      });
    }
    
    if (sma.sma_200) {
      this.sma200Line = this.candleSeries.createPriceLine({
        price: sma.sma_200,
        color: '#ec4899', // Rosa - SMA lenta
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: '🏛️ SMA 200',
      });
    }
  }
  
  private getLineColor(type: string): string {
    switch (type) {
      case 'entry': return '#3b82f6';
      case 'stopLoss': case 'sl': return '#ef4444';
      case 'takeProfit': case 'tp': return '#22c55e';
      case 'support': return '#eab308';
      case 'resistance': return '#a855f7';
      default: return '#6b7280';
    }
  }
  
  private getLevelLabel(type: string): string {
    switch (type) {
      case 'entry': return '🎯 Entrada';
      case 'stopLoss': case 'sl': return '🛑 SL';
      case 'takeProfit': case 'tp': return '💰 TP';
      default: return '';
    }
  }
  
  private initChart(): void {
    if (!this.chartContainer) {
      console.error('❌ chartContainer no disponible');
      return;
    }
    
    const container = this.chartContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    
    console.log('📐 Container dimensions:', rect.width, 'x', rect.height);
    
    // Usar dimensiones fijas si no hay dimensiones del contenedor
    const width = Math.max(rect.width, 400);
    const height = Math.max(rect.height, 300);
    
    console.log('📊 Creating chart with:', width, 'x', height);
    
    // Crear el gráfico con dimensiones explícitas
    this.chart = createChart(container, {
      width,
      height,
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2a2a4a' },
        horzLines: { color: '#2a2a4a' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#6366f1',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: '#6366f1',
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#2a2a4a',
      },
      timeScale: {
        borderColor: '#2a2a4a',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });
    
    // Serie de velas
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    
    // Serie de volumen
    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#6366f1',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    
    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    // Ajustar tamaño
    this.chart.timeScale().fitContent();
    
    // Responsive - observar cambios de tamaño
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0 && this.chart) {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          this.chart.applyOptions({ width, height });
        }
      }
    });
    
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }
  
  private updateChartData(candles: any[]): void {
    if (!this.candleSeries || !this.volumeSeries || !candles || !candles.length) return;
    
    // Convertir datos al formato de lightweight-charts
    const candleData: CandlestickData<Time>[] = candles.map(c => ({
      time: this.parseDate(c.date) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    
    const volumeData = candles.map(c => ({
      time: this.parseDate(c.date) as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));
    
    // Ordenar por tiempo ascendente (requerido por lightweight-charts)
    candleData.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    volumeData.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    
    // Filtrar duplicados (lightweight-charts no permite timestamps repetidos)
    const uniqueCandleData = candleData.filter((item, index, arr) => 
      index === 0 || String(item.time) !== String(arr[index - 1].time)
    );
    const uniqueVolumeData = volumeData.filter((item, index, arr) => 
      index === 0 || String(item.time) !== String(arr[index - 1].time)
    );
    
    this.candleSeries.setData(uniqueCandleData);
    this.volumeSeries.setData(uniqueVolumeData);
    
    this.chart?.timeScale().fitContent();
  }
  
  private parseDate(dateStr: string): string {
    // Convertir fecha a formato YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }
}
