"""Script para extraer texto del PDF de Murphy en INGLES usando OCR"""
import fitz  # PyMuPDF
import easyocr
from pathlib import Path
import sys
import io
from PIL import Image, ImageEnhance, ImageFilter

pdf_path = r'd:\GitHub\TradingHell\pdfs\John_J._Murphy_-_Technical_Analysis_Of_The_Financial_Markets.pdf'
output_dir = Path(r'd:\GitHub\TradingHell\backend\rag\knowledge_base')
output_file = output_dir / 'murphy_technical_analysis.md'

def preprocess_image(img):
    """Preprocesar imagen para mejorar OCR"""
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(1.5)
    img = img.filter(ImageFilter.SHARPEN)
    img = img.convert('RGB')
    return img

# Detectar desde que pagina continuar (resume mode)
start_page = 0
if output_file.exists():
    with open(output_file, 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        pages = re.findall(r'## Page (\d+)', content)
        if pages:
            start_page = int(pages[-1])
            print(f"Resuming from page {start_page + 1}...")
            sys.stdout.flush()

# Inicializar OCR (ingles)
print("Initializing OCR (English)...")
sys.stdout.flush()
reader = easyocr.Reader(['en'], gpu=False)

doc = fitz.open(pdf_path)
total_pages = len(doc)
print(f'Total pages: {total_pages}, processing from {start_page + 1}')
sys.stdout.flush()

# Crear archivo con header solo si empezamos desde cero
if start_page == 0:
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('# Technical Analysis of the Financial Markets - John J. Murphy\n\n')
        f.write('> Classic reference book on technical analysis.\n')
        f.write('> Text extracted via OCR for RAG system.\n\n')

total_chars = 0
for i in range(start_page, total_pages):
    try:
        page = doc[i]
        
        # Convertir pagina a imagen con buena resolucion
        pix = page.get_pixmap(dpi=200)
        img_data = pix.tobytes("png")
        
        # Preprocesar imagen
        img = Image.open(io.BytesIO(img_data))
        img = preprocess_image(img)
        
        # Convertir a bytes
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_data = buf.getvalue()
        
        # OCR con parametros para parrafos
        result = reader.readtext(img_data, paragraph=True, detail=0)
        page_text = '\n'.join(result) if result else ''
        
        if page_text and len(page_text.strip()) > 30:
            # GUARDAR INMEDIATAMENTE cada pagina (append mode)
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(f'\n## Page {i+1}\n\n{page_text.strip()}\n')
            total_chars += len(page_text)
        
        # Mostrar progreso
        print(f'OK Page {i+1}/{total_pages} ({len(page_text)} chars)')
        sys.stdout.flush()
            
    except Exception as e:
        print(f'ERR Page {i+1}: {e}')
        sys.stdout.flush()
        continue

doc.close()
print(f'\nCOMPLETED!')
print(f'Total chars extracted: {total_chars:,}')
print(f'Output: {output_file}')
if output_file.exists():
    print(f'Size: {output_file.stat().st_size / 1024:.1f} KB')
