import { NextRequest, NextResponse } from 'next/server';

// Credenciais de admin (DEVEM ser definidas via variáveis de ambiente)
const ADMIN_CREDENTIALS = {
  email: (process.env.ADMIN_EMAIL || '').trim(),
  password: (process.env.ADMIN_PASSWORD || '').trim(),
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();

    // Verificar se credenciais de admin estão configuradas
    if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
      console.error('ADMIN_EMAIL e ADMIN_PASSWORD não configurados nas variáveis de ambiente');
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    // Validar credenciais
    if (trimmedEmail === ADMIN_CREDENTIALS.email && trimmedPassword === ADMIN_CREDENTIALS.password) {
      // Gerar token simples (em produção usar JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

      const response = NextResponse.json({
        success: true,
        token,
        message: 'Login bem-sucedido',
      });

      // Definir cookie httpOnly para que o middleware consiga ler
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Credenciais inválidas' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { success: false, message: 'Erro no servidor' },
      { status: 500 }
    );
  }
}
