@echo off
chcp 65001 >nul
echo Monster Waves - serwer LAN (wymaga zainstalowanego Node.js)
cd /d "%~dp0"
node lan\server-lan.js
pause
