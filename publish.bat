@echo off
REM Prepares this folder for GitHub Pages. Run once.
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git not found. Install it from https://git-scm.com/download/win then run again.
  pause
  exit /b 1
)
if not exist ".git" git init -b main
git add -A
git status --short
REM Commit (uses local identity; set once with the prompts below if asked).
for /f %%i in ('git config user.name') do set HASNAME=%%i
if not defined HASNAME (
  set /p GITNAME="Your name for git (e.g. Shahid Zilan): "
  git config user.name "%GITNAME%"
)
for /f %%i in ('git config user.email') do set HASEMAIL=%%i
if not defined HASEMAIL (
  set /p GITEMAIL="Your email for git: "
  git config user.email "%GITEMAIL%"
)
git commit -m "Publish Sylhet through DazzCam flipbook" 2>nul
echo.
echo === Next steps (do these on github.com) ===
echo 1. Create a NEW empty repository (no README) - e.g. name it sylhet-through-dazzcam
echo 2. Then run these two commands here (replace USER and REPO):
echo.
echo    git remote remove origin 2^>nul ^& git remote add origin https://github.com/USER/REPO.git
echo    git push -u origin main
echo.
echo 3. On the repo page: Settings ^> Pages ^> Build and deployment:
echo    Source = "Deploy from a branch", Branch = main, folder = / (root). Save.
echo 4. Wait 1-2 minutes, open https://USER.github.io/REPO/?view=1
echo.
pause
