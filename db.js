// Supabase初始化
export function initializeSupabase() {
    const SUPABASE_URL = 'https://klajzzafruygqqwtdini.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYWp6emFmcnV5Z3Fxd3RkaW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MjIzMzksImV4cCI6MjA1ODI5ODMzOX0.dMx-nH4i_CcxBWSeSV56UtnGraEfQ20ufSYoHvgadog';
    const supabase_client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabase_client
}

// 商品操作模块
export const ProductService = {
  // 获取带库存的商品列表
  async getProducts(supabase_client) {
    const { data, error } = await supabase_client
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('获取商品失败:', error);
      return [];
    }
    return data;
  }
}
