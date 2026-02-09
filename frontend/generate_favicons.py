#!/usr/bin/env python3
"""
Script para gerar favicon a partir do logo oficial da Humano Saúde
"""

from PIL import Image
import os

# Caminhos
LOGO_PATH = "public/images/logos/LOGO 1 SEM FUNDO.png"
OUTPUT_DIR = "public"

# Tamanhos para gerar
SIZES = {
    "favicon.ico": 32,
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

def create_favicons():
    """Gera todos os favicons necessários"""
    
    # Abrir logo original
    try:
        logo = Image.open(LOGO_PATH)
        print(f"✅ Logo carregado: {LOGO_PATH}")
        print(f"   Tamanho original: {logo.size}")
        print(f"   Modo: {logo.mode}")
    except Exception as e:
        print(f"❌ Erro ao abrir logo: {e}")
        return
    
    # Converter para RGBA se necessário
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Gerar cada tamanho
    for filename, size in SIZES.items():
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        # Redimensionar mantendo proporção
        logo_resized = logo.copy()
        logo_resized.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # Criar nova imagem com fundo transparente
        final_image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Centralizar logo
        x = (size - logo_resized.width) // 2
        y = (size - logo_resized.height) // 2
        final_image.paste(logo_resized, (x, y), logo_resized)
        
        # Salvar
        if filename.endswith('.ico'):
            final_image.save(output_path, format='ICO', sizes=[(32, 32)])
        else:
            final_image.save(output_path, format='PNG')
        
        print(f"✅ Gerado: {filename} ({size}x{size})")
    
    print(f"\n🎉 Todos os favicons foram gerados com sucesso!")
    print(f"📁 Salvos em: {os.path.abspath(OUTPUT_DIR)}")

if __name__ == "__main__":
    create_favicons()
