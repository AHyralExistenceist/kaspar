# 노트북 웹 앱

간단한 노트북 스타일의 웹 애플리케이션입니다.

## 파일 구성
- `index.html` - 메인 HTML 파일
- `style.css` - 스타일시트
- `script.js` - JavaScript 기능

## GitHub Pages 배포 방법

### 1단계: GitHub 계정 만들기
1. https://github.com 접속
2. "Sign up" 클릭하여 계정 생성 (이메일 인증 필요)

### 2단계: 새 저장소 만들기
1. GitHub 로그인 후 우측 상단 "+" 버튼 클릭
2. "New repository" 선택
3. Repository name 입력 (예: `my-notebook`)
4. "Public" 선택 (무료 호스팅을 위해 필수)
5. "Add a README file" 체크 해제
6. "Create repository" 클릭

### 3단계: 파일 업로드하기

#### 방법 A: 웹에서 직접 업로드 (가장 쉬움)
1. 생성된 저장소 페이지에서 "uploading an existing file" 클릭
2. `index.html`, `style.css`, `script.js` 파일을 드래그 앤 드롭
3. "Commit changes" 클릭

#### 방법 B: Git 명령어 사용
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

### 4단계: GitHub Pages 활성화
1. 저장소 페이지에서 "Settings" 탭 클릭
2. 왼쪽 메뉴에서 "Pages" 클릭
3. "Source"에서 "Deploy from a branch" 선택
4. Branch를 "main" 선택
5. Folder를 "/ (root)" 선택
6. "Save" 클릭

### 5단계: 웹사이트 확인
1. 몇 분 후 (최대 5분) 저장소 페이지로 돌아가기
2. "Settings" → "Pages"에서 웹사이트 URL 확인
3. URL 형식: `https://사용자명.github.io/저장소명/`

## 업데이트 방법
파일을 수정한 후:
1. GitHub 저장소에 파일 업로드 (또는 git push)
2. 자동으로 웹사이트에 반영됨 (몇 분 소요)

## 주의사항
- 각 사용자의 노트는 브라우저의 로컬 스토리지에 저장됩니다
- 서버에 데이터가 저장되지 않으므로 브라우저를 삭제하면 노트도 삭제됩니다


