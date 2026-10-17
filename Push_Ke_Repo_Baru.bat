@echo off
title Push Proyek BIOTA Smarthome ke Repository Baru GitHub
color 0b
echo ================================================================
echo   PUSH PROYEK KE REPOSITORY BARU GITHUB
echo ================================================================
echo.

set GIT_PATH="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"
if not exist %GIT_PATH% (
    set GIT_PATH=git
)

set /p REPO_URL="Masukkan URL Repository Baru GitHub (contoh: https://github.com/nikmatiaja99/nama-repo-baru.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] URL tidak boleh kosong!
    pause
    exit /b
)

echo.
echo Mengubah remote repository tujuan...
%GIT_PATH% remote set-url origin %REPO_URL%

echo Mendorong (Push) kode ke repository baru...
%GIT_PATH% push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================================
    echo [BERHASIL!] Seluruh proyek telah ter-push ke repository baru:
    echo %REPO_URL%
    echo ================================================================
) else (
    echo ================================================================
    echo [GAGAL ATAU PERLU OTENTIKASI]
    echo Pastikan URL repository benar dan Anda memiliki akses write.
    echo ================================================================
)
echo.
pause
