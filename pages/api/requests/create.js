import { supabase } from '../../../services/supabaseClient';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  if (req.method === 'POST') {
    const { movieId, userId, type, message, deliveryMethod, requesterEmail } = req.body;

    const { data, error } = await supabase
      .from('requests')
      .insert([
        {
          movie_id: movieId,
          user_id: userId,
          requester_email: requesterEmail || null,
          type: type,
          status: 'OPEN',
          message: message,
          delivery_method: deliveryMethod,
        },
      ])
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}
