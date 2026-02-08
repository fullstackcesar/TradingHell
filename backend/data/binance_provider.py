"""
Binance Data Provider
Obtiene datos de mercado en tiempo real de Binance.
Documentación: https://developers.binance.com/docs/binance-spot-api-docs/rest-api
"""

import httpx
import asyncio
import json
from typing import Optional, Dict, List, Callable, Any
from datetime import datetime
from enum import Enum
import pandas as pd


# Base URLs de Binance
BINANCE_REST_URL = "https://api.binance.com"
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws"


class BinanceInterval(Enum):
    """Intervalos de tiempo soportados por Binance."""
    M1 = "1m"
    M3 = "3m"
    M5 = "5m"
    M15 = "15m"
    M30 = "30m"
    H1 = "1h"
    H2 = "2h"
    H4 = "4h"
    H6 = "6h"
    H8 = "8h"
    H12 = "12h"
    D1 = "1d"
    D3 = "3d"
    W1 = "1w"
    MN = "1M"


# Mapeo de intervalos genéricos a Binance
INTERVAL_MAP = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1wk": "1w",
    "1mo": "1M",
}


class BinanceProvider:
    """Provider de datos de Binance."""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Cierra el cliente HTTP."""
        await self.client.aclose()
    
    # ============== REST API - Market Data ==============
    
    async def ping(self) -> bool:
        """Test de conectividad con Binance."""
        try:
            response = await self.client.get(f"{BINANCE_REST_URL}/api/v3/ping")
            return response.status_code == 200
        except Exception:
            return False
    
    async def get_server_time(self) -> int:
        """Obtiene el tiempo del servidor Binance."""
        response = await self.client.get(f"{BINANCE_REST_URL}/api/v3/time")
        return response.json()["serverTime"]
    
    async def get_exchange_info(self, symbol: Optional[str] = None) -> Dict:
        """
        Obtiene información del exchange.
        
        Args:
            symbol: Símbolo específico (opcional)
        """
        url = f"{BINANCE_REST_URL}/api/v3/exchangeInfo"
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_ticker_price(self, symbol: Optional[str] = None) -> Dict | List:
        """
        Obtiene el precio actual de un símbolo o todos.
        
        Args:
            symbol: Par de trading (ej: BTCUSDT). Si es None, devuelve todos.
        
        Returns:
            {"symbol": "BTCUSDT", "price": "50000.00"}
        """
        url = f"{BINANCE_REST_URL}/api/v3/ticker/price"
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_ticker_24h(self, symbol: Optional[str] = None) -> Dict | List:
        """
        Obtiene estadísticas de 24 horas.
        
        Args:
            symbol: Par de trading (ej: BTCUSDT)
        
        Returns:
            Estadísticas completas de 24h incluyendo cambio de precio, volumen, etc.
        """
        url = f"{BINANCE_REST_URL}/api/v3/ticker/24hr"
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_order_book(self, symbol: str, limit: int = 100) -> Dict:
        """
        Obtiene el libro de órdenes (depth).
        
        Args:
            symbol: Par de trading (ej: BTCUSDT)
            limit: Número de niveles (5, 10, 20, 50, 100, 500, 1000, 5000)
        """
        url = f"{BINANCE_REST_URL}/api/v3/depth"
        params = {
            "symbol": symbol.upper(),
            "limit": limit
        }
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_recent_trades(self, symbol: str, limit: int = 500) -> List[Dict]:
        """
        Obtiene los trades recientes.
        
        Args:
            symbol: Par de trading
            limit: Número de trades (máx 1000)
        """
        url = f"{BINANCE_REST_URL}/api/v3/trades"
        params = {
            "symbol": symbol.upper(),
            "limit": min(limit, 1000)
        }
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_klines(
        self,
        symbol: str,
        interval: str = "1h",
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> pd.DataFrame:
        """
        Obtiene datos de velas (klines/candlesticks).
        
        Args:
            symbol: Par de trading (ej: BTCUSDT)
            interval: Intervalo (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M)
            limit: Número de velas (máx 1000)
            start_time: Timestamp inicio en ms (opcional)
            end_time: Timestamp fin en ms (opcional)
        
        Returns:
            DataFrame con OHLCV
        """
        url = f"{BINANCE_REST_URL}/api/v3/klines"
        
        # Mapear intervalo
        binance_interval = INTERVAL_MAP.get(interval, interval)
        
        params = {
            "symbol": symbol.upper(),
            "interval": binance_interval,
            "limit": min(limit, 1000)
        }
        
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        response = await self.client.get(url, params=params)
        data = response.json()
        
        # Convertir a DataFrame
        df = pd.DataFrame(data, columns=[
            'timestamp', 'Open', 'High', 'Low', 'Close', 'Volume',
            'close_time', 'quote_volume', 'trades', 'taker_buy_base',
            'taker_buy_quote', 'ignore'
        ])
        
        # Convertir tipos
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['Date'] = df['timestamp']
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Seleccionar columnas relevantes
        df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        df.set_index('Date', inplace=True)
        
        return df
    
    async def get_avg_price(self, symbol: str) -> Dict:
        """
        Obtiene el precio promedio actual.
        
        Args:
            symbol: Par de trading
        """
        url = f"{BINANCE_REST_URL}/api/v3/avgPrice"
        params = {"symbol": symbol.upper()}
        
        response = await self.client.get(url, params=params)
        return response.json()
    
    async def get_book_ticker(self, symbol: Optional[str] = None) -> Dict | List:
        """
        Obtiene el mejor bid/ask y cantidad.
        
        Args:
            symbol: Par de trading (opcional, si None devuelve todos)
        """
        url = f"{BINANCE_REST_URL}/api/v3/ticker/bookTicker"
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        
        response = await self.client.get(url, params=params)
        return response.json()


# ============== WebSocket Streams ==============

class BinanceWebSocket:
    """Manager de WebSocket para datos en tiempo real."""
    
    def __init__(self):
        self.ws = None
        self.running = False
        self.callbacks: Dict[str, List[Callable]] = {}
    
    def get_stream_url(self, streams: List[str]) -> str:
        """
        Genera la URL del WebSocket para múltiples streams.
        
        Streams disponibles:
        - <symbol>@trade: Trades en tiempo real
        - <symbol>@kline_<interval>: Velas en tiempo real
        - <symbol>@depth: Order book updates
        - <symbol>@miniTicker: Mini ticker 24h
        - <symbol>@ticker: Ticker completo 24h
        - <symbol>@bookTicker: Best bid/ask
        """
        if len(streams) == 1:
            return f"{BINANCE_WS_URL}/{streams[0]}"
        else:
            combined = "/".join(streams)
            return f"wss://stream.binance.com:9443/stream?streams={combined}"
    
    @staticmethod
    def format_trade_stream(symbol: str) -> str:
        """Stream de trades: btcusdt@trade"""
        return f"{symbol.lower()}@trade"
    
    @staticmethod
    def format_kline_stream(symbol: str, interval: str = "1m") -> str:
        """Stream de velas: btcusdt@kline_1m"""
        return f"{symbol.lower()}@kline_{interval}"
    
    @staticmethod
    def format_depth_stream(symbol: str, level: str = "") -> str:
        """Stream de order book: btcusdt@depth o btcusdt@depth5"""
        if level:
            return f"{symbol.lower()}@depth{level}"
        return f"{symbol.lower()}@depth"
    
    @staticmethod
    def format_ticker_stream(symbol: str) -> str:
        """Stream de ticker 24h: btcusdt@ticker"""
        return f"{symbol.lower()}@ticker"
    
    @staticmethod
    def format_mini_ticker_stream(symbol: str) -> str:
        """Stream de mini ticker: btcusdt@miniTicker"""
        return f"{symbol.lower()}@miniTicker"
    
    @staticmethod
    def format_book_ticker_stream(symbol: str) -> str:
        """Stream de best bid/ask: btcusdt@bookTicker"""
        return f"{symbol.lower()}@bookTicker"
    
    @staticmethod
    def format_all_tickers_stream() -> str:
        """Stream de todos los tickers: !ticker@arr"""
        return "!ticker@arr"
    
    @staticmethod
    def format_all_mini_tickers_stream() -> str:
        """Stream de todos los mini tickers: !miniTicker@arr"""
        return "!miniTicker@arr"


# ============== Helper Functions ==============

def normalize_binance_symbol(symbol: str) -> str:
    """
    Normaliza un símbolo genérico al formato de Binance.
    
    Ejemplos:
        BTC -> BTCUSDT
        BTC/USDT -> BTCUSDT
        ETH -> ETHUSDT
        BTC-USD -> BTCUSDT
    """
    symbol = symbol.upper().replace("/", "").replace("-", "")
    
    # Si ya tiene USDT, dejarlo
    if symbol.endswith("USDT"):
        return symbol
    
    # Si termina en USD, cambiar a USDT
    if symbol.endswith("USD"):
        return symbol[:-3] + "USDT"
    
    # Si es solo base, añadir USDT
    return symbol + "USDT"


def parse_kline_data(data: Dict) -> Dict:
    """
    Parsea datos de vela del WebSocket.
    
    El formato del WebSocket es:
    {
        "e": "kline",     // Event type
        "E": 123456789,   // Event time
        "s": "BTCUSDT",   // Symbol
        "k": {
            "t": 123400000, // Kline start time
            "T": 123460000, // Kline close time
            "s": "BTCUSDT", // Symbol
            "i": "1m",      // Interval
            "o": "0.0010",  // Open price
            "c": "0.0020",  // Close price
            "h": "0.0025",  // High price
            "l": "0.0015",  // Low price
            "v": "1000",    // Base asset volume
            "n": 100,       // Number of trades
            "x": false,     // Is this kline closed?
            "q": "1.0000",  // Quote asset volume
        }
    }
    """
    k = data.get("k", {})
    return {
        "symbol": k.get("s"),
        "interval": k.get("i"),
        "open_time": k.get("t"),
        "close_time": k.get("T"),
        "open": float(k.get("o", 0)),
        "high": float(k.get("h", 0)),
        "low": float(k.get("l", 0)),
        "close": float(k.get("c", 0)),
        "volume": float(k.get("v", 0)),
        "trades": k.get("n"),
        "is_closed": k.get("x", False)
    }


def parse_trade_data(data: Dict) -> Dict:
    """
    Parsea datos de trade del WebSocket.
    
    {
        "e": "trade",     // Event type
        "E": 123456789,   // Event time
        "s": "BTCUSDT",   // Symbol
        "t": 12345,       // Trade ID
        "p": "0.001",     // Price
        "q": "100",       // Quantity
        "T": 123456785,   // Trade time
        "m": true,        // Is buyer maker?
    }
    """
    return {
        "symbol": data.get("s"),
        "trade_id": data.get("t"),
        "price": float(data.get("p", 0)),
        "quantity": float(data.get("q", 0)),
        "time": data.get("T"),
        "is_buyer_maker": data.get("m")
    }


def parse_ticker_data(data: Dict) -> Dict:
    """
    Parsea datos de ticker 24h del WebSocket.
    """
    return {
        "symbol": data.get("s"),
        "price_change": float(data.get("p", 0)),
        "price_change_percent": float(data.get("P", 0)),
        "weighted_avg_price": float(data.get("w", 0)),
        "last_price": float(data.get("c", 0)),
        "open_price": float(data.get("o", 0)),
        "high_price": float(data.get("h", 0)),
        "low_price": float(data.get("l", 0)),
        "volume": float(data.get("v", 0)),
        "quote_volume": float(data.get("q", 0)),
        "open_time": data.get("O"),
        "close_time": data.get("C"),
        "trades": data.get("n")
    }


# Instancia global del provider
_binance_provider: Optional[BinanceProvider] = None


async def get_binance_provider() -> BinanceProvider:
    """Obtiene o crea la instancia del provider de Binance."""
    global _binance_provider
    if _binance_provider is None:
        _binance_provider = BinanceProvider()
    return _binance_provider
