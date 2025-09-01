from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from routes.analyze_news import router as analyze_router

# 환경변수 로드
load_dotenv()

app = FastAPI(title="FactLab AI Analysis Service", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analyze_router, tags=["AI Analysis"])  # prefix 제거

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 데이터베이스 설정
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/factlab")

def get_db_connection():
    """데이터베이스 연결"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@app.get("/health")
async def health_check():
    """헬스체크"""
    return {
        "status": "healthy",
        "service": "FactLab AI Analysis Service",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)