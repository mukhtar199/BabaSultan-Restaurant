# Production Container for Baba Sultan Restaurant ERP
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build frontend and compile backend into dist/server.cjs
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Expose HTTP port
EXPOSE 8080 3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
