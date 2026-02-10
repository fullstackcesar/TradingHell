# Patrones de Velas Japonesas - Guía Completa

Basado en la metodología de análisis técnico de velas japonesas. Los patrones se clasifican por número de velas y señal (alcista/bajista).

## Anatomía de una Vela

```
VELA ALCISTA (verde)         VELA BAJISTA (roja)
     High                         High
      │                            │
      │ Upper Wick                 │ Upper Wick
      │                            │
    ┌─┴─┐ Close                  ┌─┴─┐ Open
    │███│                        │░░░│
    │███│ Real Body              │░░░│ Real Body
    │███│                        │░░░│
    └─┬─┘ Open                   └─┬─┘ Close
      │                            │
      │ Lower Wick                 │ Lower Wick
      │                            │
     Low                          Low
```

---

## Patrones Neutrales (Indecisión)

### Doji
```
    │
   ─┼─
    │
```
**Señal:** NEUTRAL - Indecisión total del mercado
**Descripción:** Apertura y cierre prácticamente iguales. El mercado no sabe hacia dónde ir.
**Contexto:** Importante en zonas de soporte/resistencia. Requiere confirmación.

### Long-Legged Doji (Doji de Piernas Largas)
```
    │
    │
   ─┼─
    │
    │
```
**Señal:** NEUTRAL - Alta volatilidad con indecisión
**Descripción:** Mechas muy largas arriba y abajo con cuerpo mínimo. Batalla intensa entre compradores y vendedores.
**Contexto:** Posible punto de inflexión. Esperar confirmación.

### Spinning Top (Peonza)
```
    │
   ┌┴┐
   │█│
   └┬┘
    │
```
**Señal:** NEUTRAL - Indecisión moderada
**Descripción:** Cuerpo pequeño con mechas similares. Menor indecisión que el Doji.
**Contexto:** Si aparece tras tendencia fuerte, puede indicar agotamiento.

---

## Patrones de Una Vela (Single Candlestick)

### ALCISTAS (Bullish)

#### Hammer (Martillo)
```
   ┌─┐
   │█│
   └┬┘
    │
    │
    │
```
**Señal:** ALCISTA - Reversión de tendencia bajista
**Descripción:** Cuerpo pequeño arriba, mecha inferior larga (2-3x el cuerpo), sin/poca mecha superior.
**Contexto:** SOLO válido tras tendencia BAJISTA. Los vendedores empujaron pero los compradores recuperaron.
**Fiabilidad:** ⭐⭐⭐⭐ Alta (requiere confirmación)

#### Inverted Hammer (Martillo Invertido)
```
    │
    │
    │
   ┌┴┐
   │█│
   └─┘
```
**Señal:** ALCISTA - Posible reversión
**Descripción:** Cuerpo pequeño abajo, mecha superior larga, sin/poca mecha inferior.
**Contexto:** Tras tendencia bajista. Los compradores intentaron subir pero no mantuvieron. Necesita confirmación fuerte.
**Fiabilidad:** ⭐⭐⭐ Media

#### Dragonfly Doji (Doji Libélula)
```
   ─┬─
    │
    │
    │
```
**Señal:** ALCISTA - Fuerte rechazo de precios bajos
**Descripción:** Como un Doji pero solo con mecha inferior larga.
**Contexto:** Tras tendencia bajista indica fuerte rechazo. Compradores tomaron control.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Bullish Spinning Top (Peonza Alcista)
```
    │
   ┌┴┐
   │█│ (verde)
   └┬┘
    │
```
**Señal:** ALCISTA débil
**Descripción:** Peonza con cierre ligeramente superior a apertura.
**Contexto:** Por sí sola no es señal fuerte. Buscar confirmación.
**Fiabilidad:** ⭐⭐ Baja

#### Bullish Marubozu (Marubozu Alcista)
```
   ┌───┐
   │███│
   │███│
   │███│
   │███│
   └───┘
```
**Señal:** ALCISTA FUERTE - Dominio total de compradores
**Descripción:** Cuerpo largo verde SIN mechas. Abre en mínimo, cierra en máximo.
**Contexto:** Señal de fuerza extrema. Continuación o inicio de tendencia alcista.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

---

### BAJISTAS (Bearish)

#### Shooting Star (Estrella Fugaz)
```
    │
    │
    │
   ┌┴┐
   │░│
   └─┘
```
**Señal:** BAJISTA - Reversión de tendencia alcista
**Descripción:** Cuerpo pequeño abajo, mecha superior larga (2-3x cuerpo), sin/poca mecha inferior.
**Contexto:** SOLO válido tras tendencia ALCISTA. Compradores empujaron pero vendedores rechazaron.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Hanging Man (Hombre Colgado)
```
   ┌─┐
   │░│
   └┬┘
    │
    │
    │
```
**Señal:** BAJISTA - Posible reversión
**Descripción:** Idéntico al Martillo pero tras tendencia ALCISTA.
**Contexto:** Indica que vendedores están ganando fuerza. Necesita confirmación.
**Fiabilidad:** ⭐⭐⭐ Media

#### Gravestone Doji (Doji Lápida)
```
    │
    │
    │
   ─┴─
```
**Señal:** BAJISTA - Fuerte rechazo de precios altos
**Descripción:** Doji solo con mecha superior larga.
**Contexto:** Tras tendencia alcista indica rechazo fuerte. Vendedores tomaron control.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Bearish Spinning Top (Peonza Bajista)
```
    │
   ┌┴┐
   │░│ (roja)
   └┬┘
    │
```
**Señal:** BAJISTA débil
**Descripción:** Peonza con cierre ligeramente inferior a apertura.
**Contexto:** Señal muy débil por sí sola.
**Fiabilidad:** ⭐⭐ Baja

#### Bearish Marubozu (Marubozu Bajista)
```
   ┌───┐
   │░░░│
   │░░░│
   │░░░│
   │░░░│
   └───┘
```
**Señal:** BAJISTA FUERTE - Dominio total de vendedores
**Descripción:** Cuerpo largo rojo SIN mechas. Abre en máximo, cierra en mínimo.
**Contexto:** Señal de debilidad extrema. Continuación o inicio de tendencia bajista.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

---

## Patrones de Dos Velas (Double Candlestick)

### ALCISTAS (Bullish)

#### Bullish Kicker (Patada Alcista)
```
   │      ┌───┐
  ┌┴┐     │███│
  │░│     │███│
  │░│     │███│
  └─┘     └─┬─┘
            │
```
**Señal:** ALCISTA MUY FUERTE - Una de las señales más potentes
**Descripción:** Vela bajista seguida de vela alcista con gap alcista (abre por encima del cierre anterior).
**Contexto:** Cambio drástico de sentimiento. Los vendedores fueron "pateados" fuera.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Bullish Engulfing (Envolvente Alcista)
```
         ┌───┐
   ┌─┐   │███│
   │░│   │███│
   └─┘   │███│
         └───┘
```
**Señal:** ALCISTA FUERTE - Reversión
**Descripción:** Vela bajista pequeña seguida de vela alcista grande que "envuelve" completamente a la anterior.
**Contexto:** Tras tendencia bajista. Los compradores superaron totalmente a vendedores.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Bullish Harami (Harami Alcista)
```
  ┌───┐
  │░░░│  ┌─┐
  │░░░│  │█│
  │░░░│  └─┘
  └───┘
```
**Señal:** ALCISTA - Posible reversión
**Descripción:** Vela bajista grande seguida de vela alcista pequeña contenida dentro del cuerpo anterior.
**Contexto:** "Harami" significa "embarazada" en japonés. Indica pérdida de momentum bajista.
**Fiabilidad:** ⭐⭐⭐ Media (requiere confirmación)

#### Piercing Line (Línea Penetrante)
```
  ┌───┐
  │░░░│  ┌─┐
  │░░░│  │█│
  │░░░│  │█│
  └───┘  │█│
         └─┘
```
**Señal:** ALCISTA - Reversión
**Descripción:** Vela bajista seguida de alcista que abre por debajo del mínimo pero cierra por encima del 50% del cuerpo anterior.
**Contexto:** Los compradores "penetran" territorio bajista. Cuanto más alto el cierre, más fuerte.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Tweezer Bottom (Pinza Inferior)
```
   ┌─┐    ┌─┐
   │░│    │█│
   └┬┘    └┬┘
    │      │
    └──────┘ (mismo mínimo)
```
**Señal:** ALCISTA - Soporte fuerte
**Descripción:** Dos velas (bajista + alcista) con el MISMO mínimo exacto.
**Contexto:** El mercado rechazó ese nivel dos veces. Soporte confirmado.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

---

### BAJISTAS (Bearish)

#### Bearish Kicker (Patada Bajista)
```
            │
   ┌───┐   ┌┴┐
   │███│   │░│
   │███│   │░│
   │███│   │░│
   └─┬─┘   └─┘
     │
```
**Señal:** BAJISTA MUY FUERTE
**Descripción:** Vela alcista seguida de bajista con gap bajista.
**Contexto:** Cambio drástico. Compradores "pateados" fuera del mercado.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Bearish Engulfing (Envolvente Bajista)
```
         ┌───┐
   ┌─┐   │░░░│
   │█│   │░░░│
   └─┘   │░░░│
         └───┘
```
**Señal:** BAJISTA FUERTE - Reversión
**Descripción:** Vela alcista pequeña seguida de bajista grande que la envuelve.
**Contexto:** Tras tendencia alcista. Vendedores dominaron completamente.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Bearish Harami (Harami Bajista)
```
  ┌───┐
  │███│  ┌─┐
  │███│  │░│
  │███│  └─┘
  └───┘
```
**Señal:** BAJISTA - Posible reversión
**Descripción:** Vela alcista grande seguida de bajista pequeña dentro del cuerpo.
**Contexto:** Pérdida de momentum alcista.
**Fiabilidad:** ⭐⭐⭐ Media

#### Dark Cloud Cover (Nube Oscura)
```
         ┌─┐
   ┌───┐ │░│
   │███│ │░│
   │███│ │░│
   │███│ └─┘
   └───┘
```
**Señal:** BAJISTA - Reversión
**Descripción:** Vela alcista seguida de bajista que abre por encima del máximo pero cierra por debajo del 50% del cuerpo.
**Contexto:** Los vendedores "cubren" con una nube oscura. Opuesto a Piercing Line.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

#### Tweezer Top (Pinza Superior)
```
    ┌──────┐ (mismo máximo)
    │      │
   ┌┴┐    ┌┴┐
   │█│    │░│
   └─┘    └─┘
```
**Señal:** BAJISTA - Resistencia fuerte
**Descripción:** Dos velas con el MISMO máximo exacto.
**Contexto:** El mercado rechazó ese nivel dos veces. Resistencia confirmada.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

---

## Patrones de Tres Velas (Triple Candlestick)

### ALCISTAS (Bullish)

#### Morning Star (Estrella de la Mañana)
```
  ┌───┐         ┌───┐
  │░░░│  ┌─┐    │███│
  │░░░│  │ │    │███│
  │░░░│  └─┘    │███│
  └───┘         └───┘
```
**Señal:** ALCISTA FUERTE - Reversión clásica
**Descripción:** Bajista grande + Cuerpo pequeño (gap abajo) + Alcista grande
**Contexto:** La "estrella" (vela pequeña) indica indecisión antes del giro. Patrón muy respetado.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Morning Doji Star (Estrella Doji de la Mañana)
```
  ┌───┐         ┌───┐
  │░░░│   │     │███│
  │░░░│  ─┼─    │███│
  │░░░│   │     │███│
  └───┘         └───┘
```
**Señal:** ALCISTA MUY FUERTE
**Descripción:** Como Morning Star pero la vela central es un Doji.
**Contexto:** El Doji indica indecisión extrema antes del giro. Más potente que Morning Star normal.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Bullish Abandoned Baby (Bebé Abandonado Alcista)
```
  ┌───┐         ┌───┐
  │░░░│         │███│
  │░░░│   │     │███│
  │░░░│  ─┼─    │███│
  └───┘   │     └───┘
      gap↑ ↑gap
```
**Señal:** ALCISTA MUY FUERTE - Raro pero potente
**Descripción:** Morning Doji Star con GAPS en ambos lados del Doji.
**Contexto:** El Doji queda "abandonado" entre gaps. Señal de reversión muy rara y muy fuerte.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Extrema (muy raro)

#### Three White Soldiers (Tres Soldados Blancos)
```
            ┌───┐
       ┌───┐│███│
  ┌───┐│███││███│
  │███││███││███│
  │███││███│└───┘
  │███│└───┘
  └───┘
```
**Señal:** ALCISTA FUERTE - Continuación/Reversión
**Descripción:** Tres velas alcistas consecutivas, cada una abriendo dentro del cuerpo anterior y cerrando más alto.
**Contexto:** Dominio total de compradores. Cuidado si velas son muy largas (posible agotamiento).
**Fiabilidad:** ⭐⭐⭐⭐ Alta

---

### BAJISTAS (Bearish)

#### Evening Star (Estrella de la Tarde)
```
            ┌─┐
  ┌───┐     │ │    ┌───┐
  │███│     └─┘    │░░░│
  │███│            │░░░│
  │███│            │░░░│
  └───┘            └───┘
```
**Señal:** BAJISTA FUERTE - Reversión clásica
**Descripción:** Alcista grande + Cuerpo pequeño (gap arriba) + Bajista grande
**Contexto:** Opuesto a Morning Star. La estrella prevé el fin de la tendencia alcista.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Evening Doji Star (Estrella Doji de la Tarde)
```
             │
  ┌───┐     ─┼─    ┌───┐
  │███│      │     │░░░│
  │███│            │░░░│
  │███│            │░░░│
  └───┘            └───┘
```
**Señal:** BAJISTA MUY FUERTE
**Descripción:** Evening Star con Doji central.
**Contexto:** Indecisión extrema en el tope. Más potente que Evening Star normal.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

#### Bearish Abandoned Baby (Bebé Abandonado Bajista)
```
             │
  ┌───┐     ─┼─    ┌───┐
  │███│      │     │░░░│
  │███│  gap↑ ↑gap │░░░│
  │███│            │░░░│
  └───┘            └───┘
```
**Señal:** BAJISTA MUY FUERTE
**Descripción:** Evening Doji Star con gaps en ambos lados.
**Contexto:** Señal muy rara y muy potente de reversión bajista.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Extrema

#### Three Black Crows (Tres Cuervos Negros)
```
  ┌───┐
  │░░░│┌───┐
  │░░░││░░░│┌───┐
  │░░░││░░░││░░░│
  └───┘│░░░││░░░│
       └───┘│░░░│
            └───┘
```
**Señal:** BAJISTA FUERTE - Continuación/Reversión
**Descripción:** Tres velas bajistas consecutivas, cada una abriendo dentro del cuerpo anterior y cerrando más bajo.
**Contexto:** Dominio total de vendedores. Opuesto a Three White Soldiers.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

---

## Patrones de Confirmación

### Three Inside Up (Tres Dentro Arriba)
```
  ┌───┐
  │░░░│  ┌─┐   ┌───┐
  │░░░│  │█│   │███│
  │░░░│  └─┘   │███│
  └───┘        └───┘
```
**Señal:** ALCISTA - Confirmación de Harami
**Descripción:** Harami Alcista + Tercera vela alcista que cierra por encima del máximo de la primera.
**Contexto:** La tercera vela CONFIRMA la reversión sugerida por el Harami.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

### Three Outside Up (Tres Fuera Arriba)
```
         ┌───┐
   ┌─┐   │███│  ┌───┐
   │░│   │███│  │███│
   └─┘   │███│  │███│
         └───┘  └───┘
```
**Señal:** ALCISTA - Confirmación de Engulfing
**Descripción:** Engulfing Alcista + Tercera vela alcista.
**Contexto:** Confirma la fuerza del Engulfing. Señal muy confiable.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

### Three Inside Down (Tres Dentro Abajo)
```
  ┌───┐
  │███│  ┌─┐   ┌───┐
  │███│  │░│   │░░░│
  │███│  └─┘   │░░░│
  └───┘        └───┘
```
**Señal:** BAJISTA - Confirmación de Harami
**Descripción:** Harami Bajista + Tercera vela bajista confirmando.
**Contexto:** Similar a Three Inside Up pero en dirección bajista.
**Fiabilidad:** ⭐⭐⭐⭐ Alta

### Three Outside Down (Tres Fuera Abajo)
```
         ┌───┐
   ┌─┐   │░░░│  ┌───┐
   │█│   │░░░│  │░░░│
   └─┘   │░░░│  │░░░│
         └───┘  └───┘
```
**Señal:** BAJISTA - Confirmación de Engulfing
**Descripción:** Engulfing Bajista + Tercera vela bajista.
**Contexto:** Confirmación muy fuerte de reversión bajista.
**Fiabilidad:** ⭐⭐⭐⭐⭐ Muy alta

---

## Reglas de Oro para Patrones de Velas

1. **CONTEXTO ES REY**: Un martillo solo es válido tras tendencia bajista. Sin contexto, no hay señal.

2. **CONFIRMACIÓN**: Espera la siguiente vela para confirmar, especialmente en patrones débiles.

3. **VOLUMEN**: Mayor volumen = Mayor fiabilidad del patrón.

4. **TIMEFRAME**: Patrones en gráficos 4H, Diario, Semanal son más confiables que en minutos.

5. **SOPORTE/RESISTENCIA**: Patrones en niveles clave son más potentes.

6. **NO OPERES SOLO POR EL PATRÓN**: Usa indicadores adicionales (RSI, MACD, Volumen) para confirmar.

7. **GESTIÓN DE RIESGO**: Siempre define tu Stop Loss ANTES de entrar, independientemente de lo "bonito" que sea el patrón.

---

## Tabla Resumen de Fiabilidad

| Patrón | Tipo | Señal | Fiabilidad |
|--------|------|-------|------------|
| Bullish/Bearish Kicker | 2 velas | Reversión | ⭐⭐⭐⭐⭐ |
| Abandoned Baby | 3 velas | Reversión | ⭐⭐⭐⭐⭐ |
| Morning/Evening Star | 3 velas | Reversión | ⭐⭐⭐⭐⭐ |
| Three Outside Up/Down | 3 velas | Confirmación | ⭐⭐⭐⭐⭐ |
| Engulfing | 2 velas | Reversión | ⭐⭐⭐⭐ |
| Marubozu | 1 vela | Continuación | ⭐⭐⭐⭐ |
| Hammer/Shooting Star | 1 vela | Reversión | ⭐⭐⭐⭐ |
| Piercing/Dark Cloud | 2 velas | Reversión | ⭐⭐⭐⭐ |
| Tweezer Top/Bottom | 2 velas | Reversión | ⭐⭐⭐⭐ |
| Harami | 2 velas | Reversión | ⭐⭐⭐ |
| Doji | 1 vela | Indecisión | ⭐⭐⭐ |
| Spinning Top | 1 vela | Indecisión | ⭐⭐ |

---

*Fuente visual: ChartGuys.com Candlestick Patterns Cheat Sheet*
