@echo off
cd /d %~dp0
echo ========================================
echo     LLM Chat Service Starting...
echo ========================================
echo.
echo Port: 8888
echo API Docs: http://localhost:8888/docs
echo.
start cmd /k "python main.py"
echo.
echo ========================================
echo Service started!
echo Make sure Ollama is running.
echo ========================================
pause
