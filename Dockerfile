# Use Node.js 20 as the base image
FROM node:20-alpine

# Install Alpine C library compatibility layers required for Bun musl runtime
RUN apk add --no-cache libc6-compat gcompat libstdc++

# Install Bun globally
RUN npm install -g bun

WORKDIR /usr/src/app

# Copy package files
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies using Bun with fallback
RUN bun install || npm install

# Copy the rest of your application code
COPY . .

# Build the app (runs vite build and esbuild)
RUN bun run build || npm run build

# Expose the port (Express defaults to 3000)
EXPOSE 3000

# Start the server exactly as defined in your package.json
CMD ["node", "dist/server.js"]
