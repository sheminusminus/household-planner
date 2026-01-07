import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wisrbqibbbauqxxicqct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc3JicWliYmJhdXF4eGljcWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzY5NTUsImV4cCI6MjA4MzI1Mjk1NX0.FzoRZ9PCvcyik4S-w6zU2oqg2FI38sT2cYW5KrtBi7Q';

export const supabase = createClient(supabaseUrl, supabaseKey);
