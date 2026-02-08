"""
Análisis técnico: indicadores, patrones de velas y señales.
"""

import pandas as pd
import pandas_ta as ta
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class Signal(Enum):
    """Tipos de señal."""
    STRONG_BUY = "COMPRA FUERTE"
    BUY = "COMPRA"
    NEUTRAL = "NEUTRAL"
    SELL = "VENTA"
    STRONG_SELL = "VENTA FUERTE"


@dataclass
class PatternDetection:
    """Resultado de detección de patrón."""
    name: str
    signal: Signal
    confidence: float  # 0-100
    description: str
    candle_index: int


@dataclass
class IndicatorResult:
    """Resultado de un indicador."""
    name: str
    value: float
    signal: Signal
    interpretation: str


@dataclass
class AnalysisResult:
    """Resultado completo del análisis."""
    symbol: str
    timeframe: str
    current_price: float
    
    # Tendencia
    trend: str  # "ALCISTA", "BAJISTA", "LATERAL"
    trend_strength: float  # 0-100
    
    # Indicadores
    indicators: List[IndicatorResult]
    
    # Patrones de velas
    patterns: List[PatternDetection]
    
    # Soportes y resistencias
    support_levels: List[float]
    resistance_levels: List[float]
    
    # Señal final
    overall_signal: Signal
    signal_strength: float  # 0-100
    
    # Resumen
    summary: str
    recommendations: List[str]


def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula todos los indicadores técnicos.
    
    Args:
        df: DataFrame con columnas OHLCV
        
    Returns:
        DataFrame con indicadores añadidos
    """
    df = df.copy()
    
    # Asegurar nombres de columnas correctos
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    # RSI
    df['rsi'] = ta.rsi(df['close'], length=14)
    
    # MACD
    macd = ta.macd(df['close'], fast=12, slow=26, signal=9)
    if macd is not None:
        df['macd'] = macd.iloc[:, 0]
        df['macd_signal'] = macd.iloc[:, 1]
        df['macd_hist'] = macd.iloc[:, 2]
    
    # Medias móviles
    df['sma_20'] = ta.sma(df['close'], length=20)
    df['sma_50'] = ta.sma(df['close'], length=50)
    df['sma_200'] = ta.sma(df['close'], length=200)
    df['ema_20'] = ta.ema(df['close'], length=20)
    df['ema_50'] = ta.ema(df['close'], length=50)
    
    # Bandas de Bollinger
    bbands = ta.bbands(df['close'], length=20, std=2)
    if bbands is not None:
        df['bb_upper'] = bbands.iloc[:, 0]
        df['bb_middle'] = bbands.iloc[:, 1]
        df['bb_lower'] = bbands.iloc[:, 2]
    
    # Estocástico
    stoch = ta.stoch(df['high'], df['low'], df['close'], k=14, d=3)
    if stoch is not None:
        df['stoch_k'] = stoch.iloc[:, 0]
        df['stoch_d'] = stoch.iloc[:, 1]
    
    # ADX
    adx = ta.adx(df['high'], df['low'], df['close'], length=14)
    if adx is not None:
        df['adx'] = adx.iloc[:, 0]
    
    # ATR
    df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
    
    # OBV
    df['obv'] = ta.obv(df['close'], df['volume'])
    
    # CCI
    df['cci'] = ta.cci(df['high'], df['low'], df['close'], length=20)
    
    return df


def detect_candle_patterns(df: pd.DataFrame) -> List[PatternDetection]:
    """
    Detecta patrones de velas japonesas.
    
    Args:
        df: DataFrame con OHLCV
        
    Returns:
        Lista de patrones detectados
    """
    patterns = []
    df = df.copy()
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    # Patrones de reversión alcista
    pattern_checks = [
        ('CDL_HAMMER', 'Martillo', Signal.BUY, 70, 
         "Patrón de reversión alcista. Indica que los compradores rechazaron precios bajos."),
        
        ('CDL_INVERTEDHAMMER', 'Martillo Invertido', Signal.BUY, 60,
         "Posible reversión alcista. Los compradores intentaron subir el precio."),
        
        ('CDL_ENGULFING', 'Envolvente', None, 80,
         "Patrón de reversión fuerte. La vela actual envuelve completamente la anterior."),
        
        ('CDL_MORNINGSTAR', 'Estrella de la Mañana', Signal.STRONG_BUY, 85,
         "Patrón de reversión alcista muy fiable. Señal fuerte de compra."),
        
        ('CDL_EVENINGSTAR', 'Estrella de la Tarde', Signal.STRONG_SELL, 85,
         "Patrón de reversión bajista muy fiable. Señal fuerte de venta."),
        
        ('CDL_DOJI', 'Doji', Signal.NEUTRAL, 50,
         "Indecisión total del mercado. Esperar confirmación."),
        
        ('CDL_SHOOTINGSTAR', 'Estrella Fugaz', Signal.SELL, 70,
         "Patrón de reversión bajista. Los vendedores rechazaron precios altos."),
        
        ('CDL_HANGINGMAN', 'Hombre Colgado', Signal.SELL, 60,
         "Advertencia de posible reversión bajista."),
        
        ('CDL_PIERCING', 'Línea Penetrante', Signal.BUY, 70,
         "Patrón alcista. El precio recuperó más del 50% de la caída anterior."),
        
        ('CDL_DARKCLOUDCOVER', 'Nube Oscura', Signal.SELL, 70,
         "Patrón bajista. El precio cayó más del 50% de la subida anterior."),
        
        ('CDL_3WHITESOLDIERS', 'Tres Soldados Blancos', Signal.STRONG_BUY, 80,
         "Fuerte presión compradora sostenida. Tendencia alcista confirmada."),
        
        ('CDL_3BLACKCROWS', 'Tres Cuervos Negros', Signal.STRONG_SELL, 80,
         "Fuerte presión vendedora sostenida. Tendencia bajista confirmada."),
    ]
    
    for func_name, name, default_signal, confidence, description in pattern_checks:
        try:
            # Usar pandas_ta para detectar patrones
            result = df.ta.cdl_pattern(name=func_name.replace('CDL_', '').lower())
            
            if result is not None and len(result) > 0:
                last_value = result.iloc[-1].values[0] if hasattr(result.iloc[-1], 'values') else result.iloc[-1]
                
                if last_value != 0:
                    signal = default_signal
                    if signal is None:
                        signal = Signal.BUY if last_value > 0 else Signal.SELL
                    
                    patterns.append(PatternDetection(
                        name=name,
                        signal=signal,
                        confidence=confidence,
                        description=description,
                        candle_index=-1
                    ))
        except Exception:
            continue
    
    return patterns


def find_support_resistance(df: pd.DataFrame, window: int = 20) -> Tuple[List[float], List[float]]:
    """
    Encuentra niveles de soporte y resistencia.
    
    Args:
        df: DataFrame con OHLCV
        window: Ventana para buscar picos/valles
        
    Returns:
        (soportes, resistencias)
    """
    df = df.copy()
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    # Encontrar mínimos locales (soportes)
    supports = []
    for i in range(window, len(df) - window):
        if df['low'].iloc[i] == df['low'].iloc[i-window:i+window].min():
            supports.append(df['low'].iloc[i])
    
    # Encontrar máximos locales (resistencias)
    resistances = []
    for i in range(window, len(df) - window):
        if df['high'].iloc[i] == df['high'].iloc[i-window:i+window].max():
            resistances.append(df['high'].iloc[i])
    
    # Filtrar niveles cercanos (agrupar)
    def cluster_levels(levels: List[float], threshold: float = 0.02) -> List[float]:
        if not levels:
            return []
        
        levels = sorted(levels)
        clustered = [levels[0]]
        
        for level in levels[1:]:
            if abs(level - clustered[-1]) / clustered[-1] > threshold:
                clustered.append(level)
            else:
                # Promediar niveles cercanos
                clustered[-1] = (clustered[-1] + level) / 2
        
        return clustered
    
    current_price = df['close'].iloc[-1]
    
    # Solo devolver niveles cercanos al precio actual (±20%)
    supports = [s for s in cluster_levels(supports) if s < current_price and s > current_price * 0.8]
    resistances = [r for r in cluster_levels(resistances) if r > current_price and r < current_price * 1.2]
    
    return sorted(supports, reverse=True)[:3], sorted(resistances)[:3]


def analyze_indicators(df: pd.DataFrame) -> List[IndicatorResult]:
    """
    Analiza los indicadores y genera interpretaciones.
    
    Args:
        df: DataFrame con indicadores calculados
        
    Returns:
        Lista de resultados de indicadores
    """
    results = []
    last = df.iloc[-1]
    
    # RSI
    if 'rsi' in df.columns and not pd.isna(last.get('rsi')):
        rsi = last['rsi']
        if rsi > 70:
            signal = Signal.SELL
            interp = f"RSI en {rsi:.1f} → SOBRECOMPRA. El precio puede bajar."
        elif rsi < 30:
            signal = Signal.BUY
            interp = f"RSI en {rsi:.1f} → SOBREVENTA. El precio puede subir."
        else:
            signal = Signal.NEUTRAL
            interp = f"RSI en {rsi:.1f} → Zona neutral."
        
        results.append(IndicatorResult("RSI", rsi, signal, interp))
    
    # MACD
    if all(col in df.columns for col in ['macd', 'macd_signal']):
        macd = last.get('macd', 0)
        macd_signal = last.get('macd_signal', 0)
        
        if not pd.isna(macd) and not pd.isna(macd_signal):
            if macd > macd_signal and macd > 0:
                signal = Signal.BUY
                interp = "MACD por encima de la señal y positivo → Tendencia alcista."
            elif macd > macd_signal:
                signal = Signal.BUY
                interp = "MACD cruzando al alza → Posible cambio a alcista."
            elif macd < macd_signal and macd < 0:
                signal = Signal.SELL
                interp = "MACD por debajo de la señal y negativo → Tendencia bajista."
            else:
                signal = Signal.NEUTRAL
                interp = "MACD neutral, esperando dirección."
            
            results.append(IndicatorResult("MACD", macd, signal, interp))
    
    # Medias móviles
    close = last.get('close', 0)
    sma_20 = last.get('sma_20', 0)
    sma_50 = last.get('sma_50', 0)
    sma_200 = last.get('sma_200', 0)
    ema_20 = last.get('ema_20', 0)
    ema_50 = last.get('ema_50', 0)
    
    # SMA 20
    if not pd.isna(sma_20):
        signal = Signal.BUY if close > sma_20 else Signal.SELL
        results.append(IndicatorResult("SMA 20", sma_20, signal, f"Media Simple 20: {sma_20:.2f}"))
    
    # SMA 50
    if not pd.isna(sma_50):
        signal = Signal.BUY if close > sma_50 else Signal.SELL
        results.append(IndicatorResult("SMA 50", sma_50, signal, f"Media Simple 50: {sma_50:.2f}"))
    
    # SMA 200 (importante)
    if not pd.isna(sma_200):
        signal = Signal.BUY if close > sma_200 else Signal.SELL
        results.append(IndicatorResult("SMA 200", sma_200, signal, f"Media Simple 200: {sma_200:.2f}"))
    
    # EMA 20
    if not pd.isna(ema_20):
        signal = Signal.BUY if close > ema_20 else Signal.SELL
        results.append(IndicatorResult("EMA 20", ema_20, signal, f"Media Exponencial 20: {ema_20:.2f}"))
    
    # EMA 50
    if not pd.isna(ema_50):
        signal = Signal.BUY if close > ema_50 else Signal.SELL
        results.append(IndicatorResult("EMA 50", ema_50, signal, f"Media Exponencial 50: {ema_50:.2f}"))
    
    # Bandas de Bollinger
    bb_upper = last.get('bb_upper', 0)
    bb_middle = last.get('bb_middle', 0)
    bb_lower = last.get('bb_lower', 0)
    
    if not pd.isna(bb_upper):
        signal = Signal.SELL if close >= bb_upper else Signal.NEUTRAL
        results.append(IndicatorResult("BB Superior", bb_upper, signal, f"Banda Superior: {bb_upper:.2f}"))
    
    if not pd.isna(bb_middle):
        signal = Signal.BUY if close > bb_middle else Signal.SELL
        results.append(IndicatorResult("BB Media", bb_middle, signal, f"Banda Media: {bb_middle:.2f}"))
    
    if not pd.isna(bb_lower):
        signal = Signal.BUY if close <= bb_lower else Signal.NEUTRAL
        results.append(IndicatorResult("BB Inferior", bb_lower, signal, f"Banda Inferior: {bb_lower:.2f}"))
    
    # Estocástico
    stoch_k = last.get('stoch_k', 0)
    stoch_d = last.get('stoch_d', 0)
    
    if not pd.isna(stoch_k):
        if stoch_k > 80:
            signal = Signal.SELL
            interp = f"Estocástico en {stoch_k:.1f} → SOBRECOMPRA."
        elif stoch_k < 20:
            signal = Signal.BUY
            interp = f"Estocástico en {stoch_k:.1f} → SOBREVENTA."
        else:
            signal = Signal.NEUTRAL
            interp = f"Estocástico en {stoch_k:.1f} → Neutral."
        
        results.append(IndicatorResult("Estocástico", stoch_k, signal, interp))
    
    # ADX (fuerza de tendencia)
    adx = last.get('adx', 0)
    
    if not pd.isna(adx):
        if adx > 50:
            interp = f"ADX en {adx:.1f} → Tendencia MUY FUERTE."
        elif adx > 25:
            interp = f"ADX en {adx:.1f} → Tendencia fuerte."
        else:
            interp = f"ADX en {adx:.1f} → Sin tendencia clara (lateral)."
        
        results.append(IndicatorResult("ADX", adx, Signal.NEUTRAL, interp))
    
    return results


def determine_trend(df: pd.DataFrame) -> Tuple[str, float]:
    """
    Determina la tendencia actual.
    
    Args:
        df: DataFrame con indicadores
        
    Returns:
        (tendencia, fuerza 0-100)
    """
    last = df.iloc[-1]
    
    close = last.get('close', 0)
    sma_20 = last.get('sma_20', 0)
    sma_50 = last.get('sma_50', 0)
    sma_200 = last.get('sma_200', 0)
    adx = last.get('adx', 25)
    
    bullish_score = 0
    bearish_score = 0
    
    # Posición respecto a medias
    if not pd.isna(sma_20) and close > sma_20:
        bullish_score += 1
    else:
        bearish_score += 1
    
    if not pd.isna(sma_50) and close > sma_50:
        bullish_score += 1
    else:
        bearish_score += 1
    
    if not pd.isna(sma_200) and close > sma_200:
        bullish_score += 1
    else:
        bearish_score += 1
    
    # Cruce de medias
    if not pd.isna(sma_20) and not pd.isna(sma_50):
        if sma_20 > sma_50:
            bullish_score += 1
        else:
            bearish_score += 1
    
    # MACD
    macd = last.get('macd', 0)
    if not pd.isna(macd):
        if macd > 0:
            bullish_score += 1
        else:
            bearish_score += 1
    
    # Determinar tendencia
    if bullish_score > bearish_score + 1:
        trend = "ALCISTA"
    elif bearish_score > bullish_score + 1:
        trend = "BAJISTA"
    else:
        trend = "LATERAL"
    
    # Fuerza basada en ADX
    strength = min(100, adx * 2) if not pd.isna(adx) else 50
    
    return trend, strength


def calculate_overall_signal(
    indicators: List[IndicatorResult],
    patterns: List[PatternDetection]
) -> Tuple[Signal, float]:
    """
    Calcula la señal general combinando indicadores y patrones.
    
    Returns:
        (señal, fuerza 0-100)
    """
    buy_score = 0
    sell_score = 0
    total_weight = 0
    
    # Ponderar indicadores
    for ind in indicators:
        weight = 1.0
        if ind.name in ["RSI", "MACD", "Medias Móviles"]:
            weight = 1.5
        
        if ind.signal in [Signal.BUY, Signal.STRONG_BUY]:
            buy_score += weight * (1.5 if ind.signal == Signal.STRONG_BUY else 1.0)
        elif ind.signal in [Signal.SELL, Signal.STRONG_SELL]:
            sell_score += weight * (1.5 if ind.signal == Signal.STRONG_SELL else 1.0)
        
        total_weight += weight
    
    # Ponderar patrones
    for pattern in patterns:
        weight = pattern.confidence / 100 * 2
        
        if pattern.signal in [Signal.BUY, Signal.STRONG_BUY]:
            buy_score += weight * (1.5 if pattern.signal == Signal.STRONG_BUY else 1.0)
        elif pattern.signal in [Signal.SELL, Signal.STRONG_SELL]:
            sell_score += weight * (1.5 if pattern.signal == Signal.STRONG_SELL else 1.0)
        
        total_weight += weight
    
    if total_weight == 0:
        return Signal.NEUTRAL, 50
    
    # Normalizar
    buy_pct = buy_score / total_weight
    sell_pct = sell_score / total_weight
    
    diff = buy_pct - sell_pct
    
    if diff > 0.3:
        signal = Signal.STRONG_BUY
    elif diff > 0.1:
        signal = Signal.BUY
    elif diff < -0.3:
        signal = Signal.STRONG_SELL
    elif diff < -0.1:
        signal = Signal.SELL
    else:
        signal = Signal.NEUTRAL
    
    strength = min(100, abs(diff) * 200 + 50)
    
    return signal, strength


def generate_summary(result: AnalysisResult) -> str:
    """Genera un resumen en lenguaje natural del análisis."""
    
    signal_emoji = {
        Signal.STRONG_BUY: "🟢🟢",
        Signal.BUY: "🟢",
        Signal.NEUTRAL: "🟡",
        Signal.SELL: "🔴",
        Signal.STRONG_SELL: "🔴🔴"
    }
    
    summary = f"""
📊 **ANÁLISIS DE {result.symbol}** ({result.timeframe})

💰 **Precio actual**: {result.current_price:.4f}

📈 **Tendencia**: {result.trend} (Fuerza: {result.trend_strength:.0f}%)

{signal_emoji.get(result.overall_signal, '')} **SEÑAL**: {result.overall_signal.value}
   Confianza: {result.signal_strength:.0f}%
"""
    
    # Añadir patrones detectados
    if result.patterns:
        summary += "\n🕯️ **Patrones de velas detectados**:\n"
        for p in result.patterns:
            summary += f"   • {p.name}: {p.signal.value} ({p.confidence:.0f}%)\n"
    
    # Soportes y resistencias
    if result.support_levels:
        summary += f"\n🛡️ **Soportes**: {', '.join([f'{s:.4f}' for s in result.support_levels])}\n"
    if result.resistance_levels:
        summary += f"🎯 **Resistencias**: {', '.join([f'{r:.4f}' for r in result.resistance_levels])}\n"
    
    return summary


def generate_recommendations(result: AnalysisResult) -> List[str]:
    """Genera recomendaciones basadas en el análisis."""
    
    recs = []
    
    if result.overall_signal == Signal.STRONG_BUY:
        recs.append("✅ Buena oportunidad de COMPRA. Múltiples indicadores alineados al alza.")
        if result.support_levels:
            recs.append(f"📍 Stop Loss sugerido: {result.support_levels[0]:.4f} (primer soporte)")
    
    elif result.overall_signal == Signal.BUY:
        recs.append("✅ Considerar COMPRA con precaución. Esperar confirmación adicional.")
        recs.append("⚠️ No invertir más del 1-2% del capital en esta operación.")
    
    elif result.overall_signal == Signal.SELL:
        recs.append("❌ Considerar VENTA o no entrar en nuevas compras.")
        recs.append("⚠️ Si tienes posición, ajustar stop loss para proteger ganancias.")
    
    elif result.overall_signal == Signal.STRONG_SELL:
        recs.append("❌ Señal de VENTA fuerte. Evitar compras.")
        recs.append("⚠️ Si tienes posición, considerar cerrar o reducir exposición.")
    
    else:  # NEUTRAL
        recs.append("🟡 Mercado sin dirección clara. ESPERAR mejor momento.")
        recs.append("⚠️ No operar en mercados laterales sin experiencia.")
    
    # Advertencia general
    recs.append("⚠️ RECUERDA: Esto es solo análisis técnico, no garantiza resultados. Gestiona tu riesgo.")
    
    return recs


def full_analysis(df: pd.DataFrame, symbol: str, timeframe: str = "1d") -> AnalysisResult:
    """
    Realiza un análisis técnico completo.
    
    Args:
        df: DataFrame con OHLCV
        symbol: Símbolo del activo
        timeframe: Timeframe del análisis
        
    Returns:
        AnalysisResult con todo el análisis
    """
    # Calcular indicadores
    df = calculate_indicators(df)
    
    # Detectar patrones
    patterns = detect_candle_patterns(df)
    
    # Analizar indicadores
    indicators = analyze_indicators(df)
    
    # Encontrar soportes y resistencias
    supports, resistances = find_support_resistance(df)
    
    # Determinar tendencia
    trend, trend_strength = determine_trend(df)
    
    # Calcular señal general
    overall_signal, signal_strength = calculate_overall_signal(indicators, patterns)
    
    # Crear resultado
    result = AnalysisResult(
        symbol=symbol,
        timeframe=timeframe,
        current_price=df['close'].iloc[-1],
        trend=trend,
        trend_strength=trend_strength,
        indicators=indicators,
        patterns=patterns,
        support_levels=supports,
        resistance_levels=resistances,
        overall_signal=overall_signal,
        signal_strength=signal_strength,
        summary="",
        recommendations=[]
    )
    
    # Generar resumen y recomendaciones
    result.summary = generate_summary(result)
    result.recommendations = generate_recommendations(result)
    
    return result
