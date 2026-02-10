/**
 * Analysis Component - Muestra el análisis técnico
 */

import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TradingService } from '../../services/trading.service';
import { SIGNAL_CLASSES } from '../../models/trading.models';

// Diccionario de explicaciones de indicadores
const INDICATOR_EXPLANATIONS: Record<string, string> = {
  'RSI': 'RSI (0-100): Mide si el precio está sobrecomprado (>70) o sobrevendido (<30). Si está muy alto, puede bajar pronto. Si está muy bajo, puede subir.',
  'MACD': 'MACD: Compara dos medias móviles. Si la línea MACD cruza hacia arriba la línea de señal = posible subida. Si cruza hacia abajo = posible bajada.',
  'BB': 'Bandas de Bollinger: El precio suele moverse entre la banda superior e inferior. Si toca la superior, puede bajar. Si toca la inferior, puede subir.',
  'BB Superior': 'Banda superior de Bollinger. Si el precio toca esta línea = posible sobrecompra, puede bajar.',
  'BB Media': 'Banda media de Bollinger (SMA 20). Nivel de equilibrio. El precio tiende a volver a esta línea.',
  'BB Inferior': 'Banda inferior de Bollinger. Si el precio toca esta línea = posible sobreventa, puede subir.',
  'SMA': 'SMA (Media Móvil Simple): Muestra el precio promedio de los últimos X días. Si el precio está por encima = tendencia alcista.',
  'SMA 20': 'SMA 20: Media de los últimos 20 períodos. Si el precio está arriba = alcista a corto plazo.',
  'SMA 50': 'SMA 50: Media de los últimos 50 períodos. Si el precio está arriba = alcista a medio plazo.',
  'SMA 200': 'SMA 200: La más importante. Si el precio está arriba = tendencia alcista de largo plazo (bull market).',
  'EMA': 'EMA (Media Móvil Exponencial): Similar a SMA pero da más peso a precios recientes. Reacciona más rápido a cambios.',
  'EMA 20': 'EMA 20: Media exponencial corta. Útil para detectar cambios rápidos de tendencia.',
  'EMA 50': 'EMA 50: Media exponencial media. Equilibrio entre velocidad y estabilidad.',
  'ADX': 'ADX (0-100): Mide la FUERZA de la tendencia, no su dirección. >25 = tendencia fuerte. <20 = mercado sin dirección clara.',
  'STOCH': 'Estocástico (0-100): Similar al RSI. >80 = sobrecompra, <20 = sobreventa. Útil para detectar cambios de dirección.',
  'Estocástico': 'Estocástico (0-100): Similar al RSI. >80 = sobrecompra, <20 = sobreventa. Útil para detectar cambios de dirección.',
  'ATR': 'ATR (Rango Verdadero Promedio): Mide volatilidad. Más alto = más movimiento del precio. Útil para calcular stop loss.',
  'OBV': 'OBV (Volumen en Balance): Si sube con el precio = la subida tiene fuerza. Si baja mientras el precio sube = posible trampa.',
  'VWAP': 'VWAP: Precio promedio ponderado por volumen. Si el precio está por encima = compradores dominan. Por debajo = vendedores.',
  'Volumen': 'Volumen: Cantidad de operaciones. Alto volumen en subida = fuerza real. Bajo volumen = movimiento débil.',
  'Momentum': 'Momentum: Velocidad del cambio de precio. Positivo = el precio acelera hacia arriba. Negativo = acelera hacia abajo.'
};

// SVGs de patrones de velas basados en ChartGuys Cheat Sheet
// Verde (#22c55e) = Alcista, Rojo (#ef4444) = Bajista, Gris (#9ca3af) = Neutral
// VERIFICADO contra imagen de referencia ChartGuys 2026-02-10
const PATTERN_SVGS: Record<string, string> = {
  // ============================================================
  // PATRONES NEUTRALES (parte superior izquierda de ChartGuys)
  // ============================================================
  
  // DOJI: Cruz pequeña - apertura = cierre, indecisión total
  // Imagen: cruz con mechas cortas iguales arriba y abajo
  'DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="15" x2="30" y2="35" stroke="#9ca3af" stroke-width="2"/>
    <line x1="22" y1="40" x2="38" y2="40" stroke="#9ca3af" stroke-width="4"/>
    <line x1="30" y1="45" x2="30" y2="65" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  // LONG LEGGED DOJI: Mechas largas iguales, gran volatilidad
  // Imagen: cruz con mechas muy largas arriba y abajo
  'LONG_LEGGED_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="5" x2="30" y2="37" stroke="#9ca3af" stroke-width="2"/>
    <line x1="22" y1="40" x2="38" y2="40" stroke="#9ca3af" stroke-width="4"/>
    <line x1="30" y1="43" x2="30" y2="75" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  // SPINNING TOP: Cuerpo pequeño con mechas similares
  // Imagen: cuerpo pequeño centrado con mechas medianas
  'SPINNING_TOP': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <rect x="22" y="28" width="16" height="24" fill="#9ca3af" rx="1"/>
    <line x1="30" y1="52" x2="30" y2="68" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,

  // ============================================================
  // SINGLE CANDLE - ALCISTAS (Single Candlestick Patterns - Bullish)
  // ============================================================
  
  // HAMMER (Martillo): Cuerpo pequeño ARRIBA, mecha larga ABAJO, sin mecha superior
  // Imagen ChartGuys: cuerpo verde arriba, cola larga abajo
  // Señal: Alcista en tendencia bajista (los compradores rechazaron los mínimos)
  'HAMMER': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#22c55e" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'MARTILLO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#22c55e" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  // INVERTED HAMMER (Martillo Invertido): Cuerpo pequeño ABAJO, mecha larga ARRIBA, sin mecha inferior
  // Imagen ChartGuys: cuerpo verde abajo, cola larga arriba
  // Señal: Alcista en tendencia bajista (intento de subida)
  'INVERTED_HAMMER': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#22c55e" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'MARTILLO_INVERTIDO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#22c55e" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // DRAGONFLY DOJI: Forma de T - línea horizontal arriba, mecha larga abajo
  // Imagen ChartGuys: T invertida, señal alcista
  'DRAGONFLY_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="20" y1="15" x2="40" y2="15" stroke="#22c55e" stroke-width="4"/>
    <line x1="30" y1="15" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'LIBELULA_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="20" y1="15" x2="40" y2="15" stroke="#22c55e" stroke-width="4"/>
    <line x1="30" y1="15" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  // BULLISH SPINNING TOP: Cuerpo pequeño verde con mechas
  // Imagen ChartGuys: igual que spinning top pero verde
  'BULLISH_SPINNING_TOP': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="28" stroke="#22c55e" stroke-width="2"/>
    <rect x="22" y="28" width="16" height="24" fill="#22c55e" rx="1"/>
    <line x1="30" y1="52" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  // BULLISH MARUBOZU: Cuerpo verde grande SIN mechas (fuerza compradora total)
  // Imagen ChartGuys: rectángulo verde sólido sin sombras
  'BULLISH_MARUBOZU': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#22c55e" rx="2"/>
  </svg>`,
  
  'MARUBOZU': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#22c55e" rx="2"/>
  </svg>`,

  // ============================================================
  // SINGLE CANDLE - BAJISTAS (Single Candlestick Patterns - Bearish)
  // ============================================================
  
  // SHOOTING STAR (Estrella Fugaz): Cuerpo pequeño ABAJO, mecha larga ARRIBA
  // Imagen ChartGuys: MISMA FORMA que Inverted Hammer pero ROJO
  // Señal: Bajista en tendencia alcista (rechazo de máximos)
  'SHOOTING_STAR': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#ef4444" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'ESTRELLA_FUGAZ': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#ef4444" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // HANGING MAN (Hombre Colgado): Cuerpo pequeño ARRIBA, mecha larga ABAJO
  // Imagen ChartGuys: MISMA FORMA que Hammer pero ROJO
  // Señal: Bajista en tendencia alcista (los vendedores empiezan a presionar)
  'HANGING_MAN': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#ef4444" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'HOMBRE_COLGADO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#ef4444" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  // GRAVESTONE DOJI: Forma de T invertida - línea horizontal abajo, mecha larga arriba
  // Imagen ChartGuys: T normal (opuesto a dragonfly), señal bajista
  'GRAVESTONE_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="65" stroke="#ef4444" stroke-width="2"/>
    <line x1="20" y1="65" x2="40" y2="65" stroke="#ef4444" stroke-width="4"/>
  </svg>`,
  
  'LAPIDA_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="65" stroke="#ef4444" stroke-width="2"/>
    <line x1="20" y1="65" x2="40" y2="65" stroke="#ef4444" stroke-width="4"/>
  </svg>`,
  
  // BEARISH SPINNING TOP: Cuerpo pequeño rojo con mechas
  // Imagen ChartGuys: igual que spinning top pero rojo
  'BEARISH_SPINNING_TOP': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="28" stroke="#ef4444" stroke-width="2"/>
    <rect x="22" y="28" width="16" height="24" fill="#ef4444" rx="1"/>
    <line x1="30" y1="52" x2="30" y2="68" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  // BEARISH MARUBOZU: Cuerpo rojo grande SIN mechas (fuerza vendedora total)
  // Imagen ChartGuys: rectángulo rojo sólido sin sombras
  'BEARISH_MARUBOZU': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#ef4444" rx="2"/>
  </svg>`,

  // ============================================================
  // DOUBLE CANDLE - ALCISTAS (Double Candlestick Patterns - Bullish)
  // ============================================================
  
  // BULLISH KICKER: Gap alcista - vela roja, gap, vela verde que abre arriba
  // Imagen ChartGuys: roja abajo, verde arriba SIN solaparse (gap)
  'BULLISH_KICKER': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="40" width="18" height="30" fill="#ef4444" rx="1"/>
    <rect x="55" y="10" width="18" height="30" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // BULLISH ENGULFING: Vela verde grande envuelve vela roja pequeña
  // Imagen ChartGuys: roja pequeña, verde grande que la cubre completamente
  'BULLISH_ENGULFING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'ENGULFING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'ENVOLVENTE': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'ENVOLVENTE_ALCISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // BULLISH HARAMI: Vela verde pequeña DENTRO de vela roja grande
  // Imagen ChartGuys: roja grande, verde pequeña contenida dentro
  'BULLISH_HARAMI': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'HARAMI': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'HARAMI_ALCISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // PIERCING LINE: Vela verde abre debajo y cierra arriba del 50% de la roja
  // Imagen ChartGuys: roja larga, verde que penetra más del 50%
  'PIERCING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#ef4444" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#ef4444" stroke-width="2"/>
    <line x1="64" y1="60" x2="64" y2="72" stroke="#22c55e" stroke-width="2"/>
    <rect x="54" y="28" width="20" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'PENETRANTE': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#ef4444" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#ef4444" stroke-width="2"/>
    <line x1="64" y1="60" x2="64" y2="72" stroke="#22c55e" stroke-width="2"/>
    <rect x="54" y="28" width="20" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'PIERCING_LINE': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#ef4444" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#ef4444" stroke-width="2"/>
    <line x1="64" y1="60" x2="64" y2="72" stroke="#22c55e" stroke-width="2"/>
    <rect x="54" y="28" width="20" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // TWEEZER BOTTOM: Dos velas con mínimos iguales (suelo)
  // Imagen ChartGuys: roja y verde con colas al mismo nivel inferior
  'TWEEZER_BOTTOM': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="18" y="18" width="18" height="32" fill="#ef4444" rx="1"/>
    <line x1="27" y1="50" x2="27" y2="68" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#22c55e" rx="1"/>
    <line x1="63" y1="50" x2="63" y2="68" stroke="#22c55e" stroke-width="2"/>
    <line x1="12" y1="68" x2="80" y2="68" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,
  
  'PINZAS_SUELO': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="18" y="18" width="18" height="32" fill="#ef4444" rx="1"/>
    <line x1="27" y1="50" x2="27" y2="68" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#22c55e" rx="1"/>
    <line x1="63" y1="50" x2="63" y2="68" stroke="#22c55e" stroke-width="2"/>
    <line x1="12" y1="68" x2="80" y2="68" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,

  // ============================================================
  // DOUBLE CANDLE - BAJISTAS (Double Candlestick Patterns - Bearish)
  // ============================================================
  
  // BEARISH KICKER: Gap bajista - vela verde, gap, vela roja que abre abajo
  // Imagen ChartGuys: verde arriba, roja abajo SIN solaparse (gap)
  'BEARISH_KICKER': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="10" width="18" height="30" fill="#22c55e" rx="1"/>
    <rect x="55" y="40" width="18" height="30" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // BEARISH ENGULFING: Vela roja grande envuelve vela verde pequeña
  // Imagen ChartGuys: verde pequeña, roja grande que la cubre
  'BEARISH_ENGULFING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#22c55e" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'ENVOLVENTE_BAJISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#22c55e" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // BEARISH HARAMI: Vela roja pequeña DENTRO de vela verde grande
  // Imagen ChartGuys: verde grande, roja pequeña contenida dentro
  'BEARISH_HARAMI': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'HARAMI_BAJISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // DARK CLOUD COVER: Vela roja abre arriba y cierra debajo del 50% de la verde
  // Imagen ChartGuys: verde larga, roja que penetra más del 50% hacia abajo
  'DARK_CLOUD': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#22c55e" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="64" y1="8" x2="64" y2="20" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="20" width="20" height="32" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'DARK_CLOUD_COVER': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#22c55e" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="64" y1="8" x2="64" y2="20" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="20" width="20" height="32" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'NUBE_OSCURA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#22c55e" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="64" y1="8" x2="64" y2="20" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="20" width="20" height="32" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // TWEEZER TOP: Dos velas con máximos iguales (techo)
  // Imagen ChartGuys: verde y roja con mechas al mismo nivel superior
  'TWEEZER_TOP': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="27" y1="12" x2="27" y2="30" stroke="#22c55e" stroke-width="2"/>
    <rect x="18" y="30" width="18" height="32" fill="#22c55e" rx="1"/>
    <line x1="63" y1="12" x2="63" y2="30" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#ef4444" rx="1"/>
    <line x1="12" y1="12" x2="80" y2="12" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,
  
  'PINZAS_TECHO': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="27" y1="12" x2="27" y2="30" stroke="#22c55e" stroke-width="2"/>
    <rect x="18" y="30" width="18" height="32" fill="#22c55e" rx="1"/>
    <line x1="63" y1="12" x2="63" y2="30" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#ef4444" rx="1"/>
    <line x1="12" y1="12" x2="80" y2="12" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,

  // ============================================================
  // TRIPLE CANDLE - ALCISTAS (Triple Candlestick Patterns - Bullish)
  // ============================================================
  
  // MORNING STAR: Roja grande, vela pequeña abajo (gap), verde grande
  // Imagen ChartGuys: estrella de la mañana con gap hacia abajo en medio
  'MORNING_STAR': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="8" x2="22" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="12" y="15" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="22" y1="55" x2="22" y2="62" stroke="#ef4444" stroke-width="2"/>
    <line x1="62" y1="52" x2="62" y2="57" stroke="#9ca3af" stroke-width="2"/>
    <rect x="54" y="57" width="16" height="10" fill="#9ca3af" rx="1"/>
    <line x1="62" y1="67" x2="62" y2="72" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="8" x2="108" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="15" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="108" y1="55" x2="108" y2="62" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'ESTRELLA_MANANA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="8" x2="22" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="12" y="15" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="22" y1="55" x2="22" y2="62" stroke="#ef4444" stroke-width="2"/>
    <line x1="62" y1="52" x2="62" y2="57" stroke="#9ca3af" stroke-width="2"/>
    <rect x="54" y="57" width="16" height="10" fill="#9ca3af" rx="1"/>
    <line x1="62" y1="67" x2="62" y2="72" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="8" x2="108" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="15" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="108" y1="55" x2="108" y2="62" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  // MORNING DOJI STAR: Como morning star pero con doji en medio
  // Imagen ChartGuys: roja, doji (cruz), verde
  'MORNING_DOJI_STAR': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="8" x2="22" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="12" y="15" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="22" y1="55" x2="22" y2="62" stroke="#ef4444" stroke-width="2"/>
    <line x1="62" y1="50" x2="62" y2="60" stroke="#9ca3af" stroke-width="2"/>
    <line x1="54" y1="63" x2="70" y2="63" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="66" x2="62" y2="72" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="8" x2="108" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="15" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="108" y1="55" x2="108" y2="62" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  // BULLISH ABANDONED BABY: Gap-doji-gap (aislado)
  // Imagen ChartGuys: roja, gap, doji aislado, gap, verde
  'BULLISH_ABANDONED_BABY': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="54" y1="62" x2="70" y2="62" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="58" x2="62" y2="72" stroke="#9ca3af" stroke-width="2"/>
    <rect x="98" y="15" width="20" height="40" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'BEBE_ABANDONADO_ALCISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="54" y1="62" x2="70" y2="62" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="58" x2="62" y2="72" stroke="#9ca3af" stroke-width="2"/>
    <rect x="98" y="15" width="20" height="40" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // THREE WHITE SOLDIERS: Tres velas verdes consecutivas ascendentes
  // Imagen ChartGuys: escalera de 3 verdes subiendo
  'THREE_WHITE_SOLDIERS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="48" x2="22" y2="52" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="52" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="62" y1="32" x2="62" y2="36" stroke="#22c55e" stroke-width="2"/>
    <rect x="52" y="36" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="108" y1="15" x2="108" y2="19" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="19" width="20" height="22" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'TRES_SOLDADOS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="48" x2="22" y2="52" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="52" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="62" y1="32" x2="62" y2="36" stroke="#22c55e" stroke-width="2"/>
    <rect x="52" y="36" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="108" y1="15" x2="108" y2="19" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="19" width="20" height="22" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'TRES_SOLDADOS_BLANCOS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="48" x2="22" y2="52" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="52" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="62" y1="32" x2="62" y2="36" stroke="#22c55e" stroke-width="2"/>
    <rect x="52" y="36" width="20" height="22" fill="#22c55e" rx="1"/>
    <line x1="108" y1="15" x2="108" y2="19" stroke="#22c55e" stroke-width="2"/>
    <rect x="98" y="19" width="20" height="22" fill="#22c55e" rx="1"/>
  </svg>`,

  // ============================================================
  // TRIPLE CANDLE - BAJISTAS (Triple Candlestick Patterns - Bearish)
  // ============================================================
  
  // EVENING STAR: Verde grande, vela pequeña arriba (gap), roja grande
  // Imagen ChartGuys: estrella de la tarde con gap hacia arriba en medio
  'EVENING_STAR': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="18" x2="22" y2="25" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="25" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="22" y1="65" x2="22" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="62" y1="8" x2="62" y2="13" stroke="#9ca3af" stroke-width="2"/>
    <rect x="54" y="13" width="16" height="10" fill="#9ca3af" rx="1"/>
    <line x1="62" y1="23" x2="62" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="18" x2="108" y2="25" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="25" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="108" y1="65" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'ESTRELLA_TARDE': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="18" x2="22" y2="25" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="25" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="22" y1="65" x2="22" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="62" y1="8" x2="62" y2="13" stroke="#9ca3af" stroke-width="2"/>
    <rect x="54" y="13" width="16" height="10" fill="#9ca3af" rx="1"/>
    <line x1="62" y1="23" x2="62" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="18" x2="108" y2="25" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="25" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="108" y1="65" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  // EVENING DOJI STAR: Como evening star pero con doji en medio
  // Imagen ChartGuys: verde, doji (cruz), roja
  'EVENING_DOJI_STAR': `<svg width="140" height="80" viewBox="0 0 140 80">
    <line x1="22" y1="18" x2="22" y2="25" stroke="#22c55e" stroke-width="2"/>
    <rect x="12" y="25" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="22" y1="65" x2="22" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="62" y1="8" x2="62" y2="14" stroke="#9ca3af" stroke-width="2"/>
    <line x1="54" y1="17" x2="70" y2="17" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="20" x2="62" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <line x1="108" y1="18" x2="108" y2="25" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="25" width="20" height="40" fill="#ef4444" rx="1"/>
    <line x1="108" y1="65" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  // BEARISH ABANDONED BABY: Gap-doji-gap (aislado) bajista
  // Imagen ChartGuys: verde, gap, doji aislado arriba, gap, roja
  'BEARISH_ABANDONED_BABY': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="25" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="54" y1="15" x2="70" y2="15" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="8" x2="62" y2="22" stroke="#9ca3af" stroke-width="2"/>
    <rect x="98" y="25" width="20" height="40" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'BEBE_ABANDONADO_BAJISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="25" width="20" height="40" fill="#22c55e" rx="1"/>
    <line x1="54" y1="15" x2="70" y2="15" stroke="#9ca3af" stroke-width="3"/>
    <line x1="62" y1="8" x2="62" y2="22" stroke="#9ca3af" stroke-width="2"/>
    <rect x="98" y="25" width="20" height="40" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // THREE BLACK CROWS: Tres velas rojas consecutivas descendentes
  // Imagen ChartGuys: escalera de 3 rojas bajando
  'THREE_BLACK_CROWS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="8" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="22" y1="30" x2="22" y2="35" stroke="#ef4444" stroke-width="2"/>
    <rect x="52" y="26" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="62" y1="48" x2="62" y2="53" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="45" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="108" y1="67" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'TRES_CUERVOS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="8" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="22" y1="30" x2="22" y2="35" stroke="#ef4444" stroke-width="2"/>
    <rect x="52" y="26" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="62" y1="48" x2="62" y2="53" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="45" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="108" y1="67" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'TRES_CUERVOS_NEGROS': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="8" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="22" y1="30" x2="22" y2="35" stroke="#ef4444" stroke-width="2"/>
    <rect x="52" y="26" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="62" y1="48" x2="62" y2="53" stroke="#ef4444" stroke-width="2"/>
    <rect x="98" y="45" width="20" height="22" fill="#ef4444" rx="1"/>
    <line x1="108" y1="67" x2="108" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,

  // ============================================================
  // CONFIRMATION PATTERNS (Patrones de Confirmación)
  // ============================================================
  
  // THREE INSIDE UP: Harami alcista + vela de confirmación verde
  // Imagen ChartGuys: roja grande, verde pequeña dentro, verde confirmación
  'THREE_INSIDE_UP': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="48" y="32" width="14" height="18" fill="#22c55e" rx="1"/>
    <rect x="78" y="20" width="18" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'TRES_INTERIOR_ALCISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="48" y="32" width="14" height="18" fill="#22c55e" rx="1"/>
    <rect x="78" y="20" width="18" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // THREE OUTSIDE UP: Engulfing alcista + vela de confirmación verde
  // Imagen ChartGuys: roja pequeña, verde envolvente, verde confirmación
  'THREE_OUTSIDE_UP': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="18" y="32" width="14" height="18" fill="#ef4444" rx="1"/>
    <rect x="45" y="20" width="22" height="42" fill="#22c55e" rx="1"/>
    <rect x="82" y="12" width="18" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'TRES_EXTERIOR_ALCISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="18" y="32" width="14" height="18" fill="#ef4444" rx="1"/>
    <rect x="45" y="20" width="22" height="42" fill="#22c55e" rx="1"/>
    <rect x="82" y="12" width="18" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  // THREE INSIDE DOWN: Harami bajista + vela de confirmación roja
  // Imagen ChartGuys: verde grande, roja pequeña dentro, roja confirmación
  'THREE_INSIDE_DOWN': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="48" y="30" width="14" height="18" fill="#ef4444" rx="1"/>
    <rect x="78" y="28" width="18" height="36" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'TRES_INTERIOR_BAJISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="12" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="48" y="30" width="14" height="18" fill="#ef4444" rx="1"/>
    <rect x="78" y="28" width="18" height="36" fill="#ef4444" rx="1"/>
  </svg>`,
  
  // THREE OUTSIDE DOWN: Engulfing bajista + vela de confirmación roja
  // Imagen ChartGuys: verde pequeña, roja envolvente, roja confirmación
  'THREE_OUTSIDE_DOWN': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="18" y="30" width="14" height="18" fill="#22c55e" rx="1"/>
    <rect x="45" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
    <rect x="82" y="36" width="18" height="32" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'TRES_EXTERIOR_BAJISTA': `<svg width="140" height="80" viewBox="0 0 140 80">
    <rect x="18" y="30" width="14" height="18" fill="#22c55e" rx="1"/>
    <rect x="45" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
    <rect x="82" y="36" width="18" height="32" fill="#ef4444" rx="1"/>
  </svg>`,

  // ============================================================
  // GENÉRICOS (para patrones no específicos)
  // ============================================================
  'BULLISH': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="8" x2="30" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="20" y="15" width="20" height="50" fill="#22c55e" rx="2"/>
    <line x1="30" y1="65" x2="30" y2="72" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'ALCISTA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="8" x2="30" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="20" y="15" width="20" height="50" fill="#22c55e" rx="2"/>
    <line x1="30" y1="65" x2="30" y2="72" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'BEARISH': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="8" x2="30" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="20" y="15" width="20" height="50" fill="#ef4444" rx="2"/>
    <line x1="30" y1="65" x2="30" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'BAJISTA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="8" x2="30" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="20" y="15" width="20" height="50" fill="#ef4444" rx="2"/>
    <line x1="30" y1="65" x2="30" y2="72" stroke="#ef4444" stroke-width="2"/>
  </svg>`
};

// Diccionario de patrones de velas con explicaciones
const PATTERN_EXPLANATIONS: Record<string, { emoji: string; explanation: string; signal: string; color: string }> = {
  'DOJI': {
    emoji: '➕',
    explanation: 'Apertura y cierre casi iguales. El mercado está INDECISO. Suele aparecer antes de un cambio de dirección.',
    signal: '⚠️ Esperar siguiente vela',
    color: 'yellow'
  },
  'LONG_LEGGED_DOJI': {
    emoji: '➕',
    explanation: 'Doji con mechas largas arriba y abajo. Gran indecisión con mucha volatilidad.',
    signal: '⚠️ Alta indecisión',
    color: 'yellow'
  },
  'SPINNING_TOP': {
    emoji: '🎯',
    explanation: 'Cuerpo pequeño con mechas similares. Indecisión, ni compradores ni vendedores dominan.',
    signal: '⚠️ Neutral',
    color: 'yellow'
  },
  'HAMMER': {
    emoji: '🔨',
    explanation: 'Cuerpo pequeño ARRIBA con mecha larga ABAJO. Los vendedores intentaron bajar pero compradores recuperaron. En tendencia bajista = REBOTE.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'MARTILLO': {
    emoji: '🔨',
    explanation: 'Cuerpo pequeño ARRIBA con mecha larga ABAJO. Los vendedores intentaron bajar pero compradores recuperaron. En tendencia bajista = REBOTE.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'INVERTED_HAMMER': {
    emoji: '🔨⬆️',
    explanation: 'Cuerpo pequeño ABAJO con mecha larga ARRIBA. Los compradores intentaron subir pero no mantuvieron. En tendencia bajista = posible cambio.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'MARTILLO_INVERTIDO': {
    emoji: '🔨⬆️',
    explanation: 'Cuerpo pequeño ABAJO con mecha larga ARRIBA. Los compradores intentaron subir pero no mantuvieron. En tendencia bajista = posible cambio.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'DRAGONFLY_DOJI': {
    emoji: '🪰',
    explanation: 'Doji con mecha larga solo hacia abajo. Fuerte rechazo de precios bajos. Alcista tras tendencia bajista.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'BULLISH_MARUBOZU': {
    emoji: '📊',
    explanation: 'Vela verde sin mechas. Los compradores dominaron TODO el periodo sin oposición. Señal muy fuerte.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'SHOOTING_STAR': {
    emoji: '⭐💫',
    explanation: 'Cuerpo pequeño ABAJO con mecha larga ARRIBA. Los compradores fracasaron. En tendencia ALCISTA = posible CAÍDA.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'ESTRELLA_FUGAZ': {
    emoji: '⭐💫',
    explanation: 'Cuerpo pequeño ABAJO con mecha larga ARRIBA. Los compradores fracasaron. En tendencia ALCISTA = posible CAÍDA.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'HANGING_MAN': {
    emoji: '🧍‍♂️⬇️',
    explanation: 'Igual forma que el martillo pero aparece en TENDENCIA ALCISTA. Aviso de que la subida puede terminar.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'HOMBRE_COLGADO': {
    emoji: '🧍‍♂️⬇️',
    explanation: 'Igual forma que el martillo pero aparece en TENDENCIA ALCISTA. Aviso de que la subida puede terminar.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'GRAVESTONE_DOJI': {
    emoji: '🪦',
    explanation: 'Doji con mecha larga solo hacia arriba. Fuerte rechazo de precios altos. Bajista tras tendencia alcista.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'BEARISH_MARUBOZU': {
    emoji: '📊',
    explanation: 'Vela roja sin mechas. Los vendedores dominaron TODO el periodo sin oposición. Señal muy fuerte de caída.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'MARUBOZU': {
    emoji: '📊',
    explanation: 'Vela sin mechas. Si es verde = compradores dominaron TODO el periodo. Si es roja = vendedores dominaron TODO.',
    signal: '⚡ Muy fuerte',
    color: 'purple'
  },
  'ENGULFING': {
    emoji: '🐋',
    explanation: 'Una vela grande "envuelve" completamente el cuerpo de la anterior. Señal MUY FUERTE de cambio de tendencia.',
    signal: '⚡ Fuerte',
    color: 'purple'
  },
  'BULLISH_ENGULFING': {
    emoji: '🐋',
    explanation: 'Vela verde grande envuelve la roja anterior. Los compradores tomaron el control total.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'ENVOLVENTE': {
    emoji: '🐋',
    explanation: 'Una vela grande "envuelve" completamente el cuerpo de la anterior. Señal MUY FUERTE de cambio de tendencia.',
    signal: '⚡ Fuerte',
    color: 'purple'
  },
  'BULLISH_HARAMI': {
    emoji: '🤰',
    explanation: 'Vela verde pequeña dentro de vela roja grande anterior. Pérdida de momentum bajista.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'HARAMI': {
    emoji: '🤰',
    explanation: 'Una vela pequeña contenida dentro del cuerpo de la anterior. Indica pérdida de momentum.',
    signal: '⚠️ Posible cambio',
    color: 'yellow'
  },
  'PIERCING': {
    emoji: '📍',
    explanation: 'Vela alcista que abre por debajo pero cierra por encima de la mitad de la vela bajista anterior. Compradores tomando control.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'PENETRANTE': {
    emoji: '📍',
    explanation: 'Vela alcista que abre por debajo pero cierra por encima de la mitad de la vela bajista anterior. Compradores tomando control.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'TWEEZER_BOTTOM': {
    emoji: '🔧⬇️',
    explanation: 'Dos velas con el mismo mínimo exacto. El mercado rechazó ese nivel dos veces = Soporte fuerte.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'BULLISH_KICKER': {
    emoji: '🦵',
    explanation: 'Vela roja seguida de verde con gap alcista. Cambio de sentimiento extremo.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'BEARISH_ENGULFING': {
    emoji: '🐋',
    explanation: 'Vela roja grande envuelve la verde anterior. Los vendedores tomaron el control total.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'BEARISH_HARAMI': {
    emoji: '🤰',
    explanation: 'Vela roja pequeña dentro de vela verde grande anterior. Pérdida de momentum alcista.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'DARK_CLOUD': {
    emoji: '🌧️',
    explanation: 'Vela bajista que abre por encima pero cierra por debajo de la mitad de la vela alcista anterior. Vendedores tomando control.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'NUBE_OSCURA': {
    emoji: '🌧️',
    explanation: 'Vela bajista que abre por encima pero cierra por debajo de la mitad de la vela alcista anterior. Vendedores tomando control.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'TWEEZER_TOP': {
    emoji: '🔧⬆️',
    explanation: 'Dos velas con el mismo máximo exacto. El mercado rechazó ese nivel dos veces = Resistencia fuerte.',
    signal: '🔴 Bajista',
    color: 'red'
  },
  'BEARISH_KICKER': {
    emoji: '🦵',
    explanation: 'Vela verde seguida de roja con gap bajista. Cambio de sentimiento extremo.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'MORNING_STAR': {
    emoji: '🌅',
    explanation: 'Patrón de 3 velas: 1) Bajista grande 2) Vela pequeña/doji 3) Alcista grande. El amanecer después de la noche = SUBIDA.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'ESTRELLA_MANANA': {
    emoji: '🌅',
    explanation: 'Patrón de 3 velas: 1) Bajista grande 2) Vela pequeña/doji 3) Alcista grande. El amanecer después de la noche = SUBIDA.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'BULLISH_ABANDONED_BABY': {
    emoji: '👶',
    explanation: '3 velas con gaps: roja, doji aislado, verde. Reversión muy fuerte.',
    signal: '🟢🟢🟢 Muy alcista',
    color: 'green'
  },
  'THREE_WHITE_SOLDIERS': {
    emoji: '💂💂💂',
    explanation: '3 velas alcistas consecutivas, cada una cerrando más alto. Los compradores dominan totalmente = SUBIDA FUERTE.',
    signal: '🟢🟢🟢 Muy alcista',
    color: 'green'
  },
  'TRES_SOLDADOS': {
    emoji: '💂💂💂',
    explanation: '3 velas alcistas consecutivas, cada una cerrando más alto. Los compradores dominan totalmente = SUBIDA FUERTE.',
    signal: '🟢🟢🟢 Muy alcista',
    color: 'green'
  },
  'THREE_INSIDE_UP': {
    emoji: '📈',
    explanation: 'Harami alcista confirmado por tercera vela verde que cierra arriba.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'THREE_OUTSIDE_UP': {
    emoji: '📈',
    explanation: 'Envolvente alcista confirmado por tercera vela verde que cierra arriba.',
    signal: '🟢🟢 Muy alcista',
    color: 'green'
  },
  'EVENING_STAR': {
    emoji: '🌆',
    explanation: 'Patrón de 3 velas: 1) Alcista grande 2) Vela pequeña/doji 3) Bajista grande. El atardecer después del día = BAJADA.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'ESTRELLA_TARDE': {
    emoji: '🌆',
    explanation: 'Patrón de 3 velas: 1) Alcista grande 2) Vela pequeña/doji 3) Bajista grande. El atardecer después del día = BAJADA.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'BEARISH_ABANDONED_BABY': {
    emoji: '👶',
    explanation: '3 velas con gaps: verde, doji aislado, roja. Reversión muy fuerte hacia abajo.',
    signal: '🔴🔴🔴 Muy bajista',
    color: 'red'
  },
  'THREE_BLACK_CROWS': {
    emoji: '🐦‍⬛🐦‍⬛🐦‍⬛',
    explanation: '3 velas bajistas consecutivas, cada una cerrando más bajo. Los vendedores dominan totalmente = CAÍDA FUERTE.',
    signal: '🔴🔴🔴 Muy bajista',
    color: 'red'
  },
  'TRES_CUERVOS': {
    emoji: '🐦‍⬛🐦‍⬛🐦‍⬛',
    explanation: '3 velas bajistas consecutivas, cada una cerrando más bajo. Los vendedores dominan totalmente = CAÍDA FUERTE.',
    signal: '🔴🔴🔴 Muy bajista',
    color: 'red'
  },
  'THREE_INSIDE_DOWN': {
    emoji: '📉',
    explanation: 'Harami bajista confirmado por tercera vela roja que cierra abajo.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'THREE_OUTSIDE_DOWN': {
    emoji: '📉',
    explanation: 'Envolvente bajista confirmado por tercera vela roja que cierra abajo.',
    signal: '🔴🔴 Muy bajista',
    color: 'red'
  },
  'BULLISH': {
    emoji: '🐂',
    explanation: 'Patrón alcista detectado. El precio tiende a subir.',
    signal: '🟢 Alcista',
    color: 'green'
  },
  'BEARISH': {
    emoji: '🐻',
    explanation: 'Patrón bajista detectado. El precio tiende a bajar.',
    signal: '🔴 Bajista',
    color: 'red'
  }
};

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="trading-card h-full overflow-y-auto">
      <h2 class="text-lg font-semibold mb-4">📊 Análisis Técnico</h2>
      
      @if (tradingService.analysis.isLoading()) {
        <div class="flex items-center justify-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      } @else if (analysis()) {
        <!-- Señal Principal -->
        <div class="mb-6 p-4 rounded-lg bg-gradient-to-r from-trading-card to-trading-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Señal</p>
              <p class="text-2xl font-bold" [class]="signalColor()">
                {{ analysis()!.overall_signal }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-400 text-sm">Confianza</p>
              <p class="text-2xl font-bold">{{ analysis()!.signal_strength | number:'1.0-0' }}%</p>
            </div>
          </div>
          
          <!-- Barra de confianza -->
          <div class="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-500"
              [class]="signalBarColor()"
              [style.width.%]="analysis()!.signal_strength">
            </div>
          </div>
        </div>
        
        <!-- Tendencia -->
        <div class="mb-4 p-3 rounded-lg bg-trading-border/30">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Tendencia</span>
            <span class="font-semibold" [class]="trendColor()">
              {{ trendEmoji() }} {{ analysis()!.trend }}
            </span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            Fuerza: {{ analysis()!.trend_strength | number:'1.0-0' }}%
          </div>
        </div>
        
        <!-- Precio actual -->
        <div class="mb-4 p-3 rounded-lg bg-trading-border/30">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Precio actual</span>
            <span class="font-semibold text-lg">
              {{ analysis()!.current_price | number:'1.2-4' }}
            </span>
          </div>
        </div>
        
        <!-- Soportes y Resistencias -->
        @if (analysis()!.support_levels.length || analysis()!.resistance_levels.length) {
          <div class="mb-4 grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p class="text-green-400 text-sm mb-2">🛡️ Soportes</p>
              @for (level of analysis()!.support_levels; track level) {
                <p class="text-sm">{{ level | number:'1.2-4' }}</p>
              } @empty {
                <p class="text-gray-500 text-sm">-</p>
              }
            </div>
            <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p class="text-red-400 text-sm mb-2">🎯 Resistencias</p>
              @for (level of analysis()!.resistance_levels; track level) {
                <p class="text-sm">{{ level | number:'1.2-4' }}</p>
              } @empty {
                <p class="text-gray-500 text-sm">-</p>
              }
            </div>
          </div>
        }
        
        <!-- Indicadores -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-400 mb-2">📈 Indicadores <span class="text-xs text-gray-500">(click para ver en gráfico)</span></h3>
          <div class="space-y-2">
            @for (indicator of analysis()!.indicators; track indicator.name) {
              <div 
                class="p-2 rounded flex items-center justify-between cursor-pointer relative group transition-all"
                [class]="isIndicatorSelected(indicator.name) 
                  ? 'bg-indigo-600/30 border border-indigo-500' 
                  : 'bg-trading-border/20 hover:bg-trading-border/40'"
                (click)="toggleIndicatorOnChart(indicator.name)"
                (mouseenter)="showIndicatorTooltip(indicator.name)"
                (mouseleave)="hideTooltip()">
                <span class="text-sm flex items-center gap-1">
                  @if (isIndicatorSelected(indicator.name)) {
                    <span class="text-indigo-400">📊</span>
                  }
                  {{ indicator.name }}
                  <span class="text-gray-500 text-xs">❓</span>
                </span>
                <div class="flex items-center gap-2">
                  @if (indicator.value !== undefined) {
                    <span class="text-xs text-gray-500">{{ indicator.value | number:'1.1-1' }}</span>
                  }
                  <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(indicator.signal)">
                    {{ indicator.signal }}
                  </span>
                </div>
                
                <!-- Tooltip -->
                @if (activeTooltip() === indicator.name) {
                  <div class="absolute left-0 bottom-full mb-2 z-50 w-64 p-2 bg-gray-900 border border-indigo-500 rounded-lg shadow-xl text-xs">
                    <p class="text-indigo-400 font-bold mb-1">{{ indicator.name }}</p>
                    <p class="text-gray-300 leading-relaxed">{{ getIndicatorExplanation(indicator.name) }}</p>
                    <p class="text-indigo-300 mt-1 text-xs">👆 Click para {{ isIndicatorSelected(indicator.name) ? 'ocultar' : 'mostrar' }} en gráfico</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
        
        <!-- Patrones detectados -->
        @if (analysis()!.patterns.length) {
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-400 mb-2">🕯️ Patrones de Velas <span class="text-xs text-gray-500">(hover para ver)</span></h3>
            <div class="space-y-2">
              @for (pattern of analysis()!.patterns; track pattern.name) {
                <div 
                  class="p-2 rounded bg-trading-border/20 hover:bg-trading-border/40 cursor-pointer relative group transition-all"
                  (mouseenter)="showPatternTooltip(pattern.name)"
                  (mouseleave)="hidePatternTooltip()">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium flex items-center gap-1">
                      <span class="text-lg">{{ getPatternEmoji(pattern.name) }}</span>
                      {{ pattern.name }}
                      <span class="text-gray-500 text-xs">❓</span>
                    </span>
                    <span class="text-xs px-2 py-1 rounded" [class]="getSignalClass(pattern.signal)">
                      {{ pattern.confidence | number:'1.0-0' }}%
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ pattern.description }}</p>
                  
                  <!-- Tooltip visual del patrón -->
                  @if (activePatternTooltip() === pattern.name) {
                    <div 
                      class="absolute left-0 bottom-full mb-2 z-50 w-96 p-3 bg-gray-900 rounded-lg shadow-xl"
                      [class]="getPatternBorderClass(pattern.name)">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-3xl">{{ getPatternEmoji(pattern.name) }}</span>
                        <span class="font-bold" [class]="getPatternTextClass(pattern.name)">{{ pattern.name }}</span>
                      </div>
                      
                      <!-- SVG del patrón -->
                      <div 
                        class="bg-gray-950 rounded p-3 mb-2 flex justify-center border border-gray-700"
                        [innerHTML]="getPatternSVG(pattern.name)">
                      </div>
                      
                      <p class="text-gray-300 text-xs leading-relaxed mb-2">{{ getPatternExplanation(pattern.name) }}</p>
                      
                      <div class="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span class="text-xs font-semibold" [class]="getPatternTextClass(pattern.name)">{{ getPatternSignal(pattern.name) }}</span>
                        <span class="text-xs text-gray-500">Confianza: {{ pattern.confidence }}%</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
        
        <!-- Recomendaciones -->
        <div>
          <h3 class="text-sm font-semibold text-gray-400 mb-2">💡 Recomendaciones</h3>
          <div class="space-y-2">
            @for (rec of analysis()!.recommendations; track rec) {
              <p class="text-sm text-gray-300">{{ rec }}</p>
            }
          </div>
        </div>
      } @else {
        <div class="text-center text-gray-500 py-8">
          Selecciona un símbolo para ver el análisis
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnalysisComponent {
  readonly tradingService = inject(TradingService);
  private sanitizer = inject(DomSanitizer);
  
  readonly analysis = computed(() => this.tradingService.analysis.value());
  
  readonly signalColor = computed(() => {
    const signal = this.analysis()?.overall_signal;
    if (!signal) return 'text-gray-400';
    if (signal.includes('COMPRA')) return 'text-green-400';
    if (signal.includes('VENTA')) return 'text-red-400';
    return 'text-yellow-400';
  });
  
  readonly signalBarColor = computed(() => {
    const signal = this.analysis()?.overall_signal;
    if (!signal) return 'bg-gray-500';
    if (signal.includes('COMPRA')) return 'bg-green-500';
    if (signal.includes('VENTA')) return 'bg-red-500';
    return 'bg-yellow-500';
  });
  
  readonly trendColor = computed(() => {
    const trend = this.analysis()?.trend;
    if (trend === 'ALCISTA') return 'text-green-400';
    if (trend === 'BAJISTA') return 'text-red-400';
    return 'text-yellow-400';
  });
  
  readonly trendEmoji = computed(() => {
    const trend = this.analysis()?.trend;
    if (trend === 'ALCISTA') return '📈';
    if (trend === 'BAJISTA') return '📉';
    return '➡️';
  });
  
  getSignalClass(signal: string): string {
    return SIGNAL_CLASSES[signal] || 'bg-gray-500/20 text-gray-400';
  }
  
  // Tooltip para indicadores
  readonly activeTooltip = signal<string | null>(null);
  
  // Tooltip para patrones de velas
  readonly activePatternTooltip = signal<string | null>(null);
  
  showIndicatorTooltip(name: string): void {
    this.activeTooltip.set(name);
  }
  
  hideTooltip(): void {
    this.activeTooltip.set(null);
  }
  
  showPatternTooltip(name: string): void {
    this.activePatternTooltip.set(name);
  }
  
  hidePatternTooltip(): void {
    this.activePatternTooltip.set(null);
  }
  
  getIndicatorExplanation(name: string): string {
    // Buscar coincidencia parcial
    for (const [key, explanation] of Object.entries(INDICATOR_EXPLANATIONS)) {
      if (name.toUpperCase().includes(key)) {
        return explanation;
      }
    }
    return 'Indicador técnico que ayuda a predecir movimientos del precio.';
  }
  
  private findPatternData(name: string) {
    const normalized = this.normalizePatternName(name);
    
    // Crear un mapa normalizado de claves
    const entries = Object.entries(PATTERN_EXPLANATIONS);
    
    // Primero buscar coincidencia EXACTA después de normalizar
    for (const [key, data] of entries) {
      if (this.normalizePatternName(key) === normalized) {
        return data;
      }
    }
    
    // Ordenar por longitud de clave normalizada descendente para priorizar matches más específicos
    const sortedEntries = entries.sort((a, b) => 
      this.normalizePatternName(b[0]).length - this.normalizePatternName(a[0]).length
    );
    
    for (const [key, data] of sortedEntries) {
      const normKey = this.normalizePatternName(key);
      if (normalized.includes(normKey) || normKey.includes(normalized)) {
        return data;
      }
    }
    return null;
  }
  
  getPatternEmoji(name: string): string {
    const data = this.findPatternData(name);
    return data?.emoji || '🕯️';
  }
  
  getPatternExplanation(name: string): string {
    const data = this.findPatternData(name);
    return data?.explanation || 'Patrón de velas que puede indicar un cambio en la dirección del precio.';
  }
  
  getPatternSignal(name: string): string {
    const data = this.findPatternData(name);
    return data?.signal || '⚠️ Evaluar contexto';
  }
  
  // Función para normalizar texto: quitar tildes, espacios extra, etc.
  private normalizePatternName(name: string): string {
    return name
      .toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/\s+/g, '_')
      .replace(/_DE_LA_/g, '_')  // Simplificar "ESTRELLA_DE_LA_MANANA" → "ESTRELLA_MANANA"
      .replace(/_DE_/g, '_')
      .replace(/_LA_/g, '_');
  }
  
  getPatternSVG(name: string): SafeHtml {
    const normalized = this.normalizePatternName(name);
    
    // Primero buscar coincidencia EXACTA
    if (PATTERN_SVGS[normalized]) {
      return this.sanitizer.bypassSecurityTrustHtml(PATTERN_SVGS[normalized]);
    }
    
    // Crear un mapa normalizado de claves
    const normalizedKeyMap: Record<string, string> = {};
    for (const key of Object.keys(PATTERN_SVGS)) {
      normalizedKeyMap[this.normalizePatternName(key)] = key;
    }
    
    // Buscar coincidencia exacta después de normalizar
    if (normalizedKeyMap[normalized]) {
      return this.sanitizer.bypassSecurityTrustHtml(PATTERN_SVGS[normalizedKeyMap[normalized]]);
    }
    
    // Ordenar claves normalizadas por longitud descendente para priorizar matches más específicos
    const sortedNormalizedKeys = Object.keys(normalizedKeyMap).sort((a, b) => b.length - a.length);
    
    for (const normKey of sortedNormalizedKeys) {
      if (normalized.includes(normKey) || normKey.includes(normalized)) {
        return this.sanitizer.bypassSecurityTrustHtml(PATTERN_SVGS[normalizedKeyMap[normKey]]);
      }
    }
    
    // Si no encuentra, devolver un SVG genérico
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 50 60" class="w-12 h-14">
        <rect x="20" y="10" width="10" height="40" fill="#9ca3af" rx="1"/>
        <line x1="25" y1="5" x2="25" y2="10" stroke="#9ca3af" stroke-width="1"/>
        <line x1="25" y1="50" x2="25" y2="55" stroke="#9ca3af" stroke-width="1"/>
      </svg>
    `);
  }
  
  getPatternBorderClass(name: string): string {
    const data = this.findPatternData(name);
    switch (data?.color) {
      case 'green': return 'border-2 border-green-500';
      case 'red': return 'border-2 border-red-500';
      case 'yellow': return 'border-2 border-yellow-500';
      case 'purple': return 'border-2 border-purple-500';
      default: return 'border border-gray-500';
    }
  }
  
  getPatternTextClass(name: string): string {
    const data = this.findPatternData(name);
    switch (data?.color) {
      case 'green': return 'text-green-400';
      case 'red': return 'text-red-400';
      case 'yellow': return 'text-yellow-400';
      case 'purple': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  }
  
  // Indicador seleccionado para mostrar en gráfico
  isIndicatorSelected(name: string): boolean {
    return this.tradingService.selectedIndicator() === name;
  }
  
  toggleIndicatorOnChart(name: string): void {
    if (this.tradingService.selectedIndicator() === name) {
      this.tradingService.selectIndicator(null);
    } else {
      this.tradingService.selectIndicator(name);
    }
  }
}
