import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svxkqctwgjxmyaxkthwc.supabase.co';
const supabaseKey = 'sb_publishable_0bpTe4CAZJ5Fhz3xJHUjNQ_7ohz_qBQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLastOrderStatus() {
  console.log('Fetching the most recent order from Supabase...');
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.error('Error fetching latest order:', fetchErr);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('No orders found in the database to update.');
    return;
  }

  const lastOrder = orders[0];
  console.log(`Found order ID: ${lastOrder.id}, Customer: ${lastOrder.user_name}, Current Status: ${lastOrder.status}`);

  // Toggles status: pending -> preparing -> ready -> completed -> pending
  let newStatus = 'pending';
  if (lastOrder.status === 'pending') {
    newStatus = 'preparing';
  } else if (lastOrder.status === 'preparing') {
    newStatus = 'ready';
  } else if (lastOrder.status === 'ready') {
    newStatus = 'completed';
  } else {
    newStatus = 'pending';
  }

  console.log(`Updating status to: "${newStatus}"...`);
  const { data: updatedData, error: updateErr } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', lastOrder.id)
    .select();

  if (updateErr) {
    console.error('Error updating status:', updateErr.message);
  } else {
    console.log(`Success! Updated Order ID: ${lastOrder.id} status to "${updatedData[0].status}".`);
  }
}

updateLastOrderStatus();
