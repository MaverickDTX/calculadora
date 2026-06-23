import { createClient } from '@supabase/supabase-js';
import type { SavedBet } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveBet(bet: Omit<SavedBet, 'id' | 'created_at'>): Promise<{ data?: SavedBet; error?: Error }> {
  const { data, error } = await supabase
    .from('saved_bets')
    .insert(bet)
    .select()
    .single();
  if (error) return { error: new Error(error.message) };
  return { data: data as SavedBet };
}

export async function getSavedBets(): Promise<{ data?: SavedBet[]; error?: Error }> {
  const { data, error } = await supabase
    .from('saved_bets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { error: new Error(error.message) };
  return { data: data as SavedBet[] };
}

export async function deleteBet(id: string): Promise<{ error?: Error }> {
  const { error } = await supabase.from('saved_bets').delete().eq('id', id);
  if (error) return { error: new Error(error.message) };
  return {};
}
