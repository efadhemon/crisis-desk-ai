# ============================================
# Stage 1: Install ALL dependencies + Build
# ============================================
FROM node:22-alpine AS builder

# Install native build tools (needed for compiling native modules like bcrypt)
RUN apk add --no-cache make g++ python3

WORKDIR /app

# Copy dependency files first (enables Docker layer caching)
COPY package.json yarn.lock ./

# Install all dependencies (dev + prod) — needed for building
RUN yarn install --frozen-lockfile

# Copy only what's needed for the build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Build the NestJS project (skip prebuild lint/typecheck — CI handles that)
RUN yarn nest build

# ============================================
# Stage 2: Production dependencies only
# ============================================
FROM node:22-alpine AS production-deps

RUN apk add --no-cache make g++ python3

WORKDIR /app

COPY package.json yarn.lock ./

# Install ONLY production dependencies
RUN yarn install --frozen-lockfile --production \
    && yarn cache clean

# ============================================
# Stage 3: Final minimal runtime image
# ============================================
FROM node:22-alpine AS runtime

RUN apk add --no-cache bash

WORKDIR /app

# Copy production node_modules from Stage 2
COPY --from=production-deps /app/node_modules ./node_modules

# Copy built output from Stage 1
COPY --from=builder /app/dist ./dist

# Copy runtime files
COPY package.json ./
COPY entrypoint.sh ./

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["sh", "./entrypoint.sh"]
