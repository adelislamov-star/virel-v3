@echo off
cd /d C:\Virel
call node_modules\.bin\prisma.cmd db push > prisma_push_result.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> prisma_push_result.txt
