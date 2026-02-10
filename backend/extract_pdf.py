"""Script para extraer texto del PDF de Murphy"""
import fitz  # PyMuPDF
from pathlib import Path

pdf_path = r'd:\GitHub\TradingHell\pdfs\ANALISIS TECNICO DE LOS MERCADOS FINANCIEROS - JHON J. MURPHY.pdf'
output_dir = Path(r'd:\GitHub\TradingHell\backend\rag\knowledge_base')

doc = fitz.open(pdf_path)
print(f'Total páginas: {len(doc)}')

all_text = []
for i, page in enumerate(doc):
    text = page.get_text()
    if text and len(text.strip()) > 50:
        all_text.append(f'\n## Página {i+1}\n\n{text.strip()}')
    if (i+1) % 100 == 0:
        print(f'Procesadas {i+1}/{len(doc)} páginas...')

full_text = '\n'.join(all_text)
print(f'Total caracteres: {len(full_text):,}')

# Guardar
output_file = output_dir / 'murphy_analisis_tecnico.md'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('# Análisis Técnico de los Mercados Financieros - John J. Murphy\n\n')
    f.write('> Libro clásico de referencia en análisis técnico.\n')
    f.write('> Este texto fue extraído automáticamente del PDF.\n\n')
    f.write(full_text)

print(f'Guardado: {output_file}')
print(f'Tamaño: {output_file.stat().st_size / 1024:.1f} KB')
