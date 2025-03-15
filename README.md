# ChMake-Chat-App

ChMake-Chat-App is a real-time chat application that allows users to connect and communicate with random users as well as their friends. Users can send friend requests, accept or decline them, and engage in private conversations.

## Features

- **Random Chat**: Connect with random users and start a conversation.
- **Friend Requests**: Send and accept friend requests to build your contact list.
- **Private Chat**: Chat securely with friends in private conversations.
- **Real-Time Messaging**: Instant message delivery using WebSockets.
- **User Authentication**: Secure login and signup for users.
- **Online/Offline Status**: See which of your friends are online.
- **Chat History**: Store and retrieve previous conversations.

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL + MongoDB + Redis (for caching)
- **WebSockets**: Socket.io for real-time messaging
- **Authentication**: JSON Web Tokens (JWT)

## Installation

### Prerequisites
Make sure you have the following installed:
- Node.js
- MySQL
- MongoDB
- Redis (optional for caching but recommended)

### Steps to Set Up

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/ChMake-Chat-App.git
   cd ChMake-Chat-App
   ```

2. Install dependencies for both frontend and backend:
   ```sh
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory and add the required environment variables:
     ```env
     MONGODB_URI=...
     PORT=5001
     JWT_SECRET=...

     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...

     NODE_ENV=development
     ```

4. Set up the database:
   - Create a MySQL database and update the `.env` file with the credentials.
   - Run migrations (if applicable).

5. Start the backend server:
   ```sh
   cd backend
   npm run dev
   ```

6. Start the frontend:
   ```sh
   cd frontend
   npm run dev
   ```

## Usage
- Sign up or log in to start using the app.
- Connect with random users or send friend requests.
- Accept or decline friend requests.
- Start chatting in real-time!

## Contributing
Feel free to submit issues, feature requests, or contribute by making pull requests.

## License
This project is licensed under the MIT License.

---
### Author
**Krishna Sumit**

If you like this project, don't forget to ⭐ the repository!
