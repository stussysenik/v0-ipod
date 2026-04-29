# Makefile for v0-ipod
# IPO-Ready Development Workflow

.PHONY: help install dev build test lint format clean ci deploy

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
RED := \033[31m
YELLOW := \033[33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)v0-ipod - IPO-Ready Development$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	bun install
	bun run prepare

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	bun run dev

dev-raw: ## Start dev server without portless
	@echo "$(BLUE)Starting dev server (raw)...$(NC)"
	bun run dev:raw

build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	bun run build

build-analyze: ## Build with bundle analysis
	@echo "$(BLUE)Building with bundle analysis...$(NC)"
	ANALYZE=true bun run build

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	bun run test

test-ui: ## Run tests with UI
	@echo "$(BLUE)Running tests with UI...$(NC)"
	bun run test:ui

test-unit: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	bun run test:unit

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	bun run test:coverage

lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	bun run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "$(BLUE)Running ESLint with auto-fix...$(NC)"
	bun run lint:fix

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	bun run format

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	bun run format:check

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	bun run type-check

validate: ## Run all validation (lint + format + type-check)
	@echo "$(BLUE)Running full validation...$(NC)"
	bun run validate

ci: ## Run CI pipeline locally
	@echo "$(BLUE)Running CI pipeline...$(NC)"
	bun run ci

clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning...$(NC)"
	rm -rf .next node_modules bun.lock
	@echo "$(GREEN)Cleaned! Run 'make install' to reinstall.$(NC)"

fresh: clean install ## Clean and reinstall everything
	@echo "$(GREEN)Fresh install complete!$(NC)"

audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	bun audit

audit-fix: ## Fix security issues
	@echo "$(BLUE)Fixing security issues...$(NC)"
	bun run audit:fix

# Development shortcuts
c: ## Shortcut for validate
	$(MAKE) validate

t: ## Shortcut for test
	$(MAKE) test

b: ## Shortcut for build
	$(MAKE) build

# Git workflow
commit: validate ## Commit with validation (runs pre-commit hooks)
	@echo "$(BLUE)Staging changes and opening commit editor...$(NC)"
	git add -A
	git commit

commit-msg: ## Show commit message format help
	@echo "$(BLUE)Commit Message Format:$(NC)"
	@echo ""
	@echo "  <type>[optional scope]: <description>"
	@echo ""
	@echo "$(BLUE)Types:$(NC)"
	@echo "  feat:     New feature"
	@echo "  fix:      Bug fix"
	@echo "  docs:     Documentation"
	@echo "  style:    Code style (formatting)"
	@echo "  refactor: Code refactoring"
	@echo "  perf:     Performance improvement"
	@echo "  test:     Tests"
	@echo "  build:    Build system"
	@echo "  ci:       CI/CD changes"
	@echo "  chore:    Maintenance"
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  feat: add user authentication"
	@echo "  fix(ipod): resolve wheel scroll issue"
	@echo "  docs(readme): update installation instructions"

# Performance checks
perf-lighthouse: ## Run Lighthouse CI locally
	@echo "$(BLUE)Running Lighthouse...$(NC)"
	bunx @lhci/cli autorun

perf-bundle: ## Analyze bundle size
	@echo "$(BLUE)Analyzing bundle size...$(NC)"
	$(MAKE) build-analyze

# Utility
size: ## Show bundle sizes
	@echo "$(BLUE)Bundle sizes:$(NC)"
	@du -sh .next/static/chunks/*.js 2>/dev/null | sort -rh | head -10 || echo "Build first with 'make build'"

disk: ## Show disk usage
	@echo "$(BLUE)Disk usage:$(NC)"
	df -h /

stats: ## Show project stats
	@echo "$(BLUE)Project Statistics:$(NC)"
	@echo ""
	@echo "Lines of code:"
	@find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | tail -1
	@echo ""
	@echo "Test files:"
	@find tests -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l
	@echo ""
	@echo "Components:"
	@find components -name "*.tsx" 2>/dev/null | wc -l
	@echo ""
	@echo "Git commits (last 30 days):"
	@git log --since="30 days ago" --oneline | wc -l
