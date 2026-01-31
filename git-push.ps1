# Git Add, Commit, and Push Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Add, Commit, and Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 브랜치 확인
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# 변경사항 확인
Write-Host "Changes:" -ForegroundColor Yellow
git status --short
Write-Host ""

# 커밋 메시지 입력 받기
$commitMsg = Read-Host "Enter commit message"

if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    Write-Host "Error: Commit message is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Adding all changes..." -ForegroundColor Green
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Git add failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Green
git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pushing to remote..." -ForegroundColor Green
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully pushed to $currentBranch" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

