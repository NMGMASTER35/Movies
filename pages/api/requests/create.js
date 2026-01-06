import { supabase } from '../../../services/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  const { movieId, userId, type, message, deliveryMethod, requesterEmail } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  if (!type) {
    return res.status(400).json({ error: 'Request type is required.' });
  }

  try {
    const payload = {
      movie_id: movieId ?? null,
      user_id: userId,
      type,
      status: 'OPEN',
      message: message?.trim() || '',
      delivery_method: deliveryMethod || null,
      requester_email: requesterEmail || null,
    };

    const { data, error } = await supabase.from('requests').insert([payload]).select('*').single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (creationError) {
    return res.status(500).json({ error: creationError.message || 'Unable to create request.' });
  }
}
