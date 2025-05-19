import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REAL_SUPABASE_URL,
  process.env.REAL_SUPABASE_SERVICE_KEY // 👈 Make sure this one is *not* the public anon key
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('approved', true)
    .order('id', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}