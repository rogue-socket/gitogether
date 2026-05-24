# 🤝 Contributing to GitTogether

Thank you for your interest in contributing to GitTogether! We're excited to have you join our community. This guide will help you get started.

## 📋 Code of Conduct

Please review and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We're committed to providing a welcoming and inclusive environment.

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/gitogether.git
cd gitogether
git remote add upstream https://github.com/rogue-socket/gitogether.git
```

### 2. Set Up Your Environment

```bash
# Install dependencies
npm install

# Create .env.local from example
cp .env.example .env.local

# Configure environment variables (ask maintainers for test credentials)
```

### 3. Create a Feature Branch

```bash
git checkout -b feature/my-awesome-feature
```

## 📝 Development Workflow

### Running the Dev Server

```bash
npm run dev
# Opens http://localhost:3000
```

### Code Standards

We use **TypeScript**, **ESLint**, and **Prettier** for code quality.

```bash
# Lint & format code
npm run lint
npm run lint:fix

# Run type checking
npm run type-check
```

### Writing Code

- **TypeScript**: Always use TypeScript, avoid `any` types
- **Components**: Use functional React components with hooks
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Comments**: Only add comments for non-obvious logic
- **Error Handling**: Always handle errors gracefully

### Testing

Write tests for all new features and bug fixes.

```bash
# Run tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage Requirements:**
- New code should have >80% coverage
- Critical paths should have >90% coverage
- Always test error cases

## 📌 Commit Guidelines

Follow conventional commits for clear history:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Test additions/modifications
- `chore`: Build, CI, dependency updates

### Example
```
feat(discovery): add difficulty filter to repo search

- Added DifficultyFilter component
- Integrated with SearchService
- Updated database schema with difficulty level

Closes #123
```

## 🔄 Pull Request Process

### Before You Submit

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test thoroughly**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

3. **Update documentation** if you changed:
   - APIs
   - Configuration
   - Database schema
   - Architecture

### Creating a PR

1. Push your branch to your fork
2. Create a PR against `rogue-socket/gitogether:main`
3. Fill out the PR template completely
4. Link related issues with `Closes #123`

### PR Title Format

```
[COMPONENT] Brief description
```

Examples:
- `[UI] Improve search results layout`
- `[API] Add pagination to repo endpoint`
- `[Docs] Update deployment guide`

### PR Description Template

```markdown
## Description
Brief overview of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement

## Testing
Describe how you tested this change.

## Screenshots (if applicable)
Add relevant screenshots or GIFs.

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Commits follow guidelines

## Related Issues
Closes #123
```

## 🔍 Code Review Process

1. **Automated Checks**: CI/CD runs tests, linting, and type checking
2. **Maintainer Review**: One or more maintainers will review your code
3. **Feedback**: Address feedback and push additional commits
4. **Approval**: Once approved, your PR will be merged

### What We Look For

- ✅ Code quality and consistency
- ✅ Comprehensive tests
- ✅ Clear documentation
- ✅ Performance impact
- ✅ Security considerations
- ✅ Accessibility compliance

## 🐛 Reporting Bugs

### Before You Report

1. Check [existing issues](https://github.com/rogue-socket/gitogether/issues)
2. Search closed issues—it may be already fixed
3. Ensure you're on the latest version

### Creating a Bug Report

Use the [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md):

1. **Title**: Clear, descriptive (e.g., "Search filter crashes on special characters")
2. **Description**: What were you doing when the bug occurred?
3. **Steps to Reproduce**: Clear, numbered steps
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Environment**: OS, Node version, browser
7. **Logs**: Error messages, stack traces

## 💡 Requesting Features

Use the [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md):

1. **Title**: Short description (e.g., "Dark mode support")
2. **Motivation**: Why should we add this?
3. **Proposed Solution**: How would this work?
4. **Alternatives**: Any alternatives considered?
5. **Additional Context**: Screenshots, links, references

## 📚 Documentation

### Updating Docs

- Keep documentation clear and concise
- Update [ARCHITECTURE.md](./ARCHITECTURE.md) if you change system design
- Update [DEPLOYMENT.md](./DEPLOYMENT.md) for infrastructure changes
- Add examples for new features

### Writing Good Documentation

- Use clear headings and structure
- Include code examples where helpful
- Link to related documentation
- Keep language simple and accessible

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 💬 Questions?

- **Discord**: [Join our server](#)
- **Discussions**: [GitHub Discussions](https://github.com/rogue-socket/gitogether/discussions)
- **Issues**: [Create a question issue](https://github.com/rogue-socket/gitogether/issues)

## 🏆 Recognition

We celebrate all contributions! Contributors will be recognized in:
- Release notes
- Contributors page (coming soon)
- Special badges on GitHub profile

---

Thank you for making GitTogether awesome! 🚀
