import { supabaseAdmin } from '../../../services/supabaseAdminClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client is not configured.' });
  }

  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required to confirm email.' });
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ user: data?.user });
}
