<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81ea4c3a-77ab-4448-83d7-af31d5a99cca" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a6b2f635-1d62-43db-81d3-b7ebcd193b28" />

# Qwik Dashboard Template

A production-ready dashboard template built with Qwik and Tailwind CSS, designed for rapid project initialization with enterprise-grade features.

## ✨ Features

### 🔐 Authentication & Security
- **User Authentication** - Secure login/logout system with JWT
- **Two-Factor Authentication (2FA)** - TOTP-based 2FA with QR code setup
- **Role-Based Access Control (RBAC)** - Fine-grained permission system
- **Session Management** - Automatic session tracking and timeout handling
- **Password Security** - bcrypt hashing with salt rounds

### 👥 User Management
- **User CRUD Operations** - Create, read, update, and delete users
- **Role Assignment** - Assign multiple roles to users
- **User Status Management** - Activate/deactivate user accounts
- **Profile Management** - User profile editing and avatar support
- **Login Attempt Tracking** - Security audit trail

### 🎨 UI/UX
- **Dark Mode** - Full dark mode support with CSS custom properties
- **Responsive Design** - Mobile-first, fully responsive layouts
- **Modern UI Components** - Pre-built reusable components
- **Accessibility** - ARIA-compliant components
- **Icons** - @qwikest/icons integration

### 📊 Dashboard Features
- **System Overview** - Real-time statistics and metrics
- **Chart Integration** - Chart.js for data visualization
- **Reports** - Customizable reporting system
- **Settings Management** - System configuration interface

### 🛠️ Developer Experience
- **Auto Database Setup** - Database automatically initializes on first run
- **Type Safety** - Full TypeScript support
- **Hot Module Replacement** - Fast development with Vite
- **Code Quality** - Biome for linting and formatting
- **Demo Users** - Pre-configured demo accounts for testing

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **Bun**: Latest version (or npm/yarn/pnpm)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd qwik-dashboard-template
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   TWO_FACTOR_ISSUER="Qwik Dashboard"
   SESSION_EXPIRES_IN="7d"
   NODE_ENV="development"
   ```

4. **Start development server**
   ```bash
   bun run dev
   ```

   The database will automatically initialize on first run! 🎉

5. **Access the application**
   - Open http://localhost:5173
   - Login with demo accounts (see below)

### 🔑 Demo Accounts

The system automatically creates these demo accounts:

| Role     | Email                 | Password    | Access Level         |
|----------|-----------------------|-------------|----------------------|
| Admin    | admin@example.com     | password123 | Full system access   |
| Editor   | editor@example.com    | password123 | Read dashboard/users |
| User     | user@example.com      | password123 | Read dashboard only  |

> ⚠️ **Security Note**: Change these credentials in production!

## 📁 Project Structure

```
qwik-dashboard-template/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seed data
├── public/                   # Static assets
│   ├── favicon.svg
│   ├── logo.svg
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Badge.tsx
│   │   │   ├── Box.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── OTPInput.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Textarea.tsx
│   │   ├── router-head/
│   │   └── theme-script.tsx  # Dark mode script
│   ├── routes/
│   │   ├── auth/             # Authentication routes
│   │   │   ├── login/
│   │   │   ├── setup-2fa/
│   │   │   └── verify-2fa/
│   │   ├── dashboard/        # Dashboard routes
│   │   │   ├── index.tsx     # Dashboard home
│   │   │   ├── profile/      # User profile
│   │   │   ├── roles/        # Role management
│   │   │   ├── security/     # Security settings
│   │   │   ├── settings/     # System settings
│   │   │   ├── users/        # User management
│   │   │   └── reports/      # Reports
│   │   ├── plugin@db.ts      # Database init plugin
│   │   ├── layout.tsx        # Root layout
│   │   └── index.tsx         # Homepage redirect
│   ├── server/
│   │   ├── auth/             # Auth configuration
│   │   ├── middleware/       # Request middleware
│   │   ├── services/         # Business logic
│   │   ├── db.ts             # Prisma client
│   │   └── db-init.ts        # Auto database setup
│   ├── utils/                # Utility functions
│   ├── entry.dev.tsx
│   ├── entry.preview.tsx
│   ├── entry.ssr.tsx
│   └── root.tsx
├── .env.example              # Environment variables template
├── biome.json                # Biome configuration
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## 🧪 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run dev.debug        # Start with Node.js debugger

# Building
bun run build            # Production build
bun run build.client     # Client-only build
bun run build.preview    # Preview build
bun run build.types      # Type checking

# Code Quality
bun run fmt              # Format code with Biome
bun run lint             # Lint and type check

# Database
bun run db:studio        # Open Prisma Studio (browse database)

# Preview
bun run preview          # Preview production build
```

## 🗄️ Database

### Automatic Initialization

The database automatically initializes on first server start:

1. **Checks** if database file exists
2. **Creates** database if needed
3. **Syncs** schema (dev: `db push`, prod: `migrate deploy`)
4. **Seeds** default data (roles, permissions, demo users)

No manual setup required! 🎉

### Database Management

The database is fully managed automatically. For advanced operations:

```bash
# Browse database with Prisma Studio
bun run db:studio

# Note: db:generate, db:migrate, db:push, and db:seed
# are automatically handled by the system on startup
```

### Database Schema

The schema includes:
- **Users** - User accounts with authentication
- **Roles** - System and custom roles
- **Permissions** - Resource-based permissions
- **UserRoles** - User-role assignments
- **RolePermissions** - Role-permission assignments
- **Sessions** - Active user sessions
- **LoginAttempts** - Security audit log
- **PendingAuth** - 2FA pending authentication
- **Settings** - System configuration

## 🎨 Styling

### Tailwind CSS v4

This template uses the latest Tailwind CSS v4 with:
- **CSS-first configuration**
- **Modern color system**
- **Dark mode** via CSS custom properties
- **Responsive design** utilities

### Dark Mode

Toggle dark mode with the theme switcher in the navigation bar. The theme persists across sessions.

Implementation:
```tsx
// Theme is managed via classList
// Dark mode: document.documentElement.classList.add('dark')
// Light mode: document.documentElement.classList.remove('dark')
```

## 🔒 Security

### Authentication Flow

1. User logs in with email/password
2. Credentials validated against database
3. JWT token generated and stored
4. If 2FA enabled, redirect to verification
5. Session tracked in database

### 2FA Setup

1. Navigate to Security Settings
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save recovery codes securely

### Permission System

Fine-grained RBAC with:
- **Resources**: users, roles, settings, dashboard
- **Actions**: read, manage
- **Assignment**: Roles → Permissions → Users

Example:
```typescript
// Check permission
import { hasPermission } from '~/server/services/auth.service';

const canManageUsers = hasPermission(user, 'users', 'manage');
```

## 📦 Production Deployment

### Build for Production

```bash
# Create production build
bun run build

# Preview production build locally
bun run preview
```

### Environment Variables

Ensure these are set in production:

```env
DATABASE_URL="<production-database-url>"
JWT_SECRET="<strong-random-secret>"
TWO_FACTOR_ISSUER="Your App Name"
SESSION_EXPIRES_IN="7d"
NODE_ENV="production"
```

### Deployment Platforms

Add deployment adapters:

```bash
# Cloudflare
bun qwik add cloudflare-pages

# Netlify
bun qwik add netlify-edge

# Vercel
bun qwik add vercel-edge

# Node.js
bun qwik add express
```

## 🧩 Tech Stack

| Category          | Technology                    |
|-------------------|-------------------------------|
| Framework         | Qwik 1.17+                    |
| Styling           | Tailwind CSS v4               |
| Database          | Prisma + SQLite               |
| Authentication    | JWT + bcryptjs                |
| 2FA               | speakeasy + qrcode            |
| Validation        | Zod                           |
| Icons             | @qwikest/icons                |
| Charts            | Chart.js                      |
| Linting/Formatting| Biome                         |
| Type Checking     | TypeScript 5.4                |
| Build Tool        | Vite 5.3                      |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Run linting (`bun run lint`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Use **TypeScript** for all new files
- Follow **Biome** formatting rules
- Add **JSDoc comments** for public APIs
- Use **semantic commit messages**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Qwik](https://qwik.dev/) - Resumable framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Biome](https://biomejs.dev/) - Toolchain for web projects

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Join the [Qwik Discord](https://qwik.dev/chat)

---

**Built with ⚡ Qwik - Instant-loading web apps**
