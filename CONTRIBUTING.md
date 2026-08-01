# Contributing

Thank you for considering contributing to the Playwright Automation Dashboard!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Follow the [Quick Start](#-quick-start) guide in README.md
4. Create a feature branch: `git checkout -b feature/your-feature`
5. Make changes and test
6. Commit: `git commit -m "feat: your feature description"`
7. Push: `git push origin feature/your-feature`
8. Open a Pull Request

## Code Standards

- **Frontend**: TypeScript strict mode, ESLint, Tailwind CSS
- **Backend**: Python type hints, PEP 8, Flask blueprints
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`)

## Architecture Guidelines

- Keep services in `app/services/` (business logic separate from routes)
- Keep validation in `app/services/validation.py`
- Use `@jwt_required()` on all protected endpoints
- Use demo data fallback in frontend for empty states
- All new pages must include loading skeletons and demo data

## Testing

```bash
# Backend smoke tests
cd backend && python -m tests.test_smoke

# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend build
cd frontend && npm run build
```

## Pull Request Checklist

- [ ] TypeScript compiles with 0 errors
- [ ] Vite build succeeds
- [ ] Backend smoke tests pass (42/42)
- [ ] No `console.log` in production code
- [ ] New endpoints have validation
- [ ] New pages have demo data fallback
