"""Verificar tipo de contenido del PDF"""
import fitz

pdf_path = r'd:\GitHub\TradingHell\pdfs\Análisis_técnico_de_los_mercados.pdf'
doc = fitz.open(pdf_path)

for page_num in [5, 10, 50, 100]:
    page = doc[page_num]
    images = page.get_images()
    text = page.get_text()
    print(f'Página {page_num}: {len(images)} imágenes, {len(text)} chars texto')
    if text:
        print(f'  Muestra: {text[:100]}...')
