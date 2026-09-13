#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""剥离 ZCode 编辑器注入的 data-page-node-id 属性。

背景：ZCode 编辑器会将 HTML 文件"结构化"并在标签上写入
data-page-node-id="..." 属性（约 298 处）。这些属性不影响游戏运行，
但会污染 git diff。本脚本把它们安全移除。

用法：
    python build/strip_editor_inject.py            # 预览（不写盘）
    python build/strip_editor_inject.py --apply    # 实际写入
    python build/strip_editor_inject.py --apply --sync   # 写入并同步到 mobile/www
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "football-career-simulator.html")
PATTERN = re.compile(r'\s*data-page-node-id="[^"]*"')


def main():
    apply = "--apply" in sys.argv
    sync = "--sync" in sys.argv

    with open(TARGET, encoding="utf-8") as f:
        src = f.read()

    hits = len(PATTERN.findall(src))
    print("发现 data-page-node-id：%d 处" % hits)
    if hits == 0:
        print("无需处理。")
        return

    clean = PATTERN.sub("", src)
    print("剥离后大小：%d 字节（原 %d）" % (len(clean), len(src)))

    # 安全校验：剥离后 <script> 内容必须与原文件完全一致
    old_js = re.findall(r"<script[^>]*>(.*?)</script>", src, re.S)
    new_js = re.findall(r"<script[^>]*>(.*?)</script>", clean, re.S)
    if old_js != new_js:
        print("!! 安全检查未通过：剥离操作影响到了 <script> 内容，已中止。")
        sys.exit(1)
    print("安全检查通过：JS 内容未受影响。")

    if not apply:
        print("\n[预览模式] 未写入。加 --apply 执行。")
        return

    with open(TARGET, "w", encoding="utf-8", newline="") as f:
        f.write(clean)
    print("已写入 %s" % TARGET)

    if sync:
        mobile = os.path.join(ROOT, "mobile", "www", "index.html")
        if os.path.exists(mobile):
            with open(mobile, "w", encoding="utf-8", newline="") as f:
                f.write(clean)
            print("已同步 %s" % mobile)
        subprocess.call([sys.executable, os.path.join(ROOT, "mobile", "sync.py")])


if __name__ == "__main__":
    main()
