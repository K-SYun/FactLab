FROM node:20

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (도커 내부에서)
RUN npm install

# 소스 코드 복사
COPY . .

CMD ["npm", "start"]
