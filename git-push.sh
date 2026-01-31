#!/bin/bash

echo "========================================"
echo "Git Add, Commit, and Push"
echo "========================================"
echo ""

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# 변경사항 확인
echo "Changes:"
git status --short
echo ""

# 커밋 메시지 입력 받기
read -p "Enter commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo "Error: Commit message is required!"
    exit 1
fi

echo ""
echo "Adding all changes..."
git add .

if [ $? -ne 0 ]; then
    echo "Error: Git add failed!"
    exit 1
fi

echo ""
echo "Committing changes..."
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo "Error: Commit failed!"
    exit 1
fi

echo ""
echo "Pushing to remote..."
git push origin "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    echo "Error: Push failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Successfully pushed to $CURRENT_BRANCH"
echo "========================================"

