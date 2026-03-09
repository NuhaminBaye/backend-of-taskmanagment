# Task Management Backend - NestJS

This is the NestJS backend for the Task Management application.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (via Neon or local)
- Clerk account for authentication
- Brevo account for email service

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the `server` directory with the following variables:

```env
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
CLERK_SECRET_KEY=your_clerk_secret_key
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
SENDER_EMAIL=your_sender_email
PORT=5000
```

3. Generate Prisma client:
```bash
npm run postinstall
```

4. Run database migrations (if needed):
```bash
npx prisma migrate dev
```

### Running the Application

**Development mode:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📁 Project Structure

```
server/
├── src/
│   ├── prisma/          # Prisma database service
│   ├── email/            # Email service (Nodemailer)
│   ├── inngest/          # Inngest event handling
│   ├── auth/             # Authentication guards and decorators
│   ├── workspace/        # Workspace module
│   ├── project/          # Project module
│   ├── task/             # Task module
│   ├── comment/          # Comment module
│   ├── app.module.ts     # Root module
│   ├── app.controller.ts # Root controller
│   └── main.ts           # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── tsconfig.json         # TypeScript configuration
├── nest-cli.json         # NestJS CLI configuration
└── package.json          # Dependencies
```

## 🔌 API Endpoints

### Workspaces
- `GET /api/workspaces` - Get all workspaces for the authenticated user
- `POST /api/workspaces/add-member` - Add a member to a workspace

### Projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects` - Update a project
- `POST /api/projects/:projectId/addMember` - Add a member to a project

### Tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `POST /api/tasks/delete` - Delete tasks (bulk)

### Comments
- `POST /api/comments` - Add a comment to a task
- `GET /api/comments/:taskId` - Get all comments for a task

### Inngest
- `ALL /api/inngest/*` - Inngest webhook handler for background jobs

## 🛠️ Technology Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Next-generation ORM
- **Clerk** - Authentication service
- **Inngest** - Background job processing
- **Nodemailer** - Email service
- **Brevo** - SMTP email provider

## 📝 Features

- ✅ Type-safe API with TypeScript
- ✅ Request validation with DTOs
- ✅ Authentication with Clerk
- ✅ Email notifications for task assignments
- ✅ Background job processing with Inngest
- ✅ Database operations with Prisma
- ✅ Error handling and logging
- ✅ CORS enabled

## 🔒 Authentication

All API endpoints (except `/api/inngest/*`) require authentication. Include the Clerk session token in the Authorization header:

```
Authorization: Bearer <clerk_session_token>
```

## 📧 Email Service

The application sends emails for:
- Task assignments
- Task reminders (on due date)

Email service uses Brevo (formerly Sendinblue) SMTP relay.

## 🧪 Development

### Running in Development Mode

```bash
npm run start:dev
```

This will start the server with hot-reload enabled.

### Building for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Linting

```bash
npm run lint
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Inngest Documentation](https://www.inngest.com/docs)

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client not generated**: Run `npm run postinstall`
2. **Database connection errors**: Check your `DATABASE_URL` in `.env`
3. **Authentication errors**: Verify `CLERK_SECRET_KEY` is set correctly
4. **Email sending fails**: Check SMTP credentials in `.env`

## 📄 License

ISC


