FROM node:20

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (도커 내부에서)
RUN npm install --legacy-peer-deps

# ESLint 캐시 디렉토리 생성 및 권한 설정
RUN mkdir -p node_modules/.cache && chmod 777 node_modules/.cache

# 소스 코드 복사
COPY . .

# ESLint 캐시 비활성화 환경변수
ENV ESLINT_NO_DEV_ERRORS=true
ENV GENERATE_SOURCEMAP=false
ENV ESLINT_NO_ESLINTRC=false
ENV SKIP_PREFLIGHT_CHECK=true

CMD ["npm", "start"]
