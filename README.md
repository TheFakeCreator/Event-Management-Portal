<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Management Portal - README</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Event Management Portal</h1>
    <p>A web application to manage events, built using Node.js, Express, MongoDB, and EJS.</p>
    
    <h2>📌 Features</h2>
    <ul>
        <li>User authentication (Signup/Login)</li>
        <li>Create, edit, delete, and view events</li>
        <li>Admin dashboard for event management</li>
        <li>Flash messages for notifications</li>
    </ul>
    
    <h2>🛠️ Setup Instructions</h2>
    <h3>1️⃣ Clone the Repository</h3>
    <pre><code>git clone https://github.com/your-username/event-management-portal.git</code></pre>
    
    <h3>2️⃣ Navigate to the Project Directory</h3>
    <pre><code>cd event-management-portal</code></pre>
    
    <h3>3️⃣ Install Dependencies</h3>
    <pre><code>npm install</code></pre>
    
    <h3>4️⃣ Set Up Environment Variables</h3>
    <p>Create a <code>.env</code> file in the root directory and add:</p>
    <pre><code>
MONGO_URI=your_mongodb_connection_string
PORT=5000
SESSION_SECRET=your_secret_key
    </code></pre>
    
    <h3>5️⃣ Run the Project</h3>
    <pre><code>npm start</code></pre>
    
    <h3>6️⃣ Open in Browser</h3>
    <p>Visit <a href="http://localhost:5000" target="_blank">http://localhost:5000</a> to use the application.</p>
    
    <h2>🎯 Contribution Guidelines</h2>
    <p>We welcome contributions! Follow these steps:</p>
    <ol>
        <li>Fork the repository.</li>
        <li>Create a new branch: <code>git checkout -b feature-name</code></li>
        <li>Make your changes and commit: <code>git commit -m "Added feature X"</code></li>
        <li>Push to your branch: <code>git push origin feature-name</code></li>
        <li>Create a Pull Request.</li>
    </ol>
    
    <h2>📜 License</h2>
    <p>This project is licensed under the MIT License.</p>
</body>
</html>
