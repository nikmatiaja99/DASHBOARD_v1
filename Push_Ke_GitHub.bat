@echo off
title Push Proyek BIOTA Smarthome ke DASHBOARD_v1 (nikmatiaja99)
color 0b
echo ================================================================
echo   PUSH PROYEK KE GITHUB RESMI BIOTA SMARTHOME
echo   Target: https://github.com/nikmatiaja99/DASHBOARD_v1.git
echo ================================================================
echo.

set GIT_PATH="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"

if not exist %GIT_PATH% (
    set GIT_PATH=git
)

%GIT_PATH% remote set-url origin https://github.com/nikmatiaja99/DASHBOARD_v1.git

echo Menghubungkan ke GitHub sebagai nikmatiaja99...
echo (Jika muncul jendela browser, silakan klik 'Sign in with browser' / Authorize)
echo.

%GIT_PATH% push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================================
    echo [BERHASIL!] Seluruh file proyek sudah sukses di-push ke:
    echo https://github.com/nikmatiaja99/DASHBOARD_v1
    echo ================================================================
) else (
    echo ================================================================
    echo [CATATAN OTENTIKASI GITHUB]
    echo Jika muncul permintaan login:
    echo 1. Pilih 'Sign in with your browser' (karena browser Anda sudah login nikmatiaja99)
    echo 2. Atau masukkan Token GitHub jika diminta.
    echo ================================================================
)
echo.
pause
