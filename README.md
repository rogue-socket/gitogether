# 🎯 GitTogether

> **Collaborative Git Repository Finder** — Discover open-source projects, connect with contributors, and grow your portfolio together.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/rogue-socket/gitogether)](https://github.com/rogue-socket/gitogether)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org)

## 🌟 Features

- **Repository Discovery** — Smart search to find projects matching your interests and skill level
- **Contributor Matching** — Connect with like-minded developers and build meaningful collaborations
- **Portfolio Building** — Showcase your contributions and grow your GitHub presence
- **Beginner-Friendly** — Filter projects by difficulty level and required skills
- **Real-time Stats** — View live contributor counts, issue counts, and project activity
- **Saved Projects** — Bookmark interesting repos and create personalized collections
- **Collaboration Tools** — In-app messaging and project management features

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/rogue-socket/gitogether.git
cd gitogether

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
npm run build
npm start
```

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** — System design, data flows, and technical decisions
- **[Contributing Guidelines](./CONTRIBUTING.md)** — How to contribute, code standards, and workflow
- **[Deployment Guide](./DEPLOYMENT.md)** — Docker, environment setup, and self-hosting
- **[Security Policy](./SECURITY.md)** — Vulnerability reporting and security practices
- **[Roadmap](./ROADMAP.md)** — Feature plans and future direction
- **[Changelog](./CHANGELOG.md)** — Version history and release notes

## 🏗️ Architecture

### Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **DevOps** | Docker, GitHub Actions, ESLint, TypeScript |

### Key Modules

```
src/
├── app/          # Next.js app router & pages
├── components/   # React components (UI library)
├── lib/          # Utilities, helpers, API clients
├── api/          # Backend API routes
├── types/        # TypeScript type definitions
└── styles/       # Global styles
```

## 🔑 Core Workflows

### Discovery Flow
```
Search → Filter by Level/Skills → Browse Repos → View Details → Save to Favorites
```

### Collaboration Flow
```
Find Project → View Contributors → Connect → Chat → Collaborate → Contribute
```

## 💾 Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. Key entities:

- **Users** — Developer profiles with GitHub integration
- **Repositories** — Synced from GitHub API with enriched metadata
- **Contributions** — Track user contributions to projects
- **Messages** — In-app messaging between collaborators
- **Collections** — User-created project collections

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete ERD and schema details.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## 📦 Deployment

### Docker

```bash
docker build -t gitogether:latest .
docker run -p 3000:3000 --env-file .env gitogether:latest
```

### Self-Hosting

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:
- Environment configuration
- Database setup
- SSL/TLS certificates
- Reverse proxy setup
- Monitoring and logging

## 🤝 Contributing

We love contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first to understand our development workflow, code standards, and how to submit PRs.

### Quick Tips
- Fork the repository
- Create a feature branch (`git checkout -b feature/my-feature`)
- Make your changes and add tests
- Submit a pull request with a clear description

## ❓ FAQ

**Q: Is GitTogether free?**
A: Yes! GitTogether is free and open-source. We believe collaboration should be accessible to everyone.

**Q: Can I use my GitHub account?**
A: Yes! We integrate seamlessly with GitHub OAuth for easy authentication.

**Q: How do you find projects to display?**
A: We continuously sync with the GitHub API and apply intelligent filtering to surface beginner-friendly, active projects.

**Q: Can I host GitTogether myself?**
A: Absolutely! We provide Docker support and detailed self-hosting instructions. See [DEPLOYMENT.md](./DEPLOYMENT.md).

**Q: How is my data handled?**
A: We follow strict privacy practices. See [SECURITY.md](./SECURITY.md) for details on data handling and security.

**Q: How can I report a security issue?**
A: Please don't create public GitHub issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## 📞 Support

- **Issues & Bugs** — [GitHub Issues](https://github.com/rogue-socket/gitogether/issues)
- **Discussions** — [GitHub Discussions](https://github.com/rogue-socket/gitogether/discussions)
- **Discord** — [Join our community server](#)

## 📄 License

GitTogether is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- GitHub for the API and community
- All our amazing contributors
- The open-source community for inspiration

---

**Made with ❤️ by the GitTogether community**

[⬆ back to top](#-gittogether)