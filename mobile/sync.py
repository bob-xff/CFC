#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CFC mobile sync：把游戏源文件同步进 Capacitor 工程

流程：football-career-simulator.html -> www/index.html
      assets/ -> www/assets/（若存在 mobile/assets_opt/ 优化版队徽则覆盖）
      然后 npx cap sync android（未生成 android 工程时跳过）

用法：python sync.py          （同步 + cap sync）
      python sync.py --copy   （仅拷贝，不调 cap sync）
"""
import os
import shutil
import subprocess
import sys

MOBILE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(MOBILE)
WWW = os.path.join(MOBILE, "www")
OPT = os.path.join(MOBILE, "assets_opt")


def copy_web_assets():
    html_src = os.path.join(ROOT, "football-career-simulator.html")
    if not os.path.exists(html_src):
        sys.exit("错误：找不到 football-career-simulator.html")
    os.makedirs(WWW, exist_ok=True)
    shutil.copy2(html_src, os.path.join(WWW, "index.html"))

    src_assets = os.path.join(ROOT, "assets")
    dst_assets = os.path.join(WWW, "assets")
    if os.path.exists(dst_assets):
        shutil.rmtree(dst_assets)
    shutil.copytree(src_assets, dst_assets)

    if os.path.exists(OPT):
        for base, _dirs, files in os.walk(OPT):
            rel = os.path.relpath(base, OPT)
            target = dst_assets if rel == "." else os.path.join(dst_assets, rel)
            os.makedirs(target, exist_ok=True)
            for f in files:
                shutil.copy2(os.path.join(base, f), os.path.join(target, f))
        print("assets: 已应用优化版队徽")
    else:
        print("assets: 使用原始资源（未生成优化版）")
    print("HTML -> www/index.html 同步完成")


def cap_sync():
    if not os.path.exists(os.path.join(MOBILE, "android")):
        print("android/ 工程尚未生成，跳过 cap sync（首次请先运行 npx cap add android）")
        return
    subprocess.check_call("npx cap sync android", cwd=MOBILE, shell=True)


if __name__ == "__main__":
    copy_web_assets()
    if "--copy" not in sys.argv:
        cap_sync()
