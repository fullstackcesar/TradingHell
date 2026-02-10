"""
TradingHell - Backend API
FastAPI backend para análisis técnico y asistente RAG de trading.
"""

import os
import asyncio
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import json

# Cargar variables de entorno
load_dotenv()

# Importar módulos locales
from data.providers import get_market_data, get_ticker_info, search_symbols, normalize_symbol
from data.binance_provider import (
    get_binance_provider, normalize_binance_symbol, BinanceProvider,
    stream_price, stream_kline, stream_ticker, stream_mini_ticker,
    stream_book_ticker, stream_depth, BinanceWSClient
)
from analysis.technical import full_analysis, Signal
from rag.rag_engine import get_rag_engine, TradingRAG

# Crear app
app = FastAPI(
    title="TradingHell API",
    description="API para análisis técnico de trading con asistente RAG inteligente",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Modelos Pydantic ==============

class QuestionRequest(BaseModel):
    """Petición de pregunta al RAG."""
    question: str


class QuestionResponse(BaseModel):
    """Respuesta del RAG."""
    answer: str
    sources: List[str]


class AnalysisRequest(BaseModel):
    """Petición de análisis técnico."""
    symbol: str
    interval: str = "1d"
    period: str = "6mo"


class IndicatorResponse(BaseModel):
    """Respuesta de un indicador."""
    name: str
    value: float
    signal: str
    interpretation: str


class PatternResponse(BaseModel):
    """Respuesta de un patrón detectado."""
    name: str
    signal: str
    confidence: float
    description: str


class AnalysisResponse(BaseModel):
    """Respuesta completa del análisis."""
    symbol: str
    timeframe: str
    current_price: float
    trend: str
    trend_strength: float
    trend_details: Optional[dict] = None
    indicators: List[IndicatorResponse]
    patterns: List[PatternResponse]
    support_levels: List[float]
    resistance_levels: List[float]
    overall_signal: str
    signal_strength: float
    summary: str
    recommendations: List[str]


class CandleData(BaseModel):
    """Datos de una vela."""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class ChartDataResponse(BaseModel):
    """Respuesta con datos del gráfico."""
    symbol: str
    interval: str
    candles: List[CandleData]


class TickerInfo(BaseModel):
    """Información de un ticker."""
    symbol: str
    name: Optional[str] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    volume: Optional[float] = None


# ============== Variables globales ==============

rag_engine: Optional[TradingRAG] = None


# ============== Endpoints ==============

@app.on_event("startup")
async def startup_event():
    """Inicializar el motor RAG al arrancar."""
    global rag_engine
    
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            print("🚀 Inicializando motor RAG con OpenAI...")
            rag_engine = get_rag_engine(openai_api_key=openai_key)
            print("✅ Motor RAG inicializado correctamente")
        else:
            print("⚠️ OPENAI_API_KEY no configurada.")
            print("   El chat no funcionará sin API key de OpenAI.")
            print("   Crea un archivo .env con: OPENAI_API_KEY=tu_clave")
    except Exception as e:
        print(f"⚠️ Error inicializando RAG: {e}")
        print("   El análisis técnico funcionará, pero el chat no.")


@app.get("/")
async def root():
    """Endpoint raíz."""
    return {
        "message": "🔥 Bienvenido a TradingHell API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Check de salud del servicio."""
    return {
        "status": "healthy",
        "rag_available": rag_engine is not None
    }


# ============== RAG Endpoints ==============

@app.post("/api/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Hace una pregunta al asistente RAG sobre trading.
    
    Ejemplos de preguntas:
    - ¿Qué es un martillo en trading?
    - ¿Cómo funciona el RSI?
    - ¿Cuándo debo comprar según las bandas de Bollinger?
    """
    if not rag_engine:
        # Sin RAG, dar respuesta básica
        return QuestionResponse(
            answer="⚠️ El asistente RAG no está disponible. Configura OPENAI_API_KEY en el archivo .env para usar esta función.",
            sources=[]
        )
    
    try:
        result = rag_engine.ask(request.question)
        return QuestionResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando pregunta: {str(e)}")


# ============== Market Data Endpoints ==============

@app.get("/api/chart/{symbol}", response_model=ChartDataResponse)
async def get_chart_data(
    symbol: str,
    interval: str = Query("1d", description="Intervalo: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1wk"),
    period: str = Query("6mo", description="Período: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y")
):
    """
    Obtiene datos de velas para el gráfico.
    
    Símbolos de ejemplo:
    - Acciones USA: AAPL, MSFT, TSLA, GOOGL
    - Acciones España: SANTANDER, BBVA, IBERDROLA
    - Forex: EURUSD, GBPUSD, USDJPY
    - Crypto: BTC, ETH
    """
    try:
        df = get_market_data(symbol, interval=interval, period=period)
        
        candles = []
        for _, row in df.iterrows():
            candles.append(CandleData(
                date=str(row['Date']),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=float(row.get('Volume', 0))
            ))
        
        return ChartDataResponse(
            symbol=normalize_symbol(symbol),
            interval=interval,
            candles=candles
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/ticker/{symbol}", response_model=TickerInfo)
async def get_ticker(symbol: str):
    """Obtiene información de un símbolo."""
    try:
        info = get_ticker_info(symbol)
        if "error" in info:
            raise HTTPException(status_code=404, detail=info["error"])
        return TickerInfo(**info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1)):
    """Busca símbolos por nombre."""
    results = search_symbols(q)
    return {"results": results}


# ============== Analysis Endpoints ==============

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_symbol(request: AnalysisRequest):
    """
    Realiza análisis técnico completo de un símbolo.
    
    Incluye:
    - Detección de patrones de velas
    - Indicadores técnicos (RSI, MACD, Bollinger, etc.)
    - Soportes y resistencias
    - Señal de compra/venta
    - Recomendaciones
    """
    try:
        # Obtener datos
        df = get_market_data(
            request.symbol,
            interval=request.interval,
            period=request.period
        )
        
        # Realizar análisis
        result = full_analysis(df, request.symbol, request.interval)
        
        # Convertir a response
        return AnalysisResponse(
            symbol=result.symbol,
            timeframe=result.timeframe,
            current_price=result.current_price,
            trend=result.trend,
            trend_strength=result.trend_strength,
            trend_details=result.trend_details,
            indicators=[
                IndicatorResponse(
                    name=ind.name,
                    value=ind.value,
                    signal=ind.signal.value,
                    interpretation=ind.interpretation
                ) for ind in result.indicators
            ],
            patterns=[
                PatternResponse(
                    name=p.name,
                    signal=p.signal.value,
                    confidence=p.confidence,
                    description=p.description
                ) for p in result.patterns
            ],
            support_levels=result.support_levels,
            resistance_levels=result.resistance_levels,
            overall_signal=result.overall_signal.value,
            signal_strength=result.signal_strength,
            summary=result.summary,
            recommendations=result.recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/analyze/{symbol}", response_model=AnalysisResponse)
async def analyze_symbol_get(
    symbol: str,
    interval: str = Query("1d", description="Intervalo de tiempo"),
    period: str = Query("6mo", description="Período de datos")
):
    """Versión GET del análisis técnico."""
    return await analyze_symbol(AnalysisRequest(
        symbol=symbol,
        interval=interval,
        period=period
    ))


# ============== Combined Endpoint ==============

@app.post("/api/smart-analysis")
async def smart_analysis(
    symbol: str = Query(..., description="Símbolo a analizar"),
    question: Optional[str] = Query(None, description="Pregunta adicional sobre el análisis")
):
    """
    Análisis inteligente: combina análisis técnico con explicación del RAG.
    
    Ejemplo: /api/smart-analysis?symbol=AAPL&question=¿Debería comprar ahora?
    """
    try:
        # Obtener datos y análisis
        df = get_market_data(symbol, interval="1d", period="6mo")
        analysis = full_analysis(df, symbol, "1d")
        
        # Si hay pregunta, usar RAG para contextualizar
        rag_response = None
        if question and rag_engine:
            # Crear contexto del análisis actual
            context = f"""
            Estoy analizando {symbol}.
            Precio actual: {analysis.current_price}
            Tendencia: {analysis.trend}
            Señal: {analysis.overall_signal.value}
            RSI: {next((i.value for i in analysis.indicators if i.name == 'RSI'), 'N/A')}
            {question}
            """
            rag_result = rag_engine.ask(context)
            rag_response = rag_result["answer"]
        
        return {
            "analysis": {
                "symbol": analysis.symbol,
                "price": analysis.current_price,
                "trend": analysis.trend,
                "signal": analysis.overall_signal.value,
                "signal_strength": analysis.signal_strength,
                "summary": analysis.summary,
                "recommendations": analysis.recommendations
            },
            "rag_explanation": rag_response,
            "patterns": [
                {"name": p.name, "signal": p.signal.value}
                for p in analysis.patterns
            ],
            "indicators": [
                {"name": i.name, "value": i.value, "signal": i.signal.value}
                for i in analysis.indicators
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== Binance Endpoints (Real-time) ==============

@app.get("/api/binance/ping")
async def binance_ping():
    """Test de conectividad con Binance."""
    provider = await get_binance_provider()
    is_connected = await provider.ping()
    return {"connected": is_connected}


@app.get("/api/binance/price/{symbol}")
async def binance_price(symbol: str):
    """
    Obtiene el precio actual de un par de Binance.
    
    Ejemplos: BTCUSDT, ETHUSDT, etc.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        price = await provider.get_ticker_price(normalized)
        return price
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/prices")
async def binance_all_prices():
    """Obtiene todos los precios de Binance."""
    provider = await get_binance_provider()
    return await provider.get_ticker_price()


@app.get("/api/binance/ticker/{symbol}")
async def binance_ticker(symbol: str):
    """
    Obtiene estadísticas 24h de un par.
    
    Incluye: cambio de precio, volumen, high, low, etc.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        ticker = await provider.get_ticker_24h(normalized)
        return ticker
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/klines/{symbol}")
async def binance_klines(
    symbol: str,
    interval: str = Query(default="1h", description="Intervalo: 1m, 5m, 15m, 30m, 1h, 4h, 1d"),
    limit: int = Query(default=100, le=1000, description="Número de velas (máx 1000)")
):
    """
    Obtiene datos de velas (candlesticks) de Binance.
    
    Para análisis técnico y gráficos.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        df = await provider.get_klines(normalized, interval=interval, limit=limit)
        
        # Convertir a formato JSON amigable
        data = []
        for idx, row in df.iterrows():
            data.append({
                "time": int(idx.timestamp()),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": row["Volume"]
            })
        
        return {
            "symbol": normalized,
            "interval": interval,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/orderbook/{symbol}")
async def binance_orderbook(
    symbol: str,
    limit: int = Query(default=20, description="Niveles del order book (5, 10, 20, 50, 100)")
):
    """
    Obtiene el libro de órdenes (depth).
    
    Muestra las órdenes de compra y venta pendientes.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        orderbook = await provider.get_order_book(normalized, limit=limit)
        return {
            "symbol": normalized,
            "bids": orderbook.get("bids", [])[:limit],
            "asks": orderbook.get("asks", [])[:limit],
            "lastUpdateId": orderbook.get("lastUpdateId")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/trades/{symbol}")
async def binance_trades(
    symbol: str,
    limit: int = Query(default=50, le=1000, description="Número de trades")
):
    """
    Obtiene los trades recientes.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        trades = await provider.get_recent_trades(normalized, limit=limit)
        return {
            "symbol": normalized,
            "trades": trades
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/book-ticker/{symbol}")
async def binance_book_ticker(symbol: str):
    """
    Obtiene el mejor bid/ask actual.
    
    Precio más bajo de venta y más alto de compra.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        ticker = await provider.get_book_ticker(normalized)
        return ticker
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/symbols")
async def binance_symbols():
    """
    Lista todos los pares de trading disponibles en Binance.
    """
    provider = await get_binance_provider()
    
    try:
        info = await provider.get_exchange_info()
        symbols = [
            {
                "symbol": s["symbol"],
                "baseAsset": s["baseAsset"],
                "quoteAsset": s["quoteAsset"],
                "status": s["status"]
            }
            for s in info.get("symbols", [])
            if s["status"] == "TRADING"
        ]
        return {"symbols": symbols, "total": len(symbols)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/binance/analyze/{symbol}")
async def binance_analyze(
    symbol: str,
    interval: str = Query(default="1h", description="Intervalo para análisis"),
    limit: int = Query(default=200, description="Velas para análisis")
):
    """
    Análisis técnico completo usando datos de Binance.
    """
    provider = await get_binance_provider()
    normalized = normalize_binance_symbol(symbol)
    
    try:
        # Obtener datos de velas
        df = await provider.get_klines(normalized, interval=interval, limit=limit)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No hay datos disponibles")
        
        # Realizar análisis técnico (incluye Murphy/Dow Theory)
        analysis = full_analysis(df, normalized, interval)
        
        # Obtener precio actual
        price_data = await provider.get_ticker_price(normalized)
        current_price = float(price_data.get("price", 0))
        
        # Obtener ticker 24h para más contexto
        ticker_24h = await provider.get_ticker_24h(normalized)
        
        return {
            "symbol": normalized,
            "current_price": current_price,
            "price_change_24h": float(ticker_24h.get("priceChange", 0)),
            "price_change_percent_24h": float(ticker_24h.get("priceChangePercent", 0)),
            "high_24h": float(ticker_24h.get("highPrice", 0)),
            "low_24h": float(ticker_24h.get("lowPrice", 0)),
            "volume_24h": float(ticker_24h.get("volume", 0)),
            "trend": analysis.trend,
            "trend_strength": analysis.trend_strength,
            "trend_details": analysis.trend_details,
            "overall_signal": analysis.overall_signal.value,
            "signal_strength": analysis.signal_strength,
            "support_levels": analysis.support_levels,
            "resistance_levels": analysis.resistance_levels,
            "indicators": [
                {"name": i.name, "value": i.value, "signal": i.signal.value}
                for i in analysis.indicators
            ],
            "patterns": [
                {"name": p.name, "signal": p.signal.value, "confidence": p.confidence, "description": p.description}
                for p in analysis.patterns
            ],
            "recommendations": analysis.recommendations,
            "summary": analysis.summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== Market Scanner (Oportunidades) ==============

# Lista de símbolos populares para escanear
DEFAULT_CRYPTO_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
    "MATICUSDT", "LTCUSDT", "ATOMUSDT", "UNIUSDT", "AAVEUSDT"
]

class OpportunityResponse(BaseModel):
    """Una oportunidad detectada."""
    symbol: str
    signal: str  # COMPRA FUERTE, COMPRA, NEUTRAL, VENTA, VENTA FUERTE
    signal_strength: float
    trend: str
    trend_strength: float
    current_price: float
    price_change_24h: float
    volume_24h: float
    entry_price: float
    take_profit: float
    stop_loss: float
    risk_reward: float
    reasons: List[str]
    score: float  # Puntuación final 0-100


class ScannerResponse(BaseModel):
    """Respuesta del scanner."""
    opportunities: List[OpportunityResponse]
    total_scanned: int
    buy_signals: int
    sell_signals: int
    best_opportunity: Optional[str]
    scan_time: float


async def analyze_symbol_fast(provider: BinanceProvider, symbol: str, interval: str = "1h") -> Optional[dict]:
    """Analiza un símbolo rápidamente para el scanner."""
    try:
        df = await provider.get_klines(symbol, interval=interval, limit=200)
        if df.empty:
            return None
        
        analysis = full_analysis(df, symbol, interval)
        ticker_24h = await provider.get_ticker_24h(symbol)
        
        current_price = float(ticker_24h.get("lastPrice", 0))
        price_change = float(ticker_24h.get("priceChangePercent", 0))
        volume = float(ticker_24h.get("volume", 0))
        
        # Calcular puntuación (score) basada en múltiples factores
        score = 0
        
        # Señal (40 puntos máx)
        signal_scores = {
            "COMPRA FUERTE": 40,
            "COMPRA": 30,
            "NEUTRAL": 10,
            "VENTA": 30,
            "VENTA FUERTE": 40
        }
        score += signal_scores.get(analysis.overall_signal.value, 0)
        
        # Fuerza de tendencia (30 puntos máx)
        score += (analysis.trend_strength / 100) * 30
        
        # Confirmación Dow Theory (20 puntos máx)
        dow = analysis.trend_details.get('dow_theory', {}) if analysis.trend_details else {}
        if analysis.trend == "ALCISTA" and "FUERTE" in dow.get('pattern', ''):
            score += 20
        elif analysis.trend == "BAJISTA" and "FUERTE" in dow.get('pattern', ''):
            score += 20
        elif dow.get('pattern'):
            score += 10
        
        # Confirmación de volumen (10 puntos máx)
        vol = analysis.trend_details.get('volume_analysis', {}) if analysis.trend_details else {}
        if vol.get('confirms'):
            score += 10
        
        # Calcular niveles de entrada/salida
        if analysis.overall_signal.value in ["COMPRA FUERTE", "COMPRA"]:
            entry = current_price  # Comprar al precio actual
            sl = analysis.support_levels[0] if analysis.support_levels else current_price * 0.97
            tp = analysis.resistance_levels[0] if analysis.resistance_levels else current_price * 1.06
        elif analysis.overall_signal.value in ["VENTA FUERTE", "VENTA"]:
            entry = current_price
            tp = analysis.support_levels[0] if analysis.support_levels else current_price * 0.94
            sl = analysis.resistance_levels[0] if analysis.resistance_levels else current_price * 1.03
        else:
            entry = current_price
            sl = analysis.support_levels[0] if analysis.support_levels else current_price * 0.97
            tp = analysis.resistance_levels[0] if analysis.resistance_levels else current_price * 1.03
        
        # Risk/Reward
        risk = abs(entry - sl)
        reward = abs(tp - entry)
        rr = reward / risk if risk > 0 else 0
        
        # Extraer razones principales
        reasons = []
        if dow.get('pattern'):
            reasons.append(f"Dow: {dow['pattern']}")
        if vol.get('confirms'):
            reasons.append("Volumen confirma")
        if analysis.trend_details and analysis.trend_details.get('bullish_factors'):
            reasons.extend(analysis.trend_details['bullish_factors'][:2])
        if analysis.trend_details and analysis.trend_details.get('bearish_factors'):
            reasons.extend(analysis.trend_details['bearish_factors'][:2])
        
        return {
            "symbol": symbol,
            "signal": analysis.overall_signal.value,
            "signal_strength": analysis.signal_strength,
            "trend": analysis.trend,
            "trend_strength": analysis.trend_strength,
            "current_price": current_price,
            "price_change_24h": price_change,
            "volume_24h": volume,
            "entry_price": entry,
            "take_profit": tp,
            "stop_loss": sl,
            "risk_reward": round(rr, 2),
            "reasons": reasons[:4],
            "score": min(100, score)
        }
    except Exception as e:
        print(f"Error analizando {symbol}: {e}")
        return None


@app.get("/api/scanner", response_model=ScannerResponse)
async def scan_market(
    symbols: str = Query(default="", description="Símbolos a escanear separados por coma (vacío = todos)"),
    interval: str = Query(default="1h", description="Intervalo: 1m, 5m, 15m, 1h, 4h, 1d"),
    min_score: float = Query(default=50, description="Puntuación mínima para incluir (0-100)"),
    signal_filter: str = Query(default="all", description="Filtro: all, buy, sell")
):
    """
    🔍 SCANNER DE MERCADO - Encuentra las mejores oportunidades
    
    Escanea múltiples símbolos y devuelve oportunidades ordenadas por puntuación.
    
    - **symbols**: Lista de símbolos separados por coma (ej: BTCUSDT,ETHUSDT)
    - **interval**: Timeframe para el análisis
    - **min_score**: Solo mostrar oportunidades con score >= min_score
    - **signal_filter**: Filtrar por tipo de señal (all/buy/sell)
    """
    import time
    start_time = time.time()
    
    provider = await get_binance_provider()
    
    # Determinar símbolos a escanear
    if symbols:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
    else:
        symbol_list = DEFAULT_CRYPTO_SYMBOLS
    
    # Analizar en paralelo
    tasks = [analyze_symbol_fast(provider, sym, interval) for sym in symbol_list]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filtrar y procesar resultados
    opportunities = []
    buy_count = 0
    sell_count = 0
    
    for result in results:
        if result is None or isinstance(result, Exception):
            continue
        
        # Filtrar por score mínimo
        if result["score"] < min_score:
            continue
        
        # Filtrar por tipo de señal
        is_buy = result["signal"] in ["COMPRA FUERTE", "COMPRA"]
        is_sell = result["signal"] in ["VENTA FUERTE", "VENTA"]
        
        if signal_filter == "buy" and not is_buy:
            continue
        if signal_filter == "sell" and not is_sell:
            continue
        
        if is_buy:
            buy_count += 1
        if is_sell:
            sell_count += 1
        
        opportunities.append(OpportunityResponse(**result))
    
    # Ordenar por score descendente
    opportunities.sort(key=lambda x: x.score, reverse=True)
    
    # Mejor oportunidad
    best = opportunities[0].symbol if opportunities else None
    
    scan_time = time.time() - start_time
    
    return ScannerResponse(
        opportunities=opportunities,
        total_scanned=len(symbol_list),
        buy_signals=buy_count,
        sell_signals=sell_count,
        best_opportunity=best,
        scan_time=round(scan_time, 2)
    )


@app.get("/api/top-opportunities")
async def get_top_opportunities(
    limit: int = Query(default=5, description="Número de oportunidades top"),
    interval: str = Query(default="1h", description="Intervalo para análisis")
):
    """
    🏆 TOP OPORTUNIDADES - Las mejores señales del momento
    
    Devuelve las X mejores oportunidades ordenadas por puntuación.
    Ideal para el dashboard principal.
    """
    result = await scan_market(symbols="", interval=interval, min_score=40, signal_filter="all")
    
    top = result.opportunities[:limit]
    
    return {
        "top_opportunities": [
            {
                "rank": i + 1,
                "symbol": opp.symbol,
                "signal": opp.signal,
                "score": opp.score,
                "price": opp.current_price,
                "change_24h": opp.price_change_24h,
                "entry": opp.entry_price,
                "tp": opp.take_profit,
                "sl": opp.stop_loss,
                "rr": opp.risk_reward,
                "trend": opp.trend,
                "reasons": opp.reasons[:2]
            }
            for i, opp in enumerate(top)
        ],
        "scan_time": result.scan_time,
        "total_buy": result.buy_signals,
        "total_sell": result.sell_signals
    }


# ============== Sistema de Alertas ==============

# Almacén en memoria de alertas (en producción usar Redis/DB)
active_alerts: List[dict] = []
triggered_alerts: List[dict] = []


class AlertCreate(BaseModel):
    """Crear una alerta."""
    symbol: str
    condition: str  # "price_above", "price_below", "signal_buy", "signal_sell"
    value: Optional[float] = None  # Para alertas de precio
    message: Optional[str] = None


class AlertResponse(BaseModel):
    """Respuesta de alerta."""
    id: str
    symbol: str
    condition: str
    value: Optional[float]
    message: str
    created_at: str
    triggered: bool
    triggered_at: Optional[str] = None


@app.post("/api/alerts")
async def create_alert(alert: AlertCreate):
    """
    🔔 CREAR ALERTA - Te avisamos cuando pase algo
    
    Tipos de condición:
    - price_above: Cuando el precio suba de X
    - price_below: Cuando el precio baje de X
    - signal_buy: Cuando haya señal de compra
    - signal_sell: Cuando haya señal de venta
    """
    from datetime import datetime
    import uuid
    
    alert_id = str(uuid.uuid4())[:8]
    
    new_alert = {
        "id": alert_id,
        "symbol": alert.symbol.upper(),
        "condition": alert.condition,
        "value": alert.value,
        "message": alert.message or f"Alerta para {alert.symbol}",
        "created_at": datetime.now().isoformat(),
        "triggered": False,
        "triggered_at": None
    }
    
    active_alerts.append(new_alert)
    
    return {"status": "created", "alert": new_alert}


@app.get("/api/alerts")
async def get_alerts():
    """Lista todas las alertas activas y disparadas."""
    return {
        "active": active_alerts,
        "triggered": triggered_alerts[-20:],  # Últimas 20
        "total_active": len(active_alerts)
    }


@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Elimina una alerta."""
    global active_alerts
    active_alerts = [a for a in active_alerts if a["id"] != alert_id]
    return {"status": "deleted", "id": alert_id}


@app.get("/api/alerts/check")
async def check_alerts():
    """
    Verifica alertas activas y dispara las que cumplan condición.
    Llamar periódicamente desde el frontend.
    """
    from datetime import datetime
    
    provider = await get_binance_provider()
    newly_triggered = []
    
    for alert in active_alerts[:]:  # Copiar lista para modificar
        try:
            if alert["condition"] in ["price_above", "price_below"]:
                # Obtener precio actual
                price_data = await provider.get_ticker_price(alert["symbol"])
                current_price = float(price_data.get("price", 0))
                
                triggered = False
                if alert["condition"] == "price_above" and current_price >= alert["value"]:
                    triggered = True
                elif alert["condition"] == "price_below" and current_price <= alert["value"]:
                    triggered = True
                
                if triggered:
                    alert["triggered"] = True
                    alert["triggered_at"] = datetime.now().isoformat()
                    alert["trigger_price"] = current_price
                    triggered_alerts.append(alert)
                    active_alerts.remove(alert)
                    newly_triggered.append(alert)
            
            elif alert["condition"] in ["signal_buy", "signal_sell"]:
                # Hacer análisis rápido
                result = await analyze_symbol_fast(provider, alert["symbol"], "1h")
                if result:
                    is_buy = result["signal"] in ["COMPRA FUERTE", "COMPRA"]
                    is_sell = result["signal"] in ["VENTA FUERTE", "VENTA"]
                    
                    triggered = False
                    if alert["condition"] == "signal_buy" and is_buy:
                        triggered = True
                    elif alert["condition"] == "signal_sell" and is_sell:
                        triggered = True
                    
                    if triggered:
                        alert["triggered"] = True
                        alert["triggered_at"] = datetime.now().isoformat()
                        alert["trigger_signal"] = result["signal"]
                        triggered_alerts.append(alert)
                        active_alerts.remove(alert)
                        newly_triggered.append(alert)
        
        except Exception as e:
            print(f"Error verificando alerta {alert['id']}: {e}")
    
    return {
        "newly_triggered": newly_triggered,
        "active_count": len(active_alerts)
    }


# ============== Knowledge Base / Learning ==============

@app.get("/api/knowledge-base")
async def get_knowledge_base():
    """
    Devuelve los artículos de la base de conocimiento para el centro de aprendizaje.
    Lee los archivos markdown de rag/knowledge_base/ y los estructura.
    """
    import glob
    from pathlib import Path
    
    knowledge_dir = Path(__file__).parent / "rag" / "knowledge_base"
    articles = []
    
    # Mapeo de archivos a categorías
    category_map = {
        "murphy_technical_analysis": ("murphy", "📈", "Análisis Técnico de Murphy"),
        "indicadores_tecnicos": ("indicadores", "📊", "Indicadores Técnicos"),
        "patrones_velas": ("patrones", "🕯️", "Patrones de Velas (Básico)"),
        "patrones_velas_completo": ("patrones", "🕯️", "Patrones de Velas - Guía Completa"),
        "soportes_resistencias": ("soportes", "📍", "Soportes y Resistencias"),
        "volumen": ("volumen", "📶", "Análisis de Volumen"),
        "gestion_riesgo": ("riesgo", "🛡️", "Gestión de Riesgo"),
        "mercados": ("mercados", "🌐", "Tipos de Mercados"),
    }
    
    for md_file in knowledge_dir.glob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            filename = md_file.stem
            
            # Determinar categoría
            category_info = category_map.get(filename, ("general", "📄", filename))
            category, icon, default_title = category_info
            
            # Parsear el markdown
            sections = []
            current_section = None
            current_content = []
            title = default_title
            
            for line in content.split("\n"):
                if line.startswith("# "):
                    title = line[2:].strip()
                elif line.startswith("## "):
                    if current_section:
                        sections.append({
                            "title": current_section,
                            "content": "\n".join(current_content).strip()
                        })
                    current_section = line[3:].strip()
                    current_content = []
                elif line.startswith("### "):
                    # Subsección como parte del contenido
                    current_content.append(f"\n**{line[4:].strip()}**\n")
                else:
                    current_content.append(line)
            
            # Última sección
            if current_section:
                sections.append({
                    "title": current_section,
                    "content": "\n".join(current_content).strip()
                })
            elif current_content:
                sections.append({
                    "title": "Introducción",
                    "content": "\n".join(current_content).strip()
                })
            
            articles.append({
                "id": filename,
                "title": title,
                "category": category,
                "icon": icon,
                "content": content[:500],  # Preview
                "sections": sections
            })
            
        except Exception as e:
            print(f"Error leyendo {md_file}: {e}")
    
    return {"articles": articles}


# Eventos de ciclo de vida
@app.on_event("shutdown")
async def shutdown_event():
    """Cierra conexiones al apagar el servidor."""
    provider = await get_binance_provider()
    await provider.close()


# ============== Main ==============

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║     🔥 TradingHell Backend API 🔥      ║
    ╠════════════════════════════════════════╣
    ║  Documentación: http://localhost:8001/docs
    ║  Health check:  http://localhost:8001/health
    ╚════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8001)
