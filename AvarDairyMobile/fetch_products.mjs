import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Need to read .env
import fs from 'fs';
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

const supabase = createClient(envVars['EXPO_PUBLIC_SUPABASE_URL'], envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data, error } = await supabase.from('products').select('*');
  console.log("Products:");
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}

run();
