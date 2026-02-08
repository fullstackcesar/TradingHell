"""
RAG Engine simplificado para el asistente de trading.
Usa OpenAI directamente con la base de conocimiento como contexto.
Sin dependencias pesadas (langchain, chromadb, sentence-transformers, etc.)
"""

import os
from pathlib import Path
from typing import List, Optional
from openai import OpenAI


class TradingRAG:
    """Motor RAG simplificado usando solo OpenAI."""
    
    def __init__(
        self,
        knowledge_base_path: str = None,
        openai_api_key: str = None,
        model_name: str = "gpt-4o-mini"
    ):
        """
        Inicializa el motor RAG.
        
        Args:
            knowledge_base_path: Ruta a la carpeta con los documentos
            openai_api_key: API key de OpenAI
            model_name: Modelo a usar (gpt-4o-mini es barato y bueno)
        """
        if knowledge_base_path is None:
            knowledge_base_path = Path(__file__).parent / "knowledge_base"
        
        self.knowledge_base_path = Path(knowledge_base_path)
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name
        
        # Inicializar cliente OpenAI
        self.client = OpenAI(api_key=self.openai_api_key)
        
        # Cargar conocimiento
        self.knowledge = self._load_knowledge_base()
        print(f"✅ RAG inicializado con {len(self.knowledge)} caracteres de conocimiento")
    
    def _load_knowledge_base(self) -> str:
        """Carga todos los documentos markdown como texto."""
        print(f"📚 Cargando base de conocimiento desde: {self.knowledge_base_path}")
        
        all_content = []
        md_files = list(self.knowledge_base_path.glob("**/*.md"))
        
        for md_file in md_files:
            try:
                content = md_file.read_text(encoding='utf-8')
                all_content.append(f"## Tema: {md_file.stem}\n\n{content}")
                print(f"  📄 Cargado: {md_file.name}")
            except Exception as e:
                print(f"  ⚠️ Error cargando {md_file.name}: {e}")
        
        return "\n\n---\n\n".join(all_content)
    
    def ask(self, question: str) -> dict:
        """
        Responde una pregunta usando la base de conocimiento.
        
        Args:
            question: Pregunta del usuario
            
        Returns:
            dict con 'answer' y 'sources'
        """
        system_prompt = f"""Eres un experto en trading que ayuda a principiantes a entender el análisis técnico.
Tu trabajo es explicar conceptos de forma simple, clara y práctica.

REGLAS:
1. Responde SOLO basándote en la información proporcionada
2. Si no sabes algo, dilo honestamente
3. Usa ejemplos prácticos cuando sea posible
4. Responde en español
5. Sé conciso pero completo
6. Usa emojis para hacer la respuesta más visual (📈 📉 ⚠️ ✅ ❌)

BASE DE CONOCIMIENTO:
{self.knowledge}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            
            # Identificar qué documentos se usaron
            sources = []
            for md_file in self.knowledge_base_path.glob("**/*.md"):
                if md_file.stem.lower() in question.lower() or md_file.stem.lower() in answer.lower():
                    sources.append(md_file.name)
            
            return {
                "answer": answer,
                "sources": sources[:3]
            }
            
        except Exception as e:
            return {
                "answer": f"Error al procesar la pregunta: {str(e)}",
                "sources": []
            }
    
    def get_relevant_context(self, query: str, k: int = 4) -> List[str]:
        """
        Busca contexto relevante en la base de conocimiento.
        Método simplificado por compatibilidad.
        """
        # Búsqueda simple por palabras clave
        results = []
        query_words = query.lower().split()
        
        for md_file in self.knowledge_base_path.glob("**/*.md"):
            try:
                content = md_file.read_text(encoding='utf-8')
                score = sum(1 for word in query_words if word in content.lower())
                if score > 0:
                    results.append((score, content[:500]))
            except:
                pass
        
        results.sort(reverse=True, key=lambda x: x[0])
        return [r[1] for r in results[:k]]


# Singleton para reutilizar la instancia
_rag_instance: Optional[TradingRAG] = None


def get_rag_engine(openai_api_key: str = None) -> TradingRAG:
    """Obtiene o crea la instancia del motor RAG."""
    global _rag_instance
    
    if _rag_instance is None:
        _rag_instance = TradingRAG(openai_api_key=openai_api_key)
    
    return _rag_instance
