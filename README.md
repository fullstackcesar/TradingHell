# 🔥 TradingHell

Asistente inteligente de trading con análisis técnico automático y sistema RAG para aprender trading de forma intuitiva.

![Trading Dashboard](https://via.placeholder.com/800x400/1a1a2e/22c55e?text=TradingHell+Dashboard)

## ✨ Características

- 📊 **Gráficos de velas** interactivos con TradingView Lightweight Charts
- 🤖 **Asistente RAG** que explica conceptos de trading en lenguaje natural
- 📈 **Análisis técnico automático** con indicadores (RSI, MACD, Bollinger, etc.)
- 🕯️ **Detección de patrones de velas** (Martillo, Envolvente, Doji, etc.)
- 🎯 **Señales de compra/venta** con recomendaciones claras
- 💡 **Base de conocimiento** sobre trading para principiantes
- 🌍 **Múltiples mercados**: Acciones USA, España, Forex y Criptomonedas

## 🛠️ Tecnologías

### Backend
- **Python 3.11+**
- **FastAPI** - API REST moderna
- **LangChain** - Framework RAG
- **pandas-ta** - Análisis técnico
- **yfinance** - Datos de mercado
- **ChromaDB** - Base de datos vectorial

### Frontend
- **Angular 19/21** con Signals y Resource API
- **TailwindCSS** - Estilos
- **TradingView Lightweight Charts** - Gráficos

## 🚀 Instalación

### Requisitos previos
- Python 3.11+
- Node.js 20+
- (Opcional) API Key de OpenAI para el asistente RAG

### 1. Clonar el proyecto

```bash
git clone https://github.com/tuusuario/TradingHell.git
cd TradingHell
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Activar entorno (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
# Copiar el ejemplo
copy .env.example .env

# Editar .env y añadir tu API key de OpenAI
# OPENAI_API_KEY=sk-...
```

> ⚠️ Sin la API key de OpenAI, el asistente RAG no funcionará. 
> Pero el análisis técnico y los gráficos sí funcionarán.

### 4. Iniciar el Backend

```bash
python main.py
```

El backend estará en: http://localhost:8000
Documentación API: http://localhost:8000/docs

### 5. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

El frontend estará en: http://localhost:4200

## 📖 Uso

### Dashboard principal

1. **Selecciona un símbolo** de la lista o escribe uno nuevo
2. **Elige el timeframe** (1h, 4h, 1d, 1sem, 1mes)
3. **Observa el análisis** automático en el panel derecho
4. **Pregunta al asistente** cualquier duda sobre trading

### Símbolos soportados

| Mercado | Ejemplos |
|---------|----------|
| 🇺🇸 Acciones USA | AAPL, MSFT, TSLA, GOOGL, NVDA |
| 🇪🇸 Acciones España | SANTANDER, BBVA, IBERDROLA, TELEFONICA |
| 💱 Forex | EURUSD, GBPUSD, USDJPY |
| ₿ Crypto | BTC, ETH |

### API Endpoints

```
GET  /api/chart/{symbol}     - Datos de velas
GET  /api/analyze/{symbol}   - Análisis técnico completo
POST /api/ask                - Pregunta al RAG
GET  /api/ticker/{symbol}    - Info del activo
POST /api/smart-analysis     - Análisis + explicación RAG
```

## 🧠 Base de conocimiento RAG

El asistente incluye conocimiento sobre:

- **Patrones de velas**: Martillo, Envolvente, Doji, Estrella, etc.
- **Indicadores técnicos**: RSI, MACD, Bollinger, Estocástico, ADX
- **Soportes y resistencias**: Cómo identificarlos y usarlos
- **Volumen**: Interpretación y confirmación
- **Gestión del riesgo**: Stop loss, sizing, ratio riesgo/beneficio
- **Mercados**: Características de acciones, forex y crypto

## 📊 Indicadores incluidos

| Indicador | Descripción |
|-----------|-------------|
| RSI | Índice de Fuerza Relativa (sobrecompra/sobreventa) |
| MACD | Convergencia/Divergencia de medias móviles |
| Bollinger | Bandas de volatilidad |
| SMA/EMA | Medias móviles simples y exponenciales |
| Estocástico | Oscilador de momentum |
| ADX | Fuerza de la tendencia |
| ATR | Volatilidad media |
| OBV | Volumen acumulado |

## ⚠️ Disclaimer

**IMPORTANTE**: Esta aplicación es solo para fines educativos.

- No es consejo financiero
- El trading conlleva riesgos de pérdida de capital
- Los resultados pasados no garantizan resultados futuros
- Opera bajo tu propio riesgo

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE)

---

Hecho con 🔥 y ☕
