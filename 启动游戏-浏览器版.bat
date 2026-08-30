@echo off
rem CFC 足球职业生涯模拟器 - 浏览器版启动器（独立窗口运行，不受智能应用控制拦截，双击即玩）
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "URL=%~dp0football-career-simulator.html"
set "URL=%URL:\=/%"
if exist "%EDGE%" (
  start "" "%EDGE%" --app="file:///%URL%"
) else (
  start "" "%~dp0football-career-simulator.html"
)
