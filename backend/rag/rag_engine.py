"""
RAG Engine para el asistente de trading.
Carga la base de conocimiento y responde preguntas en lenguaje natural.
"""

import os
from pathlib import Path
from typing import List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI


class TradingRAG:
    """Motor RAG especializado en trading."""
    
    def __init__(
        self,
        knowledge_base_path: str = None,
        use_openai: bool = True,
        openai_api_key: str = None,
        model_name: str = "gpt-4o-mini"
    ):
        """
        Inicializa el motor RAG.
        
        Args:
            knowledge_base_path: Ruta a la carpeta con los documentos de conocimiento
            use_openai: Si True, usa OpenAI. Si False, usa Ollama local
            openai_api_key: API key de OpenAI (opcional si está en env)
            model_name: Nombre del modelo a usar
        """
        if knowledge_base_path is None:
            knowledge_base_path = Path(__file__).parent / "knowledge_base"
        
        self.knowledge_base_path = Path(knowledge_base_path)
        self.use_openai = use_openai
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name
        
        # Inicializar embeddings (gratuito, local)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Inicializar vector store
        self.vector_store = None
        self.qa_chain = None
        
        # Cargar conocimiento
        self._load_knowledge_base()
        self._setup_qa_chain()
    
    def _load_knowledge_base(self):
        """Carga y procesa los documentos de la base de conocimiento."""
        print(f"📚 Cargando base de conocimiento desde: {self.knowledge_base_path}")
        
        # Cargar todos los archivos markdown
        loader = DirectoryLoader(
            str(self.knowledge_base_path),
            glob="**/*.md",
            loader_cls=TextLoader,
            loader_kwargs={'encoding': 'utf-8'}
        )
        documents = loader.load()
        
        print(f"📄 Documentos cargados: {len(documents)}")
        
        # Dividir en chunks para mejor búsqueda
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n## ", "\n### ", "\n\n", "\n", " "]
        )
        splits = text_splitter.split_documents(documents)
        
        print(f"✂️ Chunks creados: {len(splits)}")
        
        # Crear vector store
        persist_directory = self.knowledge_base_path.parent / "chroma_db"
        self.vector_store = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=str(persist_directory)
        )
        
        print("✅ Base de conocimiento cargada correctamente")
    
    def _setup_qa_chain(self):
        """Configura la cadena de preguntas y respuestas."""
        
        # Prompt personalizado para trading
        prompt_template = """Eres un asistente experto en trading que ayuda a principiantes a entender el análisis técnico.
Tu trabajo es explicar conceptos de forma simple, clara y práctica.

Usa la siguiente información de la base de conocimiento para responder:

{context}

Reglas para responder:
1. Explica como si hablaras con alguien que nunca ha hecho trading
2. Usa ejemplos concretos cuando sea posible
3. Si hay señales de compra/venta, explica claramente QUÉ hacer y POR QUÉ
4. Advierte siempre de los riesgos
5. Responde en español
6. Sé conciso pero completo
7. Usa emojis para hacer la respuesta más visual (📈 📉 ⚠️ ✅ ❌)

Pregunta: {question}

Respuesta útil:"""

        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Configurar LLM
        if self.use_openai and self.openai_api_key:
            llm = ChatOpenAI(
                model_name=self.model_name,
                temperature=0.3,
                openai_api_key=self.openai_api_key
            )
        else:
            # Usar Ollama local (gratuito)
            llm = Ollama(
                model="llama2",
                temperature=0.3
            )
        
        # Crear cadena QA
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 4}
            ),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
    
    def ask(self, question: str) -> dict:
        """
        Hace una pregunta al sistema RAG.
        
        Args:
            question: La pregunta en lenguaje natural
            
        Returns:
            dict con 'answer' y 'sources'
        """
        if not self.qa_chain:
            return {"answer": "Error: El sistema no está inicializado", "sources": []}
        
        try:
            result = self.qa_chain.invoke({"query": question})
            
            # Extraer fuentes
            sources = []
            if "source_documents" in result:
                for doc in result["source_documents"]:
                    source = doc.metadata.get("source", "Desconocido")
                    sources.append(Path(source).name)
            
            return {
                "answer": result["result"],
                "sources": list(set(sources))  # Eliminar duplicados
            }
        except Exception as e:
            return {
                "answer": f"Error al procesar la pregunta: {str(e)}",
                "sources": []
            }
    
    def get_relevant_context(self, query: str, k: int = 4) -> List[str]:
        """
        Obtiene contexto relevante sin generar respuesta.
        Útil para combinar con análisis técnico.
        
        Args:
            query: Texto de búsqueda
            k: Número de documentos a retornar
            
        Returns:
            Lista de textos relevantes
        """
        if not self.vector_store:
            return []
        
        docs = self.vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]


# Singleton para reusar el motor
_rag_instance: Optional[TradingRAG] = None


def get_rag_engine(openai_api_key: str = None) -> TradingRAG:
    """Obtiene o crea la instancia del motor RAG."""
    global _rag_instance
    
    if _rag_instance is None:
        _rag_instance = TradingRAG(openai_api_key=openai_api_key)
    
    return _rag_instance
