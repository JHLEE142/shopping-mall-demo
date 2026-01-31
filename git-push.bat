@echo off
echo ========================================
echo Git Add, Commit, and Push
echo ========================================
echo.

REM 현재 브랜치 확인
git branch --show-current > temp_branch.txt
set /p CURRENT_BRANCH=<temp_branch.txt
del temp_branch.txt

echo Current branch: %CURRENT_BRANCH%
echo.

REM 변경사항 확인
git status --short
echo.

REM 커밋 메시지 입력 받기
set /p COMMIT_MSG="Enter commit message: "

if "%COMMIT_MSG%"=="" (
    echo Error: Commit message is required!
    pause
    exit /b 1
)

echo.
echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "%COMMIT_MSG%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Commit failed!
    pause
    exit /b 1
)

echo.
echo Pushing to remote...
git push origin %CURRENT_BRANCH%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Push failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Successfully pushed to %CURRENT_BRANCH%
echo ========================================
pause

