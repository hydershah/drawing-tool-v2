-- ============================================
-- Drawing Tool V2 - PostgreSQL Database Schema
-- ============================================
-- This file creates all necessary tables for the drawing tool

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS site_content CASCADE;

-- ============================================
-- 1. PROMPTS TABLE
-- ============================================
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  prompt_number INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  artwork_id TEXT
);

-- Create indexes for prompts
CREATE INDEX idx_prompts_email ON prompts(email);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);

-- ============================================
-- 2. ARTWORKS TABLE
-- ============================================
CREATE TABLE artworks (
  id TEXT PRIMARY KEY,
  prompt_id TEXT REFERENCES prompts(id) ON DELETE SET NULL,
  prompt_number INTEGER NOT NULL,
  image_data TEXT NOT NULL, -- base64 encoded image
  artist_name TEXT,
  artist_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_admin_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- Create indexes for artworks
CREATE INDEX idx_artworks_prompt_id ON artworks(prompt_id);
CREATE INDEX idx_artworks_prompt_number ON artworks(prompt_number);
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_artworks_is_admin_created ON artworks(is_admin_created);

-- ============================================
-- 3. SITE CONTENT TABLE
-- ============================================
CREATE TABLE site_content (
  id TEXT PRIMARY KEY DEFAULT 'default',
  project_title TEXT NOT NULL,
  project_description TEXT NOT NULL,
  book_link TEXT,
  book_title TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default site content
INSERT INTO site_content (id, project_title, project_description)
VALUES ('default', 'Drawing Tool', 'Submit prompts and receive custom artwork')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to get next prompt number
CREATE OR REPLACE FUNCTION get_next_prompt_number()
RETURNS INTEGER AS $$
DECLARE
  max_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(prompt_number), 0) INTO max_number
  FROM artworks;

  RETURN max_number + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for site_content
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE prompts IS 'User submitted drawing prompts';
COMMENT ON TABLE artworks IS 'Submitted artworks with images (base64 encoded)';
COMMENT ON TABLE site_content IS 'Site configuration and content';

COMMENT ON COLUMN prompts.status IS 'pending, completed, or in_progress';
COMMENT ON COLUMN artworks.status IS 'pending, approved, or rejected';
COMMENT ON COLUMN artworks.image_data IS 'Base64 encoded image data';

-- ============================================
-- SETUP COMPLETE
-- ============================================

SELECT 'Database schema created successfully!' AS message;
