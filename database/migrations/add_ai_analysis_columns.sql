-- Add AI analysis columns to news table
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis_result TEXT,
ADD COLUMN IF NOT EXISTS reliability_score INTEGER,
ADD COLUMN IF NOT EXISTS confidence_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_keywords VARCHAR(1000);