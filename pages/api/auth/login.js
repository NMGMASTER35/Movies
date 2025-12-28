import { supabase } from '../../../services/supabaseClient';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;

    let data;
    let error;

    if (typeof supabase.auth.signInWithPassword === 'function') {
      ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
    } else {
      const response = await supabase.auth.signIn({ email, password });
      data = response?.data ?? { user: response?.user, session: response?.session };
      error = response?.error;
    }
    const authUser = data?.user;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ user: authUser });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
