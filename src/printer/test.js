import { createClient } from '@supabase/supabase-js';

// PASTE YOUR KEYS HERE
const URL = "https://fqiuwmxdxqrlpmuyxlyw.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXV3bXhkeHFybHBtdXl4bHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE2NTAyNCwiZXhwIjoyMDg2NzQxMDI0fQ.vXPv6inWpJ2IPPF0e98-ZPZ82fuL6yQwgmCmFaUN3so"; 

const supabase = createClient(URL, KEY);

async function testConnection() {
  console.log("Testing connection with key...");
  const { data, error } = await supabase.from('PrintJob').select('*');
  
  if (error) {
    console.error("❌ STILL BLOCKED:", error.message);
  } else {
    console.log("✅ SUCCESS! The Master Key worked. Data:", data);
  }
}

testConnection();