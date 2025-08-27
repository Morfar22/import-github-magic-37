-- Fix RLS policy for chat messages to allow anonymous visitors to send messages
DROP POLICY IF EXISTS "Visitors can insert messages in their session" ON chat_messages;

-- Create improved policy for visitors inserting messages
-- This allows anonymous visitors (no auth.uid()) to insert messages in sessions where user_id is null
-- And allows authenticated users to insert messages in their own sessions
CREATE POLICY "Visitors can insert messages in their session" 
ON chat_messages 
FOR INSERT 
WITH CHECK (
  sender_type = 'visitor'
  AND (
    -- Anonymous visitor case: no auth, session has no user_id
    (auth.uid() IS NULL AND session_id IN (
      SELECT id FROM chat_sessions WHERE user_id IS NULL
    ))
    OR 
    -- Authenticated user case: has auth, session belongs to them
    (auth.uid() IS NOT NULL AND session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    ))
  )
);