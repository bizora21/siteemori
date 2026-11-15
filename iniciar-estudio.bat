@echo off
rem Abre o estúdio de vídeo (dashboard). Duplo clique neste ficheiro.
rem Mostra também o link para abrir no telemóvel (mesmo Wi-Fi).
cd /d "%~dp0"
title Estudio de video
echo.
echo  A iniciar o estudio... (feche esta janela para o desligar)
echo.
start "" "http://127.0.0.1:4173/?phone=1"
call npm run studio -- --lan
pause
