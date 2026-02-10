/**
 * Learning Component - Centro educativo con base de conocimiento de trading
 * Contenido: Murphy's Technical Analysis, Indicadores, Patrones, etc.
 */

import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { PATTERN_SVGS, PATTERN_GALLERY, PatternInfo } from '../../constants/pattern-svgs';

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  icon: string;
  content: string;
  sections: { title: string; content: string; patterns?: string[] }[];
  isGallery?: boolean; // Para artículos tipo galería visual
}

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [],
  template: `
    <div class="h-full flex flex-col bg-trading-bg">
      <!-- Header -->
      <div class="flex-shrink-0 p-3 border-b border-trading-border">
        <h2 class="text-lg font-bold flex items-center gap-2">
          📚 Centro de Aprendizaje
          <span class="text-xs text-gray-500 font-normal">Base de conocimiento de trading profesional</span>
        </h2>
      </div>
      
      <!-- Layout 2 columnas: Menú + Contenido -->
      <div class="flex-1 flex min-h-0 overflow-hidden">
        
        <!-- Sidebar: Categorías -->
        <div class="w-64 flex-shrink-0 border-r border-trading-border overflow-y-auto">
          <div class="p-2 space-y-1">
            @for (cat of categories(); track cat.id) {
              <button 
                (click)="selectCategory(cat.id)"
                class="w-full text-left px-3 py-2 rounded transition-all flex items-center gap-2"
                [class]="selectedCategory() === cat.id 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' 
                  : 'hover:bg-gray-800 text-gray-400 hover:text-white'">
                <span class="text-lg">{{ cat.icon }}</span>
                <div>
                  <div class="font-medium text-sm">{{ cat.title }}</div>
                  <div class="text-xs text-gray-500">{{ cat.count }} artículos</div>
                </div>
              </button>
            }
          </div>
          
          <!-- Quick Tips -->
          <div class="p-3 m-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <h4 class="text-xs font-bold text-yellow-400 mb-2">💡 Tip del día</h4>
            <p class="text-xs text-gray-300">{{ dailyTip() }}</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
          @if (loading()) {
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="animate-spin text-4xl mb-3">📖</div>
                <p class="text-gray-400">Cargando contenido...</p>
              </div>
            </div>
          } @else if (selectedArticle()) {
            <!-- Article View -->
            <div class="p-4 max-w-4xl mx-auto">
              <button 
                (click)="selectedArticle.set(null)"
                class="text-xs text-indigo-400 hover:text-indigo-300 mb-3 flex items-center gap-1">
                ← Volver a {{ getCategoryTitle(selectedCategory()) }}
              </button>
              
              <article class="prose prose-invert max-w-none">
                <h1 class="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span class="text-3xl">{{ selectedArticle()!.icon }}</span>
                  {{ selectedArticle()!.title }}
                </h1>
                
                <!-- GALERÍA VISUAL DE PATRONES -->
                @if (selectedArticle()!.isGallery) {
                  <div class="not-prose">
                    <!-- Filtros -->
                    <div class="flex gap-2 mb-4 flex-wrap">
                      <button 
                        (click)="galleryFilter.set('all')"
                        class="px-3 py-1 rounded text-sm transition-all"
                        [class]="galleryFilter() === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        Todos
                      </button>
                      <button 
                        (click)="galleryFilter.set('bullish')"
                        class="px-3 py-1 rounded text-sm transition-all"
                        [class]="galleryFilter() === 'bullish' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        🟢 Alcistas
                      </button>
                      <button 
                        (click)="galleryFilter.set('bearish')"
                        class="px-3 py-1 rounded text-sm transition-all"
                        [class]="galleryFilter() === 'bearish' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        🔴 Bajistas
                      </button>
                      <button 
                        (click)="galleryFilter.set('neutral')"
                        class="px-3 py-1 rounded text-sm transition-all"
                        [class]="galleryFilter() === 'neutral' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
                        ⚪ Neutrales
                      </button>
                    </div>
                    
                    <!-- Grid de patrones -->
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      @for (pattern of getFilteredPatterns(); track pattern.key) {
                        <div class="p-4 rounded-lg border transition-all hover:scale-105"
                             [class]="getPatternCardClass(pattern.signal)">
                          <!-- SVG del patrón -->
                          <div class="bg-gray-900/50 rounded-lg p-3 mb-3 flex items-center justify-center min-h-[100px]"
                               [innerHTML]="getPatternSVG(pattern.key)">
                          </div>
                          
                          <!-- Info -->
                          <div class="text-center">
                            <h4 class="font-bold text-sm mb-1" [class]="getPatternTextClass(pattern.signal)">
                              {{ pattern.name }}
                            </h4>
                            <p class="text-xs text-gray-500 mb-2">{{ pattern.nameEn }}</p>
                            <p class="text-xs text-gray-400">{{ pattern.description }}</p>
                            <div class="flex justify-center gap-2 mt-2">
                              <span class="text-xs px-2 py-0.5 rounded"
                                    [class]="getPatternBadgeClass(pattern.signal)">
                                {{ pattern.signal === 'bullish' ? '🟢 Alcista' : pattern.signal === 'bearish' ? '🔴 Bajista' : '⚪ Neutral' }}
                              </span>
                              <span class="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                                {{ pattern.candles }} {{ pattern.candles === 1 ? 'vela' : 'velas' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                    
                    <!-- Leyenda -->
                    <div class="mt-6 p-4 bg-gray-800/50 rounded-lg">
                      <h4 class="text-sm font-bold text-gray-300 mb-2">📖 Leyenda de colores</h4>
                      <div class="flex flex-wrap gap-4 text-xs">
                        <div class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-green-500 rounded"></span>
                          <span class="text-gray-400">Verde = Vela alcista (cierre > apertura)</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-red-500 rounded"></span>
                          <span class="text-gray-400">Rojo = Vela bajista (cierre < apertura)</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-gray-500 rounded"></span>
                          <span class="text-gray-400">Gris = Indecisión / neutral</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                
                <!-- Table of Contents -->
                @if (selectedArticle()!.sections.length > 1 && !selectedArticle()!.isGallery) {
                  <div class="bg-gray-800/50 rounded-lg p-4 mb-6 not-prose">
                    <h3 class="text-sm font-bold text-gray-300 mb-2">📋 Contenido</h3>
                    <ul class="space-y-1">
                      @for (section of selectedArticle()!.sections; track section.title; let i = $index) {
                        <li>
                          <a 
                            (click)="scrollToSection(i)"
                            class="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer">
                            {{ i + 1 }}. {{ section.title }}
                          </a>
                        </li>
                      }
                    </ul>
                  </div>
                }
                
                <!-- Sections -->
                @for (section of selectedArticle()!.sections; track section.title; let i = $index) {
                  <div [id]="'section-' + i" class="mb-8">
                    <h2 class="text-xl font-bold text-indigo-400 mb-3 pb-2 border-b border-gray-700">
                      {{ section.title }}
                    </h2>
                    
                    <!-- Pattern Visual Cards -->
                    @if (section.patterns?.length) {
                      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        @for (patternName of section.patterns!; track patternName) {
                          <div class="rounded-lg p-3 flex flex-col items-center border"
                               [class]="getPatternCardClass(findPatternInfo(patternName)?.signal || 'neutral')">
                            <div [innerHTML]="getPatternSVG(patternName)" class="mb-2"></div>
                            <span class="text-xs font-medium text-center"
                                  [class]="getPatternTextClass(findPatternInfo(patternName)?.signal || 'neutral')">{{ patternName }}</span>
                          </div>
                        }
                      </div>
                    }
                    
                    <div 
                      class="text-gray-300 leading-relaxed whitespace-pre-line"
                      [innerHTML]="formatContent(section.content)">
                    </div>
                  </div>
                }
              </article>
            </div>
          } @else {
            <!-- Article List -->
            <div class="p-4">
              <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                {{ getCategoryIcon(selectedCategory()) }} {{ getCategoryTitle(selectedCategory()) }}
              </h3>
              
              <div class="grid gap-3">
                @for (article of filteredArticles(); track article.id) {
                  <button 
                    (click)="selectArticle(article)"
                    class="text-left p-4 rounded-lg bg-trading-card border border-trading-border 
                           hover:border-indigo-500/50 transition-all group">
                    <div class="flex items-start gap-3">
                      <span class="text-2xl group-hover:scale-110 transition-transform">{{ article.icon }}</span>
                      <div class="flex-1">
                        <h4 class="font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {{ article.title }}
                        </h4>
                        <p class="text-sm text-gray-400 mt-1 line-clamp-2">
                          {{ getPreview(article) }}
                        </p>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                            {{ article.sections.length }} secciones
                          </span>
                          <span class="text-xs text-gray-500">
                            ~{{ getReadingTime(article) }} min lectura
                          </span>
                        </div>
                      </div>
                      <span class="text-gray-600 group-hover:text-indigo-400 transition-colors">→</span>
                    </div>
                  </button>
                }
                
                @if (filteredArticles().length === 0) {
                  <div class="text-center py-8 text-gray-500">
                    <span class="text-4xl block mb-2">📭</span>
                    No hay artículos en esta categoría
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .prose h3 { @apply text-lg font-bold text-white mt-6 mb-2; }
    .prose h4 { @apply text-base font-bold text-gray-300 mt-4 mb-2; }
    .prose p { @apply mb-3; }
    .prose ul { @apply list-disc list-inside space-y-1 mb-3; }
    .prose ol { @apply list-decimal list-inside space-y-1 mb-3; }
    .prose strong { @apply text-indigo-400; }
    .prose code { @apply bg-gray-800 px-1 py-0.5 rounded text-sm text-yellow-400; }
    .prose blockquote { 
      @apply border-l-4 border-indigo-500 pl-4 italic text-gray-400 my-4;
    }
  `]
})
export class LearningComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  
  readonly loading = signal(true);
  readonly selectedCategory = signal('murphy');
  readonly selectedArticle = signal<KnowledgeArticle | null>(null);
  readonly articles = signal<KnowledgeArticle[]>([]);
  readonly galleryFilter = signal<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  
  // Datos de galería de patrones
  readonly patternGallery = PATTERN_GALLERY;
  
  readonly categories = signal([
    { id: 'murphy', title: 'Teoría de Murphy', icon: '📈', count: 0 },
    { id: 'indicadores', title: 'Indicadores Técnicos', icon: '📊', count: 0 },
    { id: 'patrones', title: 'Patrones de Velas', icon: '🕯️', count: 0 },
    { id: 'soportes', title: 'Soportes y Resistencias', icon: '📍', count: 0 },
    { id: 'volumen', title: 'Análisis de Volumen', icon: '📶', count: 0 },
    { id: 'riesgo', title: 'Gestión de Riesgo', icon: '🛡️', count: 0 },
    { id: 'mercados', title: 'Tipos de Mercados', icon: '🌐', count: 0 },
  ]);
  
  readonly dailyTips = [
    'La tendencia es tu amiga... hasta que termina. Siempre confirma con volumen.',
    'Nunca arriesgues más del 2% de tu capital en una sola operación.',
    'Los patrones de velas son más fiables en marcos temporales mayores (4H, 1D).',
    'Un soporte roto se convierte en resistencia, y viceversa.',
    'El volumen precede al precio. Observa divergencias.',
    'Sé paciente. Las mejores oportunidades llegan a quienes esperan.',
    'Documenta tus operaciones. El trading journal es tu mejor maestro.',
  ];
  
  readonly dailyTip = signal(this.dailyTips[Math.floor(Math.random() * this.dailyTips.length)]);
  
  readonly filteredArticles = signal<KnowledgeArticle[]>([]);
  
  ngOnInit() {
    this.loadKnowledgeBase();
  }
  
  async loadKnowledgeBase() {
    this.loading.set(true);
    try {
      const response = await this.http.get<{ articles: KnowledgeArticle[] }>(
        `${environment.apiUrl}/api/knowledge-base`
      ).toPromise();
      
      if (response?.articles) {
        this.articles.set(response.articles);
        this.updateCategoryCounts();
        this.filterByCategory();
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      // Fallback: cargar contenido hardcoded
      this.loadFallbackContent();
    }
    this.loading.set(false);
  }
  
  loadFallbackContent() {
    // Contenido básico de fallback
    const fallbackArticles: KnowledgeArticle[] = [
      {
        id: 'murphy-dow',
        title: 'Teoría de Dow - Los 6 Principios',
        category: 'murphy',
        icon: '📈',
        content: '',
        sections: [
          {
            title: 'Principio 1: El mercado lo descuenta todo',
            content: 'El precio actual refleja toda la información disponible: noticias, datos económicos, expectativas y emociones del mercado.'
          },
          {
            title: 'Principio 2: Las tres tendencias del mercado',
            content: '• TENDENCIA PRIMARIA (1-3 años): La dirección principal del mercado\n• TENDENCIA SECUNDARIA (3 semanas-3 meses): Correcciones dentro de la primaria\n• TENDENCIA MENOR (menos de 3 semanas): Ruido del día a día'
          },
          {
            title: 'Principio 3: Las tres fases de las tendencias',
            content: '• ACUMULACIÓN: Los inversores informados compran/venden silenciosamente\n• PARTICIPACIÓN PÚBLICA: La tendencia se hace evidente, el público entra\n• DISTRIBUCIÓN: Los profesionales salen mientras el público sigue entrando'
          },
          {
            title: 'Principio 4: Confirmación entre índices',
            content: 'Una señal es más fiable cuando múltiples indicadores o activos correlacionados la confirman.'
          },
          {
            title: 'Principio 5: El volumen confirma la tendencia',
            content: '• Tendencia alcista: Volumen debe AUMENTAR en subidas\n• Tendencia bajista: Volumen debe AUMENTAR en bajadas\n• Divergencia volumen-precio = señal de alerta'
          },
          {
            title: 'Principio 6: La tendencia continúa hasta señal contraria',
            content: 'Nunca asumas que una tendencia ha terminado sin confirmación clara. Los cambios de tendencia requieren:\n• Ruptura de estructura (Higher Highs/Lower Lows)\n• Confirmación de volumen\n• Tiempo de consolidación'
          }
        ]
      },
      {
        id: 'indicadores-rsi',
        title: 'RSI - Índice de Fuerza Relativa',
        category: 'indicadores',
        icon: '📊',
        content: '',
        sections: [
          {
            title: '¿Qué es el RSI?',
            content: 'El RSI mide la velocidad y magnitud de los movimientos de precio en una escala de 0 a 100.\n\nFórmula: RSI = 100 - (100 / (1 + RS))\nDonde RS = Promedio de ganancias / Promedio de pérdidas'
          },
          {
            title: 'Interpretación clásica',
            content: '• RSI > 70: Sobrecompra (posible corrección bajista)\n• RSI < 30: Sobreventa (posible rebote alcista)\n• RSI = 50: Zona neutral'
          },
          {
            title: 'Divergencias',
            content: '• DIVERGENCIA ALCISTA: Precio hace mínimos más bajos, RSI hace mínimos más altos → Posible cambio a alcista\n• DIVERGENCIA BAJISTA: Precio hace máximos más altos, RSI hace máximos más bajos → Posible cambio a bajista'
          }
        ]
      },
      // ============================================================
      // GALERÍA VISUAL DE PATRONES DE VELAS
      // ============================================================
      {
        id: 'patrones-galeria-visual',
        title: '🎨 Galería Visual de Patrones de Velas',
        category: 'patrones',
        icon: '🖼️',
        content: '',
        sections: [],
        isGallery: true  // Marca especial para mostrar galería visual
      },
      // ============================================================
      // ARTÍCULO COMPLETO DE PATRONES DE VELAS (ChartGuys Based)
      // ============================================================
      {
        id: 'patrones-velas-completo',
        title: 'Guía Completa de Patrones de Velas Japonesas',
        category: 'patrones',
        icon: '🕯️',
        content: '',
        sections: [
          {
            title: 'Introducción a las Velas Japonesas',
            content: 'Las velas japonesas son una forma de representar el movimiento del precio que muestra 4 datos clave en cada período:\n\n• **Apertura (Open)**: Precio al inicio del período\n• **Cierre (Close)**: Precio al final del período\n• **Máximo (High)**: Precio más alto alcanzado\n• **Mínimo (Low)**: Precio más bajo alcanzado\n\n**Anatomía de una vela:**\n• **Cuerpo Real**: Distancia entre apertura y cierre\n• **Mecha Superior**: Distancia entre el máximo y el cuerpo\n• **Mecha Inferior**: Distancia entre el mínimo y el cuerpo\n\n**Colores:**\n• **Verde/Blanca**: Cierre > Apertura (alcista)\n• **Roja/Negra**: Cierre < Apertura (bajista)'
          },
          {
            title: 'Patrones Neutrales - Indecisión',
            patterns: ['Doji', 'Doji Piernas Largas', 'Peonza'],
            content: '**DOJI ➕**\nApertura y cierre prácticamente iguales, formando una cruz. Indica que ni compradores ni vendedores dominaron.\n• Señal: INDECISIÓN - esperar confirmación\n• Tras tendencia alcista: posible cambio bajista\n• Tras tendencia bajista: posible cambio alcista\n\n**DOJI DE PIERNAS LARGAS (Long-Legged Doji)**\nDoji con mechas muy largas arriba y abajo. Gran volatilidad pero precio vuelve al origen.\n• Señal: ALTA INDECISIÓN Y VOLATILIDAD\n• Más significativo en zonas de soporte/resistencia\n\n**SPINNING TOP (Peonza)**\nCuerpo pequeño con mechas medianas similares arriba y abajo.\n• Señal: NEUTRAL - ni compradores ni vendedores controlan\n• Contexto determina si es alcista o bajista'
          },
          {
            title: 'Patrones Alcistas de 1 Vela',
            patterns: ['Martillo', 'Martillo Invertido', 'Doji Libélula', 'Marubozu Alcista'],
            content: '**MARTILLO (Hammer) 🔨**\nCuerpo pequeño en la parte SUPERIOR, mecha larga hacia ABAJO (2-3x el cuerpo).\n• Los vendedores llevaron el precio abajo pero los compradores recuperaron\n• Señal: 🟢 ALCISTA (si aparece tras tendencia bajista)\n• El color del cuerpo es secundario, la forma es clave\n• Requiere confirmación: vela verde siguiente\n\n**MARTILLO INVERTIDO (Inverted Hammer)**\nCuerpo pequeño en la parte INFERIOR, mecha larga hacia ARRIBA.\n• Los compradores intentaron subir el precio\n• Señal: 🟢 ALCISTA (si aparece tras tendencia bajista)\n• Menos fiable que el martillo clásico\n\n**DRAGONFLY DOJI (Doji Libélula)**\nForma de T invertida: línea horizontal arriba, mecha larga abajo.\n• Caso especial de martillo donde apertura = cierre\n• Señal: 🟢 ALCISTA\n• Muy fuerte en soportes\n\n**MARUBOZU ALCISTA**\nCuerpo verde grande SIN mechas (o muy pequeñas).\n• Dominio total de compradores desde apertura hasta cierre\n• Señal: 🟢 FUERTEMENTE ALCISTA\n• La ausencia de mechas indica fuerza del movimiento'
          },
          {
            title: 'Patrones Bajistas de 1 Vela',
            patterns: ['Estrella Fugaz', 'Hombre Colgado', 'Doji Lápida', 'Marubozu Bajista'],
            content: '**ESTRELLA FUGAZ (Shooting Star) ⭐**\nCuerpo pequeño en la parte INFERIOR, mecha larga hacia ARRIBA.\n• Los compradores llevaron el precio arriba pero vendedores rechazaron\n• Señal: 🔴 BAJISTA (si aparece tras tendencia alcista)\n• MISMA FORMA que martillo invertido pero en contexto opuesto\n• Requiere confirmación: vela roja siguiente\n\n**HOMBRE COLGADO (Hanging Man) 👻**\nCuerpo pequeño en la parte SUPERIOR, mecha larga hacia ABAJO.\n• MISMA FORMA que martillo pero tras tendencia ALCISTA\n• Señal: 🔴 BAJISTA - los vendedores empiezan a presionar\n• La presión vendedora aparece aunque el precio cierre arriba\n\n**GRAVESTONE DOJI (Doji Lápida)**\nForma de T: línea horizontal abajo, mecha larga arriba.\n• Caso especial de estrella fugaz donde apertura = cierre\n• Señal: 🔴 BAJISTA\n• Muy fuerte en resistencias\n\n**MARUBOZU BAJISTA**\nCuerpo rojo grande SIN mechas.\n• Dominio total de vendedores\n• Señal: 🔴 FUERTEMENTE BAJISTA'
          },
          {
            title: 'Patrones Alcistas de 2 Velas',
            patterns: ['Envolvente Alcista', 'Harami Alcista', 'Patrón Penetrante', 'Pinzas de Suelo'],
            content: '**ENVOLVENTE ALCISTA (Bullish Engulfing)**\nVela verde grande que "envuelve" completamente la vela roja anterior.\n• Señal: 🟢 ALCISTA FUERTE\n• El cuerpo verde debe cubrir TODO el cuerpo rojo\n• Mayor tamaño de la envolvente = mayor fuerza\n• Muy fiable en soportes\n\n**HARAMI ALCISTA (Bullish Harami)**\n"Embarazada": Vela verde pequeña contenida DENTRO del cuerpo de la vela roja grande anterior.\n• Señal: 🟢 ALCISTA (moderada)\n• Indica pérdida de momentum bajista\n• Requiere confirmación\n\n**PATRÓN PENETRANTE (Piercing Line)**\nVela roja seguida de vela verde que abre por debajo pero cierra POR ENCIMA del 50% de la roja.\n• Señal: 🟢 ALCISTA\n• La penetración debe ser significativa (>50%)\n\n**PINZAS DE SUELO (Tweezer Bottom)**\nDos velas (roja + verde) con mínimos IGUALES.\n• Señal: 🟢 ALCISTA - doble rechazo del mismo nivel\n• El nivel de mínimos actúa como soporte\n\n**KICKER ALCISTA (Bullish Kicker)**\nVela roja seguida de vela verde que abre con GAP por encima de la apertura anterior.\n• Señal: 🟢 MUY ALCISTA\n• El gap indica cambio abrupto de sentimiento\n• Uno de los patrones más fiables'
          },
          {
            title: 'Patrones Bajistas de 2 Velas',
            patterns: ['Envolvente Bajista', 'Harami Bajista', 'Cubierta de Nube Oscura', 'Pinzas de Techo'],
            content: '**ENVOLVENTE BAJISTA (Bearish Engulfing)**\nVela roja grande que envuelve la vela verde anterior.\n• Señal: 🔴 BAJISTA FUERTE\n• Muy fiable en resistencias\n\n**HARAMI BAJISTA (Bearish Harami)**\nVela roja pequeña contenida dentro de la vela verde grande anterior.\n• Señal: 🔴 BAJISTA (moderada)\n• Indica pérdida de momentum alcista\n\n**CUBIERTA DE NUBE OSCURA (Dark Cloud Cover)**\nVela verde seguida de vela roja que abre por encima pero cierra POR DEBAJO del 50% de la verde.\n• Señal: 🔴 BAJISTA\n• Opuesto al patrón penetrante\n\n**PINZAS DE TECHO (Tweezer Top)**\nDos velas (verde + roja) con máximos IGUALES.\n• Señal: 🔴 BAJISTA - doble rechazo del mismo nivel\n• El nivel de máximos actúa como resistencia\n\n**KICKER BAJISTA (Bearish Kicker)**\nVela verde seguida de vela roja que abre con GAP por debajo.\n• Señal: 🔴 MUY BAJISTA\n• Cambio abrupto de sentimiento'
          },
          {
            title: 'Patrones Alcistas de 3 Velas',
            patterns: ['Estrella de la Mañana', 'Tres Soldados Blancos'],
            content: '**ESTRELLA DE LA MAÑANA (Morning Star) ⭐🌅**\nPatrón de 3 velas:\n1. Vela roja grande (tendencia bajista continúa)\n2. Vela pequeña con gap bajista (indecisión en el fondo)\n3. Vela verde grande que cierra arriba del 50% de la primera\n• Señal: 🟢 ALCISTA FUERTE - cambio de tendencia\n• El gap entre vela 1 y 2 aumenta fiabilidad\n\n**MORNING DOJI STAR**\nIgual que Morning Star pero la vela central es un DOJI.\n• Señal: 🟢 ALCISTA MUY FUERTE\n• El doji enfatiza la indecisión antes del giro\n\n**BEBÉ ABANDONADO ALCISTA (Bullish Abandoned Baby)**\nIgual que Morning Star pero con GAPS en ambos lados del doji central.\n• Señal: 🟢 EXTREMADAMENTE ALCISTA\n• Patrón raro pero muy fiable\n\n**TRES SOLDADOS BLANCOS (Three White Soldiers)**\nTres velas verdes consecutivas, cada una abriendo dentro del cuerpo anterior y cerrando en nuevo máximo.\n• Señal: 🟢 ALCISTA FUERTE - presión compradora sostenida\n• Las velas deben tener cuerpos similares\n• Mechas pequeñas = más fuerza'
          },
          {
            title: 'Patrones Bajistas de 3 Velas',
            patterns: ['Estrella de la Tarde', 'Tres Cuervos Negros'],
            content: '**ESTRELLA DE LA TARDE (Evening Star) ⭐🌆**\nPatrón de 3 velas:\n1. Vela verde grande (tendencia alcista continúa)\n2. Vela pequeña con gap alcista (indecisión en el techo)\n3. Vela roja grande que cierra debajo del 50% de la primera\n• Señal: 🔴 BAJISTA FUERTE - cambio de tendencia\n\n**EVENING DOJI STAR**\nIgual que Evening Star pero la vela central es un DOJI.\n• Señal: 🔴 BAJISTA MUY FUERTE\n\n**BEBÉ ABANDONADO BAJISTA (Bearish Abandoned Baby)**\nDoji central con gaps en ambos lados.\n• Señal: 🔴 EXTREMADAMENTE BAJISTA\n\n**TRES CUERVOS NEGROS (Three Black Crows)**\nTres velas rojas consecutivas, cada una abriendo dentro del cuerpo anterior y cerrando en nuevo mínimo.\n• Señal: 🔴 BAJISTA FUERTE - presión vendedora sostenida'
          },
          {
            title: 'Patrones de Confirmación',
            content: '**TRES INTERIOR ALCISTA (Three Inside Up)**\nHarami alcista + vela verde de confirmación.\n1. Vela roja grande\n2. Vela verde pequeña dentro de la primera (harami)\n3. Vela verde que cierra por encima de la primera\n• Señal: 🟢 ALCISTA CONFIRMADO\n\n**TRES EXTERIOR ALCISTA (Three Outside Up)**\nEnvolvente alcista + vela verde de confirmación.\n1. Vela roja pequeña\n2. Vela verde envolvente\n3. Vela verde de confirmación\n• Señal: 🟢 ALCISTA CONFIRMADO\n\n**TRES INTERIOR BAJISTA (Three Inside Down)**\nHarami bajista + vela roja de confirmación.\n• Señal: 🔴 BAJISTA CONFIRMADO\n\n**TRES EXTERIOR BAJISTA (Three Outside Down)**\nEnvolvente bajista + vela roja de confirmación.\n• Señal: 🔴 BAJISTA CONFIRMADO'
          },
          {
            title: 'Consejos para Operar con Patrones',
            content: '**1. EL CONTEXTO ES REY**\n• Los patrones son más fiables en zonas de soporte/resistencia\n• Confirma con la tendencia general del mercado\n• Un martillo en el aire no significa nada\n\n**2. SIEMPRE ESPERA CONFIRMACIÓN**\n• Un patrón no está "confirmado" hasta que la siguiente vela valida la dirección\n• No entres antes de tiempo\n\n**3. VOLUMEN VALIDA**\n• Patrones con alto volumen son más fiables\n• Baja volumen = posible trampa\n\n**4. TIMEFRAME IMPORTA**\n• Patrones en 4H, 1D, 1W son más fiables que en 5m o 15m\n• Mayor timeframe = mayor significancia\n\n**5. NO TODOS LOS PATRONES SON IGUALES**\n• Algunos patrones tienen mayor tasa de éxito que otros\n• Envolventes y estrellas (Morning/Evening) son los más fiables\n• Haramis requieren más confirmación\n\n**6. GESTIONA EL RIESGO**\n• Stop loss SIEMPRE debajo del mínimo del patrón (alcista) o encima del máximo (bajista)\n• No arriesgues más del 2% por operación'
          }
        ]
      },
      {
        id: 'patrones-resumen',
        title: 'Patrones de Velas Japonesas (Resumen Visual)',
        category: 'patrones',
        icon: '📝',
        content: '',
        sections: [
          {
            title: '1️⃣ Patrones de 1 Vela - Alcistas',
            patterns: ['Martillo', 'Martillo Invertido', 'Doji Libélula', 'Marubozu Alcista'],
            content: '**MARTILLO (Hammer) 🔨**\nCuerpo pequeño en la parte SUPERIOR, mecha larga (2-3x) hacia ABAJO, sin mecha superior.\n• Señal: Los vendedores llevaron el precio abajo pero compradores recuperaron con fuerza\n• Contexto: Debe aparecer tras TENDENCIA BAJISTA para ser válido\n• Fiabilidad: Alta si hay confirmación (siguiente vela verde)\n\n**MARTILLO INVERTIDO (Inverted Hammer)**\nCuerpo pequeño en la parte INFERIOR, mecha larga hacia ARRIBA.\n• Señal: Los compradores intentaron subir el precio\n• Contexto: Tras tendencia bajista indica posible cambio\n• Fiabilidad: Media - requiere confirmación\n\n**DOJI LIBÉLULA (Dragonfly Doji)**\nForma de T invertida: línea horizontal arriba, mecha larga abajo.\n• Señal: Fuerte rechazo de precios bajos\n• Fiabilidad: Alta en zonas de soporte\n\n**MARUBOZU ALCISTA**\nVela verde grande SIN mechas (o muy pequeñas).\n• Señal: Dominio TOTAL de compradores durante todo el período\n• Fiabilidad: Muy alta - demuestra fuerza compradora absoluta'
          },
          {
            title: '1️⃣ Patrones de 1 Vela - Bajistas',
            patterns: ['Estrella Fugaz', 'Hombre Colgado', 'Doji Lápida', 'Marubozu Bajista'],
            content: '**ESTRELLA FUGAZ (Shooting Star) ⭐**\nCuerpo pequeño en la parte INFERIOR, mecha larga hacia ARRIBA.\n• Señal: Los compradores intentaron subir pero los vendedores rechazaron con fuerza\n• Contexto: Debe aparecer tras TENDENCIA ALCISTA\n• Nota: MISMA FORMA que martillo invertido pero contexto opuesto\n\n**HOMBRE COLGADO (Hanging Man)**\nCuerpo pequeño en la parte SUPERIOR, mecha larga hacia ABAJO.\n• Señal: Los vendedores empiezan a presionar aunque el precio cierre arriba\n• Contexto: Aparece tras tendencia ALCISTA (si fuera bajista sería martillo)\n• Nota: MISMA FORMA que martillo pero contexto opuesto\n\n**DOJI LÁPIDA (Gravestone Doji)**\nForma de T: línea horizontal abajo, mecha larga arriba.\n• Señal: Fuerte rechazo de precios altos\n• Fiabilidad: Alta en zonas de resistencia\n\n**MARUBOZU BAJISTA**\nVela roja grande SIN mechas.\n• Señal: Dominio TOTAL de vendedores\n• Fiabilidad: Muy alta - presión vendedora absoluta'
          },
          {
            title: '2️⃣ Patrones de 2 Velas - Alcistas',
            patterns: ['Envolvente Alcista', 'Harami Alcista', 'Patrón Penetrante', 'Pinzas de Suelo'],
            content: '**ENVOLVENTE ALCISTA (Bullish Engulfing) 🐋**\nVela verde GRANDE que "envuelve" completamente el cuerpo de la vela roja anterior.\n• Señal: Cambio de poder - compradores toman control total\n• Fiabilidad: MUY ALTA - uno de los patrones más fiables\n• Tip: Cuanto mayor sea la segunda vela, más fuerte la señal\n\n**HARAMI ALCISTA (Bullish Harami) 🤰**\n"Embarazada": Vela verde pequeña contenida DENTRO del cuerpo de la vela roja grande anterior.\n• Señal: Pérdida de momentum bajista\n• Fiabilidad: Media - requiere confirmación\n\n**PATRÓN PENETRANTE (Piercing Line)**\nVela roja seguida de vela verde que abre por debajo pero cierra ARRIBA del 50% de la roja.\n• Señal: Los compradores reaccionan con fuerza\n• Fiabilidad: Alta si la penetración es >50%\n\n**PINZAS DE SUELO (Tweezer Bottom)**\nDos velas (roja + verde) con mínimos al MISMO nivel.\n• Señal: Doble rechazo del mismo soporte\n• Fiabilidad: Alta - el nivel actúa como soporte fuerte'
          },
          {
            title: '2️⃣ Patrones de 2 Velas - Bajistas',
            patterns: ['Envolvente Bajista', 'Harami Bajista', 'Cubierta de Nube Oscura', 'Pinzas de Techo'],
            content: '**ENVOLVENTE BAJISTA (Bearish Engulfing)**\nVela roja GRANDE que envuelve completamente la vela verde anterior.\n• Señal: Vendedores toman control total\n• Fiabilidad: MUY ALTA\n\n**HARAMI BAJISTA (Bearish Harami)**\nVela roja pequeña contenida dentro de la vela verde grande anterior.\n• Señal: Pérdida de momentum alcista\n• Fiabilidad: Media\n\n**CUBIERTA DE NUBE OSCURA (Dark Cloud Cover)**\nVela verde seguida de vela roja que abre arriba pero cierra DEBAJO del 50% de la verde.\n• Señal: Los vendedores reaccionan con fuerza\n• Fiabilidad: Alta - opuesto a patrón penetrante\n\n**PINZAS DE TECHO (Tweezer Top)**\nDos velas (verde + roja) con máximos al MISMO nivel.\n• Señal: Doble rechazo de la misma resistencia\n• Fiabilidad: Alta'
          },
          {
            title: '3️⃣ Patrones de 3 Velas',
            patterns: ['Estrella de la Mañana', 'Estrella de la Tarde', 'Tres Soldados Blancos', 'Tres Cuervos Negros'],
            content: '**ESTRELLA DE LA MAÑANA (Morning Star) 🌅**\n3 velas: Roja grande → Pequeña con gap abajo → Verde grande\n• Señal: CAMBIO DE TENDENCIA alcista\n• Fiabilidad: MUY ALTA - patrón de reversión más fiable\n• El gap entre vela 1 y 2 aumenta la fiabilidad\n\n**ESTRELLA DE LA TARDE (Evening Star) 🌇**\n3 velas: Verde grande → Pequeña con gap arriba → Roja grande\n• Señal: CAMBIO DE TENDENCIA bajista\n• Fiabilidad: MUY ALTA\n\n**TRES SOLDADOS BLANCOS (Three White Soldiers)**\n3 velas verdes consecutivas, cada una cerrando más arriba.\n• Señal: Presión compradora SOSTENIDA\n• Fiabilidad: Alta - tendencia alcista fuerte\n\n**TRES CUERVOS NEGROS (Three Black Crows)**\n3 velas rojas consecutivas, cada una cerrando más abajo.\n• Señal: Presión vendedora SOSTENIDA\n• Fiabilidad: Alta - tendencia bajista fuerte'
          },
          {
            title: '⚪ Patrones de Indecisión',
            patterns: ['Doji', 'Doji de Piernas Largas', 'Spinning Top'],
            content: '**DOJI ➕**\nApertura y cierre prácticamente IGUALES, formando una cruz.\n• Señal: INDECISIÓN - ni compradores ni vendedores dominaron\n• Contexto importante:\n  → Tras tendencia alcista: posible cambio bajista\n  → Tras tendencia bajista: posible cambio alcista\n  → En rango: continúa la indecisión\n\n**DOJI DE PIERNAS LARGAS (Long-Legged Doji)**\nDoji con mechas MUY largas arriba y abajo.\n• Señal: Alta volatilidad pero precio vuelve al origen\n• Significado: El mercado está muy indeciso\n\n**SPINNING TOP (Peonza)**\nCuerpo pequeño con mechas medianas similares arriba y abajo.\n• Señal: Indecisión moderada\n• Menos significativo que el doji'
          },
          {
            title: '💡 Reglas de Oro para Operar Patrones',
            content: '**1. EL CONTEXTO ES REY**\nUn patrón solo tiene valor si aparece en el lugar correcto:\n• Martillo → en SOPORTE tras tendencia bajista\n• Estrella fugaz → en RESISTENCIA tras tendencia alcista\n\n**2. SIEMPRE CONFIRMACIÓN**\nNo operes el patrón hasta que la siguiente vela confirme la dirección.\n\n**3. VOLUMEN VALIDA**\n• Alto volumen = más fiable\n• Bajo volumen = posible trampa\n\n**4. TIMEFRAME IMPORTA**\n• 4H, 1D, 1W → MUY fiables\n• 15m, 5m → Mucho ruido, menos fiables\n\n**5. STOP LOSS OBLIGATORIO**\n• Alcista: SL debajo del mínimo del patrón\n• Bajista: SL encima del máximo del patrón\n\n**6. RATIO RIESGO/BENEFICIO**\nNunca operes un patrón si el R/R es menor a 1:2'
          }
        ]
      },
      {
        id: 'riesgo-posicion',
        title: 'Gestión del Tamaño de Posición',
        category: 'riesgo',
        icon: '🛡️',
        content: '',
        sections: [
          {
            title: 'Regla del 2%',
            content: 'NUNCA arriesgues más del 2% de tu capital total en una sola operación.\n\nEjemplo con $10,000:\n• Riesgo máximo por trade: $200\n• Si tu stop loss es de $50, puedes comprar 4 unidades'
          },
          {
            title: 'Ratio Riesgo/Beneficio',
            content: 'Busca operaciones con R/R mínimo de 1:2\n\n• R/R 1:2 = Necesitas ganar 33% de tus trades para ser rentable\n• R/R 1:3 = Necesitas ganar 25% de tus trades\n\nNUNCA entres sin tener claro tu TP y SL.'
          },
          {
            title: 'Diversificación temporal',
            content: 'No entres todas tus posiciones de una vez:\n• Divide en 2-3 entradas\n• Escala hacia fuera (vende parciales en objetivos)'
          }
        ]
      }
    ];
    
    this.articles.set(fallbackArticles);
    this.updateCategoryCounts();
    this.filterByCategory();
  }
  
  updateCategoryCounts() {
    const counts = new Map<string, number>();
    for (const article of this.articles()) {
      counts.set(article.category, (counts.get(article.category) || 0) + 1);
    }
    
    this.categories.update(cats => cats.map(cat => ({
      ...cat,
      count: counts.get(cat.id) || 0
    })));
  }
  
  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.selectedArticle.set(null);
    this.filterByCategory();
  }
  
  filterByCategory() {
    const filtered = this.articles().filter(a => a.category === this.selectedCategory());
    this.filteredArticles.set(filtered);
  }
  
  selectArticle(article: KnowledgeArticle) {
    this.selectedArticle.set(article);
  }
  
  getCategoryTitle(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.title || '';
  }
  
  getCategoryIcon(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.icon || '📄';
  }
  
  getPreview(article: KnowledgeArticle): string {
    if (article.sections.length > 0) {
      return article.sections[0].content.substring(0, 150) + '...';
    }
    return article.content.substring(0, 150) + '...';
  }
  
  getReadingTime(article: KnowledgeArticle): number {
    const totalWords = article.sections.reduce((acc, s) => acc + s.content.split(' ').length, 0);
    return Math.max(1, Math.ceil(totalWords / 200));
  }
  
  formatContent(content: string): string {
    // Convertir markdown básico a HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^• /gm, '• ')
      .replace(/\n/g, '<br>');
  }
  
  scrollToSection(index: number) {
    const element = document.getElementById(`section-${index}`);
    element?.scrollIntoView({ behavior: 'smooth' });
  }
  
  // ============================================================
  // Métodos para la Galería Visual de Patrones
  // ============================================================
  
  getFilteredPatterns(): PatternInfo[] {
    const filter = this.galleryFilter();
    if (filter === 'all') return this.patternGallery;
    return this.patternGallery.filter(p => p.signal === filter);
  }
  
  getPatternSVG(key: string): SafeHtml {
    // Normalizar: quitar tildes, espacios a _, mayúsculas
    const normalized = key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace('DE_LA_', '')
      .replace('DEL_', '');
    
    const svg = PATTERN_SVGS[normalized] || PATTERN_SVGS[key] || PATTERN_SVGS[key.toUpperCase()];
    return this.sanitizer.bypassSecurityTrustHtml(svg || '');
  }
  
  getPatternCardClass(signal: string): string {
    switch (signal) {
      case 'bullish': return 'bg-green-500/10 border-green-500/30 hover:border-green-500';
      case 'bearish': return 'bg-red-500/10 border-red-500/30 hover:border-red-500';
      default: return 'bg-gray-500/10 border-gray-500/30 hover:border-gray-400';
    }
  }
  
  getPatternTextClass(signal: string): string {
    switch (signal) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-300';
    }
  }
  
  getPatternBadgeClass(signal: string): string {
    switch (signal) {
      case 'bullish': return 'bg-green-500/20 text-green-400';
      case 'bearish': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }
  
  findPatternInfo(patternName: string): PatternInfo | undefined {
    // Normalizar nombre para buscar: quitar tildes, pasar a mayúsculas, espacios a _
    const normalize = (s: string) => s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace('DE_LA_', '')
      .replace('DEL_', '');
    
    const normalizedSearch = normalize(patternName);
    
    return PATTERN_GALLERY.find(p => {
      const normalizedKey = normalize(p.key);
      const normalizedName = normalize(p.name);
      return normalizedKey.includes(normalizedSearch) || 
             normalizedSearch.includes(normalizedKey) ||
             normalizedName.includes(normalizedSearch) ||
             normalizedSearch.includes(normalizedName);
    });
  }
}
