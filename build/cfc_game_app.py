# -*- coding: utf-8 -*-
"""CFC 足球职业生涯模拟器 - 桌面启动器（pywebview）

打包（在 build 目录执行）：
    pyinstaller --noconfirm --onefile --windowed --name "CFC足球职业生涯模拟器" ^
      --icon "..\\assets\\ui\\logo.ico" ^
      --add-data "..\\football-career-simulator.html;." ^
      --add-data "..\\assets\\logos;assets\\logos" ^
      cfc_game_app.py
"""
import os
import sys

import webview


def resource_path(*rel):
    """兼容 PyInstaller onefile 解包目录与源码运行两种情况。"""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, *rel)


class Api:
    """暴露给页面 JS 的原生接口：菜单"退出游戏"直接关闭整个程序。"""

    def quit(self):
        for w in list(webview.windows):
            w.destroy()
        os._exit(0)


def main():
    html = resource_path("football-career-simulator.html")
    if not os.path.exists(html):
        # 兜底：尝试源码目录
        html = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "football-career-simulator.html")
    window = webview.create_window(
        "CFC 足球职业生涯模拟器",
        html,
        width=1440,
        height=900,
        min_size=(1024, 700),
        background_color="#05070c",
        js_api=Api(),
    )
    webview.start()


if __name__ == "__main__":
    main()
