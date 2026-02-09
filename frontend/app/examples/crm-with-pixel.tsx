/**
 * EXEMPLO DE INTEGRAÇÃO - Meta Pixel no CRM
 * 
 * Este arquivo demonstra como integrar os eventos do Meta Pixel
 * em uma página real do sistema (CRM de Leads)
 */

'use client';

import { useState } from 'react';
import { Users, UserPlus, Filter, Search } from 'lucide-react';
import { 
  trackLeadGeneration, 
  trackLeadView,
  trackWhatsAppContact 
} from '@/app/lib/metaPixel';

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  operadora?: string;
  valorAtual?: number;
  valorProposto?: number;
  economiaEstimada?: number;
  status: string;
}

export default function CRMPageWithPixel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * EXEMPLO 1: Rastrear criação de novo lead
   */
  const handleCreateLead = async (formData: any) => {
    try {
      // 1. Criar lead no backend
      const response = await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      const newLead = await response.json();
      
      // 2. 🎯 RASTREAR EVENTO NO META PIXEL
      trackLeadGeneration({
        leadId: newLead.id,
        nome: newLead.nome,
        operadora: newLead.operadora,
        valorAtual: newLead.valorAtual,
        valorProposto: newLead.valorProposto,
        economiaEstimada: newLead.economiaEstimada,
      });

      // 3. Atualizar UI
      setLeads([...leads, newLead]);
      setIsModalOpen(false);
      
      alert('Lead criado com sucesso! Evento rastreado no Meta Pixel.');
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  /**
   * EXEMPLO 2: Rastrear visualização de lead
   */
  const handleViewLead = (lead: Lead) => {
    // 🎯 RASTREAR VISUALIZAÇÃO
    trackLeadView(lead.id, lead.operadora);
    
    // Navegar para página de detalhes
    window.location.href = `/admin/crm/${lead.id}`;
  };

  /**
   * EXEMPLO 3: Rastrear contato via WhatsApp
   */
  const handleWhatsAppContact = (lead: Lead) => {
    // 🎯 RASTREAR CONTATO
    trackWhatsAppContact(lead.id, 'follow_up');
    
    // Abrir WhatsApp
    const message = encodeURIComponent(`Olá ${lead.nome}, aqui é da Humano Saúde!`);
    window.open(`https://wa.me/${lead.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]">CRM COM META PIXEL</h1>
        <p className="mt-2 text-gray-400">
          Exemplo de integração com rastreamento de eventos
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#F6E05E] transition-colors flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Novo Lead (com tracking)
        </button>
      </div>

      {/* Leads Table */}
      <div className="grid gap-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 rounded-lg bg-[#0a0a0a] border border-[#D4AF37]/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white">{lead.nome}</h3>
                <p className="text-sm text-gray-400">{lead.email}</p>
              </div>
              
              <div className="flex gap-2">
                {/* Botão com tracking de visualização */}
                <button
                  onClick={() => handleViewLead(lead)}
                  className="px-3 py-1 rounded bg-[#151515] border border-[#D4AF37]/20 text-sm hover:bg-[#D4AF37]/10"
                >
                  Ver Detalhes
                </button>
                
                {/* Botão com tracking de WhatsApp */}
                <button
                  onClick={() => handleWhatsAppContact(lead)}
                  className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação (simplificado) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-4">Novo Lead</h2>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateLead(Object.fromEntries(formData));
              }}
            >
              <input
                name="nome"
                placeholder="Nome"
                className="w-full p-2 mb-3 rounded bg-[#151515] border border-[#D4AF37]/20"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full p-2 mb-3 rounded bg-[#151515] border border-[#D4AF37]/20"
                required
              />
              <input
                name="whatsapp"
                placeholder="WhatsApp"
                className="w-full p-2 mb-3 rounded bg-[#151515] border border-[#D4AF37]/20"
                required
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded bg-[#D4AF37] text-black font-semibold"
                >
                  Criar Lead ✅
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-[#D4AF37]/20"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * EVENTOS RASTREADOS NESTE EXEMPLO:
 * 
 * 1. Lead (Standard Event)
 *    - Disparado quando novo lead é criado
 *    - Inclui: nome, operadora, valores, economia
 * 
 * 2. ViewContent (Standard Event)
 *    - Disparado quando lead é visualizado
 *    - Inclui: leadId, operadora
 * 
 * 3. Contact (Standard Event)
 *    - Disparado quando corretor envia WhatsApp
 *    - Inclui: leadId, tipo de mensagem
 */
