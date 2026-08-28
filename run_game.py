#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
足球职业生涯模拟器 - 本地启动程序
功能：启动本地 HTTP 服务器并在浏览器中打开游戏
"""

import os
import sys
import socket
import webbrowser
import http.server
import socketserver
from threading import Thread

HTML_FILE = "football-career-simulator.html"
DEFAULT_PORT = 8080


def find_free_port(start=DEFAULT_PORT, max_attempts=100):
    """查找可用端口"""
    for port in range(start, start + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return None


def open_browser(url, delay=0.8):
    """延迟后打开默认浏览器"""
    import time
    time.sleep(delay)
    webbrowser.open(url)


def main():
    # 切换到脚本所在目录，确保能找到 HTML 文件
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    if not os.path.exists(HTML_FILE):
        print(f"错误：找不到 {HTML_FILE}")
        print("请确保本程序与 HTML 源文件在同一文件夹内。")
        input("按 Enter 键退出...")
        sys.exit(1)

    port = find_free_port()
    if port is None:
        print("错误：无法找到可用端口")
        input("按 Enter 键退出...")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}/{HTML_FILE}"

    # 使用简单的 HTTP 请求处理类
    handler = http.server.SimpleHTTPRequestHandler

    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        print("=" * 50)
        print("  足球职业生涯模拟器 已启动")
        print("=" * 50)
        print(f"  本地地址：{url}")
        print(f"  数据存储：浏览器 LocalStorage（自动保存到本地浏览器）")
        print("=" * 50)
        print("  按 Ctrl+C 停止服务器")
        print("=" * 50)

        # 在浏览器中打开
        Thread(target=open_browser, args=(url,), daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            sys.exit(0)


if __name__ == "__main__":
    main()
