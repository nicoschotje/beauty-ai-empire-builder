import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://ckmnhgattkiziuykhczo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbW5oZ2F0dGtpeml1eWtoY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjU1MzksImV4cCI6MjA4ODM0MTUzOX0.l2ErPyJe6q2sI4UpNtRp9qRfeVkfdrHSOdkensj83IA';

function getClient() {
  const url = Netlify.env.get('SUPABASE_URL') || SUPA_URL;
  const key = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY') || Netlify.env.get('SUPABASE_ANON_KEY') || ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async () => {
  const sb = getClient();

  const [prodRes, catRes, settingsRes, bannerRes] = await Promise.all([
    sb.from('products')
      .select('*, categories(name, color, icon)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    sb.from('categories')
      .select('id, name, color, icon, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    sb.from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle(),
    sb.from('banners')
      .select('*')
      .eq('is_active', true)
      .is('category_name', null)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return Response.json({
    products: prodRes.data || [],
    categories: catRes.data || [],
    storeSettings: settingsRes.data || null,
    heroBanner: bannerRes.data || null,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, max-age=30' },
  });
};

export const config = {
  path: '/api/store-data',
  method: 'GET',
};
