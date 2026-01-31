# Git Push 스크립트 사용법

프로젝트 루트에 `git add .`, `git commit`, `git push`를 한 번에 실행하는 스크립트를 추가했습니다.

## 사용 방법

### 방법 1: 배치 파일 사용 (Windows - CMD)
```bash
git-push.bat
```

### 방법 2: PowerShell 스크립트 사용 (Windows - PowerShell)
```powershell
.\git-push.ps1
```

PowerShell에서 실행 정책 오류가 발생하는 경우:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 방법 3: Bash 스크립트 사용 (Linux/Mac/Git Bash)
```bash
chmod +x git-push.sh
./git-push.sh
```

### 방법 4: npm 스크립트 사용
```bash
npm run git:push
```

## 직접 명령어로 실행 (복사해서 사용)

### Windows (CMD)
```cmd
git add . && git commit -m "커밋 메시지" && git push origin %(git branch --show-current)
```

### Windows (PowerShell)
```powershell
git add .; git commit -m "커밋 메시지"; git push origin (git branch --show-current)
```

### Linux/Mac/Git Bash
```bash
git add . && git commit -m "커밋 메시지" && git push origin $(git branch --show-current)
```

## 한 줄 명령어 (커밋 메시지 포함)

### Windows (CMD)
```cmd
git add . && git commit -m "Update" && git push origin %(git branch --show-current)
```

### Windows (PowerShell)
```powershell
git add .; git commit -m "Update"; git push origin (git branch --show-current)
```

### Linux/Mac/Git Bash
```bash
git add . && git commit -m "Update" && git push origin $(git branch --show-current)
```

## 주의사항

- 커밋 메시지는 반드시 입력해야 합니다.
- 현재 브랜치에 자동으로 push됩니다.
- 에러가 발생하면 스크립트가 중단됩니다.

