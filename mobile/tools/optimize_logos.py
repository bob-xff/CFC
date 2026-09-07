#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""队徽优化：resize 到最长边 256px（显示尺寸最大 104px 的 2.5 倍）+
   PNG 调色板量化，输出到 mobile/assets_opt/（保持目录结构与文件名）。
   已足够小的文件跳过（继续使用原始文件）。画质策略：256px + 256 色
   调色板 + 抖动，队徽为平面色块图形，显示尺寸下与原图视觉一致。"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "logos")
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets_opt", "logos")
MAX_SIDE = 256
MIN_BYTES = 100 * 1024  # 100KB 以下直接跳过

def optimize(path_in, path_out):
    img = Image.open(path_in)
    has_alpha = img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info
    img = img.convert("RGBA")
    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    pal = img.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)
    pal.save(path_out, "PNG", optimize=True)

def main():
    total_in = total_out = count = 0
    for base, _dirs, files in os.walk(SRC):
        for fn in files:
            if not fn.lower().endswith(".png"):
                continue
            src = os.path.join(base, fn)
            rel = os.path.relpath(src, SRC)
            size = os.path.getsize(src)
            total_in += size
            if size < MIN_BYTES:
                continue
            dst = os.path.join(DST, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            optimize(src, dst)
            total_out += os.path.getsize(dst)
            count += 1
    print(f"optimized {count} files")
    print(f"raw total: {total_in/1024/1024:.1f} MB")
    if count:
        print(f"optimized subset: {total_out/1024/1024:.2f} MB (was {sum(os.path.getsize(os.path.join(b,f)) for b,_,fs in os.walk(SRC) for f in fs if f.lower().endswith('.png') and os.path.getsize(os.path.join(b,f))>=MIN_BYTES)/1024/1024:.1f} MB)")

if __name__ == "__main__":
    main()
