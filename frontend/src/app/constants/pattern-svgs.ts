/**
 * SVGs de Patrones de Velas - Basado en ChartGuys Candlestick Patterns Cheat Sheet
 * Colores: Verde #22c55e (alcista), Rojo #ef4444 (bajista), Gris #9ca3af (neutral)
 */

export const PATTERN_SVGS: Record<string, string> = {
  // ============================================================
  // PATRONES NEUTRALES
  // ============================================================
  'DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="15" x2="30" y2="35" stroke="#9ca3af" stroke-width="2"/>
    <line x1="22" y1="40" x2="38" y2="40" stroke="#9ca3af" stroke-width="4"/>
    <line x1="30" y1="45" x2="30" y2="65" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  'LONG_LEGGED_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="5" x2="30" y2="37" stroke="#9ca3af" stroke-width="2"/>
    <line x1="22" y1="40" x2="38" y2="40" stroke="#9ca3af" stroke-width="4"/>
    <line x1="30" y1="43" x2="30" y2="75" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  'DOJI_PIERNAS_LARGAS': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="5" x2="30" y2="37" stroke="#9ca3af" stroke-width="2"/>
    <line x1="22" y1="40" x2="38" y2="40" stroke="#9ca3af" stroke-width="4"/>
    <line x1="30" y1="43" x2="30" y2="75" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  'SPINNING_TOP': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <rect x="22" y="28" width="16" height="24" fill="#9ca3af" rx="1"/>
    <line x1="30" y1="52" x2="30" y2="68" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,
  
  'PEONZA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="28" stroke="#9ca3af" stroke-width="2"/>
    <rect x="22" y="28" width="16" height="24" fill="#9ca3af" rx="1"/>
    <line x1="30" y1="52" x2="30" y2="68" stroke="#9ca3af" stroke-width="2"/>
  </svg>`,

  // ============================================================
  // ALCISTAS - 1 VELA
  // ============================================================
  'HAMMER': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#22c55e" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'MARTILLO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#22c55e" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'INVERTED_HAMMER': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#22c55e" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'MARTILLO_INVERTIDO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#22c55e" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'DRAGONFLY_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="20" y1="15" x2="40" y2="15" stroke="#22c55e" stroke-width="4"/>
    <line x1="30" y1="15" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'DOJI_LIBELULA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="20" y1="15" x2="40" y2="15" stroke="#22c55e" stroke-width="4"/>
    <line x1="30" y1="15" x2="30" y2="68" stroke="#22c55e" stroke-width="2"/>
  </svg>`,
  
  'BULLISH_MARUBOZU': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#22c55e" rx="2"/>
  </svg>`,
  
  'MARUBOZU_ALCISTA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#22c55e" rx="2"/>
  </svg>`,

  // ============================================================
  // BAJISTAS - 1 VELA
  // ============================================================
  'SHOOTING_STAR': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#ef4444" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'ESTRELLA_FUGAZ': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="50" stroke="#ef4444" stroke-width="2"/>
    <rect x="22" y="50" width="16" height="18" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'HANGING_MAN': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#ef4444" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'HOMBRE_COLGADO': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="22" y="12" width="16" height="18" fill="#ef4444" rx="1"/>
    <line x1="30" y1="30" x2="30" y2="68" stroke="#ef4444" stroke-width="2"/>
  </svg>`,
  
  'GRAVESTONE_DOJI': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="65" stroke="#ef4444" stroke-width="2"/>
    <line x1="20" y1="65" x2="40" y2="65" stroke="#ef4444" stroke-width="4"/>
  </svg>`,
  
  'DOJI_LAPIDA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <line x1="30" y1="12" x2="30" y2="65" stroke="#ef4444" stroke-width="2"/>
    <line x1="20" y1="65" x2="40" y2="65" stroke="#ef4444" stroke-width="4"/>
  </svg>`,

  'BEARISH_MARUBOZU': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#ef4444" rx="2"/>
  </svg>`,
  
  'MARUBOZU_BAJISTA': `<svg width="60" height="80" viewBox="0 0 60 80">
    <rect x="20" y="10" width="20" height="60" fill="#ef4444" rx="2"/>
  </svg>`,

  // ============================================================
  // ALCISTAS - 2 VELAS
  // ============================================================
  'BULLISH_ENGULFING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'ENVOLVENTE_ALCISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#ef4444" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'BULLISH_HARAMI': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'HARAMI_ALCISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#ef4444" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'PIERCING_LINE': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#ef4444" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#ef4444" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#ef4444" stroke-width="2"/>
    <line x1="64" y1="60" x2="64" y2="72" stroke="#22c55e" stroke-width="2"/>
    <rect x="54" y="28" width="20" height="32" fill="#22c55e" rx="1"/>
  </svg>`,
  
  'TWEEZER_BOTTOM': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="18" y="18" width="18" height="32" fill="#ef4444" rx="1"/>
    <line x1="27" y1="50" x2="27" y2="68" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#22c55e" rx="1"/>
    <line x1="63" y1="50" x2="63" y2="68" stroke="#22c55e" stroke-width="2"/>
    <line x1="12" y1="68" x2="80" y2="68" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,

  // ============================================================
  // BAJISTAS - 2 VELAS
  // ============================================================
  'BEARISH_ENGULFING': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#22c55e" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'ENVOLVENTE_BAJISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="20" y="28" width="14" height="24" fill="#22c55e" rx="1"/>
    <rect x="50" y="18" width="22" height="44" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'BEARISH_HARAMI': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'HARAMI_BAJISTA': `<svg width="100" height="80" viewBox="0 0 100 80">
    <rect x="15" y="15" width="22" height="50" fill="#22c55e" rx="1"/>
    <rect x="52" y="30" width="14" height="20" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'DARK_CLOUD_COVER': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="26" y1="8" x2="26" y2="15" stroke="#22c55e" stroke-width="2"/>
    <rect x="16" y="15" width="20" height="50" fill="#22c55e" rx="1"/>
    <line x1="26" y1="65" x2="26" y2="72" stroke="#22c55e" stroke-width="2"/>
    <line x1="64" y1="8" x2="64" y2="20" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="20" width="20" height="32" fill="#ef4444" rx="1"/>
  </svg>`,
  
  'TWEEZER_TOP': `<svg width="100" height="80" viewBox="0 0 100 80">
    <line x1="27" y1="12" x2="27" y2="30" stroke="#22c55e" stroke-width="2"/>
    <rect x="18" y="30" width="18" height="32" fill="#22c55e" rx="1"/>
    <line x1="63" y1="12" x2="63" y2="30" stroke="#ef4444" stroke-width="2"/>
    <rect x="54" y="30" width="18" height="20" fill="#ef4444" rx="1"/>
    <line x1="12" y1="12" x2="80" y2="12" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,3"/>
  </svg>`,

  // ============================================================
  // ALCISTAS - 3 VELAS
  // ============================================================
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
  
  'THREE_WHITE_SOLDIERS': `<svg width="140" height="80" viewBox="0 0 140 80">
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
  // BAJISTAS - 3 VELAS
  // ============================================================
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
  
  'THREE_BLACK_CROWS': `<svg width="140" height="80" viewBox="0 0 140 80">
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
};

// Lista de patrones para mostrar en galería visual
export interface PatternInfo {
  key: string;
  name: string;
  nameEn: string;
  description: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  candles: number;
}

export const PATTERN_GALLERY: PatternInfo[] = [
  // Neutrales
  { key: 'DOJI', name: 'Doji', nameEn: 'Doji', description: 'Apertura = Cierre. Indecisión total del mercado.', signal: 'neutral', candles: 1 },
  { key: 'LONG_LEGGED_DOJI', name: 'Doji Piernas Largas', nameEn: 'Long-Legged Doji', description: 'Alta volatilidad pero precio vuelve al origen.', signal: 'neutral', candles: 1 },
  { key: 'SPINNING_TOP', name: 'Peonza', nameEn: 'Spinning Top', description: 'Cuerpo pequeño con mechas similares. Indecisión.', signal: 'neutral', candles: 1 },
  
  // Alcistas 1 vela
  { key: 'HAMMER', name: 'Martillo', nameEn: 'Hammer', description: 'Cuerpo arriba, mecha larga abajo. Rechazo de mínimos.', signal: 'bullish', candles: 1 },
  { key: 'INVERTED_HAMMER', name: 'Martillo Invertido', nameEn: 'Inverted Hammer', description: 'Cuerpo abajo, mecha larga arriba. Intento de subida.', signal: 'bullish', candles: 1 },
  { key: 'DRAGONFLY_DOJI', name: 'Doji Libélula', nameEn: 'Dragonfly Doji', description: 'T invertida. Fuerte rechazo de mínimos.', signal: 'bullish', candles: 1 },
  { key: 'BULLISH_MARUBOZU', name: 'Marubozu Alcista', nameEn: 'Bullish Marubozu', description: 'Cuerpo verde sin mechas. Dominio total de compradores.', signal: 'bullish', candles: 1 },
  
  // Bajistas 1 vela
  { key: 'SHOOTING_STAR', name: 'Estrella Fugaz', nameEn: 'Shooting Star', description: 'Cuerpo abajo, mecha larga arriba. Rechazo de máximos.', signal: 'bearish', candles: 1 },
  { key: 'HANGING_MAN', name: 'Hombre Colgado', nameEn: 'Hanging Man', description: 'Igual que martillo pero en tendencia alcista.', signal: 'bearish', candles: 1 },
  { key: 'GRAVESTONE_DOJI', name: 'Doji Lápida', nameEn: 'Gravestone Doji', description: 'Forma de T. Fuerte rechazo de máximos.', signal: 'bearish', candles: 1 },
  { key: 'BEARISH_MARUBOZU', name: 'Marubozu Bajista', nameEn: 'Bearish Marubozu', description: 'Cuerpo rojo sin mechas. Dominio total de vendedores.', signal: 'bearish', candles: 1 },
  
  // Alcistas 2 velas
  { key: 'BULLISH_ENGULFING', name: 'Envolvente Alcista', nameEn: 'Bullish Engulfing', description: 'Vela verde envuelve la roja anterior. Señal fuerte.', signal: 'bullish', candles: 2 },
  { key: 'BULLISH_HARAMI', name: 'Harami Alcista', nameEn: 'Bullish Harami', description: 'Verde pequeña dentro de roja grande. Pérdida de momentum bajista.', signal: 'bullish', candles: 2 },
  { key: 'PIERCING_LINE', name: 'Línea Penetrante', nameEn: 'Piercing Line', description: 'Verde cierra arriba del 50% de la roja anterior.', signal: 'bullish', candles: 2 },
  { key: 'TWEEZER_BOTTOM', name: 'Pinzas de Suelo', nameEn: 'Tweezer Bottom', description: 'Dos velas con mínimos iguales. Doble rechazo de soporte.', signal: 'bullish', candles: 2 },
  
  // Bajistas 2 velas
  { key: 'BEARISH_ENGULFING', name: 'Envolvente Bajista', nameEn: 'Bearish Engulfing', description: 'Vela roja envuelve la verde anterior. Señal fuerte.', signal: 'bearish', candles: 2 },
  { key: 'BEARISH_HARAMI', name: 'Harami Bajista', nameEn: 'Bearish Harami', description: 'Roja pequeña dentro de verde grande. Pérdida de momentum alcista.', signal: 'bearish', candles: 2 },
  { key: 'DARK_CLOUD_COVER', name: 'Cubierta de Nube Oscura', nameEn: 'Dark Cloud Cover', description: 'Roja cierra debajo del 50% de la verde anterior.', signal: 'bearish', candles: 2 },
  { key: 'TWEEZER_TOP', name: 'Pinzas de Techo', nameEn: 'Tweezer Top', description: 'Dos velas con máximos iguales. Doble rechazo de resistencia.', signal: 'bearish', candles: 2 },
  
  // Alcistas 3 velas
  { key: 'MORNING_STAR', name: 'Estrella de la Mañana', nameEn: 'Morning Star', description: 'Roja + pequeña con gap + verde. Cambio de tendencia.', signal: 'bullish', candles: 3 },
  { key: 'THREE_WHITE_SOLDIERS', name: 'Tres Soldados Blancos', nameEn: 'Three White Soldiers', description: 'Tres verdes consecutivas ascendentes. Presión compradora.', signal: 'bullish', candles: 3 },
  
  // Bajistas 3 velas
  { key: 'EVENING_STAR', name: 'Estrella de la Tarde', nameEn: 'Evening Star', description: 'Verde + pequeña con gap + roja. Cambio de tendencia.', signal: 'bearish', candles: 3 },
  { key: 'THREE_BLACK_CROWS', name: 'Tres Cuervos Negros', nameEn: 'Three Black Crows', description: 'Tres rojas consecutivas descendentes. Presión vendedora.', signal: 'bearish', candles: 3 },
];

/**
 * Función de utilidad para normalizar nombres de patrones
 */
export function normalizePatternName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '_')
    .replace(/_DE_LA_/g, '_')
    .replace(/_DE_/g, '_')
    .replace(/_LA_/g, '_');
}

/**
 * Obtiene el SVG de un patrón por nombre
 */
export function getPatternSVG(name: string): string | null {
  const normalized = normalizePatternName(name);
  
  // Buscar coincidencia exacta
  if (PATTERN_SVGS[normalized]) {
    return PATTERN_SVGS[normalized];
  }
  
  // Buscar en claves normalizadas, priorizando las más largas
  const normalizedKeyMap: Record<string, string> = {};
  for (const key of Object.keys(PATTERN_SVGS)) {
    normalizedKeyMap[normalizePatternName(key)] = key;
  }
  
  if (normalizedKeyMap[normalized]) {
    return PATTERN_SVGS[normalizedKeyMap[normalized]];
  }
  
  // Buscar coincidencia parcial
  const sortedKeys = Object.keys(normalizedKeyMap).sort((a, b) => b.length - a.length);
  for (const normKey of sortedKeys) {
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      return PATTERN_SVGS[normalizedKeyMap[normKey]];
    }
  }
  
  return null;
}
