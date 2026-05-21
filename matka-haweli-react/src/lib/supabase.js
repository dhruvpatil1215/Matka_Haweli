import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svxkqctwgjxmyaxkthwc.supabase.co';
const supabaseKey = 'sb_publishable_0bpTe4CAZJ5Fhz3xJHUjNQ_7ohz_qBQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
