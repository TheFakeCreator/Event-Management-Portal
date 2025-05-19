# 🎉 Event Management Portal

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Enabled-brightgreen)](https://mongodb.com)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()

> A modern full-stack open-source platform to manage 🎪 fests, 📅 events, 📝 recruitments & more — built for universities, clubs, and organizations.

---

## 🚀 Tech Stack

**Frontend**: EJS + TailwindCSS  
**Backend**: Node.js + Express  
**Database**: MongoDB + Mongoose  
**Auth**: Session-based + Google OAuth  
**Cloud Services**: Cloudinary (Image Hosting) + Nodemailer (Email)

---

## 📌 Features

- 🔐 **User Authentication**: Secure login, signup, password reset, email verification
- 🗓️ **Event Management**: Create, update, delete, and view detailed event info
- ⚙️ **Admin Dashboard**: Role-based management of users, clubs, logs, and events
- 📬 **Email Notifications**: Verification and event-based email alerts
- ☁️ **Cloudinary Integration**: Event banner and profile image uploads
- 🎭 **Role-Based Access**: Admins, Club Admins, and Users
- 🔎 **Advanced Filters**: Filter by club, type, and category
- 🔁 **Flash Messages**: Real-time user feedback on actions
- 📱 **Responsive UI**: Fully responsive layout for all screen sizes
- 🔎 **Search Bar**: Instant search over all event listings
- 📣 **Announcements**: Admin-posted announcements page for users
- 🎛️ **Club Management**: Individual club panels for managing events

---

## ✅ Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)
- [Cloudinary](https://cloudinary.com/) account
- [Google Developer Console](https://console.developers.google.com/) credentials for OAuth
- App email credentials for verification

---

## ⚙️ Setup Instructions

### 🔁 Clone the Repository

```bash
git clone https://github.com/your-username/event-management-portal.git
cd event-management-portal
```

### 📦 Install Dependencies

```bash
npm install
```

### 🧪 Configure Environment

Create a .env file in the root and add:

```env
MONGO_URI=your_mongo_uri
EMAIL_USER=your_email
EMAIL_PASS=your_email_password_or_app_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### ▶️ Run the Server

```bash
npm start
```

Then open http://localhost:3000 in your browser.

---

## 🙌 Contribution Guidelines

We love contributions from the community! 💖

1. Fork the project

2. Create a feature branch:

```bash
git checkout -b feature-name
```

3. Commit your changes:

```bash
git commit -m "Added feature XYZ"
```

4. Push your branch:

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🌟 Stargazers

---

## 💬 Contact

Built with ❤️ by @TheFakeCreator and @shijha19

For queries, reach out via GitHub Issues
