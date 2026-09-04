#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成博客信息图：医药二次包装套件 + 防伪标签解剖图"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mp
from matplotlib.patches import FancyBboxPatch, Rectangle
import os

OUT = os.path.join(os.path.dirname(__file__), "images", "blog")
os.makedirs(OUT, exist_ok=True)

BLUE = "#1e40af"; BLUE2 = "#3b82f6"; LIGHT = "#eff6ff"; INK = "#1e293b"
MUTED = "#64748b"; GREEN = "#16a34a"; GOLD = "#d97706"

def card(ax, x, y, w, h, title, lines, icon, color=BLUE):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.008,rounding_size=0.015",
                                fc="white", ec="#cbd5e1", lw=1.2, zorder=2))
    ax.add_patch(FancyBboxPatch((x, y + h - 0.055), w, 0.055,
                                boxstyle="round,pad=0.008,rounding_size=0.015",
                                fc=LIGHT, ec="none", zorder=3))
    ax.text(x + w/2, y + h - 0.028, title, ha="center", va="center",
            fontsize=9.8, fontweight="bold", color=BLUE, zorder=4)
    icon(ax, x + w/2, y + h*0.60, color)
    for i, ln in enumerate(lines):
        ax.text(x + w/2, y + h*0.33 - i*0.038, ln, ha="center", va="center",
                fontsize=8.5, color=MUTED, zorder=4)

def icon_carton(ax, cx, cy, c):
    ax.add_patch(Rectangle((cx-0.028, cy-0.045), 0.056, 0.075, fc=LIGHT, ec=c, lw=1.6, zorder=4))
    ax.plot([cx-0.028, cx-0.014, cx], [cy+0.03, cy+0.052, cy+0.03], color=c, lw=1.6, zorder=4)
    ax.plot([cx, cx+0.014, cx+0.028], [cy+0.03, cy+0.052, cy+0.03], color=c, lw=1.6, zorder=4)
    ax.plot([cx-0.014, cx+0.014], [cy+0.052, cy+0.052], color=c, lw=1.6, zorder=4)
    ax.plot([cx-0.017, cx+0.017], [cy-0.005, cy-0.005], color=c, lw=1.2, zorder=4)
    ax.plot([cx-0.017, cx+0.017], [cy-0.018, cy-0.018], color=c, lw=1.2, zorder=4)

def icon_leaflet(ax, cx, cy, c):
    ax.add_patch(Rectangle((cx-0.024, cy-0.048), 0.048, 0.08, fc=LIGHT, ec=c, lw=1.6, zorder=4))
    ax.plot([cx, cx], [cy-0.048, cy+0.032], color=c, lw=1.2, zorder=4)
    for dy in (0.02, 0.008, -0.004, -0.016, -0.028):
        ax.plot([cx-0.018, cx-0.004], [cy+dy, cy+dy], color=c, lw=1.0, zorder=4)
        ax.plot([cx+0.004, cx+0.018], [cy+dy, cy+dy], color=c, lw=1.0, zorder=4)

def icon_label(ax, cx, cy, c):
    ax.add_patch(FancyBboxPatch((cx-0.03, cy-0.02), 0.06, 0.04,
                 boxstyle="round,pad=0.004,rounding_size=0.008", fc=LIGHT, ec=c, lw=1.6, zorder=4))
    ax.text(cx, cy, "Rx", ha="center", va="center", fontsize=10, fontweight="bold", color=c, zorder=5)
    for i, dy in enumerate((-0.035, -0.05)):
        ax.plot([cx-0.024+i*0.006, cx+0.024-i*0.006], [cy+dy, cy+dy], color=c, lw=1.2, zorder=4)

def icon_holo(ax, cx, cy, c=GOLD):
    th = np_th = None
    import numpy as np
    t = np.linspace(0, 2*np.pi, 7)[:-1] + np.pi/2
    r1, r2 = 0.038, 0.017
    xs, ys = [], []
    for i, ang in enumerate(np.linspace(np.pi/2, np.pi/2+2*np.pi, 11)[:-1]):
        r = r1 if i % 2 == 0 else r2
        xs.append(cx + r*np.cos(ang)); ys.append(cy + r*np.sin(ang))
    ax.fill(xs, ys, fc="#fef3c7", ec=c, lw=1.6, zorder=4)
    ax.text(cx, cy, "✓", ha="center", va="center", fontsize=11, fontweight="bold", color=c, zorder=5)

def icon_blister(ax, cx, cy, c):
    ax.add_patch(Rectangle((cx-0.032, cy-0.042), 0.064, 0.084, fc=LIGHT, ec=c, lw=1.6, zorder=4))
    for dx in (-0.016, 0.016):
        for dy in (-0.02, 0.02):
            ax.add_patch(mp.Circle((cx+dx, cy+dy), 0.011, fc="white", ec=c, lw=1.3, zorder=5))

# ============ 图 1：包装套件总览 ============
fig, ax = plt.subplots(figsize=(12, 6.75), dpi=100)
ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
fig.patch.set_facecolor("#f8fafc")

ax.text(0.5, 0.93, "Pharmaceutical Secondary Packaging: The Complete Set",
        ha="center", fontsize=19, fontweight="bold", color=INK)
ax.text(0.5, 0.865, "One supplier. One quality standard. One shipment.  —  V5 Medical",
        ha="center", fontsize=11, color=MUTED)

cards = [
    ("Folding\nCartons", ["300–350 gsm paperboard", "FSC certified options", "Braille & serialization"], icon_carton, BLUE),
    ("Package Inserts\n(IFU)", ["40–60 gsm lightweight paper", "Multi-fold, multi-language", "Readability compliant"], icon_leaflet, BLUE2),
    ("Self-Adhesive\nLabels", ["Paper / PP / PET facestock", "Cold-chain adhesives", "Variable data printing"], icon_label, GREEN),
    ("Hologram\nSecurity Labels", ["Tamper-evident VOID", "Serial number + QR code", "Anti-counterfeit foil"], icon_holo, GOLD),
    ("Blister\nTrays", ["PET / PVC / PP materials", "Custom thermoform tooling", "Medical-grade cleanroom"], icon_blister, BLUE),
]
w, h, gap = 0.176, 0.58, 0.012
x0 = (1 - (5*w + 4*gap)) / 2
for i, (t, lines, ic, col) in enumerate(cards):
    card(ax, x0 + i*(w+gap), 0.16, w, h, t, lines, ic, col)

ax.text(0.5, 0.06, "v5med.net  |  ISO 13485 Certified Supply Chain  |  Factory-direct from China",
        ha="center", fontsize=9.5, color=MUTED)
plt.savefig(os.path.join(OUT, "pharma-secondary-packaging-set.png"),
            bbox_inches="tight", facecolor=fig.get_facecolor())
plt.close()
print("saved pharma-secondary-packaging-set.png")

# ============ 图 2：防伪标签解剖 ============
fig, ax = plt.subplots(figsize=(12, 6.75), dpi=100)
ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
fig.patch.set_facecolor("#f8fafc")

ax.text(0.5, 0.94, "Anatomy of an Anti-Counterfeit Hologram Label",
        ha="center", fontsize=19, fontweight="bold", color=INK)
ax.text(0.5, 0.875, "Why Philippine distributors are upgrading to multi-layer security labels",
        ha="center", fontsize=11, color=MUTED)

# 左侧：分层结构
layers = [
    ("1. PET Facestock + Holographic Foil", "#dbeafe", BLUE, "Diffractive optical pattern — cannot be photocopied"),
    ("2. Tamper-Evident VOID Layer", "#fef3c7", GOLD, "Leaves 'VOID' residue when peeled — reuse impossible"),
    ("3. Security Printing Layer", "#dcfce7", GREEN, "Serial number + QR code + microtext (0.2 mm)"),
    ("4. Aggressive Acrylic Adhesive", "#fee2e2", "#b91c1c", "Bonds in seconds; survives cold chain & humidity"),
    ("5. Glassine Release Liner", "#f1f5f9", MUTED, "Silicone-coated — smooth die-cutting & application"),
]
ax.text(0.24, 0.80, "LABEL STRUCTURE (5 LAYERS)", ha="center", fontsize=12, fontweight="bold", color=BLUE)
y = 0.74
for name, fc, ec, note in layers:
    ax.add_patch(FancyBboxPatch((0.06, y-0.075), 0.36, 0.082, boxstyle="round,pad=0.004,rounding_size=0.01",
                                fc=fc, ec=ec, lw=1.4, zorder=3))
    ax.text(0.24, y-0.025, name, ha="center", fontsize=10, fontweight="bold", color=INK, zorder=4)
    ax.text(0.24, y-0.052, note, ha="center", fontsize=7.8, color=MUTED, zorder=4)
    y -= 0.098

# 右侧：验证流程
ax.text(0.73, 0.80, "HOW PHARMACIES VERIFY AUTHENTICITY", ha="center", fontsize=12, fontweight="bold", color=BLUE)
steps = [
    ("Step 1", "Visual check", "Holographic foil shifts color under light — fakes print flat silver ink"),
    ("Step 2", "Scan QR code", "Redirects to verification page showing batch, MFG date & origin"),
    ("Step 3", "Check serial", "Unique serial per unit — duplicates trigger counterfeit alert"),
    ("Step 4", "Peel test", "VOID residue proves the label was never transferred to a fake box"),
]
y = 0.745
for tag, t, d in steps:
    ax.add_patch(FancyBboxPatch((0.52, y-0.095), 0.42, 0.105, boxstyle="round,pad=0.004,rounding_size=0.01",
                                fc="white", ec="#cbd5e1", lw=1.2, zorder=3))
    ax.text(0.535, y-0.024, tag, fontsize=8.5, fontweight="bold", color="white", zorder=5,
            va="center", bbox=dict(boxstyle="round,pad=0.3", fc=BLUE, ec="none"))
    ax.text(0.615, y-0.024, t, fontsize=11, fontweight="bold", color=INK, zorder=4, va="center")
    ax.text(0.535, y-0.062, d, fontsize=8.2, color=MUTED, zorder=4, va="center", wrap=True)
    y -= 0.118

ax.text(0.5, 0.045, "v5med.net  |  Anti-counterfeit packaging for Southeast Asia pharmaceutical markets",
        ha="center", fontsize=9.5, color=MUTED)
plt.savefig(os.path.join(OUT, "anti-counterfeit-label-anatomy.png"),
            bbox_inches="tight", facecolor=fig.get_facecolor())
plt.close()
print("saved anti-counterfeit-label-anatomy.png")

# ============ 图 3：项目流程 ============
fig, ax = plt.subplots(figsize=(12, 5.2), dpi=100)
ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
fig.patch.set_facecolor("#f8fafc")

ax.text(0.5, 0.90, "From Artwork to Shipment: The V5 Packaging Project Workflow",
        ha="center", fontsize=18, fontweight="bold", color=INK)
ax.text(0.5, 0.80, "One coordinated process for cartons, inserts, labels, security labels and blister trays",
        ha="center", fontsize=10.5, color=MUTED)

steps = [
    ("1. Artwork\nReview", "Dieline check,\nmaterial advice,\n48h feedback"),
    ("2. Material\nSelection", "Climate-rated\nboard, adhesives\n& resins"),
    ("3. Sampling", "Physical proofs\nshipped for\napproval"),
    ("4. QC\nValidation", "Peel, humidity &\ncolor tests on\nactual surfaces"),
    ("5. Mass\nProduction", "Unified standard\nacross all 5\ncomponents"),
    ("6. Consolidated\nShipment", "One QC report,\none shipment,\none customs entry"),
]
n = len(steps)
w, gap = 0.145, 0.014
x0 = (1 - (n*w + (n-1)*gap)) / 2
y0, h = 0.18, 0.48

for i, (t, d) in enumerate(steps):
    x = x0 + i*(w+gap)
    ax.add_patch(FancyBboxPatch((x, y0), w, h, boxstyle="round,pad=0.008,rounding_size=0.02",
                                fc="white", ec=BLUE2, lw=1.4, zorder=2))
    ax.add_patch(mp.Circle((x + w/2, y0 + h - 0.085), 0.036, fc=BLUE, ec="none", zorder=3))
    ax.text(x + w/2, y0 + h - 0.085, str(i+1), ha="center", va="center",
            fontsize=13, fontweight="bold", color="white", zorder=4)
    ax.text(x + w/2, y0 + h - 0.20, t, ha="center", va="center",
            fontsize=9.6, fontweight="bold", color=BLUE, zorder=4)
    ax.text(x + w/2, y0 + 0.10, d, ha="center", va="center",
            fontsize=7.6, color=MUTED, zorder=4)
    if i < n - 1:
        ax.annotate("", xy=(x + w + gap - 0.004, y0 + h/2), xytext=(x + w + 0.004, y0 + h/2),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE2, lw=1.6), zorder=5)

ax.text(0.5, 0.055, "v5med.net  |  ISO 13485 Certified Supply Chain  |  Pharmaceutical Packaging Solutions",
        ha="center", fontsize=9.5, color=MUTED)
plt.savefig(os.path.join(OUT, "packaging-project-workflow.png"),
            bbox_inches="tight", facecolor=fig.get_facecolor())
plt.close()
print("saved packaging-project-workflow.png")
