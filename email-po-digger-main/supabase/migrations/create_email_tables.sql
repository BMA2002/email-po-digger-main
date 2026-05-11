-- Create emails table to store incoming webhook emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL,
  to_recipients TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_email JSONB,
  webhook_id TEXT UNIQUE
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size_kb INTEGER,
  content TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emails_to ON emails(to_recipients);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON email_attachments(email_id);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access (for webhook receiver)
CREATE POLICY "Allow anonymous insert" ON emails
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON emails
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anonymous attachment insert" ON email_attachments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated attachment read" ON email_attachments
  FOR SELECT
  TO authenticated
  USING (true);
