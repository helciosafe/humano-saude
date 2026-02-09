# Meta Pixel (Facebook Pixel) - Documentação

## 📊 Visão Geral

O **Meta Pixel** (ID: `1572724200440814`) está integrado em todas as páginas do Humano Saúde para rastrear conversões, otimizar campanhas de Meta Ads e construir públicos personalizados.

---

## 🚀 Implementação

### 1. Instalação Automática

O pixel está instalado globalmente via `app/layout.tsx` através do componente `MetaPixel`:

```tsx
import MetaPixel from "./components/MetaPixel";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <MetaPixel />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Rastreamento Automático

- ✅ **PageView**: Rastreado automaticamente em todas as páginas
- ✅ **SPA Navigation**: Rastreamento em mudanças de rota do Next.js
- ✅ **Fallback noscript**: Para usuários com JS desabilitado

---

## 📈 Eventos Customizados

Use as funções utilitárias em `app/lib/metaPixel.ts`:

### **1. Geração de Lead**

```tsx
import { trackLeadGeneration } from '@/app/lib/metaPixel';

// Quando novo lead é criado
trackLeadGeneration({
  leadId: '123',
  nome: 'João Silva',
  operadora: 'Unimed',
  valorAtual: 1200.00,
  valorProposto: 950.00,
  economiaEstimada: 250.00,
});
```

### **2. Conversão de Proposta**

```tsx
import { trackPropostaConversion } from '@/app/lib/metaPixel';

// Quando lead vira cliente (proposta aceita)
trackPropostaConversion({
  propostaId: 'PROP-456',
  leadId: '123',
  operadora: 'Bradesco Saúde',
  valor: 950.00,
  comissao: 95.00,
});
```

### **3. Início de Cotação**

```tsx
import { trackQuoteStart } from '@/app/lib/metaPixel';

// Quando usuário inicia processo de cotação
trackQuoteStart({
  operadora: 'Amil',
  idades: [35, 32, 8],
  tipoContratacao: 'PF',
});
```

### **4. Busca de Planos**

```tsx
import { trackPlanSearch } from '@/app/lib/metaPixel';

// Quando usuário pesquisa planos
trackPlanSearch('plano familiar SP', 'Unimed');
```

### **5. Cadastro de Usuário**

```tsx
import { trackUserRegistration } from '@/app/lib/metaPixel';

// Quando novo corretor se registra
trackUserRegistration('user-789', 'corretor');
```

### **6. Contato via WhatsApp**

```tsx
import { trackWhatsAppContact } from '@/app/lib/metaPixel';

// Quando corretor envia mensagem para lead
trackWhatsAppContact('lead-123', 'follow_up');
```

### **7. Uso de IA**

```tsx
import { trackAIUsage } from '@/app/lib/metaPixel';

// Quando corretor usa feature de IA
trackAIUsage('audience_generation', {
  audience_size: 50000,
  target_age: '35-44',
});
```

### **8. Gerenciamento de Campanhas**

```tsx
import { trackAdsCampaign } from '@/app/lib/metaPixel';

// Quando corretor cria/edita campanha
trackAdsCampaign('create', 'campaign-abc');
trackAdsCampaign('pause', 'campaign-abc');
```

### **9. Exportação de Relatórios**

```tsx
import { trackReportExport } from '@/app/lib/metaPixel';

// Quando corretor exporta relatório
trackReportExport('performance_mensal');
```

---

## 🎯 Eventos Standard do Meta Pixel

| Evento | Quando Usar | Exemplo |
|--------|-------------|---------|
| `PageView` | Automático em todas as páginas | - |
| `ViewContent` | Visualização de lead/plano | `trackLeadView('lead-123')` |
| `Lead` | Novo lead criado | `trackLeadGeneration({...})` |
| `Purchase` | Proposta aceita (conversão) | `trackPropostaConversion({...})` |
| `InitiateCheckout` | Início de cotação | `trackQuoteStart({...})` |
| `Search` | Busca de planos | `trackPlanSearch('termo')` |
| `CompleteRegistration` | Novo cadastro | `trackUserRegistration('id')` |
| `Contact` | Contato via WhatsApp | `trackWhatsAppContact()` |

---

## 🔧 Configuração no Meta Business Suite

### 1. Verificar Instalação

1. Acesse [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Selecione o Pixel ID: `1572724200440814`
3. Vá em **Test Events** → Abra `https://humanosaude.com.br`
4. Verifique se eventos `PageView` aparecem em tempo real

### 2. Configurar Conversões

1. **Eventos Manager** → **Aggregated Event Measurement**
2. Configure prioridade de eventos:
   - **1º**: Purchase (Proposta Aceita)
   - **2º**: Lead (Novo Lead)
   - **3º**: InitiateCheckout (Cotação Iniciada)
   - **4º**: CompleteRegistration (Novo Corretor)
   - **5º**: Contact (WhatsApp)

### 3. Criar Públicos Personalizados

1. **Audiences** → **Create Audience** → **Custom Audience**
2. Fontes disponíveis:
   - Pessoas que visitaram `/admin/crm` (corretores ativos)
   - Pessoas que dispararam `Lead` nos últimos 30 dias
   - Pessoas que completaram `Purchase` (corretores com conversão)

### 4. Criar Públicos Lookalike

1. Use público de corretores com mais conversões
2. Crie Lookalike de 1% no Brasil
3. Use em campanhas de recrutamento de corretores

---

## 📊 Métricas e Otimização

### Eventos por Funil

```
🎯 TOPO DE FUNIL
├─ PageView (Visitas)
├─ ViewContent (Visualizações de lead)
└─ Search (Buscas de plano)

🔥 MEIO DE FUNIL
├─ InitiateCheckout (Cotações iniciadas)
├─ Lead (Leads criados)
└─ Contact (Contatos WhatsApp)

💰 FUNDO DE FUNIL
├─ Purchase (Propostas aceitas)
└─ CompleteRegistration (Novos corretores)
```

### KPIs Importantes

- **Taxa de Conversão Lead → Proposta**: `Purchase / Lead`
- **CPL (Custo por Lead)**: `Gasto / Lead`
- **CPA (Custo por Aquisição)**: `Gasto / Purchase`
- **ROAS (Return on Ad Spend)**: `Receita / Gasto`

---

## 🛠️ Troubleshooting

### Pixel não dispara eventos

1. **Verifique console do navegador**:
```javascript
// Abra DevTools → Console
console.log(window.fbq); // Deve retornar função
```

2. **Teste manualmente**:
```javascript
// No console do navegador
window.fbq('track', 'Lead', { value: 100, currency: 'BRL' });
```

3. **Verifique blockers**:
   - Desabilite AdBlock/Privacy Badger
   - Teste em navegador incógnito

### Eventos não aparecem no Events Manager

- **Delay normal**: 1-5 minutos até aparecer
- **Verifique data/hora**: Eventos aparecem com timestamp correto
- **Test Events**: Use modo de teste com seu IP

### CORS ou CSP Issues

Se houver problemas de CORS, adicione ao `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net;",
        },
      ],
    },
  ];
}
```

---

## 🔐 Privacidade e LGPD

### Dados Rastreados

- **Não enviamos dados pessoais identificáveis** (nome, email, telefone) para o pixel
- Apenas IDs internos e categorias genéricas
- Valores monetários são agregados

### Cookie Consent

Implemente banner de cookies:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cookie-consent');
    if (saved) setConsent(saved === 'true');
  }, []);

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#D4AF37]/20 p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-300 text-sm">
          Usamos cookies e pixels de rastreamento para melhorar sua experiência e otimizar campanhas.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setConsent(true);
              localStorage.setItem('cookie-consent', 'true');
            }}
            className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg"
          >
            Aceitar
          </button>
          <button
            onClick={() => {
              setConsent(false);
              localStorage.setItem('cookie-consent', 'false');
            }}
            className="px-4 py-2 border border-[#D4AF37]/20 rounded-lg"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📝 Checklist de Implementação

- [x] **Pixel instalado no layout global**
- [x] **PageView rastreado automaticamente**
- [x] **SPA navigation tracking ativo**
- [x] **Funções utilitárias criadas** (`metaPixel.ts`)
- [ ] **Eventos customizados integrados nas páginas**
- [ ] **Conversões configuradas no Events Manager**
- [ ] **Públicos personalizados criados**
- [ ] **Públicos Lookalike configurados**
- [ ] **Cookie consent implementado**
- [ ] **Testes de verificação concluídos**

---

## 🚀 Próximos Passos

1. **Integrar eventos nas páginas**:
   - `/admin/crm/page.tsx` → `trackLeadGeneration()`
   - `/admin/cockpit/consolidado/page.tsx` → `trackPropostaConversion()`
   - `/scanner/page.tsx` → `trackQuoteStart()`

2. **Configurar Meta Ads**:
   - Criar campanhas otimizadas para conversão `Lead`
   - Usar públicos Lookalike baseados em corretores ativos

3. **Monitorar métricas**:
   - CPL (Custo por Lead)
   - Taxa de conversão Lead → Proposta
   - ROAS das campanhas

---

## 📚 Recursos

- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [LGPD e Meta Pixel](https://www.facebook.com/business/gdpr)

---

**Pixel ID**: `1572724200440814`  
**Status**: ✅ Instalado e Ativo  
**Última Atualização**: 9 de Fevereiro de 2026
