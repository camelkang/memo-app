# 메모 (memo-app)

휴대폰에 저장하는 간단한 메모 앱입니다.

## 기능

- 메모 목록 (최근에 고친 메모가 위로)
- 메모 쓰기·고치기 (입력하는 즉시 자동 저장)
- 메모 삭제 (내용을 다 지우고 나가도 삭제됨)
- 검색
- 다크 모드

메모는 **휴대폰 안에만** 저장됩니다(`expo-sqlite`의 키-값 저장소). 로그인이나 서버는 없어서,
앱을 지우면 메모도 함께 지워집니다.

## 기술 스택

[Expo](https://expo.dev) SDK 58 (React Native) + TypeScript + Expo Router

## 실행

```bash
npm install
npx expo start
```

`expo-sqlite`는 Expo Go에 기본으로 들어 있어서, 터미널에 뜨는 QR 코드를
휴대폰으로 찍으면 바로 실행됩니다.

## 폴더 구조

```
src/
├── app/               # 화면 (파일 하나 = 화면 하나)
│   ├── _layout.tsx    # 공통 네비게이션
│   ├── index.tsx      # 메모 목록 + 검색
│   └── memo/[id].tsx  # 메모 편집
├── lib/memos.ts       # 메모 저장·불러오기
├── constants/theme.ts # 색상, 간격
└── hooks/             # 테마 훅
```

## 개발 명령어

```bash
npx expo install <패키지>  # 패키지 추가는 npm install 대신 이걸로
npm run lint               # 린트
npm run typecheck          # 타입 검사
```
