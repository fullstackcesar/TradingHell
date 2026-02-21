"""
Modelos de base de datos para TradingHell.
Preparado para almacenar alertas, watchlists, historial de análisis, etc.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from database import Base


class Alert(Base):
    """Alertas de precio configuradas por el usuario."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    condition = Column(String(20), nullable=False)  # 'above', 'below', 'crosses'
    price = Column(Float, nullable=False)
    message = Column(String(255))
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Watchlist(Base):
    """Símbolos en la watchlist del usuario."""
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, unique=True)
    name = Column(String(100))
    notes = Column(Text)
    added_at = Column(DateTime, default=datetime.utcnow)


class AnalysisHistory(Base):
    """Historial de análisis realizados."""
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    timeframe = Column(String(10), nullable=False)
    signal = Column(String(20))  # 'buy', 'sell', 'neutral'
    signal_strength = Column(Float)
    analysis_data = Column(JSON)  # Datos completos del análisis
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ChatHistory(Base):
    """Historial de conversaciones con el RAG."""
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class Position(Base):
    """Posiciones de trading (paper trading o seguimiento)."""
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    side = Column(String(10), nullable=False)  # 'long', 'short'
    entry_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    status = Column(String(20), default='open')  # 'open', 'closed'
    exit_price = Column(Float)
    pnl = Column(Float)
    pnl_percent = Column(Float)
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime)
    notes = Column(Text)
