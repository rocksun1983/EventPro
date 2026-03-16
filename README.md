# EventPro 📅

A comprehensive event management system built with Node.js, Express, and MongoDB. Manage events, users, and send automated reminders.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Event Management** - Create, view, manage, and duplicate events
- **Admin Dashboard** - Administrative controls and statistics
- **Automated Reminders** - Email and SMS notifications for upcoming events
- **SMS Integration** - Twilio-powered SMS messaging for event notifications
- **Attendance Reporting** - CSV and PDF attendance exports with no-show visibility
- **Organizer Dashboard** - Live stats with auto-refresh (SSE)
- **RESTful API** - Well-structured API endpoints

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer for automated reminders
- **SMS**: Twilio for SMS messaging
- **PDF**: PDFKit for shareable summary reports
- **Security**: bcryptjs for password hashing
- **Development**: Nodemon for hot reloading

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rocksun1983/EventPro.git
   cd EventPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` file and update the values:
   ```env
   MONGO_URI=mongodb://localhost:27017/eventpro
   JWT_SECRET=your-super-secret-jwt-key-here
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   BACKEND_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your-appwrite-project-id
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/signup/user` | Register new user (explicit user role) | No |
| POST | `/signup/organizer` | Create organizer account | Admin only |
| POST | `/signup/admin` | Create admin account | No (open endpoint) |
| POST | `/login` | User login | No |
| POST | `/forgot-password` | Request password reset email | No |
| POST | `/reset-password/:token` | Reset password with token | No |
| POST | `/reset-password` | Reset password (authenticated) | Yes |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |

### Event Routes (`/api/events`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all events (with filters) | No |
| GET | `/:id` | Get event by ID | No |
| POST | `/` | Create new event | Yes |
| POST | `/:id/duplicate` | Duplicate an event (draft, no date) | Yes |
| PUT | `/:id` | Update event | Yes |
| DELETE | `/:id` | Delete event | Yes |
| GET | `/organizer/my-events` | Get organizer's events | Yes |

**Query Parameters for GET /api/events:**
- `status`: Filter by status (draft, published, cancelled, completed)
- `organizer`: Filter by organizer ID
- `upcoming`: Set to "true" for upcoming events only
- `limit`: Number of events per page (default: 10)
- `page`: Page number (default: 1)

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Admin dashboard | Admin only |
| GET | `/organizers` | Get all organizer accounts | Admin only |
| GET | `/organizers/:organizerId` | Get organizer details | Admin only |
| PUT | `/organizers/:organizerId/status` | Update organizer status | Admin only |
| PUT | `/organizers/:organizerId/reset-password` | Reset organizer password | Admin only |
| GET | `/sms/config` | Get SMS configuration status | Admin only |
| POST | `/sms/test` | Test SMS functionality | Admin only |
| PUT | `/sms/user-settings` | Update user SMS settings | Admin only |
| GET | `/sms/users` | Get users with SMS enabled | Admin only |

**Query Parameters for GET /api/admin/organizers:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or email
- `status`: Filter by verification status
- `sortBy`: Sort field (name, email, createdAt)
- `sortOrder`: Sort order (asc, desc)

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Get dashboard statistics | Admin only |

### Organizer Dashboard Routes (`/api/organizer/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Get organizer dashboard stats | Organizer only |
| GET | `/stream` | Live organizer stats stream (SSE) | Organizer only |

**SSE Auth Note:**
- If your frontend cannot set `Authorization` headers for SSE, pass a JWT as `?token=...` to `/stream`.

### Attendee Routes (`/api/events`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:eventId/attendees/imports` | Import attendees (CSV/XLSX) | Organizer/Admin |
| GET | `/:eventId/attendees/imports/:importId` | Get import status | Organizer/Admin |
| GET | `/:eventId/attendees/imports/:importId/result` | Get import result | Organizer/Admin |
| GET | `/:eventId/attendees/imports/:importId/duplicates.csv` | Download duplicate report | Organizer/Admin |
| GET | `/:eventId/attendees/imports/template` | Download attendee import template | Organizer/Admin |
| GET | `/:eventId/attendees/attendance.csv` | Export attendance CSV report | Organizer/Admin |
| GET | `/:eventId/attendees/attendance.pdf` | Export attendance PDF report | Organizer/Admin |

**Query Parameters for attendance exports:**
- `only`: Filter report rows (use `no_show` for no-shows only)

### Check-in Routes (`/api/events`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:eventId/checkin/template` | Get default check-in message template | Organizer/Admin |
| POST | `/:eventId/checkin/preview` | Preview check-in message | Organizer/Admin |
| POST | `/:eventId/checkin/generate` | Generate check-in codes | Organizer/Admin |
| POST | `/:eventId/checkin/scan` | Scan a check-in code (duplicate-aware) | Organizer/Admin |
| POST | `/:eventId/checkin/send` | Send check-in instructions | Organizer/Admin |
| GET | `/:eventId/checkin/send/:sendId` | Get check-in send status | Organizer/Admin |
| GET | `/:eventId/checkin/send/:sendId/result` | Get check-in send result | Organizer/Admin |

### SMS Webhook Routes (`/api/sms`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/inbound` | Twilio inbound SMS check-in validation | No (Twilio webhook) |

## 🔐 Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Data Models

### User
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (default: "user"),
  isVerified: Boolean (default: false),
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  smsEnabled: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Event
```javascript
{
  title: String (required),
  description: String,
  date: Date (required unless status is draft, must be future date for non-draft),
  location: String (required, venue/location),
  expectedAttendees: Number (default: 0),
  organizer: ObjectId (ref: User, required),
  status: String (enum: draft, published, cancelled, completed, default: draft),
  reminderSent: Boolean (default: false),
  createdAt: Date
}
```

## 📧 Email Reminders

The system automatically sends email reminders to event organizers 24 hours before their events. Configure your email settings in the `.env` file (SendGrid preferred; nodemailer fallback).

## 📱 SMS Integration

EventPro supports SMS notifications through Twilio integration. Users can opt-in to receive SMS reminders alongside email notifications.

### SMS Configuration

1. **Get Twilio Credentials**:
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID, Auth Token, and purchase a phone number

2. **Configure Environment Variables**:
   ```env
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Admin SMS Management**:
   - Check SMS configuration status: `GET /api/admin/sms/config`
   - Test SMS functionality: `POST /api/admin/sms/test`
   - Manage user SMS settings: `PUT /api/admin/sms/user-settings`

4. **User SMS Settings**:
   - Users can update their phone number and SMS preferences via `PUT /api/auth/profile`
   - Set `smsEnabled: true` to receive SMS reminders

### SMS Features

- **Automated Reminders**: SMS sent 24 hours before events (if enabled)
- **Admin Testing**: Test SMS configuration without creating events
- **User Opt-in**: Users control their SMS preferences
- **Fallback Support**: Continues working even if SMS is not configured
- **Feature Phone Check-in**: Attendees can text a 6-digit code to check in and receive confirmation
## 👥 Organizer Management

Admins have comprehensive tools to manage all registered organizer accounts on the platform.

### Viewing All Organizers

**Endpoint:** `GET /api/admin/organizers`

**Features:**
- Paginated list of all organizer accounts
- Search by name or email
- Filter by verification status
- Sort by various fields
- Event statistics for each organizer

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search organizers by name or email
- `status`: Filter by verification status (verified/unverified)
- `sortBy`: Sort field (name, email, createdAt)
- `sortOrder`: Sort order (asc, desc)

**Response includes:**
- Organizer details (name, email, phone, verification status)
- Event statistics (total events, upcoming events)
- Platform summary (total organizers, verified count, SMS enabled count)

### Organizer Details

**Endpoint:** `GET /api/admin/organizers/:organizerId`

**Returns:**
- Complete organizer profile
- Event statistics breakdown
- Recent events list (last 10)

### Managing Organizers

**Update Organizer Status:**
```javascript
PUT /api/admin/organizers/:organizerId/status
{
  "isVerified": true,
  "smsEnabled": false
}
```

**Reset Organizer Password:**
```javascript
PUT /api/admin/organizers/:organizerId/reset-password
{
  "newPassword": "newsecurepassword123"
}
```

### Organizer Management Features

- **Account Verification**: Approve/revoke organizer verification status
- **SMS Preferences**: Enable/disable SMS notifications for organizers
- **Password Management**: Reset passwords for locked-out organizers
- **Activity Monitoring**: Track event creation and management activity
- **Bulk Operations**: Efficient handling of multiple organizer accounts
## 📅 Event Management

Organizers can create, manage, and track their events through a comprehensive event management system.

### Creating Events

**Endpoint:** `POST /api/events`

**Required Fields:**
- `title`: Event title
- `location`: Venue/location

**Date Rules:**
- `date` is required for non-draft events
- Draft events may omit `date` (useful for duplication and planning)

**Optional Fields:**
- `description`: Event description
- `expectedAttendees`: Expected number of attendees
- `status`: Event status (draft, published, cancelled, completed)

**Example Request:**
```javascript
POST /api/events
Authorization: Bearer <your-jwt-token>
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference",
  "date": "2026-06-15T09:00:00.000Z",
  "location": "Convention Center, Downtown",
  "expectedAttendees": 500,
  "status": "published"
}
```

### Event Features

- **Automatic Organizer Assignment**: Events are automatically assigned to the authenticated user
- **Status Management**: Track events through draft → published → completed lifecycle
- **Attendee Tracking**: Set and monitor expected attendance numbers
- **Future Date Validation**: Ensures events are scheduled for future dates
- **Comprehensive Filtering**: Filter events by status, organizer, and date
- **Pagination Support**: Efficient handling of large event lists

### Managing Events

- **View All Events**: `GET /api/events` (public)
- **View My Events**: `GET /api/events/organizer/my-events` (organizer only)
- **Update Events**: `PUT /api/events/:id` (organizer or admin)
- **Delete Events**: `DELETE /api/events/:id` (organizer or admin)
- **Duplicate Event**: `POST /api/events/:id/duplicate` (organizer or admin)

## 🔑 Password Reset

EventPro provides secure password reset functionality via email. Users can reset their passwords even when locked out of their accounts.

### Password Reset Flow

1. **Request Reset**: User submits email to `POST /api/auth/forgot-password`
2. **Receive Email**: User receives email with secure reset link
3. **Reset Password**: User clicks link and sets new password via `POST /api/auth/reset-password/:token`
4. **Token Expiry**: Reset links expire after 1 hour for security

### Password Reset Endpoints

- **Request Reset**: `POST /api/auth/forgot-password`
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **Reset Password**: `POST /api/auth/reset-password/:token`
  ```json
  {
    "token": "reset-token-here",
    "newPassword": "newpassword123"
  }
  ```

### Security Features

- **Secure Tokens**: Cryptographically secure reset tokens
- **Token Expiry**: 1-hour expiration window
- **One-time Use**: Tokens are invalidated after use
- **Email Verification**: Only valid email addresses can request resets
```
EventPro/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── eventController.js    # Event management
│   └── adminController.js    # Admin functions
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   └── adminMiddleware.js    # Admin authorization
├── models/
│   ├── user.js              # User schema
│   ├── event.js             # Event schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── eventRoutes.js       # Event endpoints
│   ├── adminRoutes.js       # Admin endpoints
│   └── dashboardRoutes.js   # Dashboard endpoints
├── utils/
│   ├── generateToken.js     # JWT token generation
│   ├── sendEmail.js         # Email service
│   ├── sendSMS.js           # SMS service (Twilio)
│   └── reminderScheduler.js # Automated reminders
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies & scripts
├── server.js               # Main application file
└── README.md               # Project documentation
```

## 🧪 Testing

```bash
npm test
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment
2. Ensure MongoDB is accessible
3. Configure email service for reminders
4. Use a process manager like PM2 in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support, email the repository owner or create an issue in the GitHub repository.

## 🔄 Future Enhancements

- [ ] User profile management
- [ ] Event categories and tags
- [ ] File upload for event images
- [ ] Payment integration for ticket sales
- [ ] Mobile app companion
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social media integration

---

**Made with ❤️ for event management**
### Appwrite Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login/appwrite` | Log in with Appwrite JWT |

**Appwrite Flow:**
1. Use Appwrite OAuth on the frontend to get a JWT.
2. Send `{ "jwt": "<appwrite-jwt>" }` to `/api/auth/login/appwrite`.
