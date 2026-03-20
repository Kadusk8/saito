FROM node:20-alpine AS builder

WORKDIR /app
# We need to install dependencies including devDependencies to build
COPY package.json package-lock.json* ./
RUN npm i

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled source from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001
ENV PORT=3001

CMD ["npm", "start"]
