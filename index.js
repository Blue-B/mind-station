require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const MAX_REQUESTS_PER_DAY = 10; // 로그인 사용자 최대 전송 횟수
const GUEST_MAX_REQUESTS_PER_DAY = 2; // guest 사용자 최대 전송 횟수
const requestIp = require('request-ip');



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());


const apiKey = process.env.apikey;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



app.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  });
});

const initialPrompt = `
ai 프롬포트
`;

let chat;
async function initializeChat() {
  chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: initialPrompt }] },
      { role: "model", parts: [{ text: "네, 이해했습니다. 사용자의 감정을 분석하고 적절한 응답을 제공하도록 하겠습니다." }] }
    ],
  });
}
initializeChat();

async function analyzeEmotionAndGenerateResponse(answer) {
  try {
    const trimmedAnswer = answer.replace(/\s/g, '');
    if (!answer || trimmedAnswer.length === 0) {
      throw new Error("프롬프트가 비어 있습니다.");
    }

    const result = await chat.sendMessage(answer);

    let generatedText;
    if (result.response && result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts[0]) {
      generatedText = result.response.candidates[0].content.parts[0].text;
    } else {
      throw new Error('응답 객체에 후보 텍스트가 없습니다.');
      }
      
      generatedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      
      let parsedResponse;
      try {
          parsedResponse = JSON.parse(generatedText);
      } catch (parseError) {
          parsedResponse = {
              emotion: "평온",
              response: "죄송합니다. 응답을 처리하는 데 문제가 있었어요. 다시 한 번 말씀해 주시겠어요?"
          };
      }
      
       // 프롬프트에서 걸러질 경우
       if (parsedResponse.response === "그런 내용은 답할수 없어요") {
        return {
          aiResponse: parsedResponse.response,
          emotion: "unknown",
          characterImage: "/images/error.jfif"
        };
      }

      const characterImage = getRandomImage(parsedResponse.emotion);

      // 기본값 설정
      if (!parsedResponse.emotion) {
        parsedResponse.emotion = "unknown";
      }

      return {
          aiResponse: parsedResponse.response,
          emotion: parsedResponse.emotion,
          characterImage: characterImage
      };
  } catch (error) {
      console.error('Gemini API 처리 중 오류 발생:', error);
      return {
        aiResponse: "그런 내용은 답할 수 없어요.",
        emotion: "404",
        characterImage: "images/error.jfif"
    };
  }
}

function getRandomImage(emotion) {
  const emotionToFolder = {
    '행복': 'happy',
    '슬픔': 'depressed',
    '화남': 'angry',
    '불안': 'anxious',
    '평온': 'peaceful'
  };
  const folder = emotionToFolder[emotion] || 'peaceful';
  const folderPath = path.join(__dirname, 'public/images', folder);
  
  const images = fs.readdirSync(folderPath).filter(file => /\.(jpg|jpeg|png|jfif)$/i.test(file));
  const randomImage = images[Math.floor(Math.random() * images.length)];
  
  return `/images/${folder}/${randomImage}`;
}
function removeUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}


async function saveUserResponse(userId, userResponse, aiResponse, emotion, isGuest) {
  try {
    const data = {
      userId: userId,
      userResponse: userResponse,
      aiResponse: aiResponse,
      emotion: emotion,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const collection = isGuest ? 'guest_responses' : 'responses'; // 컬렉션 선택

    await db.collection(collection).add(data);
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}
async function getUserRequestCount(userId) {
  const docRef = db.collection('userLimits').doc(userId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { count: 0, lastRequest: null };
  }

  const data = doc.data();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (data.lastRequest !== today) {
    return { count: 0, lastRequest: today };
  }

  return data;

}

async function updateUserRequestCount(userId, count, date) {
  const data = removeUndefined({ count, lastRequest: date });
  const docRef = db.collection('userLimits').doc(userId);
  await docRef.set(data, { merge: true });
}

app.post('/api/answers', async (req, res) => {
  const { answer, userId, isGuest } = req.body;
  const ip = req.clientIp;

  const trimmedAnswer = answer.replace(/\s/g, '');
  if (!answer || trimmedAnswer.length < 5 || answer.trim().length > 400) {
    return res.status(400).json({ message: '질문은 5자에서 400자 사이여야 합니다.' });
  }

  const effectiveUserId = isGuest ? ip : userId;

  try {
    const { count, lastRequest } = await getUserRequestCount(effectiveUserId);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const maxRequests = isGuest ? GUEST_MAX_REQUESTS_PER_DAY : MAX_REQUESTS_PER_DAY;

    if (lastRequest !== today) {
      count = 0;
    }

    if (count >= maxRequests) {
      return res.status(429).json({ message: `Guest 사용자의 일 전송 횟수 2회를 초과하였습니다. 더 이용하고 싶다면 ${isGuest ? '구글' : ''} 로그인을 해주세요.` });
    }

    const newCount = count + 1;
    await updateUserRequestCount(effectiveUserId, newCount, today);

    const result = await analyzeEmotionAndGenerateResponse(answer);
    await saveUserResponse(effectiveUserId, answer, result.aiResponse, result.emotion,isGuest);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 503) {
      return res.status(503).json({ message: '현재 서비스가 과부하 상태입니다. 잠시 후 다시 시도해주세요.' });
    }
    console.error('API 응답 처리 중 오류 발생:', error);
    return res.status(500).json({ message: 'Error processing response', error: error.message });
  }
});

app.get('/api/records', async (req, res) => {
  const { userId } = req.query;
  try {
      const snapshot = await db.collection('responses').where('userId', '==', userId).orderBy('timestamp', 'desc').get();
      if (snapshot.empty) {
          return res.status(200).json([]); 
      }
      const records = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id, 
              ...data,
              timestamp: data.timestamp.toDate()
          };
      });
      res.status(200).json(records);
  } catch (error) {
      console.error("Error fetching records:", error); 
      res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await db.collection('responses').doc(id).delete();
      res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
});

app.delete('/api/records', async (req, res) => {
  const { userId } = req.query;
  try {
      const snapshot = await db.collection('responses').where('userId', '==', userId).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();
      res.status(200).json({ message: 'All records deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting all records', error: error.message });
  }
});

// 404 에러
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 돌아가고 있어요!`);
});
