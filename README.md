# Talklocal – Language Learning Voice Chat Platform

Talklocal is a real-time language learning platform that allows users to practice languages through voice-based chat rooms. Built using React, TypeScript, Express, and WebRTC, it helps learners connect with native speakers and improve communication skills in an immersive environment.

---

## ⭐ Features

### 🎙 Real-Time Communication
- Voice chat using WebRTC  
- WebSocket-based signaling  
- Join/leave room events  
- Real-time text chat  
- Active speaker indicators  

### 👥 Social Features
- Follow users to build your network  
- View followers & following lists  
- User profiles with bio & language preferences  
- Learning streak tracking  
- Basic user rating system  

### 🔐 Authentication
- Email/password signup and login  
- JWT authentication  
- Password hashing using bcrypt  
- Protected routes  

### 🏠 Room Management
- Create language/topic-based rooms  
- Search and filter rooms  
- Host controls (mute/kick)  
- Participant limits (4–12 users)  
- Real-time room updates  

### 🎨 UI/UX
- Tailwind CSS + Shadcn UI  
- Fully responsive design  
- Dark/Light mode (default dark)  
- Smooth, modern animations  

---

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript  
- Zustand  
- TanStack Query v5  
- WebRTC + WebSocket client  
- Tailwind + Shadcn UI  
- Wouter routing

### Backend
- Node.js + Express  
- TypeScript  
- WebSocket (ws)  
- JWT + bcrypt  
- Zod validation  
- In-memory storage  

---

## 🔧 Steps to Set Up

1. Clone the repository
```sh
git clone https://github.com/yourusername/talklocal.git
cd talklocal
```

2. Install dependencies for both frontend and backend
```sh
cd server
npm install

cd ../client
npm install
```

3. Start the backend server
```sh
cd server
npm run dev
```
4. Start the frontend
```sh
cd ../client
npm run dev
```

## Contributing
Feel free to submit issues, feature requests, or contribute by making pull requests.

## License
This project is licensed under the MIT License.

---
### Author
**Krishna Sumit**

If you like this project, don't forget to ⭐ the repository!
