/**
 * Alerts Component - Sistema de Alertas de Trading
 * Crea y gestiona alertas de precio y señales
 */

import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';

interface Alert {
  id: string;
  symbol: string;
  condition: string;
  value: number | null;
  message: string;
  created_at: string;
  triggered: boolean;
  triggered_at?: string;
  trigger_price?: number;
  trigger_signal?: string;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="trading-card h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          🔔 Alertas
          @if (activeAlerts().length > 0) {
            <span class="px-2 py-0.5 bg-indigo-600 rounded-full text-xs">
              {{ activeAlerts().length }}
            </span>
          }
        </h3>
        <button 
          (click)="toggleCreateForm()"
          class="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded font-medium transition">
          ➕ Nueva
        </button>
      </div>

      <!-- Formulario de creación -->
      @if (showCreateForm()) {
        <div class="mb-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <div class="grid grid-cols-2 gap-2 mb-2">
            <input 
              type="text"
              [(ngModel)]="newAlert.symbol"
              placeholder="Símbolo (BTCUSDT)"
              class="px-2 py-1 bg-trading-card border border-trading-border rounded text-xs">
            <select 
              [(ngModel)]="newAlert.condition"
              class="px-2 py-1 bg-trading-card border border-trading-border rounded text-xs">
              <option value="price_above">Precio sube a</option>
              <option value="price_below">Precio baja a</option>
              <option value="signal_buy">Señal de compra</option>
              <option value="signal_sell">Señal de venta</option>
            </select>
          </div>
          
          @if (newAlert.condition === 'price_above' || newAlert.condition === 'price_below') {
            <input 
              type="number"
              [(ngModel)]="newAlert.value"
              placeholder="Precio objetivo"
              class="w-full px-2 py-1 bg-trading-card border border-trading-border rounded text-xs mb-2">
          }
          
          <div class="flex gap-2">
            <button 
              (click)="createAlert()"
              [disabled]="!canCreateAlert()"
              class="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition disabled:opacity-50">
              Crear alerta
            </button>
            <button 
              (click)="toggleCreateForm()"
              class="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition">
              Cancelar
            </button>
          </div>
        </div>
      }

      <!-- Tabs: Activas / Disparadas -->
      <div class="flex gap-2 mb-2">
        <button 
          (click)="activeTab.set('active')"
          class="flex-1 px-2 py-1 rounded text-xs font-medium transition"
          [class]="activeTab() === 'active' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'">
          Activas ({{ activeAlerts().length }})
        </button>
        <button 
          (click)="activeTab.set('triggered')"
          class="flex-1 px-2 py-1 rounded text-xs font-medium transition"
          [class]="activeTab() === 'triggered' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'">
          Disparadas ({{ triggeredAlerts().length }})
        </button>
      </div>

      <!-- Lista de alertas -->
      <div class="flex-1 overflow-auto space-y-2">
        @if (activeTab() === 'active') {
          @for (alert of activeAlerts(); track alert.id) {
            <div class="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-white text-sm">{{ alert.symbol }}</span>
                <button 
                  (click)="deleteAlert(alert.id)"
                  class="text-red-400 hover:text-red-300 text-xs">
                  ✕
                </button>
              </div>
              <div class="text-xs text-gray-400">
                {{ getConditionText(alert.condition) }}
                @if (alert.value) {
                  <span class="text-white font-bold">{{ alert.value | number:'1.2-2' }}</span>
                }
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Creada: {{ alert.created_at | date:'dd/MM HH:mm' }}
              </div>
            </div>
          } @empty {
            <div class="text-center text-gray-500 text-sm py-4">
              No hay alertas activas
            </div>
          }
        } @else {
          @for (alert of triggeredAlerts(); track alert.id) {
            <div class="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-white text-sm">{{ alert.symbol }}</span>
                <span class="text-green-400 text-xs">✓ Disparada</span>
              </div>
              <div class="text-xs text-gray-400">
                {{ getConditionText(alert.condition) }}
                @if (alert.trigger_price) {
                  a <span class="text-green-400 font-bold">{{ alert.trigger_price | number:'1.2-2' }}</span>
                }
                @if (alert.trigger_signal) {
                  → <span class="text-green-400 font-bold">{{ alert.trigger_signal }}</span>
                }
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ alert.triggered_at | date:'dd/MM HH:mm:ss' }}
              </div>
            </div>
          } @empty {
            <div class="text-center text-gray-500 text-sm py-4">
              No hay alertas disparadas
            </div>
          }
        }
      </div>

      <!-- Status de verificación -->
      <div class="mt-2 pt-2 border-t border-trading-border flex items-center justify-between text-xs">
        <label class="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input 
            type="checkbox" 
            [checked]="autoCheck()"
            (change)="toggleAutoCheck()"
            class="rounded">
          Verificar cada 30s
        </label>
        @if (lastCheck()) {
          <span class="text-gray-500">
            Último: {{ lastCheck() | date:'HH:mm:ss' }}
          </span>
        }
      </div>
    </div>
  `
})
export class AlertsComponent implements OnInit, OnDestroy {
  // State
  readonly activeAlerts = signal<Alert[]>([]);
  readonly triggeredAlerts = signal<Alert[]>([]);
  readonly showCreateForm = signal(false);
  readonly activeTab = signal<'active' | 'triggered'>('active');
  readonly autoCheck = signal(true);
  readonly lastCheck = signal<Date | null>(null);

  // Form state
  newAlert = {
    symbol: 'BTCUSDT',
    condition: 'price_above',
    value: null as number | null
  };

  private checkInterval: any = null;
  private readonly API_BASE = 'http://localhost:8001/api';

  ngOnInit() {
    this.loadAlerts();
    
    // Iniciar auto-check
    if (this.autoCheck()) {
      this.startAutoCheck();
    }
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async loadAlerts() {
    try {
      const response = await fetch(`${this.API_BASE}/alerts`);
      if (response.ok) {
        const data = await response.json();
        this.activeAlerts.set(data.active || []);
        this.triggeredAlerts.set(data.triggered || []);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  }

  async createAlert() {
    try {
      const response = await fetch(`${this.API_BASE}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.newAlert)
      });
      
      if (response.ok) {
        this.showCreateForm.set(false);
        this.newAlert = { symbol: 'BTCUSDT', condition: 'price_above', value: null };
        await this.loadAlerts();
      }
    } catch (error) {
      console.error('Error creando alerta:', error);
    }
  }

  async deleteAlert(id: string) {
    try {
      const response = await fetch(`${this.API_BASE}/alerts/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await this.loadAlerts();
      }
    } catch (error) {
      console.error('Error eliminando alerta:', error);
    }
  }

  async checkAlerts() {
    try {
      const response = await fetch(`${this.API_BASE}/alerts/check`);
      if (response.ok) {
        const data = await response.json();
        this.lastCheck.set(new Date());
        
        // Si hay alertas recién disparadas, notificar
        if (data.newly_triggered && data.newly_triggered.length > 0) {
          for (const alert of data.newly_triggered) {
            this.notifyAlert(alert);
          }
          await this.loadAlerts();
        }
      }
    } catch (error) {
      console.error('Error verificando alertas:', error);
    }
  }

  notifyAlert(alert: Alert) {
    // Notificación del navegador si está permitida
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🔔 Alerta: ${alert.symbol}`, {
        body: `${this.getConditionText(alert.condition)} ${alert.trigger_price ? '$' + alert.trigger_price : alert.trigger_signal}`,
        icon: '🔔'
      });
    }
    
    // También mostrar en consola
    console.log('🔔 ALERTA DISPARADA:', alert);
  }

  toggleCreateForm() {
    this.showCreateForm.set(!this.showCreateForm());
  }

  toggleAutoCheck() {
    this.autoCheck.set(!this.autoCheck());
    
    if (this.autoCheck()) {
      this.startAutoCheck();
    } else {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }
  }

  startAutoCheck() {
    // Verificar cada 30 segundos
    this.checkInterval = setInterval(() => this.checkAlerts(), 30 * 1000);
    // Primera verificación inmediata
    this.checkAlerts();
    
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  canCreateAlert(): boolean {
    if (!this.newAlert.symbol) return false;
    if (['price_above', 'price_below'].includes(this.newAlert.condition)) {
      return this.newAlert.value !== null && this.newAlert.value > 0;
    }
    return true;
  }

  getConditionText(condition: string): string {
    const texts: Record<string, string> = {
      'price_above': '📈 Precio sube a',
      'price_below': '📉 Precio baja a',
      'signal_buy': '🟢 Señal de COMPRA',
      'signal_sell': '🔴 Señal de VENTA'
    };
    return texts[condition] || condition;
  }
}
