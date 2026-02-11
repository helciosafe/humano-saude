import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import type { Metadata } from 'next';
import CalculadoraClient from './CalculadoraClient';

// =============================================
// SERVER COMPONENT — valida slug e salva cookie
// =============================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Metadata dinâmica para SEO/OG
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('corretores')
    .select('nome')
    .eq('slug', slug)
    .eq('ativo', true)
    .single();

  const nome = data?.nome || 'Humano Saúde';

  return {
    title: `Calculadora de Economia | ${nome} — Humano Saúde`,
    description: `Descubra quanto você pode economizar no seu plano de saúde com ${nome}. Análise gratuita com IA.`,
    openGraph: {
      title: `Economize até 40% no Plano de Saúde | ${nome}`,
      description: 'Envie sua fatura e descubra em segundos quanto pode reduzir. 100% gratuito.',
      url: `https://humanosaude.com.br/economizar/${slug}`,
      siteName: 'Humano Saúde',
      type: 'website',
    },
  };
}

export default async function EconomizarPage({ params }: PageProps) {
  const { slug } = await params;

  // Validar slug no Supabase
  const supabase = createServiceClient();
  const { data: corretor, error } = await supabase
    .from('corretores')
    .select('id, nome, slug, foto_url, logo_personalizada_url, cor_primaria, whatsapp, telefone, email')
    .eq('slug', slug)
    .eq('ativo', true)
    .single();

  if (error || !corretor) {
    notFound();
  }

  // Salvar corretor_id no cookie (7 dias)
  const cookieStore = await cookies();
  cookieStore.set('corretor_indicacao_id', corretor.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });

  return <CalculadoraClient corretor={corretor} />;
}
