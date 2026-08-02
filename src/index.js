export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Routing Halaman HTML
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    }
    if (url.pathname === '/login') {
      return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    }

    // 2. API UNTUK LOGIN (Backend)
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        // Ambil data username & password dari Login.html
        const body = await request.json();
        const { username, password } = body;

        // Cari user di Database D1
        const { results } = await env.DB.prepare(
          "SELECT * FROM users WHERE username = ? AND password = ?"
        ).bind(username, password).all();

        // Jika user ditemukan
        if (results.length > 0) {
          const user = results[0];
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Login berhasil!', 
            user: { username: user.username, role: user.role } 
          }), { headers: { 'Content-Type': 'application/json' } });
        } 
        // Jika user tidak ditemukan / password salah
        else {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Username atau Password salah!' 
          }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (err) {
        // Jika ada error di server
        return new Response(JSON.stringify({ success: false, error: 'Server Error: ' + err.message }), { status: 500 });
      }
    }

    // 3. API UNTUK AMBIL DATA USER (Untuk Dashboard)
    if (url.pathname === '/api/users') {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM users").all();
        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Gagal mengambil data' }), { status: 500 });
      }
    }

    // Default: Ambil file statis lainnya (CSS, JS, Gambar)
    return env.ASSETS.fetch(request);
  },
};
