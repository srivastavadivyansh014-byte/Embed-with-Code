@echo off
cd /d "%~dp0"

:: ==============================
:: Enter your GitHub repository name here
:: Example: portfolio, opencv-light-control, smart-home
:: ==============================
set REPO_NAME=embed-with-code

echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Creating first commit...
git commit -m "Initial commit"

echo Setting main branch...
git branch -M main

echo Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/srivastavadivyansh014-byte/%REPO_NAME%.git

echo Pushing project to GitHub...
git push -u origin main

echo.
echo ==========================================
echo Project uploaded successfully to GitHub!
echo Repository:
echo https://github.com/srivastavadivyansh014-byte/%REPO_NAME%
echo ==========================================
pause