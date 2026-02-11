'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Users,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  Phone,
  Mail,
  DollarSign,
  ArrowUpRight,
  Target,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getIndicacoesCorretor,
  atualizarStatusLead,
} from '@/app/actions/leads-indicacao';
import type { LeadIndicacao } from '@/app/actions/leads-indicacao';

// =============================================
// STATUS CONFIG
// =============================================

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  simulou: { label: 'Simulou', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  entrou_em_contato: { label: 'Contatou', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  em_analise: { label: 'Em Análise', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  proposta_enviada: { label: 'Proposta', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  fechado: { label: 'Fechado', color: 'text-green-400', bg: 'bg-green-400/10' },
  perdido: { label: 'Perdido', color: 'text-red-400', bg: 'bg-red-400/10' },
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function IndicacoesPanel({ corretorId, slug }: { corretorId: string; slug?: string }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadIndicacao[]>([]);
  const [total, setTotal] = useState(0);
  const [resumo, setResumo] = useState({
    total: 0,
    simularam: 0,
    contataram: 0,
    em_analise: 0,
    fechados: 0,
    taxa_conversao: 0,
  });

  // Filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);

  // Link de indicação
  const linkIndicacao = `https://humanosaude.com.br/economizar/${slug || ''}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getIndicacoesCorretor(corretorId, {
      status: statusFiltro,
      busca: busca || undefined,
      pagina,
      limite: 15,
    });
    if (result.success) {
      setLeads(result.data ?? []);
      setTotal(result.total ?? 0);
      if (result.resumo) setResumo(result.resumo);
    }
    setLoading(false);
  }, [corretorId, statusFiltro, busca, pagina]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling real-time (a cada 30s)
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const copiarLink = () => {
    navigator.clipboard.writeText(linkIndicacao);
    toast.success('Link copiado!');
  };

  const handleStatusChange = async (leadId: string, novoStatus: string) => {
    const result = await atualizarStatusLead(leadId, novoStatus);
    if (result.success) {
      toast.success('Status atualizado');
      fetchData();
    } else {
      toast.error('Erro ao atualizar');
    }
  };

  const formatCurrency = (v: number | null) =>
    v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#D4AF37]" />
            Minhas Indicações
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Leads gerados pelo seu link de economia
          </p>
        </div>

        {/* Link de indicação */}
        {slug && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] max-w-xs">
              <Link2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <p className="text-xs text-white/50 truncate">{linkIndicacao}</p>
            </div>
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#F6E05E] transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </button>
            <a
              href={linkIndicacao}
              target="_blank"
              className="p-2.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-[#D4AF37] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total leads', value: resumo.total, icon: Users, color: 'text-white' },
          { label: 'Simularam', value: resumo.simularam, icon: Eye, color: 'text-blue-400' },
          { label: 'Contataram', value: resumo.contataram, icon: MessageCircle, color: 'text-yellow-400' },
          { label: 'Em análise', value: resumo.em_analise, icon: Target, color: 'text-purple-400' },
          { label: 'Fechados', value: resumo.fechados, icon: CheckCircle, color: 'text-green-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('h-4 w-4', item.color)} />
                {item.label === 'Total leads' && resumo.taxa_conversao > 0 && (
                  <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    {resumo.taxa_conversao}%
                  </span>
                )}
              </div>
              <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setPagina(1);
              }}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none appearance-none"
            >
              <option value="todos">Todos</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de leads */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <Link2 className="h-10 w-10 mx-auto mb-3 text-white/10" />
            <p className="text-white/30 text-sm">Nenhuma indicação ainda</p>
            <p className="text-white/20 text-xs mt-1">
              Compartilhe seu link para começar a receber leads
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">
                    Operadora
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">
                    Valor Atual
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden lg:table-cell">
                    Economia Est.
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">
                    Vidas
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden lg:table-cell">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.simulou;
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white font-medium">
                            {lead.nome || 'Lead anônimo'}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {lead.telefone && (
                              <a
                                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                className="text-[11px] text-green-400/60 hover:text-green-400 flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {lead.telefone}
                              </a>
                            )}
                            {lead.email && (
                              <span className="text-[11px] text-white/30 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 hidden md:table-cell">
                        {lead.operadora_atual || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-white font-medium">
                          {formatCurrency(lead.valor_atual)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {lead.economia_estimada ? (
                          <span className="text-sm text-green-400 font-medium">
                            {formatCurrency(lead.economia_estimada)}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-white/50 hidden md:table-cell">
                        {lead.qtd_vidas}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={cn(
                            'text-xs font-medium px-3 py-1.5 rounded-lg border-none focus:outline-none cursor-pointer',
                            statusCfg.bg,
                            statusCfg.color,
                          )}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key} className="bg-[#111]">
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-white/30 hidden lg:table-cell">
                        {formatDate(lead.created_at)}
                        {lead.clicou_no_contato && (
                          <p className="text-green-400/60 flex items-center justify-end gap-1 mt-0.5">
                            <MessageCircle className="h-3 w-3" />
                            Clicou contato
                          </p>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              {(pagina - 1) * 15 + 1}–{Math.min(pagina * 15, total)} de {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white disabled:opacity-30"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina * 15 >= total}
                className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white disabled:opacity-30"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
