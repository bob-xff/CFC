#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用 Pillow 生成安卓应用图标（传统+自适应）与启动屏，
   替代 @capacitor/assets（sharp 依赖在当前网络装不上）。
   视觉规范：#05070c 深色底 + CFC 标志，与游戏首屏一致。"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RES = os.path.join(ROOT, "mobile", "android", "app", "src", "main", "res")
ICON_SRC = os.path.join(ROOT, "assets", "ui", "icon_1024.png")
SPLASH_LOGO = os.path.join(ROOT, "CFC--logo文件", "启动页logo.png")
BG = (5, 7, 12, 255)  # #05070c

DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def cover(img, w, h, bg):
    """等比缩放并居中到 wxh 画布（不裁剪 logo，四周留底色）。"""
    canvas = Image.new("RGBA", (w, h), bg)
    scale = min(w * 0.42 / img.width, h * 0.55 / img.height)
    logo = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(logo, ((w - logo.width) // 2, (h - logo.height) // 2))
    return canvas


def gen_icons(icon):
    for d, mult in DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{d}")
        os.makedirs(folder, exist_ok=True)
        # 传统方形图标（整幅出血）
        legacy = cover(icon, int(48 * mult), int(48 * mult), BG)
        legacy.save(os.path.join(folder, "ic_launcher.png"))
        # 圆形图标（圆形蒙版裁切出血图）
        size = legacy.width
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size * 4, size * 4), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        round_ic = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        round_ic.paste(legacy, (0, 0), mask)
        round_ic.save(os.path.join(folder, "ic_launcher_round.png"))
        # 自适应前景：内容占 62% 居中（安全区 72/108）
        fg_size = int(108 * mult)
        fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        scale = fg_size * 0.62 / icon.width
        logo = icon.resize((int(icon.width * scale), int(icon.height * scale)), Image.LANCZOS)
        fg.alpha_composite(logo, ((fg_size - logo.width) // 2, (fg_size - logo.height) // 2))
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"))
    # 图标底色
    with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#05070C</color>\n</resources>\n')


def gen_splash(logo):
    # 横竖屏各密度尺寸（Capacitor 模板规格），游戏锁横屏但两套都生成
    land = {"mdpi": (480, 320), "hdpi": (800, 480), "xhdpi": (960, 720), "xxhdpi": (1600, 960), "xxxhdpi": (1920, 1280)}
    port = {"mdpi": (480, 800), "hdpi": (720, 1280), "xhdpi": (960, 1600), "xxhdpi": (1440, 2560), "xxxhdpi": (1920, 3200)}
    for d, (w, h) in land.items():
        cover(logo, w, h, BG).convert("RGB").save(os.path.join(RES, f"drawable-land-{d}", "splash.png"))
    for d, (w, h) in port.items():
        cover(logo, w, h, BG).convert("RGB").save(os.path.join(RES, f"drawable-port-{d}", "splash.png"))
    cover(logo, 1920, 1080, BG).convert("RGB").save(os.path.join(RES, "drawable", "splash.png"))


def main():
    icon = Image.open(ICON_SRC).convert("RGBA")
    logo = Image.open(SPLASH_LOGO).convert("RGBA")
    gen_icons(icon)
    gen_splash(logo)
    print("icons + splash generated")


if __name__ == "__main__":
    main()
