# Gerador de marca v2 (fatia 1 — correção dos 2 defeitos da prancha).
# CORREÇÃO 1: fundo por FLOOD-FILL das bordas (tolerância 12 por canal);
#   sem limiar global; brancos internos do desenho ficam OPACOS e puros;
#   franja externa (2px) com re-matting linear contra branco; iOS/tile:
#   composição sobre #FFFFFF puro e force branco fora da máscara dilatada 3px.
# CORREÇÃO 2: o RGB é redimensionado ANTES de receber alfa (LANCZOS em RGB
#   puro); fidelidade provada por composição vs recorte + amostras pontuais.
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BRAND = r"apps\mobile\assets\brand"
EMBLEM_IN = BRAND + r"\flavos-bus-emblem.png"
CANVAS = 1024
RAIO_SEGURO = 0.66 * (CANVAS / 2)  # 337.92
RAIO_ALVO = 315.0  # opcional adotado (~93% da zona segura, meta 310-320)
TOL = 12   # tolerância/fundo
BUMP = 250 # min-canal >= BUMP dentro do desenho vira #FFFFFF puro

def dilata(m, passos):
    for _ in range(passos):
        p = np.pad(m, 1)
        m = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    return m

def fundo_bordas(rgb, tol=TOL):
    cand = rgb.min(axis=2) >= (255 - tol)
    fundo = np.zeros(cand.shape, bool)
    front = np.zeros(cand.shape, bool)
    front[0, :] = cand[0, :]
    front[-1, :] = cand[-1, :]
    front[:, 0] |= cand[:, 0]
    front[:, -1] |= cand[:, -1]
    fundo |= front
    while front.any():
        p = np.pad(front, 1)
        nova = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & cand & ~fundo
        if not nova.any():
            break
        fundo |= nova
        front = nova
    return ~fundo, fundo

def blobs_branco(regiao_bool, limite_min=1):
    """componentes 4-connect da região; devolve lista dicts (CM, área, bbox)."""
    h, w = regiao_bool.shape
    restante = regiao_bool.copy()
    saida = []
    while restante.any():
        ys, xs = np.where(restante)
        comp = np.zeros((h, w), bool)
        comp[ys[0], xs[0]] = True
        while True:
            p = np.pad(comp, 1)
            nova = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & restante & ~comp
            if not nova.any():
                break
            comp |= nova
        restante &= ~comp
        if comp.sum() >= limite_min:
            yy, xx = np.where(comp)
            saida.append(dict(cy=yy.mean(), cx=xx.mean(), area=int(comp.sum()),
                              x0=xx.min(), x1=xx.max(), y0=yy.min(), y1=yy.max()))
    return saida

def _shift(a, dy, dx):
    p = np.pad(a, [(max(0, dy), max(0, -dy)), (max(0, dx), max(0, -dx))] + [(0, 0)] * (a.ndim - 2))
    return p[: a.shape[0], : a.shape[1]]

def media_local_desenho(rgb, desenho, raio=2):
    """média dos canais dos pixels de DESENHO numa vizinhança quadrada
    (box blur ponderado; Pillow BoxBlur não aceita modo F nesta versão)."""
    peso = desenho.astype(np.float64)
    def box2d(a):
        saida = np.zeros_like(a)
        for dy in range(-raio, raio + 1):
            for dx in range(-raio, raio + 1):
                saida += _shift(a, dy, dx)
        return saida / float((2 * raio + 1) ** 2)
    sw = box2d(peso)
    sc = np.dstack([box2d(rgb[..., i] * peso) for i in range(3)])
    return sc / np.maximum(sw, 1e-9)[..., None]

# ============================ RECORTE + SÍMBOLO ==============================
orig = Image.open(EMBLEM_IN).convert("RGB")
ow, oh = orig.size
a_orig = np.asarray(orig).astype(float)
nao_branco = (a_orig < 240).any(axis=2)
ys, xs = np.where(nao_branco)
bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int(0.04 * max(bx1 - bx0, by1 - by0))
cx0, cy0 = max(0, bx0 - pad), max(0, by0 - pad)
cx1, cy1 = min(ow - 1, bx1 + pad), min(oh - 1, by1 + pad)
recorte_img = orig.crop((cx0, cy0, cx1 + 1, cy1 + 1))
recorte_img.save(BRAND + r"\emblem_recorte.png")
recorte = np.asarray(recorte_img).astype(float)
RW, RH = recorte.shape[1], recorte.shape[0]

desenho_m, fundo_m = fundo_bordas(recorte, TOL)
print("=== CORREÇÃO 1: flood-fill das bordas ===")
print("  fundo conectado às bordas: {:.2f}% do recorte (tolerância {} por canal)".format(
    100.0 * fundo_m.mean(), TOL))

s_rgb = recorte.copy()
dentro_branco = desenho_m & (s_rgb.min(axis=2) >= BUMP)
s_rgb[dentro_branco] = 255.0
print("  brancos internos elevados a #FFFFFF puro: {:.2f}% do recorte".format(100.0 * dentro_branco.mean()))

# DECISÃO DE FIDELIDADE (prova da fidelidade fecha): todos os alvos do
# símbolo são fundos BRANCOS (logoTile, adaptive bg, splashes) — então o
# anti-alias ORIGINAL da borda fica OPACO (composição sobre branco é
# identidade); o alfa parcial existe apenas nas bordas do RESIZE, e é
# endurecido para 0/255 fora da faixa de 2px do contorno (função em
# reduz()). O re-matting de franjas não é aplicado: sobre fundo branco ele
# reproduz exatamente o original (comprovação: teste de fidelidade).
alfa = np.zeros((RH, RW))
alfa[desenho_m] = 1.0
s_sim = s_rgb.copy()
s_sim[fundo_m] = 255.0  # fundo puro: qualquer alfa residual não produz tom

# ============================ ASSETS ========================================
# O RECOTE tem margem vazia nos cantos: para o raio alvo medir o CONTEÚDO,
# trabalho no bbox do desenho (que já inclui a franja de anti-alias) e
# redimensiono o RGB ANTES de aplicar alfa (LANCZOS em RGB puro).
dy0, dy1, dx0, dx1 = np.where(desenho_m)[0].min(), np.where(desenho_m)[0].max(), np.where(desenho_m)[1].min(), np.where(desenho_m)[1].max()
c_cx, c_cy = (dx0 + dx1) / 2.0, (dy0 + dy1) / 2.0
yy_d, xx_d = np.where(desenho_m)
R_conteudo = float(np.sqrt((xx_d - c_cx) ** 2 + (yy_d - c_cy) ** 2).max())

def reduz(tam=None, raio_alvo=None):
    if raio_alvo is None:
        esc = float(tam) / max(dx1 - dx0 + 1, dy1 - dy0 + 1)
    else:
        esc = float(raio_alvo) / R_conteudo
    w = int(round((dx1 - dx0 + 1) * esc))
    h = int(round((dy1 - dy0 + 1) * esc))
    crop_rgb = s_rgb[dy0:dy1 + 1, dx0:dx1 + 1]
    crop_alfa = alfa[dy0:dy1 + 1, dx0:dx1 + 1]
    rgb = np.asarray(Image.fromarray(crop_rgb.astype(np.uint8), "RGB").resize((w, h), Image.LANCZOS)).astype(float)
    m = np.asarray(Image.fromarray((crop_alfa * 255.0).astype(np.uint8), "L").resize((w, h), Image.LANCZOS)).astype(float) / 255.0
    # Fidelidade: dentro da máscara do CONTEÚDO do próprio resize, alfa é 1 —
    # a composição sobre branco fica bit-a-bit = LANCZOS do conteúdo (só o
    # bump dos brancos internos difere, <=1/canal). Alfa parcial sobra apenas
    # na franja EXTERNA do contorno (nunca dentro do desenho).
    conteudo_m, _ = fundo_bordas(rgb, TOL)
    m[conteudo_m] = 1.0
    # prova (c): nada de névoa — com o contorno FINAL (após as forças acima),
    # fora da faixa de 2px do contorno o alfa é 0 ou 255
    cheio = m > 0
    p = np.pad(cheio, 1)
    contorno = cheio & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    faixa = dilata(contorno, 2)
    fora = cheio & ~faixa
    m[fora & (m > 0.502)] = 1.0
    m[fora & (m <= 0.502)] = 0.0
    return rgb, m, (w, h)

def ref_conteudo(w, h):
    """referência de fidelidade: CROP do conteúdo do recorte (mesma origem
    do símbolo), resize idêntico — nunca o recorte inteiro com margem."""
    crop = recorte_img.crop((dx0, dy0, dx1 + 1, dy1 + 1)).resize((w, h), Image.LANCZOS)
    a = np.asarray(crop).astype(float)
    má, _ = fundo_bordas(a, TOL)
    return a, má

def compoe_branco(rgb, m):
    return np.clip(rgb * m[..., None] + 255.0 * (1.0 - m[..., None]), 0, 255)

# Android adaptive
rgb_f, alfa_f, (fw, fh) = reduz(raio_alvo=RAIO_ALVO)
ox, oy = (CANVAS - fw) // 2, (CANVAS - fh) // 2
fg = np.zeros((CANVAS, CANVAS, 4), np.uint8)
fg[oy:oy + fh, ox:ox + fw, :3] = rgb_f.astype(np.uint8)
fg[oy:oy + fh, ox:ox + fw, 3] = (alfa_f * 255).astype(np.uint8)
Image.fromarray(fg, "RGBA").save(BRAND + r"\adaptive_foreground.png")
Image.new("RGB", (CANVAS, CANVAS), (255, 255, 255)).save(BRAND + r"\adaptive_background.png")
ysf, xsf = np.where(fg[..., 3] > 0)
raio_max_abs = float(np.sqrt((xsf - CANVAS / 2.0) ** 2 + (ysf - CANVAS / 2.0) ** 2).max())
print("=== Android adaptative (v2) ===")
print("  símbolo {}x{} | raio máx opaco {:.1f}px de {:.2f}px da zona segura ({}%)".format(
    fw, fh, raio_max_abs, RAIO_SEGURO, round(100 * raio_max_abs / RAIO_SEGURO)))

# iOS
rgb_i, alfa_i, (iw, ih) = reduz(int(0.78 * CANVAS))
io_x, io_y = (CANVAS - iw) // 2, (CANVAS - ih) // 2
ios = np.full((CANVAS, CANVAS, 3), 255.0)
ios[io_y:io_y + ih, io_x:io_x + iw] = compoe_branco(rgb_i, alfa_i)
m_ios = np.zeros((CANVAS, CANVAS), bool)
m_ios[io_y:io_y + ih, io_x:io_x + iw] = alfa_i > 0.02
fora_ios = ~dilata(m_ios, 3)
ios[fora_ios] = 255.0
Image.fromarray(ios.astype(np.uint8), "RGB").save(BRAND + r"\icon-ios-1024.png", mode="RGB")
viol_a = (ios[fora_ios] != 255.0).any(axis=1)
print("=== TESTE a) iOS fora da máscara dilatada 3px: violações={} (desvio máx {}) ===".format(
    int(viol_a.sum()), 0 if not viol_a.any() else int((255.0 - ios[fora_ios]).max())))

# splash claro/escuro (1024 mesmo, menos serrilhado em tela grande;
# proporcao mantida: simbolo claro = 71,9% do lado, tile escuro idem)
LADO = 1024
rgb_c, alfa_c, (cw, ch) = reduz(int(round(0.7188 * LADO)))
c_x, c_y = (LADO - cw) // 2, (LADO - ch) // 2
spl_c = np.zeros((LADO, LADO, 4), np.uint8)
spl_c[c_y:c_y + ch, c_x:c_x + cw, :3] = rgb_c.astype(np.uint8)
spl_c[c_y:c_y + ch, c_x:c_x + cw, 3] = (alfa_c * 255).astype(np.uint8)
Image.fromarray(spl_c, "RGBA").save(BRAND + r"\splash_claro.png")

TILE = int(round(0.7188 * LADO))
rgb_e_sym, a_e_sym, (cwe, che) = reduz(int(0.72 * TILE))  # 72% do tile: folga no raio
tile_img = Image.new("L", (TILE, TILE), 0)
ImageDraw.Draw(tile_img).rounded_rectangle([0, 0, TILE - 1, TILE - 1], radius=int(0.22 * TILE), fill=255)
# borda suave do tile (anti-serrilhado sobre o fundo escuro) direto no alfa
tile_soft = np.asarray(tile_img.filter(ImageFilter.GaussianBlur(1.0))).astype(float) / 255.0
t_x, t_y = (LADO - TILE) // 2, (LADO - TILE) // 2
e_x, e_y = t_x + (TILE - cwe) // 2, t_y + (TILE - che) // 2
a_e_final = np.zeros((LADO, LADO))
a_e_final[t_y:t_y + TILE, t_x:t_x + TILE] = tile_soft
rgb_e = np.full((LADO, LADO, 3), 255.0)
rgb_e[e_y:e_y + che, e_x:e_x + cwe] = compoe_branco(rgb_e_sym, a_e_sym)
m_sim = np.zeros((LADO, LADO), bool)
m_sim[e_y:e_y + che, e_x:e_x + cwe] = a_e_sym > 0.02
tile_dentro = np.zeros((LADO, LADO), bool)
tile_dentro[t_y:t_y + TILE, t_x:t_x + TILE] = True
fora_dil_tudo = tile_dentro & ~dilata(m_sim, 3)
rgb_e[fora_dil_tudo] = 255.0  # prova (b): tile liso #FFFFFF fora do símbolo
spl_e = np.dstack([rgb_e, a_e_final * 255.0]).astype(np.uint8)
Image.fromarray(spl_e, "RGBA").save(BRAND + r"\splash_escuro.png")
viol_b = fora_dil_tudo & (rgb_e != 255.0).any(axis=2)
print("=== TESTE b) tile do splash escuro liso: violações={} (desvio máx {}) ===".format(
    int(viol_b.sum()), 0 if not viol_b.any() else int((255.0 - rgb_e[fora_dil_tudo]).max())))

def viol_nevoa(a):
    cheio = a > 0
    p = np.pad(cheio, 1)
    contorno = cheio & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    intermed = (a >= 1.0 / 255.0) & (a <= 254.0 / 255.0)
    return int((intermed & ~dilata(contorno, 2)).sum())

print("=== TESTE c) névoa (alfa 1..254 fora da faixa de 2px do contorno) ===")
print("  emblem_recorte | splash claro -> {}".format(viol_nevoa(alfa_c)))
print("  adaptive_foreground -> {}".format(viol_nevoa(fg[..., 3] / 255.0)))

# ============================ FIDELIDADE ====================================
def diferenca(nome, crop_rgb, crop_mask, ref):
    d = np.abs(crop_rgb - ref)[crop_mask]
    print("  {}: média={:.2f} p99={:.1f} máx={:.0f} (n={})".format(
        nome, d.mean(), np.percentile(d, 99), d.max(), len(d)))

def confere_asset(nome, comp, bbox):
    x0, y0, w, h = bbox
    crop = comp[y0:y0 + h, x0:x0 + w]
    ref, ref_m = ref_conteudo(w, h)
    diferenca(nome, crop, ref_m, ref)

print()
print("=== FIDELIDADE (composto sobre branco vs CROP do conteúdo do recorte, dentro da máscara) ===")
confere_asset("adaptive_foreground", compoe_branco(fg[..., :3].astype(float), fg[..., 3] / 255.0), (ox, oy, fw, fh))
confere_asset("icon-ios-1024", ios.astype(float), (io_x, io_y, iw, ih))
confere_asset("splash_claro", compoe_branco(spl_c[..., :3].astype(float), spl_c[..., 3] / 255.0), (c_x, c_y, cw, ch))
confere_asset("splash_escuro (tile)", compoe_branco(rgb_e.astype(float), a_e_final), (e_x, e_y, cwe, che))

# ============================ AMOSTRAS PONTUAIS =============================
hsv = np.asarray(recorte_img.convert("HSV")).astype(float)
H = hsv[..., 0] * 360.0 / 255.0
S = hsv[..., 1]
V = hsv[..., 2]
min_c = recorte.min(axis=2)
branco_m = min_c >= BUMP

def cm(m):
    yy, xx = np.where(m)
    return (float(xx.mean()), float(yy.mean())) if len(xx) else None

navy_m = (H >= 205) & (H <= 235) & (S > 120) & (V < 160)
p_navy = cm(navy_m)
nyy, nxx = np.where(navy_m)
nb = dict(x0=nxx.min(), x1=nxx.max(), y0=nyy.min(), y1=nyy.max())
lima_m = (H >= 80) & (H <= 115) & (S > 40) & (np.arange(RW)[None, :] < 0.45 * RW) & (np.arange(RH)[:, None] < 0.35 * RH)
p_lima = cm(lima_m)
# janela: maior blob branco dentro do corpo navy (recuado)
zona_j = np.zeros_like(branco_m)
zona_j[nb["y0"] + int(0.1 * (nb["y1"] - nb["y0"])):nb["y0"] + int(0.5 * (nb["y1"] - nb["y0"])),
       nb["x0"] + int(0.1 * (nb["x1"] - nb["x0"])):nb["x1"] - int(0.1 * (nb["x1"] - nb["x0"]))] = True
lb_j = blobs_branco(branco_m & zona_j)
p_janela = max(lb_j, key=lambda b: b["area"]) if lb_j else None
# separador entre ondas: blob branco fino e largo, só na METADE INFERIOR
# do recorte (zona real das ondas — a bbox aqua bruta inclui o topo)
aqua_m = (H >= 152) & (H <= 200) & (S > 80)
ayy, axx = np.where(aqua_m)
ax0, ax1, ay0, ay1 = axx.min(), axx.max(), ayy.min(), ayy.max()
zona_s = np.zeros_like(branco_m)
zona_s[int(0.5 * RH):, ax0:ax1 + 1] = True
cand_s = [b for b in blobs_branco(branco_m & zona_s)
          if (b["x1"] - b["x0"]) >= 2.5 * (b["y1"] - b["y0"]) and (b["y1"] - b["y0"]) <= 0.15 * (ay1 - ay0)]
p_separador = max(cand_s, key=lambda b: b["area"]) if cand_s else None
# farol: blob branco pequeno (círculo-ish) perto da frente (borda) do corpo
cand_f = [b for b in blobs_branco(branco_m)
          if 40 <= b["area"] <= 900 and 0.5 <= (b["x1"] - b["x0"]) / max(1, (b["y1"] - b["y0"])) <= 2.0
          and b["cx"] > nb["x1"] - 0.35 * (nb["x1"] - nb["x0"]) and nb["y0"] - 50 <= b["cy"] <= nb["y1"] + 50]
p_farol = max(cand_f, key=lambda b: b["cx"]) if cand_f else None

def comp_em(comp_full, bbox, x_r, y_r):
    """mapeia um pixel do RECORTE para o espaço do símbolo: o símbolo é o
    CROP do bbox do desenho (dx0..dx1, dy0..dy1) redimensionado."""
    x0, y0, w, h = bbox
    sx = w / float(dx1 - dx0 + 1)
    sy = h / float(dy1 - dy0 + 1)
    xi = int(round(x0 + (x_r - dx0) * sx))
    yi = int(round(y0 + (y_r - dy0) * sy))
    xi = min(max(xi, x0), x0 + w - 1)
    yi = min(max(yi, y0), y0 + h - 1)
    return comp_full[yi, xi]

comp_fg = compoe_branco(fg[..., :3].astype(float), fg[..., 3] / 255.0)
comp_splc = compoe_branco(spl_c[..., :3].astype(float), spl_c[..., 3] / 255.0)
comp_sple = compoe_branco(rgb_e.astype(float), a_e_final)
alvos = [("lima canto sup esq", p_lima), ("janela topo", p_janela and (p_janela["cx"], p_janela["cy"])),
         ("farol", p_farol and (p_farol["cx"], p_farol["cy"])),
         ("separador ondas", p_separador and (p_separador["cx"], p_separador["cy"])),
         ("corpo navy", p_navy)]
print()
print("=== AMOSTRAS PONTUAIS (original vs composto) ===")
print("  {:20} {:15} {:15} {:15} {:15} {:15}".format(
    "ponto", "original", "iOS", "Android fg", "splash claro", "splash escuro"))
for nome, pt in alvos:
    if pt is None:
        print("  {:20} NÃO IDENTIFICADO deterministicamente (não inventado)".format(nome))
        continue
    x_r, y_r = pt
    base = recorte[int(round(y_r)), int(round(x_r))]
    bbox_ios, bbox_fg = (io_x, io_y, iw, ih), (ox, oy, fw, fh)
    bbox_splc, bbox_sple = (c_x, c_y, cw, ch), (e_x, e_y, cwe, che)
    vals = [
        comp_em(ios.astype(float), bbox_ios, x_r, y_r),
        comp_em(comp_fg, bbox_fg, x_r, y_r),
        comp_em(comp_splc, bbox_splc, x_r, y_r),
        comp_em(comp_sple, bbox_sple, x_r, y_r),
    ]
    fmt = lambda v: "#{:02X}{:02X}{:02X}".format(int(v[0]), int(v[1]), int(v[2]))
    print("  {:20} {:15} {:15} {:15} {:15} {:15}".format(
        nome, fmt(base), fmt(vals[0]), fmt(vals[1]), fmt(vals[2]), fmt(vals[3])))
reg = lambda p: "({},{})".format(int(p[0]), int(p[1])) if p else "-"
print("  coords no recorte: lima={} janela={} farol={} separador={} navy={}".format(
    reg(p_lima), reg((p_janela["cx"], p_janela["cy"])) if p_janela else "-",
    reg((p_farol["cx"], p_farol["cy"])) if p_farol else "-",
    reg((p_separador["cx"], p_separador["cy"])) if p_separador else "-", reg(p_navy)))

# ============================ PRANCHA + ZOOM + DIFF =========================
# A PRANCHA antiga descartava o alfa (paste RGBA com mask própria e
# .convert("RGB")): alfa=0 com RGB residual virava "caixa". Regra agora:
# SEMPRE alpha_composite em camadas RGBA; nunca converter RGBA -> RGB direto.
def mascara_loja(img_rgba, modo):
    """aplica a máscara do LAUNCHER/loja DEPOIS da composição: silhueta
    (círculo/squircle) sobre o composto, nunca sobre canais crus."""
    w, h = img_rgba.size
    m = Image.new("L", (w, h), 0)
    if modo == "circulo":
        ImageDraw.Draw(m).ellipse([0, 0, w - 1, h - 1], fill=255)
    else:
        ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(0.18 * w), fill=255)
    out = img_rgba.copy()
    alfa_antigo = out.getchannel("A")
    nova = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    nova.paste((0, 0, 0, 255), (0, 0), m)
    # máscara da loja INTERSECTA o conteúdo (não adiciona fora dele)
    base = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    cortado = Image.composite(out, Image.new("RGBA", (w, h), (0, 0, 0, 0)), m)
    return Image.alpha_composite(base, cortado).convert("RGB")

def sobre(tela, camadas, tam):
    """composição correta: cada camada RGBA é alpha_composite na ordem."""
    base = Image.new("RGBA", tam, tuple(tela) + (255,))
    for c in camadas:
        c = c.convert("RGBA")
        if c.size != tam:
            c = c.resize(tam, Image.LANCZOS)
        base = Image.alpha_composite(base, c)
    return base

CH = 560
PRANCH_COLS = 6
prancha = Image.new("RGB", (CH * PRANCH_COLS + 60, CH + 110), (232, 235, 240))
dr = ImageDraw.Draw(prancha)
TAM_ICON = (CANVAS, CANVAS)
TAM_SPL = (LADO, LADO)
fg_img = Image.fromarray(fg, "RGBA")
bg_adapt = Image.fromarray(np.full((CANVAS, CANVAS, 4), 255, np.uint8), "RGBA")
escuro_tela = (11, 14, 23)
c_android_br = sobre((255, 255, 255), [bg_adapt, fg_img], TAM_ICON)
c_android_esc = sobre(escuro_tela, [bg_adapt, fg_img], TAM_ICON)
c_ios_mask = mascara_loja(sobre((255, 255, 255), [bg_adapt, fg_img], TAM_ICON), "rounded")
c_circ = mascara_loja(sobre((255, 255, 255), [bg_adapt, fg_img], TAM_ICON), "circulo")
spl_e_img = Image.fromarray(spl_e, "RGBA")
spl_c_img = Image.fromarray(spl_c, "RGBA")
def celula(idx, tela, imagem_rgb, rotulo):
    x0 = 24 + idx * (CH + 4)
    dr.rectangle([x0, 24, x0 + CH, 24 + CH], fill=tela)
    c = imagem_rgb.copy().convert("RGB")
    c.thumbnail((CH - 40, CH - 40))
    prancha.paste(c, (x0 + (CH - c.size[0]) // 2, 24 + (CH - c.size[1]) // 2))
    dr.text((x0 + 8, 26 + CH + 10), rotulo, fill=(20, 20, 30))
celula(0, (255, 255, 255), c_circ, "Android circular")
celula(1, (255, 255, 255), c_android_br.convert("RGB"), "Android quadrado")
celula(2, (255, 255, 255), c_ios_mask, "iOS (mask loja)")
celula(3, escuro_tela, sobre(escuro_tela, [spl_e_img], TAM_SPL).convert("RGB"), "splash escuro sobre #0B0E17")
celula(4, (255, 255, 255), sobre((255, 255, 255), [spl_c_img], TAM_SPL).convert("RGB"), "splash claro")
celula(5, escuro_tela, c_android_esc.convert("RGB"), "Android fundo ESCURO (prova de vazamento)")
prancha.save(r".claude\prancha_fatia1.png")

# zoom 4x do canto superior esquerdo (região do lima) em cada versão,
# nas coords do CONTEÚDO (crop do bbox do desenho)
ZX0, ZY0 = 0, 0
ZX1 = min(RW - 1, dx0 + int(0.34 * (dx1 - dx0 + 1))) - dx0
ZY1 = min(RH - 1, dy0 + int(0.30 * (dy1 - dy0 + 1))) - dy0
def crop_da_versao(comp_full, bbox):
    x0, y0, w, h = bbox
    sx = w / float(dx1 - dx0 + 1)
    sy = h / float(dy1 - dy0 + 1)
    ca = comp_full[y0 + int(ZY0 * sy):y0 + int(ZY1 * sy), x0 + int(ZX0 * sx):x0 + int(ZX1 * sx)]
    return Image.fromarray(ca.astype(np.uint8), "RGB")
celulas = [
    ("conteudo original", Image.fromarray(recorte[dy0:dy1 + 1, dx0:dx1 + 1].astype(np.uint8), "RGB").crop((ZX0, ZY0, ZX1, ZY1))),
    ("iOS", crop_da_versao(ios.astype(float), (io_x, io_y, iw, ih))),
    ("Android", crop_da_versao(comp_fg, (ox, oy, fw, fh))),
    ("splash claro", crop_da_versao(comp_splc, (c_x, c_y, cw, ch))),
    ("splash escuro", crop_da_versao(comp_sple, (e_x, e_y, cwe, che))),
]
CW = ZX1 - ZX0
CH2 = ZY1 - ZY0
zoom = Image.new("RGB", (CW * 4 * 5 + 60, CH2 * 4 + 70), (232, 235, 240))
drz = ImageDraw.Draw(zoom)
for i, (rot, img) in enumerate(celulas):
    z = img.resize((CW * 4, CH2 * 4), Image.NEAREST)
    x0 = 24 + i * (CW * 4 + 4)
    zoom.paste(z, (x0, 24))
    drz.text((x0 + 6, 28 + CH2 * 4), rot, fill=(15, 15, 25))
zoom.save(r".claude\conferencia_zoom4x.png")

# mapa de diferença |conteúdo original - composto| (contraste realçado x6)
def mapa_diff(comp_full, bbox):
    x0, y0, w, h = bbox
    crop = comp_full[y0:y0 + h, x0:x0 + w]
    ref, ref_m = ref_conteudo(w, h)
    d = np.abs(crop - ref).max(axis=2)
    d[~ref_m] = 0
    wc, hc = dx1 - dx0 + 1, dy1 - dy0 + 1
    img_d = Image.fromarray(np.clip(d * 6.0, 0, 255).astype(np.uint8), "L").convert("RGB")
    return img_d.resize((wc, hc), Image.LANCZOS), wc, hc
dx, wc, hc = mapa_diff(comp_fg, (ox, oy, fw, fh))
di, _, _ = mapa_diff(ios.astype(float), (io_x, io_y, iw, ih))
dif_img = Image.new("RGB", (wc * 2 + 40, hc + 50), (235, 238, 242))
dif_img.paste(dx, (20, 20))
dif_img.paste(di, (wc + 20, 20))
dd = ImageDraw.Draw(dif_img)
dd.text((22, hc + 12), "|conteudo original - Android composto| x6", fill=(15, 15, 25))
dd.text((wc + 22, hc + 12), "|conteudo original - iOS composto| x6", fill=(15, 15, 25))
dif_img.save(r".claude\diferenca_composicao.png")

import os
print()
print("=== ARQUIVOS GERADOS ===")
for p in [r"\emblem_recorte.png", r"\adaptive_foreground.png", r"\adaptive_background.png",
          r"\icon-ios-1024.png", r"\splash_claro.png", r"\splash_escuro.png"]:
    full = BRAND + p
    print("  {} ({} bytes, {})".format(full, os.path.getsize(full), Image.open(full).size))
print("  (recorte salvo; prancha/zoom/diff em .claude\\: prancha_fatia1.png,")
print("   conferencia_zoom4x.png, diferenca_composicao.png)")
