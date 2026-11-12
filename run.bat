@echo off
title TaskFlow Pro
cd /d "%~dp0"
if not exist out mkdir out
echo.
echo  ============================================
echo             TASKFLOW PRO - JAVA
echo  ============================================
echo.
echo Compiling project...
javac --add-modules jdk.httpserver -d out src\main\java\app\Task.java src\main\java\app\TaskService.java src\main\java\app\Server.java
if errorlevel 1 (
  echo.
  echo Compilation failed. Check that JDK 17 is installed.
  pause
  exit /b 1
)
echo.
echo Starting TaskFlow Pro...
echo Open http://localhost:8080 in your browser.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.
java --add-modules jdk.httpserver -cp out app.Server
pause