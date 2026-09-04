#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 pharmaceutical-packaging 分类产品图（品牌卡片风格 800x800）"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mp
from matplotlib.patches import Rectangle, FancyBboxPatch
import numpy as np
import os

OUT = os.path.join(os.path.dirname(__file__), "images", "products", "pharmaceutical-packaging")
os.makedirs(OUT, exist_ok=True)

BLUE = "#1e40af"; BLUE2 = "#3b82f6"; LIGHT = "#eff6ff"; INK = "#1e293b"; MUTED = "#64748b"; GOLD = "#d97706"; GREEN = "#16a34a"

def base_fig():
    fig, ax = plt.subplots(figsize=(8, 8), dpi=100)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
    ax.add_patch(Rectangle((0, 0), 1, 1, fc="#f8fafc", ec="none"))
    ax.add_patch(Rectangle((0.06, 0.06), 0.88, 0.88, fill=False, ec="#cbd5e1", lw=2))
    return fig, ax

def finish(fig, name, fname):
    ax = fig.axes[0]
    ax.text(0.5, 0.16, name, ha="center", fontsize=17, fontweight="bold", color=INK, wrap=True)
    ax.text(0.5, 0.105, "V5 MEDICAL  |  ISO 13485  |  OEM AVAILABLE", ha="center",
            fontsize=9.5, color=MUTED, fontweight="bold")
    fig.savefig(os.path.join(OUT, fname), bbox_inches="tight", facecolor="#f8fafc")
    plt.close(fig)
    print("saved", fname)

def draw_carton(ax, cx, cy, s=1.0, c=BLUE):
    w, h = 0.30*s, 0.34*s
    ax.add_patch(Rectangle((cx-w/2, cy-h/2), w, h, fc="white", ec=c, lw=3))
    ax.plot([cx-w/2, cx-w/4, cx], [cy+h/2, cy+h/2+0.09*s, cy+h/2], color=c, lw=3)
    ax.plot([cx, cx+w/4, cx+w/2], [cy+h/2, cy+h/2+0.09*s, cy+h/2], color=c, lw=3)
    ax.plot([cx-w/4, cx+w/4], [cy+h/2+0.09*s, cy+h/2+0.09*s], color=c, lw=3)
    ax.add_patch(Rectangle((cx-w/2+0.04, cy+0.02), w-0.08, 0.10, fc=LIGHT, ec="none"))
    for i, dy in enumerate((0.05, 0.0, -0.05)):
        ax.plot([cx-w/2+0.05, cx+w/2-0.05], [cy-h/2+0.08+dy+0.1, cy-h/2+0.08+dy+0.1], color=c, lw=2)
    ax.text(cx, cy+0.07, "Rx", ha="center", va="center", fontsize=15, fontweight="bold", color=c)

def draw_leaflet(ax, cx, cy, s=1.0, c=BLUE2):
    w, h = 0.26*s, 0.36*s
    ax.add_patch(Rectangle((cx-w/2, cy-h/2), w, h, fc="white", ec=c, lw=3))
    ax.plot([cx, cx], [cy-h/2, cy+h/2], color=c, lw=2)
    for dy in np.linspace(-h/2+0.05, h/2-0.05, 6):
        ax.plot([cx-w/2+0.03, cx-0.03], [cy+dy, cy+dy], color=c, lw=1.6)
        ax.plot([cx+0.03, cx+w/2-0.03], [cy+dy, cy+dy], color=c, lw=1.6)

def draw_label(ax, cx, cy, s=1.0, c=GREEN):
    ax.add_patch(FancyBboxPatch((cx-0.17*s, cy-0.10*s), 0.34*s, 0.20*s,
                 boxstyle="round,pad=0.01,rounding_size=0.03", fc="white", ec=c, lw=3))
    ax.text(cx, cy+0.02*s, "Rx LABEL", ha="center", va="center", fontsize=12, fontweight="bold", color=c)
    for dy in (-0.045, -0.075):
        ax.plot([cx-0.12*s, cx+0.12*s], [cy+dy*s, cy+dy*s], color=c, lw=2)
    for i in range(3):
        ax.plot([cx-0.14*s+i*0.03, cx-0.11*s+i*0.03], [cy-0.16*s, cy-0.13*s], color=c, lw=2)
    ax.plot([cx-0.14*s, cx+0.14*s], [cy-0.145*s, cy-0.145*s], color=c, lw=1.2, linestyle=(0, (2, 2)))

def draw_holo(ax, cx, cy, s=1.0, c=GOLD):
    t = np.linspace(np.pi/2, np.pi/2+2*np.pi, 11)[:-1]
    xs = [cx + (0.16 if i % 2 == 0 else 0.07)*s*np.cos(a) for i, a in enumerate(t)]
    ys = [cy + (0.16 if i % 2 == 0 else 0.07)*s*np.sin(a) for i, a in enumerate(t)]
    ax.fill(xs, ys, fc="#fef3c7", ec=c, lw=3)
    ax.add_patch(mp.Circle((cx, cy), 0.085*s, fc="white", ec=c, lw=2.5))
    ax.text(cx, cy, "✓", ha="center", va="center", fontsize=26, fontweight="bold", color=c)
    ax.text(cx, cy-0.24*s, "VOID", ha="center", fontsize=11, fontweight="bold", color=c,
            bbox=dict(boxstyle="round,pad=0.2", fc="white", ec=c, lw=1.5))

def draw_blister(ax, cx, cy, s=1.0, c=BLUE):
    w, h = 0.32*s, 0.38*s
    ax.add_patch(Rectangle((cx-w/2, cy-h/2), w, h, fc="white", ec=c, lw=3))
    for dx in (-w/4, w/4):
        for dy in (-h/4, h/4):
            ax.add_patch(mp.Circle((cx+dx, cy+dy), 0.055*s, fc=LIGHT, ec=c, lw=2.5))

jobs = [
    ("Pharmaceutical\nFolding Cartons", "pharma-folding-cartons.jpg", draw_carton),
    ("Package Inserts\n(IFU)", "pharma-package-inserts.jpg", draw_leaflet),
    ("Self-Adhesive\nPharmaceutical Labels", "pharma-adhesive-labels.jpg", draw_label),
    ("Holographic\nAnti-Counterfeit Labels", "pharma-hologram-labels.jpg", draw_holo),
    ("Pharmaceutical\nBlister Trays", "pharma-blister-trays.jpg", draw_blister),
]
for name, fname, drawer in jobs:
    fig, ax = base_fig()
    drawer(ax, 0.5, 0.58)
    finish(fig, name, fname)
