'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Calculator,
  TrendingDown,
  Users,
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  ArrowRight,
  Shield,
  Sparkles,
  Camera,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  salvarLeadIndicacao,
  marcarClicouContato,
} from '@/app/actions/leads-indicacao';
import type { CorretorPublico } from '@/app/actions/leads-indicacao';

// =============================================
// TIPOS
// =============================================

interface DadosFatura {
  operadora: string | null;
  plano: string | null;
  valor_total: number | null;
  beneficiarios: number | null;
  titular: string | null;
}

interface ResultadoSimulacao {
  valorAtual: number;
  valorMin: number;
  valorMax: number;
  economiaMin: number;
  economiaMax: number;
  economiaAnualMin: number;
  economiaAnualMax: number;
}

type Etapa = 'upload' | 'dados' | 'resultado';

// =============================================
// FAIXAS ETÁRIAS PADRÃO ANS
// =============================================

const FAIXAS_IDADE = [
  '0-18', '19-23', '24-28', '29-33', '34-38',
  '39-43', '44-48', '49-53', '54-58', '59+',
];

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function CalculadoraEconomia({
  corretor,
}: {
  corretor: CorretorPublico;
}) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [uploading, setUploading] = useState(false);
  const [calculando, setCalculando] = useState(false);

  // Dados da fatura (OCR ou manual)
  const [dadosFatura, setDadosFatura] = useState<DadosFatura>({
    operadora: null,
    plano: null,
    valor_total: null,
    beneficiarios: null,
    titular: null,
  });

  // Input manual
  const [valorManual, setValorManual] = useState('');
  const [operadoraManual, setOperadoraManual] = useState('');
  const [idades, setIdades] = useState<string[]>([]);
  const [novaIdade, setNovaIdade] = useState('');

  // Lead data
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Resultado
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [contatoClicado, setContatoClicado] = useState(false);

  // Preview da imagem
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ─── UPLOAD E OCR ────────────────────────────

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('fatura', file);

      const res = await fetch('/api/calculadora/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.dados) {
        setDadosFatura(data.dados);
        if (data.dados.valor_total) {
          setValorManual(String(data.dados.valor_total));
        }
        if (data.dados.operadora) {
          setOperadoraManual(data.dados.operadora);
        }
        if (data.dados.beneficiarios && data.dados.beneficiarios > 0) {
          // Preencher idades genéricas
          const idadesDefault = Array(data.dados.beneficiarios).fill('29-33');
          setIdades(idadesDefault);
        }
        toast.success('Dados extraídos com sucesso!');
      } else {
        toast.error(data.error || 'Não foi possível ler a fatura. Preencha manualmente.');
      }
    } catch {
      toast.error('Erro ao processar fatura');
    }

    setUploading(false);
    setEtapa('dados');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  // ─── IDADES ─────────────────────────────────

  const adicionarIdade = () => {
    if (novaIdade && idades.length < 20) {
      setIdades((prev) => [...prev, novaIdade]);
      setNovaIdade('');
    }
  };

  const removerIdade = (index: number) => {
    setIdades((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── CALCULAR ───────────────────────────────

  const calcular = async () => {
    const valor = parseFloat(valorManual.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      toast.error('Informe o valor atual da mensalidade');
      return;
    }
    if (idades.length === 0) {
      toast.error('Adicione pelo menos uma faixa etária');
      return;
    }

    setCalculando(true);

    // Cálculo estimado: economia de 20% a 40%
    const valorMin = Math.round(valor * 0.60 * 100) / 100; // -40%
    const valorMax = Math.round(valor * 0.80 * 100) / 100; // -20%
    const economiaMin = Math.round((valor - valorMax) * 100) / 100;
    const economiaMax = Math.round((valor - valorMin) * 100) / 100;

    const res: ResultadoSimulacao = {
      valorAtual: valor,
      valorMin,
      valorMax,
      economiaMin,
      economiaMax,
      economiaAnualMin: Math.round(economiaMin * 12 * 100) / 100,
      economiaAnualMax: Math.round(economiaMax * 12 * 100) / 100,
    };

    setResultado(res);

    // Salvar lead no Supabase
    const leadResult = await salvarLeadIndicacao({
      corretor_id: corretor.id,
      nome: nome || null as unknown as undefined,
      email: email || null as unknown as undefined,
      telefone: telefone || null as unknown as undefined,
      operadora_atual: operadoraManual || dadosFatura.operadora || null as unknown as undefined,
      plano_atual: dadosFatura.plano || null as unknown as undefined,
      valor_atual: valor,
      qtd_vidas: idades.length,
      idades,
      valor_estimado_min: valorMin,
      valor_estimado_max: valorMax,
      economia_estimada: Math.round(((economiaMin + economiaMax) / 2) * 100) / 100,
      metadata: {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
    });

    if (leadResult.success && leadResult.lead_id) {
      setLeadId(leadResult.lead_id);
    }

    setCalculando(false);
    setEtapa('resultado');
  };

  // ─── CONTATO WHATSAPP ────────────────────────

  const handleContatoWhatsApp = async () => {
    if (leadId && !contatoClicado) {
      await marcarClicouContato(leadId);
      setContatoClicado(true);
    }

    const whats = corretor.whatsapp || corretor.telefone || '';
    const numero = whats.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${corretor.nome}! Fiz uma simulação no seu link e gostaria de saber mais sobre como economizar no meu plano de saúde. Meu valor atual é R$ ${resultado?.valorAtual?.toFixed(2) || ''}.`,
    );
    window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank');
  };

  const handleContatoTelefone = async () => {
    if (leadId && !contatoClicado) {
      await marcarClicouContato(leadId);
      setContatoClicado(true);
    }

    const tel = corretor.whatsapp || corretor.telefone || '';
    const numero = tel.replace(/\D/g, '');
    window.open(`tel:+55${numero}`, '_self');
  };

  // ─── FORMATAÇÃO ──────────────────────────────

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header com branding do corretor */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {corretor.logo_personalizada_url ? (
              <Image
                src={corretor.logo_personalizada_url}
                alt={corretor.nome}
                width={40}
                height={40}
                className="rounded-lg"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {corretor.nome.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{corretor.nome}</p>
              <p className="text-[11px] text-white/40">Corretor(a) Humano Saúde</p>
            </div>
          </div>
          <Image
            src="/images/logo.png"
            alt="Humano Saúde"
            width={120}
            height={32}
            className="opacity-60"
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Análise com IA em segundos
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Descubra quanto você pode{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]">
              economizar
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Envie sua fatura ou informe o valor atual e veja instantaneamente
            quanto pode reduzir no seu plano de saúde.
          </p>
        </motion.div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { id: 'upload', label: 'Fatura', icon: Upload },
            { id: 'dados', label: 'Dados', icon: Calculator },
            { id: 'resultado', label: 'Resultado', icon: TrendingDown },
          ].map((step, i) => {
            const StepIcon = step.icon;
            const isActive = step.id === etapa;
            const isPast =
              (step.id === 'upload' && etapa !== 'upload') ||
              (step.id === 'dados' && etapa === 'resultado');
            return (
              <div key={step.id} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      'w-8 h-[2px]',
                      isPast ? 'bg-[#D4AF37]' : 'bg-white/10',
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    isActive
                      ? 'bg-[#D4AF37] text-black'
                      : isPast
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-white/5 text-white/30',
                  )}
                >
                  {isPast ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── ETAPA 1: UPLOAD ──────────────── */}
          {etapa === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="bg-white/[0.03] border-2 border-dashed border-white/[0.12] rounded-2xl p-12 text-center hover:border-[#D4AF37]/30 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="fatura-upload"
                />
                <label htmlFor="fatura-upload" className="cursor-pointer block">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 text-[#D4AF37] animate-spin" />
                      <p className="text-white/60">Analisando sua fatura com IA...</p>
                    </div>
                  ) : previewUrl ? (
                    <div className="flex flex-col items-center gap-4">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="rounded-lg opacity-60 max-h-48 object-contain"
                      />
                      <p className="text-[#D4AF37]">Processando...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-all">
                        <Camera className="h-8 w-8 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white mb-1">
                          Tire uma foto da sua fatura
                        </p>
                        <p className="text-sm text-white/40">
                          Ou arraste aqui. JPG, PNG ou PDF — máx. 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-xs text-white/30 uppercase">ou</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              <button
                onClick={() => setEtapa('dados')}
                className="w-full py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm font-medium hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all"
              >
                Prefiro digitar manualmente
              </button>
            </motion.div>
          )}

          {/* ─── ETAPA 2: DADOS ──────────────── */}
          {etapa === 'dados' && (
            <motion.div
              key="dados"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                {/* OCR Success */}
                {dadosFatura.operadora && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-green-400 font-medium">Dados extraídos automaticamente!</p>
                      <p className="text-white/40 mt-0.5">
                        Operadora: {dadosFatura.operadora}
                        {dadosFatura.valor_total ? ` • Valor: R$ ${dadosFatura.valor_total}` : ''}
                        {dadosFatura.beneficiarios ? ` • ${dadosFatura.beneficiarios} vida(s)` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Valor atual */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Valor atual da mensalidade *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="text"
                      value={valorManual}
                      onChange={(e) => setValorManual(e.target.value)}
                      placeholder="Ex: 1.200,00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg focus:outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>
                </div>

                {/* Operadora */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Operadora atual
                  </label>
                  <select
                    value={operadoraManual}
                    onChange={(e) => setOperadoraManual(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value="">Selecione</option>
                    {[
                      'Amil', 'Bradesco Saúde', 'SulAmérica', 'Unimed',
                      'Porto Saúde', 'Prevent Senior', 'MedSênior',
                      'Assim Saúde', 'Golden Cross', 'Outro',
                    ].map((op) => (
                      <option key={op} value={op} className="bg-[#111]">
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faixas etárias */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Faixas etárias dos beneficiários *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={novaIdade}
                      onChange={(e) => setNovaIdade(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
                    >
                      <option value="">Selecione a faixa</option>
                      {FAIXAS_IDADE.map((f) => (
                        <option key={f} value={f} className="bg-[#111]">
                          {f} anos
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={adicionarIdade}
                      disabled={!novaIdade}
                      className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm disabled:opacity-30 hover:bg-[#F6E05E] transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {idades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {idades.map((idade, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-white/70"
                        >
                          <Users className="h-3 w-3" />
                          {idade} anos
                          <button
                            onClick={() => removerIdade(i)}
                            className="ml-1 text-white/30 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {idades.length === 0 && (
                    <p className="text-xs text-white/30 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Adicione pelo menos uma faixa etária
                    </p>
                  )}
                </div>

                {/* Dados de contato (opcional neste momento) */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-sm font-medium text-white mb-3">
                    Dados para contato <span className="text-white/30">(opcional)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                    />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="WhatsApp"
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full mt-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                  />
                </div>

                {/* CTA */}
                <button
                  onClick={calcular}
                  disabled={calculando}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black font-bold text-base hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {calculando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Ver minha economia
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ETAPA 3: RESULTADO ──────────── */}
          {etapa === 'resultado' && resultado && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {/* Card principal de economia */}
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium mb-4">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Economia estimada
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-6">
                    Você pode economizar entre
                  </h2>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="bg-white/[0.05] rounded-2xl px-6 py-4 border border-white/[0.08]">
                      <p className="text-[11px] text-white/40 uppercase mb-1">Mínimo / mês</p>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {formatCurrency(resultado.economiaMin)}
                      </p>
                    </div>
                    <span className="text-white/20 text-2xl">~</span>
                    <div className="bg-white/[0.05] rounded-2xl px-6 py-4 border border-white/[0.08]">
                      <p className="text-[11px] text-white/40 uppercase mb-1">Máximo / mês</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(resultado.economiaMax)}
                      </p>
                    </div>
                  </div>

                  {/* Comparação visual */}
                  <div className="max-w-md mx-auto space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Seu plano atual</span>
                      <span className="text-red-400 font-semibold line-through">
                        {formatCurrency(resultado.valorAtual)}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: `${(resultado.valorMax / resultado.valorAtual) * 100}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-green-400"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Estimativa novo plano</span>
                      <span className="text-green-400 font-bold">
                        {formatCurrency(resultado.valorMin)} ~ {formatCurrency(resultado.valorMax)}
                      </span>
                    </div>
                  </div>

                  {/* Economia anual */}
                  <div className="inline-block bg-black/30 rounded-xl px-6 py-3 border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-0.5">Economia estimada no ano</p>
                    <p className="text-xl font-bold text-[#D4AF37]">
                      até {formatCurrency(resultado.economiaAnualMax)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs de contato */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Quer garantir essa economia?
                </h3>
                <p className="text-sm text-white/40 text-center mb-6">
                  Fale agora com {corretor.nome} e receba uma análise personalizada gratuita
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleContatoWhatsApp}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-all"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chamar no WhatsApp
                  </button>
                  <button
                    onClick={handleContatoTelefone}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-medium text-sm hover:border-[#D4AF37]/30 transition-all"
                  >
                    <Phone className="h-5 w-5" />
                    Ligar agora
                  </button>
                </div>

                {contatoClicado && (
                  <p className="text-xs text-green-400 text-center mt-3 flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {corretor.nome} foi notificado(a) do seu interesse!
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Dados seguros
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Sem compromisso
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> 100% gratuito
                </span>
              </div>

              {/* Recalcular */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setEtapa('dados');
                    setResultado(null);
                  }}
                  className="text-sm text-white/30 hover:text-[#D4AF37] transition-colors"
                >
                  ← Fazer nova simulação
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-16 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Humano Saúde • Valores estimados, sujeitos à análise.
          </p>
        </div>
      </footer>
    </div>
  );
}
