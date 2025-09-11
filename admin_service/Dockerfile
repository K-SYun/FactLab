# Development stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for development
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# ESLint 캐시 비활성화 환경변수
ENV ESLINT_NO_DEV_ERRORS=true
ENV GENERATE_SOURCEMAP=false
ENV ESLINT_NO_ESLINTRC=false
ENV SKIP_PREFLIGHT_CHECK=true

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "start"]