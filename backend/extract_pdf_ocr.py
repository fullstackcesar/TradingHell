"""Script para extraer texto del PDF de Murphy usando OCR - VERSIÓN MEJORADA"""
import fitz  # PyMuPDF
import easyocr
from pathlib import Path
import sys
import io
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

pdf_path = r'd:\GitHub\TradingHell\pdfs\Análisis_técnico_de_los_mercados.pdf'
output_dir = Path(r'd:\GitHub\TradingHell\backend\rag\knowledge_base')
output_file = output_dir / 'murphy_analisis_tecnico.md'

def preprocess_image(img):
    """Preprocesar imagen para mejorar OCR"""
    # Convertir a escala de grises
    img = img.convert('L')
    
    # Aumentar contraste
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # Aumentar nitidez
    img = img.filter(ImageFilter.SHARPEN)
    
    # Binarización simple (umbral)
    img = img.point(lambda x: 0 if x < 140 else 255)
    
    # Convertir de vuelta a RGB para easyocr
    img = img.convert('RGB')
    return img

# Detectar desde qué página continuar (resume mode)
start_page = 0
if output_file.exists():
    with open(output_file, 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        pages = re.findall(r'## Pagina (\d+)', content)
        if pages:
            start_page = int(pages[-1])
            print(f"Continuando desde pagina {start_page + 1}...")
            sys.stdout.flush()

# Inicializar OCR (español)
print("Inicializando OCR...")
sys.stdout.flush()
reader = easyocr.Reader(['es'], gpu=False)

doc = fitz.open(pdf_path)
total_pages = len(doc)
print(f'Total paginas: {total_pages}, procesando desde {start_page + 1}')
sys.stdout.flush()

# Crear archivo con header solo si empezamos desde cero
if start_page == 0:
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('# Analisis Tecnico de los Mercados Financieros - John J. Murphy\n\n')
        f.write('> Libro clasico de referencia en analisis tecnico.\n')
        f.write('> Texto extraido mediante OCR.\n\n')

total_chars = 0
for i in range(start_page, total_pages):
    try:
        page = doc[i]
        
        # Convertir página a imagen con ALTA resolución (300 dpi)
        pix = page.get_pixmap(dpi=300)
        img_data = pix.tobytes("png")
        
        # Preprocesar imagen
        img = Image.open(io.BytesIO(img_data))
        img = preprocess_image(img)
        
        # Convertir a bytes
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_data = buf.getvalue()
        
        # OCR con parametros mejorados
        result = reader.readtext(img_data, paragraph=True, detail=0)
        page_text = '\n'.join(result) if result else ''
        
        if page_text and len(page_text.strip()) > 30:
            # GUARDAR INMEDIATAMENTE cada página (append mode)
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(f'\n## Pagina {i+1}\n\n{page_text.strip()}\n')
            total_chars += len(page_text)
        
        # Mostrar progreso cada página para debug
        print(f'OK Pagina {i+1}/{total_pages} ({len(page_text)} chars)')
        sys.stdout.flush()
            
    except Exception as e:
        print(f'ERR Pagina {i+1}: {e}')
        sys.stdout.flush()
        continue

doc.close()
print(f'\nCOMPLETADO!')
print(f'Total caracteres extraidos: {total_chars:,}')
print(f'Archivo: {output_file}')
if output_file.exists():
    print(f'Tamano: {output_file.stat().st_size / 1024:.1f} KB')
