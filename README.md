# 테트리스 (학습용)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 프로젝트입니다.  
빌드 도구와 외부 라이브러리 없이 바로 실행할 수 있습니다.

## 실행 방법

1. 이 프로젝트 폴더를 연다.
2. `index.html` 파일을 더블 클릭하거나, 브라우저로 드래그한다.
3. 화면에 게임 보드, 보드 위쪽의 블록 1개, 점수, 시작/재시작 버튼, 조작법 안내가 보이면 성공이다.

### VS Code / Cursor에서 실행

1. `index.html` 파일을 연다.
2. 우클릭 후 **Open with Live Server** 또는 **Reveal in File Explorer**로 브라우저에서 연다.

> Live Server 확장이 없어도 `index.html`을 직접 열면 동작합니다.

## 파일 구조

```text
tetris-cursor/
├── index.html   # 화면 구조
├── style.css    # 스타일
├── script.js    # 게임 로직
└── README.md    # 실행 안내
```

## 조작법

| 키 | 동작 |
|---|---|
| `←` (ArrowLeft) | 왼쪽 이동 |
| `→` (ArrowRight) | 오른쪽 이동 |
| `↓` (ArrowDown) | 한 칸 빠르게 내리기 (바닥에 닿으면 즉시 고정) |
| `↑` (ArrowUp) | 블록 회전 (충돌 시 취소) |
| `Space` | 하드 드롭 (즉시 낙하) |

> 모든 조작은 `canMove()` 충돌 판정을 통과할 때만 적용됩니다.

## 점수 규칙

| 한 번에 지운 줄 | 점수 |
|---|---|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

## 게임 오버

스폰 위치에 새 블록을 놓을 수 없으면 게임 오버됩니다. **재시작** 버튼으로 다시 시작할 수 있습니다.

## 현재 구현 상태

- [x] 게임 보드 UI (10 × 20, CSS Grid)
- [x] I, O, T, S, Z, J, L 블록 정의
- [x] 블록 생성 및 보드 위쪽 표시
- [x] 점수 표시 및 줄 삭제 점수 계산
- [x] 시작 / 재시작 버튼
- [x] 조작법 안내
- [x] 블록 자동 낙하 및 충돌 판정
- [x] 키보드 이동·회전·소프트/하드 드롭
- [x] 줄 제거 및 점수 계산
- [x] 게임 오버 및 재시작 (보드·점수·타이머·상태 초기화)

## GitHub Pages 배포

1. GitHub 저장소 **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / **Folder:** `/ (root)`
4. 저장 후 아래 주소에서 확인

```text
https://chaekyu-lee.github.io/tetris-cursor/
```
