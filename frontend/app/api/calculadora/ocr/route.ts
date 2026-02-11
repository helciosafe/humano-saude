import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI não configurada' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('fatura') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo e tamanho
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não suportado. Envie JPG, PNG, WebP ou PDF.' },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    // Converter para base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type === 'application/pdf' ? 'image/png' : file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Chamar GPT-4o-mini Vision para extrair dados
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extrair dados de faturas/boletos de planos de saúde brasileiros.
Analise a imagem da fatura e extraia EXATAMENTE estas informações em formato JSON:

{
  "operadora": "nome da operadora (ex: Amil, Bradesco Saúde, SulAmérica, Unimed)",
  "plano": "nome do plano se visível",
  "valor_total": número decimal do valor total da fatura (apenas o número, sem R$),
  "vencimento": "data de vencimento se visível (DD/MM/YYYY)",
  "beneficiarios": número de beneficiários/vidas se visível,
  "titular": "nome do titular se visível",
  "confianca": número de 0 a 100 indicando sua confiança na extração
}

Se não conseguir identificar algum campo, use null.
Retorne APENAS o JSON válido, sem markdown ou texto extra.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados desta fatura de plano de saúde:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] OpenAI error:', errorText);
      return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';

    // Tentar parsear o JSON retornado
    let dadosFatura;
    try {
      // Limpar possível markdown
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      dadosFatura = JSON.parse(jsonStr);
    } catch {
      console.error('[OCR] Falha ao parsear resposta:', content);
      return NextResponse.json({
        success: false,
        error: 'Não foi possível extrair dados da fatura. Tente uma foto mais nítida.',
        raw: content,
      });
    }

    return NextResponse.json({
      success: true,
      dados: {
        operadora: dadosFatura.operadora || null,
        plano: dadosFatura.plano || null,
        valor_total: dadosFatura.valor_total || null,
        vencimento: dadosFatura.vencimento || null,
        beneficiarios: dadosFatura.beneficiarios || null,
        titular: dadosFatura.titular || null,
        confianca: dadosFatura.confianca || 0,
      },
    });
  } catch (err) {
    console.error('[OCR] Erro:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
