@echo off
rem CFC 足球职业生涯模拟器 - 桌面窗口版（与 exe 体验一致，无需关闭任何安全设置）
rem 原理：使用系统自带、带数字签名的 pythonw.exe 加载游戏，智能应用控制不会拦截。
set "PYW=pythonw.exe"
where %PYW% >nul 2>&1
if errorlevel 1 set "PYW=python.exe"
start "" %PYW% "%~dp0game_window.py"
