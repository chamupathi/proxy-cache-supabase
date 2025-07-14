import { createClient } from "jsr:@supabase/supabase-js";

// Cache expiration time: 25 hours in milliseconds
const CACHE_EXPIRATION_HOURS = 25;
const CACHE_EXPIRATION_MS = CACHE_EXPIRATION_HOURS * 60 * 60 * 1000;

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Data {
  path: string;
  data: any;
  created_at: string;
  expire_at: string;
}

export async function getCachedData(path: string) {
  const { data, error } = await supabase
    .from('data-table-name')
    .select('*')
    .eq('path', path)
    .limit(1);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function insertNewData(path: string, data: any) {
  const { data: insertResult, error } = await supabase
    .from('data-table-name')
    .insert({
      path: path,
      data: data,
      created_at: new Date().toISOString(),
      expire_at: new Date(Date.now() + CACHE_EXPIRATION_MS).toISOString(),
    });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return insertResult;
}

export async function updateExpiredData(path: string, data: any) {
  const { data: updateResult, error } = await supabase
    .from('data-table-name')
    .update({
      data: data,
      created_at: new Date().toISOString(),
      expire_at: new Date(Date.now() + CACHE_EXPIRATION_MS).toISOString(),
    })
    .eq('path', path);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return updateResult;
}

export function isDataExpired(data: Data[] | null): boolean {
  if (!data || data.length === 0) return true;
  
  const now = new Date();
  const expireAt = data[0].expire_at;
  
  return expireAt && new Date(expireAt) <= now;
} 