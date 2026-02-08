"""
TradingHell - Backend API
FastAPI backend para análisis técnico y asistente RAG de trading.
"""

import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Cargar variables de entorno
load_dotenv()

# Importar módulos locales
from data.providers import get_market_data, get_ticker_info, search_symbols, normalize_symbol
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
            print("⚠️ OPENAI_API_KEY no configurada. El RAG funcionará con Ollama local.")
            print("   Para usar OpenAI, crea un archivo .env con OPENAI_API_KEY=tu_clave")
    except Exception as e:
        print(f"⚠️ Error inicializando RAG: {e}")
        print("   El análisis técnico funcionará, pero las preguntas no.")


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


# ============== Main ==============

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║     🔥 TradingHell Backend API 🔥      ║
    ╠════════════════════════════════════════╣
    ║  Documentación: http://localhost:8000/docs
    ║  Health check:  http://localhost:8000/health
    ╚════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
