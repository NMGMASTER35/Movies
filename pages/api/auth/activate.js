import { supabase } from '../../../services/supabaseClient';
import { supabaseAdmin } from '../../../services/supabaseAdminClient';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    const authUser = data?.user;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (authUser?.id && supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
    }

    return res.status(200).json({ user: authUser });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
