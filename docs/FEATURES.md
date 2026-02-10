# 🔥 TradingHell - Funcionalidades y Mejoras

## 📋 Estado del Proyecto

**Última actualización:** 10 de Febrero, 2026  
**Stack:** Angular 21 (Zoneless) + FastAPI + Binance API + TailwindCSS  
**Repositorio:** https://github.com/fullstackcesar/TradingHell

---

## ✅ Funcionalidades Implementadas

### 📚 Centro de Aprendizaje (Learning)
- **Base de conocimiento** completa sobre trading técnico
- **Categorías organizadas:** Murphy, Patrones, Indicadores, Gestión de Riesgo
- **Galería Visual de Patrones** con filtros (Todos/Alcistas/Bajistas/Neutrales)
- **22+ SVGs de patrones de velas** con colores por tipo de señal
- **Artículos educativos** con SVGs inline junto a las explicaciones:
  - Guía Completa de Patrones de Velas Japonesas
  - Resumen Visual de Patrones
  - Filosofía del Análisis Técnico (Murphy)
  - Indicadores Técnicos

#### SVGs de Patrones Incluidos
| Alcistas | Bajistas | Neutrales |
|----------|----------|-----------|
| Martillo | Estrella Fugaz | Doji |
| Martillo Invertido | Hombre Colgado | Doji Piernas Largas |
| Doji Libélula | Doji Lápida | Spinning Top |
| Marubozu Alcista | Marubozu Bajista | |
| Envolvente Alcista | Envolvente Bajista | |
| Harami Alcista | Harami Bajista | |
| Patrón Penetrante | Nube Oscura | |
| Pinzas de Suelo | Pinzas de Techo | |
| Estrella de la Mañana | Estrella de la Tarde | |
| Tres Soldados Blancos | Tres Cuervos Negros | |

---

### ⏱️ Intervalos de Tiempo (16 opciones)
| Minutos | Horas | Días+ |
|---------|-------|-------|
| 1m, 3m, 5m, 15m, 30m | 1H, 2H, 4H, 6H, 8H, 12H | 1D, 3D, 1S, 1M |

### 📅 Selectores de Periodo
- **1 Mes** hasta **5 Años** + **Máximo**
- Cálculo dinámico de velas según periodo/intervalo
- Límite de 1000 velas (máximo Binance API)

### 🎯 Panel de Acción (ActionPanel)
- **Semáforo visual** con colores (verde/amarillo/rojo) para señales claras
- **Cálculo automático** de estrategia:
  - Precio de entrada sugerido
  - Stop Loss automático basado en ATR
  - Take Profit con ratio 2:1 mínimo
  - Tamaño de posición como % del capital ($10,000 por defecto)
- **Explicación en lenguaje simple** de por qué comprar/vender/esperar
- **Botón "Abrir Posición"** para registrar operaciones

### 📊 Gráfico de Velas (Chart)
- **Gráfico TradingView** con lightweight-charts
- **Marcadores de patrones** en el gráfico
- **Líneas de indicadores** clickeables (SMA, EMA, etc.)
- **Volumen** en histograma
- **Líneas de precio** para soportes/resistencias
- **Responsive** adaptable a pantalla
- **Redimensionable** verticalmente con handle de color

### ⏰ Relojes de Mercado (MarketClocks)
- **Estado visual** de mercados principales: NY, Londres, Tokio
- **Colores intuitivos:** 🟢 Abierto, 🔴 Cerrado, 🟡 Pre/Post
- **Hora local** de cada mercado
- **Oculto en móvil** para optimizar espacio

### 📈 Análisis Técnico (Analysis)
#### 12 Indicadores Individuales
| Indicador | Tipo | ¿Visible en gráfico? |
|-----------|------|---------------------|
| RSI | Oscilador (0-100) | ❌ Badge |
| MACD | Oscilador | ❌ Badge |
| **SMA 20** | Media móvil | ✅ Línea |
| **SMA 50** | Media móvil | ✅ Línea |
| **SMA 200** | Media móvil | ✅ Línea |
| **EMA 20** | Media exponencial | ✅ Línea |
| **EMA 50** | Media exponencial | ✅ Línea |
| **BB Superior** | Bollinger | ✅ Línea |
| **BB Media** | Bollinger | ✅ Línea |
| **BB Inferior** | Bollinger | ✅ Línea |
| Estocástico | Oscilador (0-100) | ❌ Badge |
| ADX | Oscilador (0-100) | ❌ Badge |

- **Tooltips explicativos** al hover sobre cada indicador
- **Click para mostrar línea** en gráfico (solo indicadores de precio)
- **Badge en gráfico** muestra valor del indicador seleccionado

#### Patrones de Velas con Emojis de Forma
Cada patrón muestra emoji representativo de su forma:
| Patrón | Emoji Forma | Señal |
|--------|-------------|-------|
| Doji | ✚ | Indecisión |
| Martillo | 🔨 | 🟢 Alcista |
| Martillo Inv. | ⚒️ | 🟢 Alcista |
| Estrella Fugaz | 💫 | 🔴 Bajista |
| Morning Star | 🌅 | 🟢🟢 Muy alcista |
| Evening Star | 🌆 | 🔴🔴 Muy bajista |
| Envolvente | 🔄 | ⚡ Fuerte |
| Hombre Colgado | 🪢 | 🔴 Bajista |
| 3 Soldados | 📈📈 | 🟢🟢 Muy alcista |
| 3 Cuervos | 📉📉 | 🔴🔴 Muy bajista |
| Harami | 🤰 | Reversión |
| Penetrante | 🗡️ | 🟢 Alcista |
| Nube Oscura | 🌧️ | 🔴 Bajista |
| Pinzas | 🔧 | Reversión |

### 🌐 Explorador de Mercados (MarketExplorer)
Categorías disponibles:
- **Criptomonedas** - BTC, ETH, SOL, etc.
- **Acciones** - AAPL, GOOGL, TSLA, etc.
- **ETFs** - SPY, QQQ, etc.
- **Forex** - EUR/USD, GBP/USD, etc.
- **Materias Primas** - Oro, Petróleo, etc.
- **Índices** - S&P 500, NASDAQ, etc.

### 📍 Seguimiento de Posiciones (PositionTracker)
- **Registro de posiciones** abiertas (LONG/SHORT)
- **P&L en tiempo real** calculado
- **Barra de progreso** hacia TP/SL
- **Alertas visuales** cuando se acerca a niveles

### 💬 Chat IA (Chat)
- Asistente con RAG (si hay OPENAI_API_KEY)
- Base de conocimiento sobre trading
- Colapsable para no ocupar espacio

### 🎯 Marcadores de Patrones en Gráfico
- **Detección automática** de patrones de velas japonesas
- **Marcadores visuales** bajo cada vela con patrón detectado
- **Tooltips** con SVG del patrón y descripción
- **Colores** verde/rojo/gris según señal alcista/bajista/neutral
- **Distribución uniforme** de marcadores para no saturar el gráfico

### ⚡ Tiempo Real
- Botón **"EN VIVO"** para auto-refresh cada 500ms
- Punto verde pulsante cuando está activo
- **No muestra barra de progreso** en modo tiempo real (evita flickering)

### 📊 Barra de Progreso de Carga
- Muestra **porcentaje de carga** al cambiar de activo:
  1. Cargando datos del mercado... (35%)
  2. Analizando indicadores... (70%)
  3. ¡Listo! (100%)
- Se oculta automáticamente tras 1.5s
- **Desactivada en modo tiempo real**

---

## 🔧 Backend API

### Endpoints disponibles
```
GET /health                          - Estado del servidor
GET /api/binance/klines/{symbol}     - Velas de Binance (rápido)
GET /api/binance/analyze/{symbol}    - Análisis técnico (Binance)
GET /api/chart/{symbol}              - Velas de yfinance
GET /api/analyze/{symbol}            - Análisis técnico (yfinance)
POST /api/ask                        - Chat con RAG
```

### Indicadores calculados
- RSI, MACD, Bandas de Bollinger
- SMA, EMA (múltiples períodos)
- ADX, Estocástico, ATR
- Volumen, Momentum, OBV, VWAP
- Soportes y resistencias automáticos
- Detección de patrones de velas

---

## 🚀 Mejoras Recientes (Feb 2026)

- [x] **Centro de Aprendizaje** - Base de conocimiento completa
- [x] **Galería Visual de Patrones** - 22+ SVGs con filtros
- [x] **SVGs inline en artículos** - Visuales junto a explicaciones
- [x] **Normalización de patrones** - Soporte español/inglés, tildes
- [x] **Marcadores en gráfico** - Patrones detectados con tooltips
- [x] **Relojes de Mercado** - Estado de NY, Londres, Tokio en tiempo real
- [x] **Paneles Redimensionables** - Todos los componentes con resize vertical
- [x] **Colores únicos por panel** - Handle distintivo para cada componente
- [x] **Scroll de página** - Paneles pueden crecer más allá del viewport

---

## 📋 Pendiente

Ver [ROADMAP.md](ROADMAP.md) para la lista completa de mejoras planificadas.

---

## 📁 Estructura de Archivos Clave

```
frontend/src/app/
├── components/
│   ├── action-panel/          # Panel de acción con semáforo
│   ├── analysis/              # Análisis técnico con tooltips y SVGs
│   ├── chart/                 # Gráfico TradingView con marcadores
│   ├── chat/                  # Chat con IA
│   ├── learning/              # Centro de aprendizaje y galería
│   ├── market-explorer/       # Explorador de mercados
│   └── position-tracker/      # Seguimiento de posiciones
├── constants/
│   └── pattern-svgs.ts        # SVGs de patrones de velas (22+)
├── pages/
│   └── dashboard/             # Layout principal
├── services/
│   └── trading.service.ts     # Comunicación con API
└── models/
    └── trading.models.ts      # Tipos TypeScript

backend/
├── main.py                    # FastAPI app
├── analysis/technical.py      # Cálculos de indicadores
├── data/
│   ├── binance_provider.py    # API Binance
│   └── providers.py           # Abstracción de datos
└── rag/
    ├── rag_engine.py          # Motor RAG para chat
    └── knowledge_base/        # Artículos de conocimiento
        ├── murphy_technical_analysis.md
        ├── patrones_velas_completo.md
        └── indicadores_tecnicos.md
```

---

## 🎨 Diseño UI/UX

### Colores (TailwindCSS custom)
```css
trading-bg: #0f0f1a      /* Fondo principal */
trading-card: #1a1a2e    /* Cards */
trading-border: #2a2a4a  /* Bordes */
```

### Señales
- 🟢 Verde = COMPRA
- 🔴 Rojo = VENTA  
- 🟡 Amarillo = ESPERAR

### Paneles Redimensionables
Todos los componentes tienen resize vertical con colores distintivos:
| Componente | Color Handle |
|------------|-------------|
| Gráfico | 🟣 Indigo |
| Posiciones | 🟢 Verde |
| Explorador | 🔵 Cyan |
| Acción | 🟠 Amber |
| Análisis | 🟣 Purple |
| Oportunidades | 🟢 Emerald |
| Alertas | 🟡 Yellow |

---

## 🐛 Bugs Conocidos

1. ~~**Gráfico puede no mostrarse**~~ ✅ RESUELTO
   - Causa: Timestamps duplicados de Binance API
   - Solución: Filtro `uniqueCandleData` elimina duplicados

2. **Zone.js warning** al arrancar
   - No afecta funcionamiento (app es zoneless)

3. **Osciladores no muestran línea** (intencional)
   - RSI, MACD, Estocástico, ADX usan escala 0-100
   - No se pueden superponer al gráfico de precio
   - Se muestran en badge superior al clickar

---

## 📝 Notas de Desarrollo

- Angular 21 con **Signals** (no RxJS para estado simple)
- **Resource API** para fetching reactivo
- **Zoneless** para mejor rendimiento
- Backend optimizado con **Binance API** para criptos (más rápido que yfinance)
