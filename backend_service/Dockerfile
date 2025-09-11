FROM openjdk:17-jdk-slim

WORKDIR /app

# Maven 설치
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# 개발 환경에서는 소스가 마운트되므로 여기서는 기본 구조만 복사
COPY pom.xml .
COPY src ./src

# JAR 파일 빌드
RUN mvn clean package -DskipTests

# JAR 파일을 app.jar로 복사
RUN cp target/factlab-backend-0.0.1-SNAPSHOT.jar app.jar

# 시작 스크립트 복사
COPY start.sh /app/start.sh
RUN chmod 755 /app/start.sh

EXPOSE 8080
ENTRYPOINT ["bash", "/app/start.sh"]