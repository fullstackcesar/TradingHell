/**
 * Chart Component - Gráfico de velas con TradingView Lightweight Charts
 */

import { 
  Component, 
  ElementRef, 
  ViewChild, 
  effect, 
  inject,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { TradingService } from '../../services/trading.service';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `
    <div class="trading-card h-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">📈 Gráfico</h2>
        <div class="flex gap-2 text-sm">
          @if (tradingService.chartData.isLoading()) {
            <span class="text-gray-400">Cargando...</span>
          }
        </div>
      </div>
      
      <div #chartContainer class="w-full h-[400px] rounded-lg overflow-hidden"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;
  
  readonly tradingService = inject(TradingService);
  
  private chart: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  
  constructor() {
    // Efecto reactivo para actualizar el gráfico cuando cambian los datos
    effect(() => {
      const data = this.tradingService.chartData.value();
      if (data && this.candleSeries) {
        this.updateChartData(data.candles);
      }
    });
  }
  
  ngAfterViewInit(): void {
    this.initChart();
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.remove();
    }
  }
  
  private initChart(): void {
    if (!this.chartContainer) return;
    
    // Crear el gráfico
    this.chart = createChart(this.chartContainer.nativeElement, {
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
    if (!this.candleSeries || !this.volumeSeries || !candles.length) return;
    
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
    
    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);
    
    this.chart?.timeScale().fitContent();
  }
  
  private parseDate(dateStr: string): string {
    // Convertir fecha a formato YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }
}
