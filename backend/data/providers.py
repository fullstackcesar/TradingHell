"""
Proveedores de datos de mercado.
Obtiene datos de diferentes fuentes: Yahoo Finance, Alpha Vantage, etc.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from enum import Enum


class Market(Enum):
    """Tipos de mercado soportados."""
    STOCKS_US = "us"
    STOCKS_ES = "es"
    FOREX = "forex"
    CRYPTO = "crypto"


class Interval(Enum):
    """Intervalos de tiempo soportados."""
    M1 = "1m"
    M5 = "5m"
    M15 = "15m"
    M30 = "30m"
    H1 = "1h"
    H4 = "4h"
    D1 = "1d"
    W1 = "1wk"
    MN = "1mo"


# Mapeo de símbolos comunes
SYMBOL_MAP = {
    # Acciones España (añadir .MC para Madrid)
    "SANTANDER": "SAN.MC",
    "SAN": "SAN.MC",
    "BBVA": "BBVA.MC",
    "TELEFONICA": "TEF.MC",
    "TEF": "TEF.MC",
    "IBERDROLA": "IBE.MC",
    "IBE": "IBE.MC",
    "INDITEX": "ITX.MC",
    "ITX": "ITX.MC",
    "REPSOL": "REP.MC",
    "REP": "REP.MC",
    
    # Forex (formato Yahoo Finance)
    "EURUSD": "EURUSD=X",
    "EUR/USD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "GBP/USD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "USD/JPY": "USDJPY=X",
    "USDCHF": "USDCHF=X",
    "USD/CHF": "USDCHF=X",
    "EURGBP": "EURGBP=X",
    "EUR/GBP": "EURGBP=X",
    
    # Crypto
    "BTC": "BTC-USD",
    "BITCOIN": "BTC-USD",
    "ETH": "ETH-USD",
    "ETHEREUM": "ETH-USD",
}


def normalize_symbol(symbol: str) -> str:
    """Normaliza el símbolo al formato de Yahoo Finance."""
    symbol_upper = symbol.upper().replace(" ", "")
    return SYMBOL_MAP.get(symbol_upper, symbol_upper)


def get_market_data(
    symbol: str,
    interval: str = "1d",
    period: str = "1y",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> pd.DataFrame:
    """
    Obtiene datos de mercado de Yahoo Finance.
    
    Args:
        symbol: Símbolo del activo (ej: AAPL, EURUSD, BTC)
        interval: Intervalo de tiempo (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)
        period: Período de datos (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        start_date: Fecha inicio (opcional, formato YYYY-MM-DD)
        end_date: Fecha fin (opcional, formato YYYY-MM-DD)
        
    Returns:
        DataFrame con columnas: Open, High, Low, Close, Volume, Date
    """
    # Normalizar símbolo
    normalized_symbol = normalize_symbol(symbol)
    
    try:
        ticker = yf.Ticker(normalized_symbol)
        
        if start_date and end_date:
            df = ticker.history(start=start_date, end=end_date, interval=interval)
        else:
            df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise ValueError(f"No se encontraron datos para {symbol}")
        
        # Limpiar y formatear
        df = df.reset_index()
        
        # Renombrar columna de fecha/datetime
        if 'Datetime' in df.columns:
            df = df.rename(columns={'Datetime': 'Date'})
        
        # Seleccionar columnas relevantes
        columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        df = df[[col for col in columns if col in df.columns]]
        
        # Asegurar que Volume existe
        if 'Volume' not in df.columns:
            df['Volume'] = 0
        
        return df
        
    except Exception as e:
        raise ValueError(f"Error obteniendo datos de {symbol}: {str(e)}")


def get_ticker_info(symbol: str) -> Dict:
    """
    Obtiene información del activo.
    
    Args:
        symbol: Símbolo del activo
        
    Returns:
        Dict con información del activo
    """
    normalized_symbol = normalize_symbol(symbol)
    
    try:
        ticker = yf.Ticker(normalized_symbol)
        info = ticker.info
        
        return {
            "symbol": normalized_symbol,
            "name": info.get("longName", info.get("shortName", symbol)),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", "Unknown"),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "current_price": info.get("currentPrice", info.get("regularMarketPrice")),
            "previous_close": info.get("previousClose"),
            "day_high": info.get("dayHigh"),
            "day_low": info.get("dayLow"),
            "volume": info.get("volume"),
            "avg_volume": info.get("averageVolume"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}


def search_symbols(query: str) -> List[Dict]:
    """
    Busca símbolos que coincidan con la query.
    
    Args:
        query: Texto de búsqueda
        
    Returns:
        Lista de símbolos encontrados
    """
    try:
        # Yahoo Finance no tiene API de búsqueda directa
        # Usamos una búsqueda básica en nuestro mapeo
        results = []
        query_upper = query.upper()
        
        for key, value in SYMBOL_MAP.items():
            if query_upper in key:
                results.append({
                    "symbol": value,
                    "name": key,
                    "type": "mapped"
                })
        
        # Intentar obtener info del símbolo directo
        try:
            info = get_ticker_info(query)
            if "error" not in info:
                results.insert(0, {
                    "symbol": info["symbol"],
                    "name": info.get("name", query),
                    "type": "direct"
                })
        except:
            pass
        
        return results
        
    except Exception as e:
        return []


def get_multiple_tickers(symbols: List[str], interval: str = "1d", period: str = "1mo") -> Dict[str, pd.DataFrame]:
    """
    Obtiene datos de múltiples símbolos de forma eficiente.
    
    Args:
        symbols: Lista de símbolos
        interval: Intervalo de tiempo
        period: Período de datos
        
    Returns:
        Dict con símbolo como clave y DataFrame como valor
    """
    result = {}
    
    # Normalizar símbolos
    normalized = [normalize_symbol(s) for s in symbols]
    
    try:
        # Descargar todos juntos (más eficiente)
        data = yf.download(
            tickers=normalized,
            period=period,
            interval=interval,
            group_by='ticker',
            auto_adjust=True
        )
        
        for i, symbol in enumerate(normalized):
            if len(normalized) == 1:
                df = data.reset_index()
            else:
                df = data[symbol].reset_index()
            
            if not df.empty:
                result[symbols[i]] = df
                
    except Exception as e:
        # Fallback: descargar uno por uno
        for symbol in symbols:
            try:
                result[symbol] = get_market_data(symbol, interval, period)
            except:
                pass
    
    return result
