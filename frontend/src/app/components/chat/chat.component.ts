/**
 * Chat Component - Asistente RAG de trading
 */

import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TradingService } from '../../services/trading.service';
import { ChatMessage } from '../../models/trading.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="trading-card h-full flex flex-col">
      <h2 class="text-lg font-semibold mb-4">💬 Asistente de Trading</h2>
      
      <!-- Mensajes -->
      <div 
        #messagesContainer
        class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        
        @if (messages().length === 0) {
          <div class="text-center text-gray-500 py-8">
            <p class="text-4xl mb-4">🤖</p>
            <p class="mb-2">¡Hola! Soy tu asistente de trading.</p>
            <p class="text-sm">Pregúntame sobre:</p>
            <div class="mt-3 space-y-2">
              @for (suggestion of suggestions; track suggestion) {
                <button 
                  class="block w-full text-left text-sm p-2 rounded bg-trading-border/30 hover:bg-trading-border/50 transition"
                  (click)="askSuggestion(suggestion)">
                  {{ suggestion }}
                </button>
              }
            </div>
          </div>
        } @else {
          @for (message of messages(); track message.id) {
            <div 
              class="flex"
              [class.justify-end]="message.role === 'user'">
              <div 
                class="max-w-[85%] p-3 rounded-xl"
                [class]="message.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-trading-border text-gray-200 rounded-bl-sm'">
                
                <div class="whitespace-pre-wrap text-sm">{{ message.content }}</div>
                
                @if (message.sources && message.sources.length > 0) {
                  <div class="mt-2 pt-2 border-t border-gray-600/30 text-xs text-gray-400">
                    📚 Fuentes: {{ message.sources.join(', ') }}
                  </div>
                }
                
                <div class="text-xs text-gray-400/60 mt-1">
                  {{ message.timestamp | date:'HH:mm' }}
                </div>
              </div>
            </div>
          }
          
          @if (isLoading()) {
            <div class="flex">
              <div class="bg-trading-border text-gray-200 p-3 rounded-xl rounded-bl-sm">
                <div class="flex items-center gap-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  <span class="text-sm">Pensando...</span>
                </div>
              </div>
            </div>
          }
        }
      </div>
      
      <!-- Input -->
      <div class="flex gap-2">
        <input
          type="text"
          [(ngModel)]="inputMessage"
          (keydown.enter)="sendMessage()"
          [disabled]="isLoading()"
          placeholder="Pregunta lo que quieras sobre trading..."
          class="flex-1 px-4 py-2 rounded-lg bg-trading-border border border-trading-border 
                 focus:border-indigo-500 focus:outline-none transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          (click)="sendMessage()"
          [disabled]="isLoading() || !inputMessage.trim()"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium
                 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Enviar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ChatComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  
  readonly tradingService = inject(TradingService);
  
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);
  inputMessage = '';
  
  readonly suggestions = [
    '¿Qué es un patrón de martillo?',
    '¿Cómo funciona el RSI?',
    '¿Cuándo debo usar stop loss?',
    '¿Qué son las bandas de Bollinger?'
  ];
  
  async sendMessage(): Promise<void> {
    const question = this.inputMessage.trim();
    if (!question || this.isLoading()) return;
    
    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    
    this.messages.update(msgs => [...msgs, userMessage]);
    this.inputMessage = '';
    this.isLoading.set(true);
    
    // Scroll al final
    setTimeout(() => this.scrollToBottom(), 100);
    
    try {
      // Llamar al RAG
      const response = await this.tradingService.askQuestion(question);
      
      // Añadir respuesta
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources
      };
      
      this.messages.update(msgs => [...msgs, assistantMessage]);
    } catch (error) {
      // Mensaje de error
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '❌ Error al conectar con el asistente. Asegúrate de que el backend está corriendo.',
        timestamp: new Date()
      };
      
      this.messages.update(msgs => [...msgs, errorMessage]);
    } finally {
      this.isLoading.set(false);
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }
  
  askSuggestion(suggestion: string): void {
    this.inputMessage = suggestion;
    this.sendMessage();
  }
  
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
