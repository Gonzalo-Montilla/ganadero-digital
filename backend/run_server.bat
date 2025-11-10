@echo off
echo ===============================================
echo   Ganadero Digital - Servidor API
echo ===============================================
echo.
echo Iniciando servidor en http://localhost:8000
echo Documentacion: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
