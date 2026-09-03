CREATE TABLE IF NOT EXISTS discovery_runs (
  id TEXT PRIMARY KEY, record_count INTEGER NOT NULL, opportunity_count INTEGER NOT NULL,
  model TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL, problem TEXT NOT NULL, score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1), evidence_count INTEGER NOT NULL,
  affected_segments TEXT NOT NULL DEFAULT '[]', keywords TEXT NOT NULL DEFAULT '[]', experiment TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_run ON opportunities(run_id);
