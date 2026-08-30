#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CFC 足球职业生涯模拟器 - 桌面窗口启动器（无 exe，安全无拦截）

原理：用系统已安装、带数字签名的 pythonw.exe（PSF 签名）加载 pywebview，
      打开与本目录 HTML 完全一致的独立桌面窗口。
      智能应用控制（Smart App Control）只拦截无签名 exe，
      不拦截签名解释器 + 本地脚本，因此无需关闭任何安全设置。

双击「启动游戏-桌面窗口版.bat」即可使用本启动器。
"""
import os
import sys
import webview


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    html = os.path.join(base, "football-career-simulator.html")
    if not os.path.exists(html):
        print("错误：找不到 football-career-simulator.html，请将本脚本放在游戏目录内。")
        sys.exit(1)
    webview.create_window(
        "CFC 足球职业生涯模拟器",
        html,
        width=1440,
        height=900,
        min_size=(1024, 700),
        background_color="#05070c",
    )
    webview.start()


if __name__ == "__main__":
    main()
