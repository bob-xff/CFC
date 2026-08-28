#!/bin/bash
# CFC 足球职业生涯模拟器 - macOS/Linux 启动脚本

cd "$(dirname "$0")" || exit 1

echo "正在启动 CFC 足球职业生涯模拟器..."
python3 run_game.py
