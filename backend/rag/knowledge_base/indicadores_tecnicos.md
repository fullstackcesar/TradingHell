# Indicadores Técnicos

Los indicadores técnicos son fórmulas matemáticas que analizan el precio y/o volumen para predecir movimientos futuros.

---

## INDICADORES DE TENDENCIA

### 1. Medias Móviles (Moving Averages)

#### Media Móvil Simple (SMA)
- **Qué es**: Promedio del precio de los últimos N períodos
- **Uso común**: SMA 20 (corto plazo), SMA 50 (medio plazo), SMA 200 (largo plazo)
- **Cómo interpretarlo**:
  - Precio ENCIMA de la SMA → Tendencia ALCISTA
  - Precio DEBAJO de la SMA → Tendencia BAJISTA
- **Señales**:
  - **COMPRA**: Precio cruza SMA hacia arriba
  - **VENTA**: Precio cruza SMA hacia abajo
  - **Golden Cross** (SMA 50 cruza SMA 200 hacia arriba) → Señal ALCISTA fuerte
  - **Death Cross** (SMA 50 cruza SMA 200 hacia abajo) → Señal BAJISTA fuerte

#### Media Móvil Exponencial (EMA)
- **Qué es**: Como la SMA pero da más peso a precios recientes
- **Uso común**: EMA 9, EMA 21, EMA 55
- **Ventaja**: Reacciona más rápido a cambios de precio
- **Desventaja**: Más señales falsas que la SMA

### 2. MACD (Moving Average Convergence Divergence)

- **Qué es**: Diferencia entre EMA 12 y EMA 26, más una línea de señal (EMA 9 del MACD)
- **Componentes**:
  - **Línea MACD**: EMA(12) - EMA(26)
  - **Línea de Señal**: EMA(9) del MACD
  - **Histograma**: MACD - Señal
- **Cómo interpretarlo**:
  - MACD > 0 → Tendencia ALCISTA
  - MACD < 0 → Tendencia BAJISTA
- **Señales**:
  - **COMPRA**: MACD cruza línea de señal hacia arriba
  - **VENTA**: MACD cruza línea de señal hacia abajo
  - **Divergencia alcista**: Precio hace mínimos más bajos pero MACD hace mínimos más altos → COMPRA
  - **Divergencia bajista**: Precio hace máximos más altos pero MACD hace máximos más bajos → VENTA
- **Fiabilidad**: ⭐⭐⭐⭐ (muy usado, funciona bien en tendencias)

### 3. ADX (Average Directional Index)

- **Qué es**: Mide la FUERZA de la tendencia (no la dirección)
- **Rango**: 0 a 100
- **Cómo interpretarlo**:
  - ADX < 20 → NO hay tendencia (mercado lateral)
  - ADX 20-25 → Tendencia débil
  - ADX 25-50 → Tendencia fuerte
  - ADX 50-75 → Tendencia muy fuerte
  - ADX > 75 → Tendencia extrema (raro)
- **Uso**: Confirmar si vale la pena seguir la tendencia
- **Señal**: Solo operar cuando ADX > 25

---

## INDICADORES DE MOMENTUM (Sobrecompra/Sobreventa)

### 1. RSI (Relative Strength Index) ⭐ MUY IMPORTANTE

- **Qué es**: Mide la velocidad y magnitud de los cambios de precio
- **Rango**: 0 a 100
- **Configuración típica**: RSI de 14 períodos
- **Zonas clave**:
  - RSI > 70 → **SOBRECOMPRA** (precio puede bajar)
  - RSI < 30 → **SOBREVENTA** (precio puede subir)
  - RSI 30-70 → Zona neutral
- **Señales**:
  - **COMPRA**: RSI sale de zona de sobreventa (cruza 30 hacia arriba)
  - **VENTA**: RSI sale de zona de sobrecompra (cruza 70 hacia abajo)
  - **Divergencia alcista**: Precio baja pero RSI sube → COMPRA
  - **Divergencia bajista**: Precio sube pero RSI baja → VENTA
- **Fiabilidad**: ⭐⭐⭐⭐⭐ (muy fiable, uno de los mejores indicadores)
- **Truco**: En tendencias fuertes alcistas, RSI puede estar en 70-80 mucho tiempo (no vender solo por eso)

### 2. Estocástico (Stochastic Oscillator)

- **Qué es**: Compara el precio de cierre con el rango de precios en N períodos
- **Componentes**:
  - **%K**: Línea rápida (más sensible)
  - **%D**: Línea lenta (media de %K)
- **Rango**: 0 a 100
- **Zonas clave**:
  - > 80 → **SOBRECOMPRA**
  - < 20 → **SOBREVENTA**
- **Señales**:
  - **COMPRA**: %K cruza %D hacia arriba en zona de sobreventa
  - **VENTA**: %K cruza %D hacia abajo en zona de sobrecompra
- **Fiabilidad**: ⭐⭐⭐⭐ (mejor en mercados laterales)

### 3. CCI (Commodity Channel Index)

- **Qué es**: Mide la desviación del precio respecto a su media
- **Rango**: -∞ a +∞ (típicamente -200 a +200)
- **Zonas clave**:
  - CCI > +100 → **SOBRECOMPRA**
  - CCI < -100 → **SOBREVENTA**
- **Señales**:
  - **COMPRA**: CCI cruza -100 hacia arriba
  - **VENTA**: CCI cruza +100 hacia abajo
- **Fiabilidad**: ⭐⭐⭐ (útil como confirmación)

---

## INDICADORES DE VOLATILIDAD

### 1. Bandas de Bollinger ⭐ MUY IMPORTANTE

- **Qué es**: 3 líneas basadas en SMA y desviación estándar
- **Componentes**:
  - **Banda superior**: SMA(20) + 2 × Desviación estándar
  - **Banda media**: SMA(20)
  - **Banda inferior**: SMA(20) - 2 × Desviación estándar
- **Cómo interpretarlo**:
  - Bandas ESTRECHAS → Baja volatilidad, posible movimiento fuerte próximo (squeeze)
  - Bandas ANCHAS → Alta volatilidad
  - Precio toca banda superior → Posible SOBRECOMPRA
  - Precio toca banda inferior → Posible SOBREVENTA
- **Señales**:
  - **COMPRA**: Precio rebota en banda inferior
  - **VENTA**: Precio rebota en banda superior
  - **Squeeze + ruptura arriba** → COMPRA fuerte
  - **Squeeze + ruptura abajo** → VENTA fuerte
- **Fiabilidad**: ⭐⭐⭐⭐⭐ (excelente para detectar momentos de entrada)

### 2. ATR (Average True Range)

- **Qué es**: Mide la volatilidad media del precio
- **Uso**: 
  - Calcular niveles de Stop Loss (ej: 2 × ATR debajo del precio)
  - Determinar tamaño de posición
- **Cómo interpretarlo**:
  - ATR alto → Alta volatilidad (más riesgo, más oportunidad)
  - ATR bajo → Baja volatilidad (menos movimiento)
- **NO da señales de compra/venta**, pero es esencial para gestión del riesgo

---

## INDICADORES DE VOLUMEN

### 1. OBV (On Balance Volume)

- **Qué es**: Suma/resta el volumen según si el precio subió o bajó
- **Cómo interpretarlo**:
  - OBV sube → Presión compradora
  - OBV baja → Presión vendedora
- **Señales**:
  - **COMPRA**: OBV sube mientras precio lateral o baja (acumulación)
  - **VENTA**: OBV baja mientras precio lateral o sube (distribución)
- **Fiabilidad**: ⭐⭐⭐⭐ (detecta movimientos antes de que ocurran)

### 2. Volume Profile

- **Qué es**: Muestra el volumen operado en cada nivel de precio
- **Conceptos clave**:
  - **POC (Point of Control)**: Precio con más volumen → Actúa como imán
  - **Value Area**: Rango donde se operó el 70% del volumen
- **Uso**: Identificar soportes y resistencias basados en volumen

---

## Combinaciones recomendadas de indicadores

### Para TENDENCIAS:
1. EMA 20 + EMA 50 (cruces)
2. MACD (confirmación)
3. ADX > 25 (fuerza de tendencia)

### Para REVERSIONES:
1. RSI (sobrecompra/sobreventa)
2. Bandas de Bollinger (toques de bandas)
3. Patrones de velas (confirmación visual)

### Para MERCADOS LATERALES:
1. Estocástico
2. Bandas de Bollinger
3. Soportes y resistencias

---

## Reglas de oro para indicadores

1. **No uses más de 3-4 indicadores** → Muchos indicadores = parálisis por análisis
2. **Combina indicadores de diferentes tipos** → No uses 3 indicadores de momentum
3. **Busca confluencia** → Cuando varios indicadores dan la misma señal, la probabilidad aumenta
4. **Los indicadores se retrasan** → Son reactivos, no predictivos
5. **Divergencias son muy fiables** → Cuando precio e indicador no coinciden, el indicador suele tener razón
