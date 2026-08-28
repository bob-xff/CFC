#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CFC 足球职业生涯模拟器 - Windows 单机版启动器
使用 pywebview(WebView2) 将网页游戏包装为原生桌面应用。
打包：pyinstaller --noconfirm --onefile --windowed \
      --name "CFC足球职业生涯模拟器" --icon ..\\assets\\ui\\logo.ico \
      --add-data "..\\football-career-simulator.html;." cfc_game_app.py
"""

import os
import sys

import webview


def resource_path(rel):
    """兼容 PyInstaller onefile 模式下的资源路径"""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def find_html():
    """按顺序查找游戏 HTML：打包目录 -> 脚本目录 -> 上级目录 -> 当前目录"""
    candidates = []
    if hasattr(sys, "_MEIPASS"):
        candidates.append(sys._MEIPASS)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates.append(script_dir)
    candidates.append(os.path.dirname(script_dir))
    candidates.append(os.getcwd())
    for base in candidates:
        path = os.path.join(base, "football-career-simulator.html")
        if os.path.exists(path):
            return path
    return None


def data_dir():
    """存档数据目录（WebView2 持久化用户数据）"""
    local = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    return os.path.join(local, "CFCFootballCareer")


class Api:
    """暴露给网页 JS 的桥接对象（预留扩展用）"""

    def app_version(self):
        return "1.2.0"


def selftest(window):
    """自检模式：验证页面加载、Logo 嵌入与 localStorage 持久化"""
    import json
    import time

    time.sleep(2.5)
    result = {"ok": False}
    try:
        title = window.evaluate_js("document.title")
        splash_logo = window.evaluate_js(
            "(function(){var e=document.getElementById('splash-logo');"
            "return e ? (e.src? e.src.length>0 : false) : false;})()"
        )
        start_logo = window.evaluate_js(
            "(function(){var e=document.getElementById('start-logo');"
            "return e ? (e.src? e.src.length>0 : false) : false;})()"
        )
        crests = window.evaluate_js(
            "(function(){try{return {count:Object.keys(LOGOS.teams||{}).length,"
            "league:Object.keys(LOGOS.leagues||{}).length,"
            "sample:!!(LOGOS.teams&&LOGOS.teams['上海海港'])};}"
            "catch(e){return {count:0,league:0,sample:false}}})()"
        )
        if "--selftest-read" in sys.argv:
            value = window.evaluate_js(
                "localStorage.getItem('cfc_selftest') || 'none'"
            )
            result.update({"read": value})
        else:
            window.evaluate_js("localStorage.setItem('cfc_selftest','ok')")
        result.update({
            "title": title,
            "splash_logo": splash_logo,
            "start_logo": start_logo,
            "team_logos": crests.get("count", 0),
            "league_logos": crests.get("league", 0),
            "sample_crest": crests.get("sample", False),
            "ok": True,
        })
    except Exception as exc:  # noqa: BLE001
        result.update({"error": repr(exc)})
    print("SELFTEST " + json.dumps(result, ensure_ascii=False))
    try:
        # windowed 模式没有控制台，自检结果写入文件便于验证
        base = os.path.dirname(os.path.abspath(sys.executable))
        out = os.path.join(base, "cfc_selftest_result.json")
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(result, fh, ensure_ascii=False)
    except Exception:  # noqa: BLE001
        pass
    window.destroy()


def main():
    html = find_html()
    if not html:
        print("错误：找不到游戏文件 football-career-simulator.html")
        sys.exit(1)

    window = webview.create_window(
        "CFC 足球职业生涯模拟器",
        html,
        js_api=Api(),
        width=1280,
        height=820,
        min_size=(960, 620),
        background_color="#030301",
    )

    if "--selftest" in sys.argv or "--selftest-read" in sys.argv:
        webview.start(selftest, window, private_mode=False, debug=False)
    else:
        # private_mode=False：localStorage 持久化到本机数据目录
        webview.start(private_mode=False, debug=False)


if __name__ == "__main__":
    main()
