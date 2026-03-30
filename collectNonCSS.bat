@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set OUTPUT=all_componentsWithoatCss.txt
set SOURCE_DIR=src

:: 1. Создаем/очищаем файл и пишем заголовок
echo Сборка компонентов из %SOURCE_DIR%... > %OUTPUT%
echo. >> %OUTPUT%

:: ==========================================
:: ДРЕВО ФАЙЛОВ (ВСЕ ФАЙЛЫ ПРОЕКТА)
:: ==========================================
echo ===== СТРУКТУРА ПРОЕКТА (ВСЕ ФАЙЛЫ) ===== >> %OUTPUT%
echo (Включая public, изображения, стили и др., кроме node_modules) >> %OUTPUT%
echo. >> %OUTPUT%

:: PowerShell для корректного обхода папок (игнорирует node_modules, .git и файл отчета)
powershell -Command "Get-ChildItem -Recurse -Force | Where-Object { $_.FullName -notmatch '\\\\(node_modules|.git|%OUTPUT%)$' -and $_.FullName -notmatch '\\\\(node_modules|.git|%OUTPUT%)\\\\' } | Tree-Format | Out-String -Width 500" >> %OUTPUT% 2>nul

:: Запасной вариант, если PowerShell не сработал
if errorlevel 1 (
    echo (Автоматическое дерево не доступно, список файлов:) >> %OUTPUT%
    dir /s /b | findstr /V /I /C:"node_modules" /C:".git" /C:"%OUTPUT%" >> %OUTPUT%
)

echo. >> %OUTPUT%
echo. >> %OUTPUT%

:: ==========================================
:: СОДЕРЖИМОЕ ФАЙЛОВ (.ts / .tsx)
:: ==========================================
echo ===== СОДЕРЖИМОЕ ФАЙЛОВ (.ts / .tsx) ===== >> %OUTPUT%
echo. >> %OUTPUT%

:: --- 1. Собираем index файлы (.ts / .tsx) ---
for /r %SOURCE_DIR% %%f in (index.ts index.tsx) do (
    echo ===== FILE: %%f ===== >> %OUTPUT%
    type "%%f" >> %OUTPUT%
    echo. >> %OUTPUT%
    echo. >> %OUTPUT%
)

:: --- 2. Собираем все .ts и .tsx файлы (кроме index) ---
for /r %SOURCE_DIR% %%f in (*.ts *.tsx) do (
    echo %%f | findstr /i "index.ts" >nul
    if errorlevel 1 (
        echo %%f | findstr /i "\\node_modules\\" >nul
        if errorlevel 1 (
            echo ===== FILE: %%f ===== >> %OUTPUT%
            type "%%f" >> %OUTPUT%
            echo. >> %OUTPUT%
            echo. >> %OUTPUT%
        )
    )
)

:: --- 3. Блок CSS удален (по запросу) ---

echo Готово! Файл сохранён: %OUTPUT%
pause