import { getFirebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async function() {
    const questionElement = document.getElementById('question');
    const loginButton = document.getElementById('login');
    const logoutButton = document.getElementById('logout');
    const answerForm = document.getElementById('answer-form');
    const answerInput = document.getElementById('answer');
    const aiResponseElement = document.getElementById('ai-response');
    const characterImageElement = document.getElementById('character-image');
    const recordsElement = document.getElementById('records');
    const viewRecordsButton = document.getElementById('view-records');
    const deleteAllRecordsButton = document.getElementById('delete-all-records');
    const welcomeSection = document.getElementById('welcome-section');
    const loadingElement = document.getElementById('loading');
    const charCountElement = document.getElementById('char-count');
    const guestLoginButton = document.getElementById('guest-login');
    let isGuest = false;
    

    // guest 로그인 버튼 클릭 시 처리
    guestLoginButton.addEventListener('click', function () {
        isGuest = true;
        loginButton.style.display = 'none';
        guestLoginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        answerForm.style.display = 'block';
        viewRecordsButton.style.display = 'none'; 
        questionElement.style.display = 'block';
        answerInput.style.display = 'block';
        welcomeSection.style.display = 'none';
    });


    let auth, provider;

    try {
        const firebaseConfig = await getFirebaseConfig();
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return;
    }

    // 질문 랜덤 선택 함수
    function displayQuestion() {
        const questions = [
        //질문 리스트

        ];
        const randomIndex = Math.floor(Math.random() * questions.length);
        questionElement.textContent = questions[randomIndex];
    }

    // 웹뷰 환경 감지 함수
    function isWebView() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const webviewRegex = /(Instagram|Line|Twitter|LinkedIn|Snapchat|WeChat|Weibo|QQ|baidubrowser|UCBrowser|MiuiBrowser|Alipay|Line|Nintendo|Xbox|Zalo|InMobi|GSA|MSI|KAKAO|Facebook|Instagram|trill)/i;

        if (webviewRegex.test(userAgent)) {
            return true;
        }

        return (window.navigator.standalone || document.referrer.includes('android-app://')) ||
            (window.webkit && window.webkit.messageHandlers);
    }

    // 로그인 버튼 클릭 시 처리
    loginButton.addEventListener('click', function () {
        if (isWebView()) {//웹뷰감지 403에러
            alert("현재 사용 중인 인앱 브라우저에서는 Google 로그인이 지원되지 않습니다. 다른 브라우저를 사용해 주세요.");
        } else {
            signInWithPopup(auth, provider).then(result => {
                loginButton.style.display = 'none';
                guestLoginButton.style.display = 'none';
                logoutButton.style.display = 'block';
                answerForm.style.display = 'block';
                viewRecordsButton.style.display = 'block';
                questionElement.style.display = 'block';
                answerInput.style.display = 'block';
                welcomeSection.style.display = 'none';
            }).catch(error => {
                console.error("Error during sign-in:", error);
            });
        }
    });

    // 로그아웃 버튼 클릭시 처리
    logoutButton.addEventListener('click', function () {
        signOut(auth).then(() => {
            loginButton.style.display = 'block';
            guestLoginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            answerForm.style.display = 'none';
            viewRecordsButton.style.display = 'none';
            deleteAllRecordsButton.style.display = 'none';
            aiResponseElement.style.display = 'none';
            characterImageElement.innerHTML = '';
            recordsElement.innerHTML = '';
            questionElement.style.display = 'none';
            answerInput.style.display = 'none';
            welcomeSection.style.display = 'block';
            isGuest = false; 
        }).catch(error => {
            console.error("Error during sign-out:", error);
        });
    });
//감정 기록 제출시 처리
    answerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const userAnswer = answerInput.value;
        const randomQuestion = questionElement.textContent;
        const fullQuestion = `질문: ${randomQuestion}\n사용자 답변: ${userAnswer}`;
        const user = auth.currentUser;
        const userId = isGuest ? null : user ? user.uid : null;

        if (userId || isGuest) {
            const trimmedAnswer = userAnswer.replace(/\s/g, '');
            if (trimmedAnswer.length < 5) {
                alert("답변은 최소 5자 이상의 유효한 문자를 포함해야 합니다.");
                return;
            }

            loadingElement.style.display = 'block';
            aiResponseElement.style.display = 'none';

            fetch('/api/answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answer: fullQuestion, userId: userId, isGuest: isGuest })
            })
                .then(response => response.json().then(data => ({ status: response.status, data })))
                .then(({ status, data }) => {
                    if (status === 400 || status === 429) {
                        alert(data.message);
                        loadingElement.style.display = 'none';
                        return;
                    }
                    if (status === 500) {
                        alert("서버 오류가 발생했습니다. 다시 시도해주세요.");
                        console.error("Error:", data.error);
                        loadingElement.style.display = 'none';
                        return;
                    }
                    if (!data.aiResponse) {
                        alert("응답할 수 없는 내용입니다.");
                        aiResponseElement.textContent = "질문과 관련된 답변을 입력해주세요.";
                        characterImageElement.innerHTML = `<img src="/images/error.jfif" alt="unavailable">`;
                        loadingElement.style.display = 'none';
                        return;
                    }
                    aiResponseElement.textContent = data.aiResponse;
                    aiResponseElement.style.display = 'block';
                    characterImageElement.innerHTML = `<img src="${data.characterImage}" alt="${data.emotion}">`;
                    loadingElement.style.display = 'none';
                })
                .catch(error => {
                    console.error("Error submitting answer:", error);
                    aiResponseElement.textContent = "서버와 통신하는 중 오류가 발생했습니다.";
                    aiResponseElement.style.display = 'block';
                    characterImageElement.innerHTML = `<img src="/images/error.jfif" alt="unavailable">`;
                    loadingElement.style.display = 'none';
                });
        } else {
            console.error("No user is signed in");
            loadingElement.style.display = 'none';
        }
    });

    // 텍스트 입력 시 글자 수 표시
    answerInput.addEventListener('input', function () {
        const currentLength = answerInput.value.length;
        charCountElement.textContent = `${currentLength}/400`;
    });

    // 기록 보기 버튼 클릭 시 처리
    viewRecordsButton.addEventListener('click', function () {
        if (recordsElement.style.display === 'none' || recordsElement.style.display === '') {
            const user = auth.currentUser;
            if (user) {

                fetch(`/api/records?userId=${user.uid}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (!Array.isArray(data)) {
                            throw new TypeError("Expected an array but got a non-array data");
                        }
                        if (data.length === 0) {
                            recordsElement.textContent = "기록이 없습니다.";
                            deleteAllRecordsButton.style.display = 'none';
                        } else {
                            recordsElement.innerHTML = data.map(record => `
                                <div style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 5px;">
                                <p><strong>${new Date(record.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} ${new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</strong></p>
                                <p><strong>감정 :</strong> ${record.emotion}</p>
                                <p><strong>사용자 :</strong> ${record.userResponse}</p>
                                <p><strong>AI답변 :</strong> ${record.aiResponse}</p>
                                <button class="delete-record" data-id="${record.id}">삭제</button>
                                </div>
                            `).join('');
                            deleteAllRecordsButton.style.display = 'block';
                        }

                        document.querySelectorAll('.delete-record').forEach(button => {
                            button.addEventListener('click', function () {
                                const recordId = this.getAttribute('data-id');
                                deleteRecord(recordId);
                            });
                        });

                        recordsElement.style.display = 'block';
                        viewRecordsButton.textContent = "기록닫기";
                    })
                    .catch(error => {
                        console.error("Error fetching records:", error);
                        recordsElement.textContent = "기록을 가져오는 중 오류가 발생했습니다.";
                        recordsElement.style.display = 'block';
                        deleteAllRecordsButton.style.display = 'none';
                    });
            } else {
                console.error("No user is signed in");
            }
        } else {
            recordsElement.style.display = 'none';
            deleteAllRecordsButton.style.display = 'none';
            viewRecordsButton.textContent = "기록보기";
        }
    });

    // 전체 기록 삭제 버튼 클릭 시 처리
    deleteAllRecordsButton.addEventListener('click', function () {
        if (!confirm("정말 전체 삭제하시겠습니까?")) {
            return;
        }
        const user = auth.currentUser;
        if (user) {
            fetch(`/api/records?userId=${user.uid}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    recordsElement.textContent = "기록이 없어요! 오늘의 기분은 어떠신가요??";
                    deleteAllRecordsButton.style.display = 'none';
                })
                .catch(error => {
                    console.error("Error deleting all records:", error);
                    recordsElement.textContent = "기록을 삭제하는 중 오류가 발생했습니다.";
                });
        } else {
            console.error("No user is signed in");
        }
    });

    // 개별 기록 삭제 함수
    function deleteRecord(recordId) {
        fetch(`/api/records/${recordId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                viewRecordsButton.click();
            })
            .catch(error => {
                console.error("Error deleting record:", error);
            });
    }

    // 질문 랜덤 표시
    displayQuestion();

    // 인증 상태 변화 시 처리
    onAuthStateChanged(auth, user => {
        if (user) {
            loginButton.style.display = 'none';
            guestLoginButton.style.display = 'none'; 
            logoutButton.style.display = 'block';
            answerForm.style.display = 'block';
            viewRecordsButton.style.display = 'block';
            questionElement.style.display = 'block';
            answerInput.style.display = 'block';
            aiResponseElement.style.display = 'none';
            welcomeSection.style.display = 'none';
        } else {
            loginButton.style.display = 'block';
            guestLoginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            answerForm.style.display = 'none';
            viewRecordsButton.style.display = 'none';
            deleteAllRecordsButton.style.display = 'none';
            aiResponseElement.style.display = 'none';
            characterImageElement.innerHTML = '';
            recordsElement.innerHTML = '';
            questionElement.style.display = 'none';
            answerInput.style.display = 'none';
            welcomeSection.style.display = 'block';
        }
    });

    // 초기 설정
    questionElement.style.display = 'none';
    answerInput.style.display = 'none';
    aiResponseElement.style.display = 'none';
    recordsElement.style.display = 'none';
    deleteAllRecordsButton.style.display = 'none';
    charCountElement.textContent = '0/400';
});
