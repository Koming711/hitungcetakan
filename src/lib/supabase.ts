import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqsijoqlgecepexmxzmj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxc2lqb3FsZ2VjZXBleG14em1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwODQzOCwiZXhwIjoyMDkwNTg0NDM4fQ.YtluV8fasR-eRT5aUbuQtQ0JgvxSZwSXeq6G78KWMDg'

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
