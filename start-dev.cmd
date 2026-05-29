@echo off
cd /d "%~dp0"
npm.cmd run dev -- --port 3000 > data\T_App-dev.out.log 2> data\T_App-dev.err.log
