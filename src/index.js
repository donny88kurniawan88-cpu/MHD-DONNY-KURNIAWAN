export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Routing Halaman HTML
    if (url.pathname === '/') return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    if (url.pathname === '/login' || url.pathname === '/Login.html') return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    if (url.pathname === '/authority' || url.pathname === '/Authority.html') return env.ASSETS.fetch(new Request(new URL('/Authority.html', request.url), request));

    // Fungsi helper untuk cek role admin dari header
    async function isAdmin(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return false;
      const { results } = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).all();
      return results.length > 0 && results[0].role === 'ADMIN';
    }

    // 2. API LOGIN
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();
        const { results } = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).all();
        
        if (results.length > 0) {
          const user = results[0];
          return Response.json({ success: true, message: 'Login berhasil!', user: { username: user.username, role: user.role } });
        } else {
          return Response.json({ success: false, error: 'Username atau Password salah!' });
        }
      } catch (err) {
        return Response.json({ success: false, error: 'Server Error: ' + err.message }, { status: 500 });
      }
    }

    // 3. API GET USERS (Hanya Admin)
    if (url.pathname === '/api/users' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role FROM users").all();
        return Response.json(results);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // 4. API ADD USER (Hanya Admin)
    if (url.pathname === '/api/users' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { username, password, role } = await request.json();
        if (!username || !password || !role) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
        
        await env.DB.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").bind(username, password, role).run();
        return Response.json({ success: true, message: 'User berhasil ditambahkan' });
      } catch (err) {
        return Response.json({ error: 'Username sudah ada atau format salah' }, { status: 500 });
      }
    }

    // 5. API DELETE USER (Hanya Admin)
    if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const usernameToDelete = decodeURIComponent(url.pathname.split('/').pop());
        
        // Keamanan: Jangan biarkan admin menghapus dirinya sendiri
        const reqUser = request.headers.get('x-auth-token');
        if (reqUser === usernameToDelete) return Response.json({ error: 'Anda tidak bisa menghapus akun sendiri!' }, { status: 400 });

        await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(usernameToDelete).run();
        return Response.json({ success: true, message: 'User berhasil dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus user' }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
