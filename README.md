# DLCSAI - Student Management System

A comprehensive Next.js application for managing students with special education needs, built with Next.js 15, MongoDB, and Tailwind CSS.

## Features

### Admin Features
- Create and manage Teacher/Service Provider accounts
- Create and manage educational goals
- View all Teacher/Service Providers and their information
- Auto-assign goals to students based on their abilities and disabilities

### Teacher/Service Provider Features
- Add and manage students
- Track student disabilities, strengths, and weaknesses
- View student details and progress
- Get AI-powered goal recommendations for students
- Auto-assign appropriate goals to students

### Goal Management System
- Create goals with categories (Academic, Behavioral, Social, Physical, Communication)
- Set priority levels (Low, Medium, High, Critical)
- Define target disabilities, weaknesses, and required strengths
- Intelligent matching algorithm to recommend goals for students

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: React Toastify

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (MongoDB Atlas recommended)
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment Variables:
   - The `.env.local` file is already configured with your MongoDB connection
   - Make sure your MongoDB database is accessible

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
DLCSAI/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── students/        # Student CRUD endpoints
│   │   └── goals/           # Goals CRUD endpoints
│   ├── dashboard/           # Dashboard page
│   ├── goals/               # Goals management page
│   ├── login/               # Login page
│   ├── professors/          # Teacher/Service Providers directory
│   ├── students/[id]/       # Student detail page
│   ├── layout.js            # Root layout
│   └── globals.css          # Global styles
├── components/              # Reusable components
│   └── Navbar.jsx          # Navigation bar
├── lib/                     # Utility functions
│   ├── mongodb.js          # Database connection
│   ├── auth.js             # JWT utilities
│   ├── authMiddleware.js   # API auth middleware
│   └── goalMapping.js      # Goal recommendation algorithm
├── models/                  # Mongoose models
│   ├── User.js             # User/Professor model
│   ├── Student.js          # Student model
│   └── Goal.js             # Goal model
└── .env.local              # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/professors` - Get all professors (Admin only)
- `DELETE /api/auth/professors/:id` - Delete professor (Admin only)

### Students
- `GET /api/students` - Get user's students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/assign-goals` - Get goal recommendations
- `POST /api/students/:id/assign-goals` - Auto-assign goals

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal (Admin only)
- `GET /api/goals/:id` - Get goal details
- `PUT /api/goals/:id` - Update goal (Admin only)
- `DELETE /api/goals/:id` - Delete goal (Admin only)

## Default Credentials

You can create an admin account by registering with:
- Role: admin (set during registration)

Or create a professor account:
- Role: professor (default)

## Goal Matching Algorithm

The system uses an intelligent algorithm to match students with appropriate goals based on:

1. **Disability Matching** (High Priority - 3x weight)
   - Matches student disabilities with goal target disabilities

2. **Weakness Matching** (Medium Priority - 2x weight)
   - Matches student weaknesses with goal target weaknesses

3. **Strength Requirements** (Lower Priority - 1x weight)
   - Ensures student has required strengths for the goal

4. **Grade Level Compatibility**
   - Matches student grade level with goal recommendations

5. **Priority Bonus**
   - High and critical priority goals get scoring bonuses

The algorithm returns the top 8 matching goals sorted by relevance score.

## Key Features Implemented

### 1. Smart Goal Assignment
- AI-powered goal recommendations based on student profile
- Automatic goal assignment with detailed match reasoning
- Manual goal selection option

### 2. Enhanced UI/UX
- Modern gradient design with rounded corners
- Responsive layout for all screen sizes
- Toast notifications for user feedback
- Modal-based forms for better UX

### 3. Comprehensive Management
- Full CRUD operations for all entities
- Role-based access control (Admin/Professor)
- Detailed student profiles with goal tracking
- Professor directory and management

## Migration from React + Express

This application has been migrated from a React (Vite) + Express backend to a unified Next.js application:

### Key Changes:
- ✅ Express routes → Next.js API Routes
- ✅ React Router → Next.js App Router
- ✅ Separate frontend/backend → Unified Next.js app
- ✅ CommonJS → ES Modules
- ✅ Vite → Next.js build system
- ✅ Added Goals management system
- ✅ Added intelligent goal-student matching
- ✅ Enhanced UI with Tailwind CSS
- ✅ Improved error handling and notifications

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This is a student management system for special education. Contributions are welcome to improve accessibility and functionality.

## License

ISC

## Support

For issues or questions, please open an issue on the GitHub repository.
