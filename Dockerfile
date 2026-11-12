# Use Node.js 20 as the base image
FROM node:20-alpine

# Install Bun globally (since you have a bun.lock file)
RUN npm install -g bun

WORKDIR /usr/src/app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of your application code
COPY . .

# Build the app (runs vite build and esbuild)
RUN bun run build

# Expose the port (Express defaults to 3000)
EXPOSE 3000

# Start the server exactly as defined in your package.json
CMD ["node", "dist/server.js"]
