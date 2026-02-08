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
import { PatternResult } from '../../models/trading.models';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, SeriesMarker } from 'lightweight-charts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="trading-card h-full flex flex-col">
      <div class="flex items-center justify-between mb-1">
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
      
      <div #chartContainer class="flex-1 w-full rounded overflow-hidden" style="min-height: 300px;"></div>
      
      <!-- Leyenda de patrones detectados -->
      @if (patterns().length) {
        <div class="mt-1 flex flex-wrap gap-1">
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
  
  private chart: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private priceLine: any = null;
  private indicatorLine: any = null;
  private markers: SeriesMarker<Time>[] = [];
  
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
  
  // Obtener emoji representativo de la forma del patrón
  private getPatternShape(patternName: string): string {
    const name = patternName.toLowerCase();
    
    // Patrones con formas distintivas
    if (name.includes('martillo') && !name.includes('invertido')) return '🔨';
    if (name.includes('martillo invertido')) return '⚒️';
    if (name.includes('estrella fugaz') || name.includes('shooting')) return '💫';
    if (name.includes('estrella') && name.includes('mañana') || name.includes('morning')) return '🌅';
    if (name.includes('estrella') && name.includes('tarde') || name.includes('evening')) return '🌆';
    if (name.includes('doji')) return '✚';
    if (name.includes('envolvente')) return '🔄';
    if (name.includes('hombre colgado') || name.includes('hanging')) return '🪢';
    if (name.includes('tres soldados') || name.includes('three white')) return '📈📈';
    if (name.includes('tres cuervos') || name.includes('three black')) return '📉📉';
    if (name.includes('harami')) return '🤰';
    if (name.includes('piercing') || name.includes('penetrante')) return '🗡️';
    if (name.includes('nube oscura') || name.includes('dark cloud')) return '🌧️';
    if (name.includes('pinza') || name.includes('tweezer')) return '🔧';
    
    return '📊';
  }
  
  private updatePatternMarkers(patterns: PatternResult[]): void {
    if (!this.candleSeries) return;
    
    const chartData = this.tradingService.chartData.value();
    if (!chartData?.candles?.length) return;
    
    // Crear marcadores para cada patrón (máximo 5)
    const tempMarkers: SeriesMarker<Time>[] = [];
    
    patterns.slice(0, 5).forEach((p, i) => {
      const isBullish = p.signal?.includes('COMPRA');
      // Distribuir patrones en las últimas velas
      const candleIndex = Math.max(0, chartData.candles.length - 1 - i * 2);
      const candle = chartData.candles[candleIndex];
      
      // Nombre corto pero con emoji de la forma
      const patternEmoji = this.getPatternShape(p.name);
      const shortName = p.name.length > 12 ? p.name.substring(0, 10) + '..' : p.name;
      
      tempMarkers.push({
        time: this.parseDate(candle.date) as Time,
        position: isBullish ? 'belowBar' : 'aboveBar',
        color: isBullish ? '#22c55e' : '#ef4444',
        shape: isBullish ? 'arrowUp' : 'arrowDown',
        text: `${patternEmoji} ${shortName}`,
      } as SeriesMarker<Time>);
    });
    
    // IMPORTANTE: Los marcadores DEBEN estar ordenados por tiempo ascendente
    this.markers = tempMarkers.sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime() / 1000;
      const timeB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime() / 1000;
      return timeA - timeB;
    });
    
    this.candleSeries.setMarkers(this.markers);
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
    
    // Responsive
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0 && this.chart) {
        const { width, height } = entries[0].contentRect;
        this.chart.applyOptions({ width, height: height || 400 });
      }
    });
    
    resizeObserver.observe(this.chartContainer.nativeElement);
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
