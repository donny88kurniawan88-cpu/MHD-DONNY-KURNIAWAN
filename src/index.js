export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Header keamanan agar tidak diblokir browser
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Tangani preflight request dari browser
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Routing Halaman HTML
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    }
    if (url.pathname === '/login' || url.pathname === '/Login.html') {
      return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    }

    // 2. API UNTUK LOGIN (Backend)
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const username = body.username;
        const password = body.password;

        // Cari user di Database D1
        const { results } = await env.DB.prepare(
          "SELECT * FROM users WHERE username = ? AND password = ?"
        ).bind(username, password).all();

        // Jika user ditemukan
        if (results.length > 0) {
          const user = results[0];
          return Response.json({ 
            success: true, 
            message: 'Login berhasil!', 
            user: { username: user.username, role: user.role } 
          }, { headers: corsHeaders });
        } 
        // Jika user tidak ditemukan
        else {
          return Response.json({ 
            success: false, 
            error: 'Username atau Password salah!' 
          }, { headers: corsHeaders });
        }
      } catch (err) {
        return Response.json({ 
          success: false, 
          error: 'Server Error: ' + err.message 
        }, { status: 500, headers: corsHeaders });
      }
    }

    // 3. API UNTUK AMBIL DATA USER (Untuk Dashboard)
    if (url.pathname === '/api/users') {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM users").all();
        return Response.json(results, { headers: corsHeaders });
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500, headers: corsHeaders });
      }
    }

    // Default: Ambil file statis lainnya (CSS, JS, Gambar)
    return env.ASSETS.fetch(request);
  },
};
