@echo off
title CFC - 关闭智能应用控制（需管理员，可选）
echo ============================================================
echo  说明：Windows "智能应用控制"(Smart App Control) 开启时，
echo        会拦截一切没有数字签名的程序——本游戏的 exe 因此被拦。
echo        本脚本把它关闭（等同于在系统设置中手动关闭）。
echo.
echo  注意：智能应用控制一旦关闭，通常需要重装/重置 Windows 才能
echo        重新开启。若你介意这一点，请改用"启动游戏-浏览器版.bat"。
echo ============================================================
echo.
echo 即将请求管理员权限，请在弹出的 UAC 窗口中点"是"。
pause
net session >nul 2>&1
if %errorlevel%==0 goto admin
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b
:admin
reg add "HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy" /v VerifiedAndReputablePolicyState /t REG_DWORD /d 0 /f
echo.
echo 已写入设置（VerifiedAndReputablePolicyState = 0）。
echo 请重启电脑使设置生效，之后即可直接双击 CFC足球职业生涯模拟器.exe。
pause
