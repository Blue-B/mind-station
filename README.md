# 마음 정거장 (mind Station)

[![Emotion Station Logo](https://github.com/user-attachments/assets/0cf25c5e-9c14-4c84-8dc3-8c497ba5fcca)](https://mind-station.org)

이미지 클릭시 사이트이동



혼자서 감당하기 어려운 복잡한 감정들, 여기서 잠시 내려놓으세요.  
당신의 마음에 작은 쉼표를 찍어드립니다.  
AI와 함께 지금의 감정을 나누고 따뜻한 공감과 위로를 받아보세요.

---

## 🌟 프로젝트 소개

**마음 정거장**은 질문에 대한 자신의 현재 감정을 표현하고, AI의 공감과 위로를 받을 수 있는 마음 케어 플랫폼입니다.  
마음이 복잡할때 쉬어갈수 있도록 AI의 사소한 질문에 답하고 오늘 하루 자신의 감정을 이해하기 위해 이 서비스를 개발했습니다.  
AI의 따뜻한 공감과 긍정적인 격려를 통해 마음의 안정을 찾을 수 있도록 도와드립니다.


---

## 🛠️ 주요 기능

- **🌈 감정 기록**: 주어진 질문에 답하여 오늘의 기분과 감정을 기록할 수 있습니다.
- **🤖 AI 공감 및 위로**: AI가 당신의 감정을 분석하고 따뜻한 공감과 위로를 제공합니다.
- **📅 기록 조회 및 삭제**: 과거의 감정 기록을 조회하고 필요시 삭제할 수 있습니다.
- **🔒 익명성 보장**: 사용자 정보는 안전하게 보호되며 익명성이 보장됩니다.
- **🎭Guest로그인 지원** : 이제 Guest로 로그인하여 일 2회 답변을하여 서비스를 체험해 볼 수 있습니다. 단 기록보기 기능은 지원하지 않습니다. (로그인 회원은 일10회 답변가능)

---

## 🔍 사이트 미리보기
### **메인 화면**
![메인화면](https://github.com/user-attachments/assets/9581ea2e-73e0-4f22-9a76-00d75ad3301c)

### **AI마음기록**
![질문](https://github.com/user-attachments/assets/73f76ff5-3743-4c93-9b1d-6de95d41c8e5)

### **에러 페이지**
![error](https://github.com/user-attachments/assets/795921b2-286c-4cb6-a2e1-0487b7caef89)

### **검색엔진 등록**
![Daum](https://github.com/user-attachments/assets/e671e04a-2486-47d7-962e-68b5e401c6a4)
![Naver](https://github.com/user-attachments/assets/3e786e2e-5f40-42ef-8933-6abb741a5192)
![Google](https://github.com/user-attachments/assets/36f7ef00-40a6-43d3-a812-2f791a715f8f)


---

## 👨‍💻 개발 후기
이번 프로젝트에서는 AI의 도움을 많이 받았습니다. 유튜버 조코딩x구글의 AI해커톤 &  Gemini API 개발자 대회 참가를 준비하면서, Node.js에서 Gemini API를 사용한 서비스를 개발하는 기획 및 코딩 과정에서 GPT의 도움을 많이 받았습니다.
또한 서비스에 사용된 모든 이미지는 코파일럿(Copilot)AI를 사용하여 제작하였습니다.


마음 정거장은 어쩌면 저를 위한 서비스일지도 모릅니다. 평소에도 걱정과 고민이 많은 저는 돌이켜 생각해보면 스스로 해결하거나 시간이 지나면 해결되는 고민들이 많습니다. 이런 고민이 많은 저를 되돌아보며 나의 평소 감정은 어떨까 생각하게 되었고, 선뜻 내 이야기를 건네기 어려운 사람 대신 AI에게 고민을 털어놓고, 직접적인 해결은 아니더라도 누군가에게 받지 못한 적절한 공감과 긍정적인 격려를 받을 수 있는 기회를 만들고자 이 서비스를 제작하게 되었습니다.

---

## 🚀 설치 및 실행

### 📋 요구 사항

- [Node.js](https://nodejs.org/) (버전 20 이상)
- [Firebase](https://firebase.google.com/) 계정 및 Firebase 설정
- [Gemini](https://aistudio.google.com/app/apikey?hl=ko)Google Gemini AI API 키
- [Firebase_Accountkey](https://console.firebase.google.com/project/emotion-5b20b/settings/serviceaccounts/adminsdk?hl=ko)Node.js용 serviceAccountKey.json 비공개키
- [public/firebase-config.js](https://console.firebase.google.com/project/emotion-5b20b/settings/general/web:NDIzODI0M2UtMDEyZS00NmM1LTk4N2QtOTkyYzZlZjI4YWM0?hl=ko) 파이어페이스 SDK 설정
- [index.js //initialPrompt 변수](https://github.com/Blue-B/mind-station/blob/main/index.js#L39) AI의 적절한 프롬포트 설정 
- [public/app.js //questions변수](https://github.com/Blue-B/mind-station/blob/main/public/app.js#L34) 사전 질문 리스트 작성
- [index.js //firebase-config변수](https://github.com/Blue-B/mind-station/blob/main/index.js#L28) firebase-config 작성(.env처리) `파이어베이스 - '프로젝트설정 아이콘'- '일반' - '내앱'에서 SDK 확인가능`

### 📦 설치

1. 이 저장소를 클론합니다.

    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/Blue-B/mind-station.git)
    cd [your-repo-name](https://github.com/Blue-B/mind-station.git)
    ```

2. 필요한 패키지를 설치합니다.

    ```bash
    npm install
    ```

3. Firebase 설정 파일 (`serviceAccountKey.json`)을 프로젝트 루트에 추가합니다. (요구사항 참고)

4. `.env` 파일을 생성하고 서비스 PORT와 Google Generative AI API 키를 추가합니다.

    ```
    PORT=5000
    apikey=your_geminie_api_key
    ```

### ▶️ 실행

개발 서버를 실행합니다.

```bash
node index.js
