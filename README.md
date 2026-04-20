Project: Shop_Online_Practise
Overview

This project is a full-stack e-commerce web application developed using Node.js and Express.js, following the MVC (Model-View-Controller) architecture. It allows users to browse products, add them to a cart, place orders, and complete payments securely.

The application simulates a real-world online shop, including authentication, session management, and payment integration.

Features:
User authentication (signup & login)
Session-based authentication with cookies
Product listing and detailed product view
Shopping cart functionality
Order creation and history
Stripe payment integration
Invoice generation (PDF)
Admin panel for managing products (CRUD operations)

Technologies Used:
Backend: Node.js, Express.js
Database: MongoDB with Mongoose
Frontend: EJS (Embedded JavaScript Templates)
Authentication: Sessions, Cookies, CSRF Protection
Payments: Stripe API
Other Tools: PDFKit (invoice generation), bcrypt (password hashing)

Architecture / How It Works
The application follows the MVC pattern:

Models: Handle data logic and communication with MongoDB
Views: Render dynamic pages using EJS templates
Controllers: Manage application logic and user requests

Middleware is used for:
Authentication checks
Error handling
Security (CSRF protection)
Authentication & Security
Passwords are hashed using bcrypt before storage
Sessions are used to maintain user login state
CSRF tokens are implemented to protect against cross-site request forgery attacks

Payments
Stripe Checkout is integrated to handle secure payments.
Users can complete transactions, and upon success:

Orders are stored in the database
A PDF invoice is generated
