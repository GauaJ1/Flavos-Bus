# Gerador dos assets de marca do Flavos Bus (fatia 1 do redesign).
# Entrada: apps/mobile/assets/brand/flavos-bus-emblem.png (1254x1254).
# Saida: assets recortados + icons + splashes + prancha de conferencia.
# Roda com o Python do runtime DSH (tem Pillow). Todas as provas sao
# numericas e impressas (o modelo nao ve imagens; a conferencia visual
# humana usa a prancha).
import math
from PIL import Image, ImageDraw, ImageFont

BRAND = r"apps\mobile\assets\brand"
EMBLEM_IN = BRAND + r"\flavos-bus-emblem.png"

# ---- 1) recorte da margem branca excedente -------------------------------
orig = Image.open(EMBLEM_IN).convert("RGB")
ow, oh = orig.size
import numpy as np  # after PIL import keeps deps explicit
a_orig = np.asarray(orig)
nao_branco = (a_orig < 240).any(axis=2)  # qualquer canal abaixo de 240 = tinta
ys, xs = np.where(nao_branco)
bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
lado_maior = max(bx1 - bx0 + 1, by1 - by0 + 1)
pad = int(0.04 * lado_maior)
cx0, cy0 = max(0, bx0 - pad), max(0, by0 - pad)
cx1, cy1 = min(ow - 1, bx1 + pad), min(oh - 1, by1 + pad)
recorte = orig.crop((cx0, cy0, cx1 + 1, cy1 + 1))
recorte_path = BRAND + r"\emblem_recorte.png"
recorte.save(recorte_path)
area_orig = ow * oh
area_rec = recorte.size[0] * recorte.size[1]
print("=== 1) RECORTE ===")
print("  original: {}x{} | bbox do desenho: x[{}..{}] y[{}..{}]".format(
    ow, oh, bx0, bx1, by0, by1))
print("  bbox em % do canvas: x[{},{}] y[{},{}] (padding {})".format(
    round(100 * bx0 / ow, 1), round(100 * bx1 / ow, 1),
    round(100 * by0 / oh, 1), round(100 * by1 / oh, 1), pad))
print("  recorte: {0}x{1} | area util {2:.1f}% do original (margem removida {3:.1f}%)".format(
    recorte.size[0], recorte.size[1], 100 * area_rec / area_orig,
    100 - 100 * area_rec / area_orig))

# fundo branco -> alfa (unpremultiply): bordas anti-alias preservadas.
# Detalhes brancos INTERNOS do desenho ficam transparentes e, como todos
# os alvos (adaptive bg, iOS icon, tile) sao brancos, o resultado e
# visualmente identico ao original neles.
def branca_para_alfa(img_rgb):
    a = np.asarray(img_rgb).astype(np.float64)
    alfa = 255.0 - a.min(axis=2)  # 0 no branco puro, 255 na tinta cheia
    seguro = np.maximum(alfa, 1e-6) / 255.0
    rgb = np.clip((a - (1.0 - seguro[..., None]) * 255.0) / seguro[..., None], 0, 255)
    saida = np.dstack([rgb, alfa]).astype(np.uint8)
    return Image.fromarray(saida, "RGBA")

simbolo = branca_para_alfa(recorte)

# ---- 2) icone adaptativo Android (zona segura 66%) ------------------------
CANVAS = 1024
RAIO_SEGURO = 0.66 * (CANVAS / 2)  # 337.92 px

def fit_no_circulo(img, alvo_raio):
    """escala o recorte para que o RETANGULO inteiro caiba inscrito no
    circulo de raio alvo (pior caso: canto do bounding box)."""
    w, h = img.size
    escala = (2 * alvo_raio) / math.sqrt(w * w + h * h)
    return img.resize((max(1, int(round(w * escala))), max(1, int(round(h * escala)))), Image.LANCZOS)

fg = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
emb = fit_no_circulo(simbolo, RAIO_SEGURO)
fg.paste(emb, ((CANVAS - emb.size[0]) // 2, (CANVAS - emb.size[1]) // 2), emb)
fg_path = BRAND + r"\adaptive_foreground.png"
fg.save(fg_path)

bg = Image.new("RGB", (CANVAS, CANVAS), (255, 255, 255))
bg_path = BRAND + r"\adaptive_background.png"
bg.save(bg_path)

# prova numerica: NENHUM pixel nao-transparente fora do circulo
fa = np.asarray(fg)
opacos = fa[..., 3] > 0
ys2, xs2 = np.where(opacos)
raio_max = float(np.max(np.sqrt((xs2 - CANVAS / 2.0) ** 2 + (ys2 - CANVAS / 2.0) ** 2)))
print("=== 2) ADAPTATIVE ANDROID ===")
print("  foreground {}x{} RGBA | fundo {}x{} RGB branco".format(CANVAS, CANVAS, CANVAS, CANVAS))
print("  zona segura solicitada: circulo 66% -> raio {:.2f}px".format(RAIO_SEGURO))
print("  PROVA: raio maximo medido de pixel opaco = {:.2f}px ({} pixels opacos) -> {}".format(
    raio_max, int(opacos.sum()), "DENTRO da zona segura" if raio_max <= RAIO_SEGURO else "FORA (ERRO)"))
assert raio_max <= RAIO_SEGURO + 0.51  # tolerancia de 1px de raster

# ---- 3) icone iOS (1024 RGB, sem alfa, sem cantos) -------------------------
ios = Image.new("RGB", (CANVAS, CANVAS), (255, 255, 255))
lado_ios = int(0.78 * CANVAS)
emb_ios = simbolo.copy()
emb_ios.thumbnail((lado_ios, lado_ios), Image.LANCZOS)
ios.paste(emb_ios, ((CANVAS - emb_ios.size[0]) // 2, (CANVAS - emb_ios.size[1]) // 2), emb_ios)
ios_path = BRAND + r"\icon-ios-1024.png"
ios.save(ios_path, mode="RGB")  # RGB => PNG SEM canal alfa
ios_check = Image.open(ios_path)
print("=== 3) ICONE iOS ===")
print("  {}x{} mode={} (sem transparente: {}) | simbolo fit {} px (margem {}%)".format(
    ios_check.size[0], ios_check.size[1], ios_check.mode,
    "ok" if ios_check.mode == "RGB" else "ERRO", lado_ios, round(100 - 0.78 * 100)))
extremos = ios_check.getextrema()
print("  getextrema por canal: {} (3 canais = RGB, nenhum alfa)".format(extremos))

# ---- 4) splashes -----------------------------------------------------------
LADO_SPLASH = 640
spl_c = simbolo.copy()
spl_c.thumbnail((460, 460), Image.LANCZOS)
spl_claro = Image.new("RGBA", (LADO_SPLASH, LADO_SPLASH), (0, 0, 0, 0))
spl_claro.paste(spl_c, ((LADO_SPLASH - spl_c.size[0]) // 2, (LADO_SPLASH - spl_c.size[1]) // 2), spl_c)
spl_claro_path = BRAND + r"\splash_claro.png"
spl_claro.save(spl_claro_path)

TILE = 460
spl_e = Image.new("RGBA", (LADO_SPLASH, LADO_SPLASH), (0, 0, 0, 0))
mask_tile = Image.new("L", (TILE, TILE), 0)
ImageDraw.Draw(mask_tile).rounded_rectangle([0, 0, TILE - 1, TILE - 1], radius=int(0.22 * TILE), fill=255)
spl_e.paste(Image.new("RGB", (TILE, TILE), (255, 255, 255)), ((LADO_SPLASH - TILE) // 2, (LADO_SPLASH - TILE) // 2), mask_tile)
emb_e = simbolo.copy()
emb_e.thumbnail((int(0.72 * TILE), int(0.72 * TILE)), Image.LANCZOS)
spl_e.paste(emb_e, ((LADO_SPLASH - emb_e.size[0]) // 2, (LADO_SPLASH - emb_e.size[1]) // 2), emb_e)
spl_escuro_path = BRAND + r"\splash_escuro.png"
spl_e.save(spl_escuro_path)

print("=== 4) SPLASHES ===")
for nome, path in [("claro", spl_claro_path), ("escuro", spl_escuro_path)]:
    im = Image.open(path)
    al = np.asarray(im)[..., 3]
    ys3, xs3 = np.where(al > 0)
    cxb, cyb = (xs3.min() + xs3.max()) / 2.0, (ys3.min() + ys3.max()) / 2.0
    off_x = abs(cxb - (im.size[0] - 1) / 2.0)
    off_y = abs(cyb - (im.size[1] - 1) / 2.0)
    print("  splash {}: {}x{} | bbox tinta x[{}..{}] y[{}..{}] | offset do centro ({:.1f}, {:.1f})px".format(
        nome, im.size[0], im.size[1], xs3.min(), xs3.max(), ys3.min(), ys3.max(), off_x, off_y))
print("  (fundo entram pelo backgroundColor do plugin: claro #FFFFFF, escuro #0B0E17)")
print("  sem wordmark: splash usa o EMBLEMA (recorte sem nome).")

# ---- 5) prancha de conferencia (gitignored) --------------------------------
def mascara(img, modo):
    w, h = img.size
    m = Image.new("L", (w, h), 0)
    if modo == "circulo":
        ImageDraw.Draw(m).ellipse([0, 0, w - 1, h - 1], fill=255)
    else:
        ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(0.18 * w), fill=255)
    saida = Image.new("RGB", (w, h), (255, 255, 255))
    saida.paste(img, (0, 0), m)
    return saida

CH = 560  # celula
prancha = Image.new("RGB", (CH * 5 + 60, CH + 110), (232, 235, 240))
dr = ImageDraw.Draw(prancha)

def celula(idx, tela_fundo, conteudo, rotulo):
    x0 = 24 + idx * (CH + 4)
    dr.rectangle([x0, 24, x0 + CH, 24 + CH], fill=tela_fundo)
    if conteudo is not None:
        conteudo = conteudo.copy()
        conteudo.thumbnail((CH - 40, CH - 40))
        prancha.paste(conteudo, (x0 + (CH - conteudo.size[0]) // 2, 24 + (CH - conteudo.size[1]) // 2),
                      conteudo if conteudo.mode == "RGBA" else None)
    dr.text((x0 + 8, 26 + CH + 10), rotulo, fill=(20, 20, 30))

composto = Image.alpha_composite(bg.convert("RGBA"), fg.resize((CANVAS, CANVAS)))  # bg + fg
celula(0, (255, 255, 255), mascara(composto, "circulo"), "Android circular")
celula(1, (255, 255, 255), composto, "Android quadrado")
celula(2, (255, 255, 255), mascara(ios, "rounded"), "iOS arredondado (mask loja)")
celula(3, (11, 14, 23), Image.open(spl_escuro_path), "splash escuro (#0B0E17)")
celula(4, (255, 255, 255), Image.open(spl_claro_path), "splash claro (#FFFFFF)")
prancha_path = r".claude\prancha_fatia1.png"
prancha.save(prancha_path)
print("=== 5) PRANCHA ===")
print("  {}".format(prancha_path))
print()
print("assets gerados em {}/:".format(BRAND))
for p in [recorte_path, fg_path, bg_path, ios_path, spl_claro_path, spl_escuro_path]:
    import os
    print("  {} ({} bytes, {}x{})".format(p, os.path.getsize(p), Image.open(p).size[0], Image.open(p).size[1]))
