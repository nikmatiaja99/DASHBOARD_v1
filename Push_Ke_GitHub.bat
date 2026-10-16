@echo off
title Push Proyek BIOTA Smarthome ke GitHub
color 0b
echo ================================================================
echo   MENDORONG (PUSH) REPOSITORI KE GITHUB RESMI BIOTA SMARTHOME
echo   Target: https://github.com/fitrohadhiansyah1-coder/biota-dashboardsales
echo ================================================================
echo.

set GIT_PATH="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"

if not exist %GIT_PATH% (
    set GIT_PATH=git
)

echo Menghubungkan ke GitHub...
%GIT_PATH% push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================================
    echo [BERHASIL!] Seluruh file proyek sudah sukses di-push ke GitHub!
    echo Silakan buka: https://github.com/fitrohadhiansyah1-coder/biota-dashboardsales
    echo ================================================================
) else (
    echo ================================================================
    echo [CATATAN OTENTIKASI GITHUB]
    echo Jika muncul permintaan login:
    echo 1. Username: fitrohadhiansyah1-coder
    echo 2. Password: Gunakan GitHub Personal Access Token (bukan password biasa).
    echo    Buat token di: https://github.com/settings/tokens (pilih scope 'repo')
    echo ================================================================
)
echo.
pause
