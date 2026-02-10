"""
Análisis técnico basado en los principios de John J. Murphy
("Technical Analysis of the Financial Markets")

Principios clave implementados:
1. Dow Theory: Tendencia = higher peaks/troughs (alcista) o lower peaks/troughs (bajista)
2. El volumen debe confirmar la tendencia
3. La tendencia persiste hasta señales definitivas de reversión
4. Múltiples timeframes: primary, secondary, minor trends
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
    
    # Detalles de tendencia (opcional, al final)
    trend_details: Dict = None


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


def identify_peaks_troughs(df: pd.DataFrame, order: int = 5) -> Tuple[List[Tuple[int, float]], List[Tuple[int, float]]]:
    """
    Identifica máximos (peaks) y mínimos (troughs) locales.
    Basado en Dow Theory: necesitamos identificar swing highs y swing lows.
    
    Args:
        df: DataFrame con OHLCV
        order: Número de velas a cada lado para confirmar un extremo
        
    Returns:
        (peaks, troughs) - Listas de tuplas (índice, precio)
    """
    df = df.copy()
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    highs = df['high'].values
    lows = df['low'].values
    n = len(df)
    
    peaks = []  # Swing highs
    troughs = []  # Swing lows
    
    for i in range(order, n - order):
        # Buscar swing high (máximo local)
        is_peak = True
        for j in range(1, order + 1):
            if highs[i] <= highs[i - j] or highs[i] <= highs[i + j]:
                is_peak = False
                break
        if is_peak:
            peaks.append((i, highs[i]))
        
        # Buscar swing low (mínimo local)
        is_trough = True
        for j in range(1, order + 1):
            if lows[i] >= lows[i - j] or lows[i] >= lows[i + j]:
                is_trough = False
                break
        if is_trough:
            troughs.append((i, lows[i]))
    
    return peaks, troughs


def analyze_dow_trend(peaks: List[Tuple[int, float]], troughs: List[Tuple[int, float]], 
                       current_price: float) -> Tuple[str, Dict]:
    """
    Analiza la tendencia según Dow Theory.
    
    Dow Theory (Murphy, Chapter 2):
    - Uptrend: cada peak sucesivo es más alto que el anterior Y cada trough es más alto que el anterior
    - Downtrend: cada peak sucesivo es más bajo que el anterior Y cada trough es más bajo que el anterior
    - La tendencia persiste hasta que hay señales definitivas de reversión
    
    Args:
        peaks: Lista de (índice, precio) de máximos
        troughs: Lista de (índice, precio) de mínimos
        current_price: Precio actual
        
    Returns:
        (tendencia, detalles)
    """
    details = {
        'peaks': peaks[-4:] if len(peaks) >= 4 else peaks,
        'troughs': troughs[-4:] if len(troughs) >= 4 else troughs,
        'pattern': 'indefinido',
        'signals': []
    }
    
    if len(peaks) < 2 or len(troughs) < 2:
        return "INDEFINIDO", details
    
    # Tomar los últimos peaks y troughs para análisis
    recent_peaks = peaks[-4:] if len(peaks) >= 4 else peaks
    recent_troughs = troughs[-4:] if len(troughs) >= 4 else troughs
    
    # Analizar secuencia de peaks (Higher Highs vs Lower Highs)
    higher_highs = 0
    lower_highs = 0
    for i in range(1, len(recent_peaks)):
        if recent_peaks[i][1] > recent_peaks[i-1][1]:
            higher_highs += 1
        elif recent_peaks[i][1] < recent_peaks[i-1][1]:
            lower_highs += 1
    
    # Analizar secuencia de troughs (Higher Lows vs Lower Lows)
    higher_lows = 0
    lower_lows = 0
    for i in range(1, len(recent_troughs)):
        if recent_troughs[i][1] > recent_troughs[i-1][1]:
            higher_lows += 1
        elif recent_troughs[i][1] < recent_troughs[i-1][1]:
            lower_lows += 1
    
    # Dow Theory: Uptrend = HH + HL, Downtrend = LH + LL
    total_peaks = len(recent_peaks) - 1
    total_troughs = len(recent_troughs) - 1
    
    hh_pct = (higher_highs / total_peaks * 100) if total_peaks > 0 else 0
    lh_pct = (lower_highs / total_peaks * 100) if total_peaks > 0 else 0
    hl_pct = (higher_lows / total_troughs * 100) if total_troughs > 0 else 0
    ll_pct = (lower_lows / total_troughs * 100) if total_troughs > 0 else 0
    
    details['higher_highs'] = higher_highs
    details['lower_highs'] = lower_highs
    details['higher_lows'] = higher_lows
    details['lower_lows'] = lower_lows
    
    # Determinar tendencia según Dow
    if higher_highs >= lower_highs and higher_lows >= lower_lows and (higher_highs > 0 or higher_lows > 0):
        # Uptrend: Higher Highs + Higher Lows
        if higher_highs > 0 and higher_lows > 0:
            details['pattern'] = 'Higher Highs + Higher Lows (ALCISTA FUERTE)'
            details['signals'].append("📈 Máximos ascendentes (Dow Theory)")
            details['signals'].append("📈 Mínimos ascendentes (Dow Theory)")
            return "ALCISTA", details
        else:
            details['pattern'] = 'Parcialmente alcista'
            return "ALCISTA_DEBIL", details
            
    elif lower_highs >= higher_highs and lower_lows >= higher_lows and (lower_highs > 0 or lower_lows > 0):
        # Downtrend: Lower Highs + Lower Lows
        if lower_highs > 0 and lower_lows > 0:
            details['pattern'] = 'Lower Highs + Lower Lows (BAJISTA FUERTE)'
            details['signals'].append("📉 Máximos descendentes (Dow Theory)")
            details['signals'].append("📉 Mínimos descendentes (Dow Theory)")
            return "BAJISTA", details
        else:
            details['pattern'] = 'Parcialmente bajista'
            return "BAJISTA_DEBIL", details
    
    # Patrones mixtos (posible reversión o consolidación)
    elif higher_highs > 0 and lower_lows > 0:
        details['pattern'] = 'Divergencia: HH pero LL (posible techo)'
        details['signals'].append("⚠️ Divergencia en estructura - posible cambio de tendencia")
        return "LATERAL", details
    elif lower_highs > 0 and higher_lows > 0:
        details['pattern'] = 'Divergencia: LH pero HL (posible suelo)'
        details['signals'].append("⚠️ Posible formación de suelo")
        return "LATERAL", details
    else:
        details['pattern'] = 'Consolidación lateral'
        return "LATERAL", details


def confirm_volume_trend(df: pd.DataFrame, trend: str) -> Tuple[bool, str]:
    """
    Verifica si el volumen confirma la tendencia.
    
    Murphy, Chapter 7 - Volume Must Confirm the Trend:
    - En uptrend: volumen aumenta cuando precio sube, disminuye cuando precio baja
    - En downtrend: volumen aumenta cuando precio baja, disminuye cuando precio rally
    
    Args:
        df: DataFrame con OHLCV
        trend: Tendencia detectada
        
    Returns:
        (confirma, descripción)
    """
    df = df.copy()
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    n = len(df)
    if n < 20:
        return True, "Datos insuficientes para análisis de volumen"
    
    # Dividir en segmentos y analizar correlación precio-volumen
    price_changes = df['close'].diff().iloc[-20:]
    volumes = df['volume'].iloc[-20:]
    
    up_days = price_changes > 0
    down_days = price_changes < 0
    
    avg_vol_up = volumes[up_days].mean() if up_days.sum() > 0 else 0
    avg_vol_down = volumes[down_days].mean() if down_days.sum() > 0 else 0
    
    if trend in ["ALCISTA", "ALCISTA_DEBIL"]:
        # En uptrend, volumen debe ser mayor en días alcistas
        if avg_vol_up > avg_vol_down * 1.1:
            return True, f"✅ Volumen confirma tendencia alcista (Vol↑ en subidas: {avg_vol_up/1e6:.1f}M > Vol↓ en bajadas: {avg_vol_down/1e6:.1f}M)"
        elif avg_vol_down > avg_vol_up * 1.2:
            return False, f"⚠️ Volumen NO confirma: mayor volumen en bajadas ({avg_vol_down/1e6:.1f}M > {avg_vol_up/1e6:.1f}M)"
        else:
            return True, "Volumen neutral"
            
    elif trend in ["BAJISTA", "BAJISTA_DEBIL"]:
        # En downtrend, volumen debe ser mayor en días bajistas
        if avg_vol_down > avg_vol_up * 1.1:
            return True, f"✅ Volumen confirma tendencia bajista (Vol↓ en bajadas: {avg_vol_down/1e6:.1f}M > Vol↑ en subidas: {avg_vol_up/1e6:.1f}M)"
        elif avg_vol_up > avg_vol_down * 1.2:
            return False, f"⚠️ Volumen NO confirma: mayor volumen en subidas ({avg_vol_up/1e6:.1f}M > {avg_vol_down/1e6:.1f}M)"
        else:
            return True, "Volumen neutral"
    
    return True, "Tendencia lateral - análisis de volumen no aplica"


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
                # Buscar en las últimas 15 velas, no solo la última
                lookback = min(15, len(result))
                
                for i in range(lookback):
                    idx = -(i + 1)  # -1, -2, -3, ... -15
                    try:
                        value = result.iloc[idx].values[0] if hasattr(result.iloc[idx], 'values') else result.iloc[idx]
                        
                        if value != 0:
                            signal = default_signal
                            if signal is None:
                                signal = Signal.BUY if value > 0 else Signal.SELL
                            
                            # Índice real de la vela (desde el final)
                            real_index = len(df) + idx  # Convertir a índice absoluto
                            
                            patterns.append(PatternDetection(
                                name=name,
                                signal=signal,
                                confidence=confidence,
                                description=description,
                                candle_index=idx  # Índice relativo desde el final (-1, -2, etc.)
                            ))
                            # Solo tomar la ocurrencia más reciente de cada patrón
                            break
                    except (IndexError, KeyError):
                        continue
        except Exception:
            continue
    
    # Filtrar patrones duplicados: si hay varios del mismo tipo, quedarse con el más reciente
    # Pero permitir múltiples patrones diferentes cerca
    filtered_patterns = []
    seen_pattern_names = set()
    used_indices = set()
    
    # Ordenar por índice (más reciente primero) y luego por confianza
    patterns.sort(key=lambda p: (p.candle_index, -p.confidence), reverse=True)
    
    for p in patterns:
        # No repetir el mismo tipo de patrón
        if p.name in seen_pattern_names:
            continue
            
        # Evitar patrones exactamente en la misma vela
        idx = p.candle_index
        if idx in used_indices:
            continue
        
        filtered_patterns.append(p)
        seen_pattern_names.add(p.name)
        used_indices.add(idx)
        
        # Máximo 8 patrones diferentes
        if len(filtered_patterns) >= 8:
            break
    
    # Ordenar resultado por índice (más antiguo primero para el display)
    filtered_patterns.sort(key=lambda p: p.candle_index)
    
    return filtered_patterns


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


def determine_trend(df: pd.DataFrame) -> Tuple[str, float, Dict]:
    """
    Determina la tendencia actual usando los principios de Murphy/Dow Theory.
    
    Metodología basada en "Technical Analysis of the Financial Markets" (J.J. Murphy):
    
    1. DOW THEORY (Principio fundamental):
       - Uptrend = Higher Peaks + Higher Troughs (máximos y mínimos ascendentes)
       - Downtrend = Lower Peaks + Lower Troughs (máximos y mínimos descendentes)
       - "La tendencia persiste hasta que da señales definitivas de reversión"
    
    2. CONFIRMACIÓN DE VOLUMEN:
       - En uptrend: volumen aumenta en subidas, disminuye en bajadas
       - En downtrend: volumen aumenta en bajadas, disminuye en subidas
    
    3. MEDIAS MÓVILES como confirmación secundaria:
       - Precio vs SMA 200 (tendencia de largo plazo)
       - Cruces de medias
    
    Args:
        df: DataFrame con indicadores
        
    Returns:
        (tendencia, fuerza 0-100, detalles)
    """
    details = {
        'bullish_factors': [],
        'bearish_factors': [],
        'neutral_factors': [],
        'dow_theory': {},
        'volume_analysis': {},
        'sma_values': {},
        'price_change': {}
    }
    
    last = df.iloc[-1]
    n = len(df)
    
    close = last.get('close', 0)
    sma_20 = last.get('sma_20')
    sma_50 = last.get('sma_50')
    sma_200 = last.get('sma_200')
    adx = last.get('adx', 25)
    
    # Guardar valores de SMAs para visualización
    if not pd.isna(sma_20):
        details['sma_values']['sma_20'] = float(sma_20)
    if not pd.isna(sma_50):
        details['sma_values']['sma_50'] = float(sma_50)
    if not pd.isna(sma_200):
        details['sma_values']['sma_200'] = float(sma_200)
    
    # Calcular cambio de precio del período
    period_start = df['close'].iloc[0]
    price_change_pct = ((close - period_start) / period_start) * 100
    period_high = df['high'].max()
    period_low = df['low'].min()
    drop_from_high = ((close - period_high) / period_high) * 100
    rise_from_low = ((close - period_low) / period_low) * 100
    
    details['price_change'] = {
        'total': round(price_change_pct, 2),
        'start_price': float(period_start),
        'end_price': float(close),
        'drop_from_high': round(drop_from_high, 2),
        'rise_from_low': round(rise_from_low, 2)
    }
    
    # ========== 1. DOW THEORY - ANÁLISIS DE PEAKS Y TROUGHS ==========
    # Identificar máximos y mínimos locales (swing highs/lows)
    order = max(3, n // 20)  # Ajustar sensibilidad según datos disponibles
    peaks, troughs = identify_peaks_troughs(df, order=order)
    
    # Analizar estructura según Dow Theory
    dow_trend, dow_details = analyze_dow_trend(peaks, troughs, close)
    details['dow_theory'] = dow_details
    
    # ========== 2. CONFIRMACIÓN DE VOLUMEN (Murphy Chapter 7) ==========
    volume_confirms, volume_msg = confirm_volume_trend(df, dow_trend)
    details['volume_analysis'] = {
        'confirms': volume_confirms,
        'message': volume_msg
    }
    
    # ========== 3. ANÁLISIS DE MEDIAS MÓVILES ==========
    ma_bullish = 0
    ma_bearish = 0
    
    # Precio vs SMA 200 (tendencia de largo plazo - Murphy Chapter 9)
    if not pd.isna(sma_200):
        if close > sma_200:
            ma_bullish += 3
            details['bullish_factors'].append(f"✅ Precio ({close:.2f}) por encima de SMA 200 ({sma_200:.2f}) - Tendencia largo plazo ALCISTA")
        else:
            ma_bearish += 3
            details['bearish_factors'].append(f"❌ Precio ({close:.2f}) por debajo de SMA 200 ({sma_200:.2f}) - Tendencia largo plazo BAJISTA")
    
    # Precio vs SMA 50 (tendencia intermedia)
    if not pd.isna(sma_50):
        if close > sma_50:
            ma_bullish += 2
            details['bullish_factors'].append(f"📈 Precio por encima de SMA 50")
        else:
            ma_bearish += 2
            details['bearish_factors'].append(f"📉 Precio por debajo de SMA 50")
    
    # Cruce de medias (Golden Cross / Death Cross)
    if not pd.isna(sma_50) and not pd.isna(sma_200):
        if sma_50 > sma_200:
            ma_bullish += 2
            details['bullish_factors'].append("🌟 Golden Cross: SMA 50 > SMA 200")
        else:
            ma_bearish += 2
            details['bearish_factors'].append("💀 Death Cross: SMA 50 < SMA 200")
    
    # ========== 4. DETERMINACIÓN FINAL DE TENDENCIA ==========
    # Prioridad: 
    # 1. Cambio de precio muy significativo (>15%) -> tendencia automática
    # 2. Dow Theory (peaks/troughs) como factor principal
    # 3. Confirmación de volumen puede invalidar
    # 4. Medias móviles como confirmación
    
    # Caso especial: Cambio de precio extremo
    if price_change_pct <= -15:
        trend = "BAJISTA"
        details['bearish_factors'].insert(0, f"📉 CAÍDA FUERTE: {abs(price_change_pct):.1f}% en el período")
        strength = min(100, abs(price_change_pct) * 3)
        
    elif price_change_pct >= 15:
        trend = "ALCISTA"
        details['bullish_factors'].insert(0, f"📈 SUBIDA FUERTE: {price_change_pct:.1f}% en el período")
        strength = min(100, price_change_pct * 3)
        
    else:
        # Usar Dow Theory como base
        if dow_trend == "ALCISTA":
            if volume_confirms and ma_bullish > ma_bearish:
                trend = "ALCISTA"
                details['bullish_factors'].extend(dow_details.get('signals', []))
                details['bullish_factors'].append(volume_msg)
            elif not volume_confirms:
                trend = "ALCISTA"  # Mantener pero advertir
                details['neutral_factors'].append("⚠️ Tendencia alcista pero volumen no confirma")
            else:
                trend = "ALCISTA"
                details['bullish_factors'].extend(dow_details.get('signals', []))
                
        elif dow_trend == "BAJISTA":
            if volume_confirms and ma_bearish > ma_bullish:
                trend = "BAJISTA"
                details['bearish_factors'].extend(dow_details.get('signals', []))
                details['bearish_factors'].append(volume_msg)
            elif not volume_confirms:
                trend = "BAJISTA"  # Mantener pero advertir
                details['neutral_factors'].append("⚠️ Tendencia bajista pero volumen no confirma")
            else:
                trend = "BAJISTA"
                details['bearish_factors'].extend(dow_details.get('signals', []))
                
        elif dow_trend in ["ALCISTA_DEBIL", "BAJISTA_DEBIL"]:
            # Usar medias móviles para decidir
            if ma_bullish > ma_bearish + 2:
                trend = "ALCISTA"
            elif ma_bearish > ma_bullish + 2:
                trend = "BAJISTA"
            else:
                trend = "LATERAL"
            details['neutral_factors'].append(f"Señal débil de Dow Theory: {dow_details.get('pattern', '')}")
            
        else:
            # Dow Theory lateral o indefinido - usar cambio de precio y MAs
            if price_change_pct > 5 and ma_bullish > ma_bearish:
                trend = "ALCISTA"
                details['bullish_factors'].append(f"📈 Subida moderada ({price_change_pct:.1f}%) + MAs alcistas")
            elif price_change_pct < -5 and ma_bearish > ma_bullish:
                trend = "BAJISTA"
                details['bearish_factors'].append(f"📉 Bajada moderada ({abs(price_change_pct):.1f}%) + MAs bajistas")
            else:
                trend = "LATERAL"
                details['neutral_factors'].append("Consolidación: sin tendencia clara")
        
        # Calcular fuerza
        base_strength = 50
        
        # Bonus por Dow Theory confirmado
        if dow_trend in ["ALCISTA", "BAJISTA"]:
            base_strength += 20
        
        # Bonus por confirmación de volumen
        if volume_confirms:
            base_strength += 10
        
        # Bonus por alineación de MAs
        ma_diff = abs(ma_bullish - ma_bearish)
        base_strength += min(15, ma_diff * 3)
        
        # Factor ADX
        if not pd.isna(adx):
            if adx > 25:
                base_strength += min(15, (adx - 25))
        
        strength = min(100, base_strength)
    
    details['scores'] = {
        'dow_trend': dow_trend,
        'volume_confirms': volume_confirms,
        'ma_bullish': ma_bullish,
        'ma_bearish': ma_bearish
    }
    details['trend'] = trend
    details['strength'] = round(strength, 1)
    
    return trend, strength, details


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
    """
    Genera un resumen en lenguaje natural del análisis.
    Incluye referencias a los principios de Murphy/Dow Theory aplicados.
    """
    
    signal_emoji = {
        Signal.STRONG_BUY: "🟢🟢",
        Signal.BUY: "🟢",
        Signal.NEUTRAL: "🟡",
        Signal.SELL: "🔴",
        Signal.STRONG_SELL: "🔴🔴"
    }
    
    # Obtener detalles de Dow Theory
    dow_details = result.trend_details.get('dow_theory', {}) if result.trend_details else {}
    price_change = result.trend_details.get('price_change', {}) if result.trend_details else {}
    
    summary = f"""
📊 **ANÁLISIS TÉCNICO DE {result.symbol}** ({result.timeframe})
_Metodología: Murphy/Dow Theory_

💰 **Precio actual**: ${result.current_price:.2f}
📉 **Cambio del período**: {price_change.get('total', 0):+.2f}%

## Tendencia (Dow Theory)
📈 **Tendencia**: {result.trend} (Fuerza: {result.trend_strength:.0f}%)
"""
    
    # Añadir detalles de Dow Theory
    if dow_details.get('pattern'):
        summary += f"📐 **Patrón**: {dow_details['pattern']}\n"
    
    if dow_details.get('higher_highs', 0) > 0 or dow_details.get('lower_highs', 0) > 0:
        summary += f"   • Higher Highs: {dow_details.get('higher_highs', 0)} | Lower Highs: {dow_details.get('lower_highs', 0)}\n"
        summary += f"   • Higher Lows: {dow_details.get('higher_lows', 0)} | Lower Lows: {dow_details.get('lower_lows', 0)}\n"
    
    # Señal
    summary += f"""
## Señal de Trading
{signal_emoji.get(result.overall_signal, '')} **SEÑAL**: {result.overall_signal.value}
   Confianza: {result.signal_strength:.0f}%
"""
    
    # Añadir patrones detectados
    if result.patterns:
        summary += "\n## Patrones de Velas Japonesas\n"
        for p in result.patterns:
            summary += f"   🕯️ {p.name}: {p.signal.value} ({p.confidence:.0f}%)\n"
    
    # Soportes y resistencias
    if result.support_levels or result.resistance_levels:
        summary += "\n## Niveles Clave (Murphy Ch. 4)\n"
        if result.support_levels:
            summary += f"🛡️ **Soportes**: {', '.join([f'${s:.2f}' for s in result.support_levels])}\n"
        if result.resistance_levels:
            summary += f"🎯 **Resistencias**: {', '.join([f'${r:.2f}' for r in result.resistance_levels])}\n"
    
    return summary


def generate_recommendations(result: AnalysisResult) -> List[str]:
    """
    Genera recomendaciones basadas en el análisis y principios de Murphy.
    
    Principios aplicados:
    1. "La tendencia es tu amiga" - operar a favor de la tendencia
    2. "El volumen debe confirmar la tendencia"
    3. "Soportes y resistencias son zonas clave"
    """
    
    recs = []
    
    # Obtener detalles de Dow Theory si están disponibles
    dow_details = result.trend_details.get('dow_theory', {}) if result.trend_details else {}
    volume_analysis = result.trend_details.get('volume_analysis', {}) if result.trend_details else {}
    
    # Recomendación basada en tendencia (Murphy: "The trend is your friend")
    if result.trend == "ALCISTA":
        recs.append("📈 **TENDENCIA ALCISTA** - Murphy: 'The trend is your friend' - Buscar entradas en largo.")
        
        if dow_details.get('pattern'):
            recs.append(f"✅ Dow Theory: {dow_details['pattern']}")
        
        # El mensaje de volumen ya incluye su propio emoji
        if volume_analysis.get('message'):
            recs.append(volume_analysis.get('message'))
            
    elif result.trend == "BAJISTA":
        recs.append("📉 **TENDENCIA BAJISTA** - Murphy: 'Never buy into a falling market' - Evitar compras.")
        
        if dow_details.get('pattern'):
            recs.append(f"❌ Dow Theory: {dow_details['pattern']}")
        
        # El mensaje de volumen ya incluye su propio emoji
        if volume_analysis.get('message'):
            recs.append(volume_analysis.get('message'))
    else:
        recs.append("↔️ **TENDENCIA LATERAL** - Murphy: 'Avoid trading in sideways markets' - Esperar ruptura.")
    
    # Señal específica
    if result.overall_signal == Signal.STRONG_BUY:
        recs.append("🟢 Buena oportunidad de COMPRA. Múltiples indicadores alineados al alza.")
        if result.support_levels:
            recs.append(f"📍 Stop Loss sugerido: ${result.support_levels[0]:.2f} (primer soporte)")
    
    elif result.overall_signal == Signal.BUY:
        recs.append("🟢 Considerar COMPRA con precaución. Esperar confirmación adicional.")
        recs.append("💰 No invertir más del 1-2% del capital en esta operación.")
    
    elif result.overall_signal == Signal.SELL:
        recs.append("🔴 Considerar VENTA o no entrar en nuevas compras.")
        recs.append("⚠️ Si tienes posición, ajustar stop loss para proteger ganancias.")
    
    elif result.overall_signal == Signal.STRONG_SELL:
        recs.append("🔴🔴 Señal de VENTA fuerte. Evitar compras.")
        recs.append("⚠️ Si tienes posición, considerar cerrar o reducir exposición.")
    
    else:  # NEUTRAL
        recs.append("🟡 Mercado sin dirección clara. ESPERAR mejor momento.")
    
    # Soportes y resistencias (Murphy Chapter 4)
    if result.support_levels:
        recs.append(f"🛡️ **Soportes clave**: {', '.join([f'${s:.2f}' for s in result.support_levels[:2]])}")
    if result.resistance_levels:
        recs.append(f"🎯 **Resistencias clave**: {', '.join([f'${r:.2f}' for r in result.resistance_levels[:2]])}")
    
    # Advertencia general
    recs.append("⚠️ **GESTIÓN DE RIESGO**: Nunca arriesgar más del 2% por operación. El análisis técnico es probabilístico.")
    
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
    # Normalizar columnas a minúsculas (soporta tanto Yahoo Finance como Binance)
    df = df.copy()
    df.columns = [col.lower() if isinstance(col, str) else col for col in df.columns]
    
    # Asegurar que tenemos las columnas necesarias
    required_cols = ['open', 'high', 'low', 'close', 'volume']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"DataFrame debe contener columna '{col}'")
    
    # Eliminar filas con NaN en columnas críticas
    df = df.dropna(subset=['open', 'high', 'low', 'close'])
    
    if len(df) < 50:
        raise ValueError(f"Datos insuficientes: {len(df)} filas (mínimo 50)")
    
    # Calcular indicadores
    df = calculate_indicators(df)
    
    # Detectar patrones
    patterns = detect_candle_patterns(df)
    
    # Analizar indicadores
    indicators = analyze_indicators(df)
    
    # Encontrar soportes y resistencias
    supports, resistances = find_support_resistance(df)
    
    # Determinar tendencia
    trend, trend_strength, trend_details = determine_trend(df)
    
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
        recommendations=[],
        trend_details=trend_details
    )
    
    # Generar resumen y recomendaciones
    result.summary = generate_summary(result)
    result.recommendations = generate_recommendations(result)
    
    return result
