# Event Management Portal

A modern web application designed to streamline event management, built with a robust tech stack including Node.js, Express, MongoDB, and EJS. It offers a seamless user experience with features like secure authentication, responsive design, and advanced event handling capabilities.

## 📌 Features

- **User Authentication**: Secure signup and login functionality with password hashing and session management.
- **Event Management**: Create, edit, delete, and view events with detailed information.
- **Admin Dashboard**: A dedicated dashboard for administrators to manage events and users efficiently.
- **Flash Notifications**: Real-time flash messages for user feedback on actions like login, event creation, etc.
- **Responsive Design**: Fully responsive UI for seamless experience across devices.
- **Google OAuth Integration**: Optional Google login for quick and secure authentication.
- **Email Notifications**: Automated email system for account verification and event updates.
- **Cloudinary Integration**: Image hosting for event banners and user profiles.
- **Search and Filter**: Advanced search and filtering options for events.
- **Role-Based Access Control**: Different access levels for users and admins.

## ✅ Pre-requisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local or cloud instance)
- [Git](https://git-scm.com/)
- A code editor like [VS Code](https://code.visualstudio.com/)
- A Cloudinary account for image hosting (optional but recommended)
- Google Developer Console credentials for OAuth (optional for Google login)
- An email account for sending verification links

## 🛠️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/event-management-portal.git
```

### 2️⃣ Navigate to the Project Directory

```bash
cd event-management-portal
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Set Up Environment Variables

Create a `.env` file in the root directory and add:

```env
MONGO_URI=your_URI
EMAIL_USER=your_email_for_verification_link
EMAIL_PASS=your_email_key_for_app
JWT_SECRET=your_JWT_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

### 5️⃣ Run the Project

```bash
npm start
```

### 6️⃣ Open in Browser

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## 🎯 Contribution Guidelines

We welcome contributions! Follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Added feature X"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Create a Pull Request.

## 📜 License

This project is licensed under the MIT License.
