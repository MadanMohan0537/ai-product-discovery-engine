CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS feedback (
  id text PRIMARY KEY, text text NOT NULL, source text NOT NULL, segment text NOT NULL,
  customer_id text, occurred_at timestamptz NOT NULL, metadata jsonb NOT NULL DEFAULT '{}',
  embedding vector(384)
);
CREATE INDEX IF NOT EXISTS feedback_source_time ON feedback(source, occurred_at DESC);
CREATE INDEX IF NOT EXISTS feedback_embedding_hnsw ON feedback USING hnsw (embedding vector_cosine_ops);
CREATE TABLE IF NOT EXISTS opportunities (
  id text PRIMARY KEY, title text NOT NULL, problem text NOT NULL, score integer NOT NULL,
  confidence real NOT NULL, evidence jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now()
);
