FROM node:18-alpine

WORKDIR /app

# Toolchain for native addons (bcrypt) on Alpine
RUN apk add --no-cache python3 make g++

# Install dependencies (container-native node_modules)
COPY package.json package-lock.json ./
RUN npm ci

# Copy only what we need (avoid copying host node_modules)
COPY src ./src
COPY tsconfig.json ./

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "dev"]

