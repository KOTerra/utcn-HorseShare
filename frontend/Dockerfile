FROM node:20.19-bullseye-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 5173

# Use entrypoint to ensure dependencies installed after volume mount
CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0"]
