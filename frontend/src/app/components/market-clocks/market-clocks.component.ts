/**
 * Market Clocks Component - Relojes de mercado con horarios y countdowns
 * Muestra estado de mercados relevantes según el activo seleccionado
 */

import { Component, input, signal, computed, OnInit, OnDestroy } from '@angular/core';

interface MarketInfo {
  name: string;
  shortName: string;
  timezone: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  premarketHour?: number;
  afterhoursClose?: number;
  weekendClosed: boolean;
  icon: string;
}

interface MarketStatus {
  market: MarketInfo;
  isOpen: boolean;
  isPremarket: boolean;
  isAfterHours: boolean;
  localTime: string;
  nextEvent: string;
  nextEventTime: string;
  countdown: string;
}

@Component({
  selector: 'app-market-clocks',
  standalone: true,
  template: `
    <div class="flex items-center gap-3 overflow-x-auto">
      @for (status of marketStatuses(); track status.market.name) {
        <div 
          class="flex items-center gap-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-all"
          [class]="getStatusClass(status)"
          [title]="getTooltip(status)">
          
          <!-- Icono y nombre -->
          <span>{{ status.market.icon }}</span>
          <span class="font-medium hidden sm:inline">{{ status.market.shortName }}</span>
          
          <!-- Estado -->
          <span class="flex items-center gap-1">
            @if (status.isOpen) {
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-green-400 font-bold">OPEN</span>
            } @else if (status.isPremarket) {
              <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span class="text-yellow-400">PRE</span>
            } @else if (status.isAfterHours) {
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              <span class="text-orange-400">AH</span>
            } @else {
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="text-red-400">CLOSED</span>
            }
          </span>
          
          <!-- Countdown al siguiente evento -->
          <span class="text-gray-500 hidden md:inline">
            {{ status.nextEvent }}: {{ status.countdown }}
          </span>
        </div>
      }
      
      <!-- Hora local -->
      <div class="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border-l border-trading-border ml-1">
        <span>🕐</span>
        <span class="font-mono">{{ localTime() }}</span>
      </div>
    </div>
  `
})
export class MarketClocksComponent implements OnInit, OnDestroy {
  symbol = input<string>('BTCUSDT');
  
  private intervalId: any;
  
  localTime = signal('--:--:--');
  marketStatuses = signal<MarketStatus[]>([]);
  
  // Definición de mercados
  private readonly MARKETS: Record<string, MarketInfo> = {
    NYSE: {
      name: 'New York Stock Exchange',
      shortName: 'NYSE',
      timezone: 'America/New_York',
      openHour: 9, openMinute: 30,
      closeHour: 16, closeMinute: 0,
      premarketHour: 4,
      afterhoursClose: 20,
      weekendClosed: true,
      icon: '🇺🇸'
    },
    NASDAQ: {
      name: 'NASDAQ',
      shortName: 'NASDAQ', 
      timezone: 'America/New_York',
      openHour: 9, openMinute: 30,
      closeHour: 16, closeMinute: 0,
      premarketHour: 4,
      afterhoursClose: 20,
      weekendClosed: true,
      icon: '📈'
    },
    BME: {
      name: 'Bolsa de Madrid',
      shortName: 'BME',
      timezone: 'Europe/Madrid',
      openHour: 9, openMinute: 0,
      closeHour: 17, closeMinute: 30,
      weekendClosed: true,
      icon: '🇪🇸'
    },
    EURONEXT: {
      name: 'Euronext (Paris)',
      shortName: 'EURONEXT',
      timezone: 'Europe/Paris',
      openHour: 9, openMinute: 0,
      closeHour: 17, closeMinute: 30,
      weekendClosed: true,
      icon: '🇪🇺'
    },
    LSE: {
      name: 'London Stock Exchange',
      shortName: 'LSE',
      timezone: 'Europe/London',
      openHour: 8, openMinute: 0,
      closeHour: 16, closeMinute: 30,
      weekendClosed: true,
      icon: '🇬🇧'
    },
    XETRA: {
      name: 'Frankfurt (Xetra)',
      shortName: 'XETRA',
      timezone: 'Europe/Berlin',
      openHour: 9, openMinute: 0,
      closeHour: 17, closeMinute: 30,
      weekendClosed: true,
      icon: '🇩🇪'
    },
    TSE: {
      name: 'Tokyo Stock Exchange',
      shortName: 'TSE',
      timezone: 'Asia/Tokyo',
      openHour: 9, openMinute: 0,
      closeHour: 15, closeMinute: 0,
      weekendClosed: true,
      icon: '🇯🇵'
    },
    SSE: {
      name: 'Shanghai Stock Exchange',
      shortName: 'SSE',
      timezone: 'Asia/Shanghai',
      openHour: 9, openMinute: 30,
      closeHour: 15, closeMinute: 0,
      weekendClosed: true,
      icon: '🇨🇳'
    },
    HKEX: {
      name: 'Hong Kong Exchange',
      shortName: 'HKEX',
      timezone: 'Asia/Hong_Kong',
      openHour: 9, openMinute: 30,
      closeHour: 16, closeMinute: 0,
      weekendClosed: true,
      icon: '🇭🇰'
    },
    FOREX: {
      name: 'Forex Market',
      shortName: 'FOREX',
      timezone: 'America/New_York',
      openHour: 17, openMinute: 0, // Domingo 5PM ET
      closeHour: 17, closeMinute: 0, // Viernes 5PM ET
      weekendClosed: true,
      icon: '💱'
    },
    CRYPTO: {
      name: 'Crypto Markets',
      shortName: 'CRYPTO',
      timezone: 'UTC',
      openHour: 0, openMinute: 0,
      closeHour: 24, closeMinute: 0,
      weekendClosed: false,
      icon: '₿'
    }
  };
  
  // Mapeo de símbolos a mercados relevantes - SOLO UNO
  private getRelevantMarket(): MarketInfo {
    const sym = this.symbol().toUpperCase();
    
    // Criptomonedas - 24/7
    if (sym.endsWith('USDT') || sym.endsWith('BUSD') || sym.endsWith('BTC') || 
        sym.endsWith('ETH') || sym.includes('CRYPTO') || 
        ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'DOGE', 'SHIB'].some(c => sym.startsWith(c))) {
      return this.MARKETS['CRYPTO'];
    }
    
    // Índices españoles
    if (sym.includes('IBEX') || sym.includes('^IBEX')) {
      return this.MARKETS['BME'];
    }
    
    // Índices europeos
    if (sym.includes('STOXX') || sym.includes('CAC') || sym.includes('^STOXX')) {
      return this.MARKETS['EURONEXT'];
    }
    
    // Índice británico
    if (sym.includes('FTSE') || sym.includes('^FTSE')) {
      return this.MARKETS['LSE'];
    }
    
    // Índice alemán
    if (sym.includes('DAX') || sym.includes('^GDAXI')) {
      return this.MARKETS['XETRA'];
    }
    
    // Índices japoneses
    if (sym.includes('N225') || sym.includes('NIKKEI') || sym.includes('^N225')) {
      return this.MARKETS['TSE'];
    }
    
    // Índices chinos
    if (sym.includes('SSE') || sym.includes('000001.SS') || sym.includes('SHANGHAI')) {
      return this.MARKETS['SSE'];
    }
    
    // Índices Hong Kong
    if (sym.includes('HSI') || sym.includes('^HSI') || sym.includes('HANG')) {
      return this.MARKETS['HKEX'];
    }
    
    // Índices USA (S&P, Dow, Nasdaq)
    if (sym.includes('SPX') || sym.includes('^GSPC') || sym.includes('DJI') || 
        sym.includes('^DJI') || sym.includes('IXIC') || sym.includes('^IXIC')) {
      return this.MARKETS['NYSE'];
    }
    
    // Forex
    if (sym.includes('/') || ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'EURGBP'].some(f => sym.includes(f))) {
      return this.MARKETS['FOREX'];
    }
    
    // Acciones y ETFs USA
    if (['AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 
         'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'ARKK', 'GLD', 'SLV', 'USO',
         'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA', 'PYPL', 'SQ', 'COIN',
         'XOM', 'CVX', 'COP', 'PFE', 'JNJ', 'UNH', 'MRNA', 'ABBV',
         'DIS', 'NFLX', 'WMT', 'COST', 'TGT', 'HD', 'LOW',
         'BA', 'LMT', 'RTX', 'CAT', 'DE'].some(s => sym === s || sym.startsWith(s))) {
      return this.MARKETS['NYSE'];
    }
    
    // Si empieza con ^ probablemente es un índice - intentar detectar por sufijo
    if (sym.startsWith('^')) {
      // Sufijos comunes de Yahoo Finance
      if (sym.endsWith('.MC')) return this.MARKETS['BME'];      // Madrid
      if (sym.endsWith('.PA')) return this.MARKETS['EURONEXT']; // Paris
      if (sym.endsWith('.L')) return this.MARKETS['LSE'];       // London
      if (sym.endsWith('.DE')) return this.MARKETS['XETRA'];    // Germany
      if (sym.endsWith('.T')) return this.MARKETS['TSE'];       // Tokyo
      if (sym.endsWith('.SS')) return this.MARKETS['SSE'];      // Shanghai
      if (sym.endsWith('.HK')) return this.MARKETS['HKEX'];     // Hong Kong
    }
    
    // Por defecto NYSE para símbolos desconocidos
    return this.MARKETS['NYSE'];
  }
  
  ngOnInit() {
    this.updateClocks();
    this.intervalId = setInterval(() => this.updateClocks(), 1000);
  }
  
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
  private updateClocks() {
    const now = new Date();
    
    // Hora local
    this.localTime.set(now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));
    
    // Estado del mercado relevante (solo uno)
    const market = this.getRelevantMarket();
    const status = this.getMarketStatus(market, now);
    this.marketStatuses.set([status]);
  }
  
  private getMarketStatus(market: MarketInfo, now: Date): MarketStatus {
    // Obtener hora en la zona horaria del mercado
    const marketTime = new Date(now.toLocaleString('en-US', { timeZone: market.timezone }));
    const hour = marketTime.getHours();
    const minute = marketTime.getMinutes();
    const day = marketTime.getDay(); // 0=Dom, 6=Sab
    
    const timeInMinutes = hour * 60 + minute;
    const openTime = market.openHour * 60 + market.openMinute;
    const closeTime = market.closeHour * 60 + market.closeMinute;
    
    let isOpen = false;
    let isPremarket = false;
    let isAfterHours = false;
    let nextEvent = '';
    let nextEventDate = new Date(marketTime);
    
    // Crypto - siempre abierto
    if (market.shortName === 'CRYPTO') {
      isOpen = true;
      nextEvent = '24/7';
      return {
        market,
        isOpen,
        isPremarket,
        isAfterHours,
        localTime: marketTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        nextEvent,
        nextEventTime: '',
        countdown: '∞'
      };
    }
    
    // Forex - especial (Dom 5PM - Vie 5PM ET)
    if (market.shortName === 'FOREX') {
      // Cerrado sábado y domingo antes de 5PM
      if (day === 6 || (day === 0 && timeInMinutes < 17 * 60)) {
        isOpen = false;
        nextEvent = 'Abre';
        // Calcular hasta domingo 5PM
        const daysUntilSunday = day === 6 ? 1 : 0;
        nextEventDate.setDate(nextEventDate.getDate() + daysUntilSunday);
        nextEventDate.setHours(17, 0, 0, 0);
      } else if (day === 5 && timeInMinutes >= 17 * 60) {
        // Viernes después de 5PM
        isOpen = false;
        nextEvent = 'Abre';
        nextEventDate.setDate(nextEventDate.getDate() + 2); // Domingo
        nextEventDate.setHours(17, 0, 0, 0);
      } else {
        isOpen = true;
        nextEvent = 'Cierra';
        // Calcular hasta viernes 5PM
        const daysUntilFriday = (5 - day + 7) % 7 || 7;
        nextEventDate.setDate(nextEventDate.getDate() + (day === 5 ? 0 : daysUntilFriday));
        nextEventDate.setHours(17, 0, 0, 0);
      }
    } else {
      // Mercados normales con horario fijo
      const isWeekend = market.weekendClosed && (day === 0 || day === 6);
      
      if (isWeekend) {
        isOpen = false;
        nextEvent = 'Abre Lun';
        // Calcular hasta lunes
        const daysUntilMonday = day === 0 ? 1 : 2;
        nextEventDate.setDate(nextEventDate.getDate() + daysUntilMonday);
        nextEventDate.setHours(market.openHour, market.openMinute, 0, 0);
      } else if (timeInMinutes >= openTime && timeInMinutes < closeTime) {
        // Mercado abierto
        isOpen = true;
        nextEvent = 'Cierra';
        nextEventDate.setHours(market.closeHour, market.closeMinute, 0, 0);
      } else if (market.premarketHour && timeInMinutes >= market.premarketHour * 60 && timeInMinutes < openTime) {
        // Pre-market
        isPremarket = true;
        nextEvent = 'Abre';
        nextEventDate.setHours(market.openHour, market.openMinute, 0, 0);
      } else if (market.afterhoursClose && timeInMinutes >= closeTime && timeInMinutes < market.afterhoursClose * 60) {
        // After-hours
        isAfterHours = true;
        nextEvent = 'Cierra AH';
        nextEventDate.setHours(market.afterhoursClose, 0, 0, 0);
      } else if (timeInMinutes < openTime) {
        // Antes de apertura
        isOpen = false;
        if (market.premarketHour && timeInMinutes < market.premarketHour * 60) {
          nextEvent = 'Pre-mkt';
          nextEventDate.setHours(market.premarketHour, 0, 0, 0);
        } else {
          nextEvent = 'Abre';
          nextEventDate.setHours(market.openHour, market.openMinute, 0, 0);
        }
      } else {
        // Después de cierre
        isOpen = false;
        nextEvent = 'Abre';
        nextEventDate.setDate(nextEventDate.getDate() + 1);
        // Si mañana es weekend, saltar al lunes
        const nextDay = nextEventDate.getDay();
        if (nextDay === 0) nextEventDate.setDate(nextEventDate.getDate() + 1);
        if (nextDay === 6) nextEventDate.setDate(nextEventDate.getDate() + 2);
        nextEventDate.setHours(market.openHour, market.openMinute, 0, 0);
      }
    }
    
    // Calcular countdown
    const diff = nextEventDate.getTime() - marketTime.getTime();
    const countdown = this.formatCountdown(diff);
    
    return {
      market,
      isOpen,
      isPremarket,
      isAfterHours,
      localTime: marketTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      nextEvent,
      nextEventTime: nextEventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      countdown
    };
  }
  
  private formatCountdown(ms: number): string {
    if (ms < 0) return '--:--';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  getStatusClass(status: MarketStatus): string {
    if (status.isOpen) {
      return 'bg-green-500/10 border border-green-500/30';
    }
    if (status.isPremarket) {
      return 'bg-yellow-500/10 border border-yellow-500/30';
    }
    if (status.isAfterHours) {
      return 'bg-orange-500/10 border border-orange-500/30';
    }
    return 'bg-red-500/10 border border-red-500/30';
  }
  
  getTooltip(status: MarketStatus): string {
    const m = status.market;
    let tooltip = `${m.name}\n`;
    tooltip += `Horario: ${m.openHour}:${m.openMinute.toString().padStart(2, '0')} - ${m.closeHour}:${m.closeMinute.toString().padStart(2, '0')}\n`;
    tooltip += `Zona: ${m.timezone}\n`;
    if (m.premarketHour) {
      tooltip += `Pre-market: ${m.premarketHour}:00\n`;
    }
    if (m.afterhoursClose) {
      tooltip += `After-hours hasta: ${m.afterhoursClose}:00\n`;
    }
    tooltip += `\n${status.nextEvent}: ${status.countdown}`;
    return tooltip;
  }
}
