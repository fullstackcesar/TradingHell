/**
 * Market Explorer Component - Explorador de mercados con categorías claras
 */

import { Component, inject, signal, computed, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradingService } from '../../services/trading.service';

interface MarketAsset {
  symbol: string;
  name: string;
  description: string;
  type: 'crypto' | 'stock' | 'etf' | 'forex' | 'index' | 'commodity';
}

interface MarketCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  assets: MarketAsset[];
}

@Component({
  selector: 'app-market-explorer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="trading-card h-full flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold">🌍 Explorador de Mercados</h2>
        <button 
          (click)="toggleExpanded()"
          class="text-xs text-gray-400 hover:text-white transition">
          {{ isExpanded() ? '➖ Minimizar' : '➕ Expandir' }}
        </button>
      </div>
      
      <!-- Búsqueda -->
      <div class="mb-3">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="🔍 Buscar activo..."
          class="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 
                 focus:border-indigo-500 focus:outline-none text-sm"
        />
      </div>
      
      <!-- Tabs de categorías -->
      <div class="flex flex-wrap gap-1 mb-3">
        @for (cat of categories; track cat.id) {
          <button
            (click)="selectCategory(cat.id)"
            [class]="selectedCategory() === cat.id 
              ? 'bg-indigo-600 border-indigo-500' 
              : 'bg-gray-800 border-gray-700 hover:border-indigo-500'"
            class="px-2 py-1 rounded text-xs border transition flex items-center gap-1"
            [title]="cat.description">
            <span>{{ cat.icon }}</span>
            <span class="hidden sm:inline">{{ cat.name }}</span>
          </button>
        }
      </div>
      
      <!-- Descripción de la categoría -->
      @if (isExpanded()) {
        <div class="mb-3 p-2 rounded bg-gray-800/50 border border-gray-700">
          <p class="text-xs text-gray-400">
            <span class="text-indigo-400 font-medium">{{ currentCategory()?.icon }} {{ currentCategory()?.name }}:</span>
            {{ currentCategory()?.description }}
          </p>
        </div>
      }
      
      <!-- Lista de activos -->
      <div class="flex-1 overflow-auto space-y-1" [class.max-h-32]="!isExpanded()" [class.max-h-64]="isExpanded()">
        @for (asset of filteredAssets(); track asset.symbol) {
          <button
            (click)="selectAsset(asset)"
            [class]="isSelected(asset.symbol) ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800/50 border-gray-700 hover:border-indigo-500'"
            class="w-full p-2 rounded border text-left transition group">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-sm text-white">{{ asset.symbol }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded" [class]="getTypeClass(asset.type)">
                    {{ getTypeLabel(asset.type) }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 truncate">{{ asset.name }}</p>
                @if (isExpanded()) {
                  <p class="text-xs text-gray-500 mt-1">{{ asset.description }}</p>
                }
              </div>
              <span class="text-indigo-400 opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
          </button>
        } @empty {
          <div class="text-center py-4 text-gray-500 text-sm">
            No se encontraron activos
          </div>
        }
      </div>
      
      <!-- Info para novatos -->
      @if (isExpanded()) {
        <div class="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
          <p class="text-xs text-yellow-400 font-medium mb-1">💡 Consejo para principiantes</p>
          <p class="text-xs text-gray-400">{{ currentTip() }}</p>
        </div>
      }
    </div>
  `
})
export class MarketExplorerComponent {
  private readonly tradingService = inject(TradingService);
  
  readonly assetSelected = output<string>();
  
  searchQuery = '';
  readonly isExpanded = signal(false);
  readonly selectedCategory = signal('crypto');
  
  readonly currentSymbol = computed(() => this.tradingService.currentSymbol());
  
  readonly categories: MarketCategory[] = [
    {
      id: 'crypto',
      name: 'Criptomonedas',
      icon: '₿',
      description: 'Monedas digitales descentralizadas. Alta volatilidad = alto riesgo pero también mayores oportunidades. Opera 24/7.',
      assets: [
        { symbol: 'BTCUSDT', name: 'Bitcoin', description: 'La criptomoneda original. "Oro digital". La más estable del mercado crypto.', type: 'crypto' },
        { symbol: 'ETHUSDT', name: 'Ethereum', description: 'Plataforma de contratos inteligentes. Base de DeFi y NFTs.', type: 'crypto' },
        { symbol: 'BNBUSDT', name: 'Binance Coin', description: 'Token del exchange Binance. Descuentos en comisiones.', type: 'crypto' },
        { symbol: 'XRPUSDT', name: 'Ripple', description: 'Enfocado en pagos bancarios internacionales rápidos.', type: 'crypto' },
        { symbol: 'SOLUSDT', name: 'Solana', description: 'Blockchain ultra-rápida. Competidor de Ethereum.', type: 'crypto' },
        { symbol: 'ADAUSDT', name: 'Cardano', description: 'Blockchain "científica". Desarrollo lento pero seguro.', type: 'crypto' },
        { symbol: 'DOGEUSDT', name: 'Dogecoin', description: 'Memecoin original. Muy volátil. Influenciado por Elon Musk.', type: 'crypto' },
        { symbol: 'DOTUSDT', name: 'Polkadot', description: 'Conecta diferentes blockchains entre sí.', type: 'crypto' },
        { symbol: 'MATICUSDT', name: 'Polygon', description: 'Solución de escalado para Ethereum. Transacciones baratas.', type: 'crypto' },
        { symbol: 'LINKUSDT', name: 'Chainlink', description: 'Oráculos que conectan blockchain con datos del mundo real.', type: 'crypto' },
        { symbol: 'AVAXUSDT', name: 'Avalanche', description: 'Blockchain rápida con subredes personalizables.', type: 'crypto' },
        { symbol: 'ATOMUSDT', name: 'Cosmos', description: 'Internet de blockchains. Interoperabilidad.', type: 'crypto' },
      ]
    },
    {
      id: 'stocks-us',
      name: 'Acciones USA',
      icon: '🇺🇸',
      description: 'Empresas cotizadas en bolsas estadounidenses (NYSE, NASDAQ). Mercado más líquido del mundo. Horario: 15:30-22:00 (España).',
      assets: [
        { symbol: 'AAPL', name: 'Apple Inc.', description: 'Fabricante de iPhone, Mac. Empresa más valiosa del mundo.', type: 'stock' },
        { symbol: 'MSFT', name: 'Microsoft', description: 'Windows, Office, Azure (cloud). Muy estable.', type: 'stock' },
        { symbol: 'GOOGL', name: 'Alphabet (Google)', description: 'Buscador, YouTube, Android. Domina publicidad digital.', type: 'stock' },
        { symbol: 'AMZN', name: 'Amazon', description: 'E-commerce + AWS (cloud). Líder en logística.', type: 'stock' },
        { symbol: 'NVDA', name: 'NVIDIA', description: 'GPUs para gaming e IA. Beneficiario del boom de IA.', type: 'stock' },
        { symbol: 'META', name: 'Meta (Facebook)', description: 'Facebook, Instagram, WhatsApp. Apuesta por el metaverso.', type: 'stock' },
        { symbol: 'TSLA', name: 'Tesla', description: 'Coches eléctricos + energía. Muy volátil. Elon Musk.', type: 'stock' },
        { symbol: 'JPM', name: 'JPMorgan Chase', description: 'Banco más grande de USA. Indicador económico.', type: 'stock' },
        { symbol: 'V', name: 'Visa', description: 'Red de pagos global. Beneficiario del consumo.', type: 'stock' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', description: 'Farmacéutica + consumo. Muy defensiva y estable.', type: 'stock' },
        { symbol: 'WMT', name: 'Walmart', description: 'Retail más grande del mundo. Defensivo en recesiones.', type: 'stock' },
        { symbol: 'DIS', name: 'Disney', description: 'Entretenimiento: parques, películas, Disney+.', type: 'stock' },
      ]
    },
    {
      id: 'stocks-eu',
      name: 'Europa',
      icon: '🇪🇺',
      description: 'Empresas europeas. Mercado español (IBEX 35) y otras bolsas europeas. Horario: 9:00-17:30.',
      assets: [
        { symbol: 'SAN.MC', name: 'Banco Santander', description: 'Banco español más grande. Exposición a Latinoamérica.', type: 'stock' },
        { symbol: 'BBVA.MC', name: 'BBVA', description: 'Banco español. Fuerte en México y Turquía.', type: 'stock' },
        { symbol: 'IBE.MC', name: 'Iberdrola', description: 'Eléctrica española. Líder en renovables mundial.', type: 'stock' },
        { symbol: 'TEF.MC', name: 'Telefónica', description: 'Teleco española. Fuerte dividendo pero deuda alta.', type: 'stock' },
        { symbol: 'ITX.MC', name: 'Inditex (Zara)', description: 'Moda global. Modelo de negocio único.', type: 'stock' },
        { symbol: 'REP.MC', name: 'Repsol', description: 'Petrolera española. Sensible al precio del crudo.', type: 'stock' },
        { symbol: 'ASML.AS', name: 'ASML', description: 'Holandesa. Monopolio en máquinas de chips. Clave para IA.', type: 'stock' },
        { symbol: 'SAP.DE', name: 'SAP', description: 'Software empresarial alemán. Muy estable.', type: 'stock' },
        { symbol: 'MC.PA', name: 'LVMH', description: 'Lujo francés: Louis Vuitton, Dior. Beneficiario de Asia.', type: 'stock' },
        { symbol: 'NESN.SW', name: 'Nestlé', description: 'Alimentación suiza. Ultra-defensiva.', type: 'stock' },
      ]
    },
    {
      id: 'etf',
      name: 'ETFs',
      icon: '📊',
      description: 'Fondos que replican índices. IDEALES para principiantes: diversificación instantánea con una sola compra. Bajo coste.',
      assets: [
        { symbol: 'SPY', name: 'S&P 500 ETF', description: '500 mayores empresas USA. EL MEJOR para empezar.', type: 'etf' },
        { symbol: 'QQQ', name: 'Nasdaq 100 ETF', description: '100 mayores tech USA. Más volátil pero más potencial.', type: 'etf' },
        { symbol: 'IWM', name: 'Russell 2000 ETF', description: 'Small caps USA. Mayor riesgo/recompensa.', type: 'etf' },
        { symbol: 'EEM', name: 'Mercados Emergentes', description: 'Acciones de países en desarrollo. Mayor volatilidad.', type: 'etf' },
        { symbol: 'VEA', name: 'Mercados Desarrollados', description: 'Europa, Japón, Australia. Diversificación internacional.', type: 'etf' },
        { symbol: 'GLD', name: 'Oro ETF', description: 'Replica precio del oro. Refugio en crisis.', type: 'etf' },
        { symbol: 'TLT', name: 'Bonos Largo Plazo', description: 'Bonos USA 20+ años. Inverso a tipos de interés.', type: 'etf' },
        { symbol: 'XLF', name: 'Financiero USA', description: 'Bancos y aseguradoras USA. Sensible a tipos.', type: 'etf' },
        { symbol: 'XLE', name: 'Energía USA', description: 'Petroleras y gasistas. Sensible al precio del crudo.', type: 'etf' },
        { symbol: 'ARKK', name: 'ARK Innovation', description: 'ETF temático de innovación disruptiva. MUY volátil.', type: 'etf' },
      ]
    },
    {
      id: 'forex',
      name: 'Forex',
      icon: '💱',
      description: 'Pares de divisas. Mercado más líquido del mundo. Opera 24h de lunes a viernes. Requiere experiencia.',
      assets: [
        { symbol: 'EURUSD=X', name: 'EUR/USD', description: 'Euro vs Dólar. Par más operado del mundo.', type: 'forex' },
        { symbol: 'GBPUSD=X', name: 'GBP/USD', description: 'Libra vs Dólar. "Cable". Muy líquido.', type: 'forex' },
        { symbol: 'USDJPY=X', name: 'USD/JPY', description: 'Dólar vs Yen. Influenciado por Banco de Japón.', type: 'forex' },
        { symbol: 'USDCHF=X', name: 'USD/CHF', description: 'Dólar vs Franco Suizo. Franco = refugio.', type: 'forex' },
        { symbol: 'AUDUSD=X', name: 'AUD/USD', description: 'Dólar Australiano vs USD. Sensible a materias primas.', type: 'forex' },
        { symbol: 'USDCAD=X', name: 'USD/CAD', description: 'Dólar vs Dólar Canadiense. Sensible al petróleo.', type: 'forex' },
        { symbol: 'EURGBP=X', name: 'EUR/GBP', description: 'Euro vs Libra. Cross europeo popular.', type: 'forex' },
        { symbol: 'EURJPY=X', name: 'EUR/JPY', description: 'Euro vs Yen. Más volátil que majors.', type: 'forex' },
      ]
    },
    {
      id: 'commodities',
      name: 'Materias Primas',
      icon: '🛢️',
      description: 'Oro, petróleo, gas, etc. Protección contra inflación. Ciclos largos.',
      assets: [
        { symbol: 'GC=F', name: 'Oro (Futures)', description: 'Refugio por excelencia. Sube en crisis e inflación.', type: 'commodity' },
        { symbol: 'SI=F', name: 'Plata (Futures)', description: 'Metal precioso + industrial. Más volátil que oro.', type: 'commodity' },
        { symbol: 'CL=F', name: 'Petróleo WTI', description: 'Crudo americano. Indicador económico global.', type: 'commodity' },
        { symbol: 'BZ=F', name: 'Petróleo Brent', description: 'Crudo europeo. Referencia internacional.', type: 'commodity' },
        { symbol: 'NG=F', name: 'Gas Natural', description: 'MUY volátil. Sensible a clima y geopolítica.', type: 'commodity' },
        { symbol: 'HG=F', name: 'Cobre', description: 'Metal industrial. Indicador de salud económica.', type: 'commodity' },
        { symbol: 'ZC=F', name: 'Maíz', description: 'Commodity agrícola. Sensible a clima.', type: 'commodity' },
        { symbol: 'ZW=F', name: 'Trigo', description: 'Commodity agrícola. Afectado por geopolítica.', type: 'commodity' },
      ]
    },
    {
      id: 'indices',
      name: 'Índices',
      icon: '📈',
      description: 'Índices bursátiles principales. No se pueden operar directamente, pero sirven de referencia.',
      assets: [
        { symbol: '^GSPC', name: 'S&P 500', description: '500 mayores empresas USA. LA referencia mundial.', type: 'index' },
        { symbol: '^DJI', name: 'Dow Jones', description: '30 blue chips USA. El más antiguo.', type: 'index' },
        { symbol: '^IXIC', name: 'Nasdaq Composite', description: 'Todas las empresas del Nasdaq. Tech-heavy.', type: 'index' },
        { symbol: '^IBEX', name: 'IBEX 35', description: '35 mayores empresas españolas.', type: 'index' },
        { symbol: '^STOXX50E', name: 'Euro Stoxx 50', description: '50 mayores empresas zona euro.', type: 'index' },
        { symbol: '^FTSE', name: 'FTSE 100', description: '100 mayores empresas Reino Unido.', type: 'index' },
        { symbol: '^N225', name: 'Nikkei 225', description: '225 mayores empresas Japón.', type: 'index' },
        { symbol: '^VIX', name: 'VIX (Miedo)', description: 'Índice de volatilidad. Alto = miedo en el mercado.', type: 'index' },
      ]
    }
  ];
  
  readonly tips: Record<string, string> = {
    'crypto': 'Las criptos son MUY volátiles. Nunca inviertas más de lo que puedas perder. Bitcoin es la más "segura" del sector.',
    'stocks-us': 'Las big tech (AAPL, MSFT, GOOGL) son las más estables. Evita "meme stocks" si eres principiante.',
    'stocks-eu': 'El mercado español tiene menos liquidez. Cuidado con los spreads en valores pequeños.',
    'etf': '¡PERFECTOS para empezar! SPY o QQQ te dan diversificación instantánea sin complicarte.',
    'forex': 'Forex requiere experiencia. El apalancamiento puede multiplicar pérdidas. No recomendado para novatos.',
    'commodities': 'Las materias primas tienen ciclos largos. El oro es refugio en crisis. El petróleo es muy volátil.',
    'indices': 'Los índices no se compran directamente, pero sus ETFs sí (SPY para S&P 500, QQQ para Nasdaq).'
  };
  
  readonly currentCategory = computed(() => 
    this.categories.find(c => c.id === this.selectedCategory())
  );
  
  readonly currentTip = computed(() => 
    this.tips[this.selectedCategory()] || 'Investiga siempre antes de invertir.'
  );
  
  readonly filteredAssets = computed(() => {
    const category = this.currentCategory();
    if (!category) return [];
    
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return category.assets;
    
    return category.assets.filter(a => 
      a.symbol.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    );
  });
  
  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }
  
  selectCategory(id: string): void {
    this.selectedCategory.set(id);
    this.searchQuery = '';
  }
  
  selectAsset(asset: MarketAsset): void {
    this.tradingService.setSymbol(asset.symbol);
  }
  
  isSelected(symbol: string): boolean {
    return this.currentSymbol() === symbol;
  }
  
  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'crypto': 'bg-orange-500/20 text-orange-400',
      'stock': 'bg-blue-500/20 text-blue-400',
      'etf': 'bg-green-500/20 text-green-400',
      'forex': 'bg-purple-500/20 text-purple-400',
      'commodity': 'bg-yellow-500/20 text-yellow-400',
      'index': 'bg-pink-500/20 text-pink-400'
    };
    return classes[type] || 'bg-gray-500/20 text-gray-400';
  }
  
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'crypto': 'Crypto',
      'stock': 'Acción',
      'etf': 'ETF',
      'forex': 'Forex',
      'commodity': 'Materia',
      'index': 'Índice'
    };
    return labels[type] || type;
  }
}
