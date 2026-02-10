"""Test del análisis técnico basado en Murphy/Dow Theory"""
from analysis.technical import full_analysis
from data.binance_provider import BinanceProvider
import asyncio
import pandas as pd

async def test():
    provider = BinanceProvider()
    # Obtener datos de Bitcoin - get_klines ya devuelve un DataFrame con columnas capitalizadas
    df = await provider.get_klines('BTCUSDT', '1d', limit=200)
    
    # Normalizar nombres de columnas a minúsculas
    df.columns = [col.lower() for col in df.columns]
    
    # Agregar timestamp desde el índice
    df = df.reset_index()
    df = df.rename(columns={'Date': 'timestamp'})
    
    print(f"DataFrame shape: {df.shape}")
    print(f"Columnas: {df.columns.tolist()}")
    print(f"Último close: {df['close'].iloc[-1]:.2f}")
    print()
    
    await provider.close()
    
    # Realizar análisis
    result = full_analysis(df, 'BTCUSDT', '1d')
    
    print('='*60)
    print('ANALISIS TECNICO - BTCUSDT (Murphy/Dow Theory)')
    print('='*60)
    print(f'Precio: ${result.current_price:.2f}')
    print(f'Tendencia: {result.trend} (Fuerza: {result.trend_strength:.0f}%)')
    print(f'Senal: {result.overall_signal.value}')
    print()
    print('--- DETALLES DOW THEORY ---')
    dow = result.trend_details.get('dow_theory', {})
    print(f'Patron: {dow.get("pattern", "N/A")}')
    print(f'Higher Highs: {dow.get("higher_highs", 0)} | Lower Highs: {dow.get("lower_highs", 0)}')
    print(f'Higher Lows: {dow.get("higher_lows", 0)} | Lower Lows: {dow.get("lower_lows", 0)}')
    print()
    print('--- VOLUMEN ---')
    vol = result.trend_details.get('volume_analysis', {})
    print(f'Confirma: {vol.get("confirms", "N/A")}')
    print(f'Mensaje: {vol.get("message", "N/A")}')
    print()
    print('--- FACTORES ALCISTAS ---')
    for f in result.trend_details.get('bullish_factors', []):
        print(f'  {f}')
    print()
    print('--- FACTORES BAJISTAS ---')
    for f in result.trend_details.get('bearish_factors', []):
        print(f'  {f}')
    print()
    print('--- RECOMENDACIONES ---')
    for r in result.recommendations:
        print(f'  {r}')

if __name__ == '__main__':
    asyncio.run(test())
