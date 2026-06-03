@echo off
title MusicFlow Server
cd /d C:\Users\Administrator\music-app

echo Starting NCM music proxy on port 4000...
start "NCM-Proxy" /min node ncm-server.js

echo Starting MusicFlow production server...
echo.
echo ============================================
echo   MusicFlow is running at:
echo.
echo   局域网 (手机):  http://192.168.2.104:3000
echo   本机:           http://localhost:3000
echo ============================================
echo.
echo 手机和电脑连同一个WiFi即可访问
echo.

npm start
pause
