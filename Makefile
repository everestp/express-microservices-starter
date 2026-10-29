.PHONY: install dev build test up down migrate

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

up:
	pnpm docker:up

down:
	pnpm docker:down

migrate:
	pnpm migrate:all
