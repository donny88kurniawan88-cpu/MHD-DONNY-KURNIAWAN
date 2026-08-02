export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    }
    
    if (url.pathname === '/authority') {
       return env.ASSETS.fetch(new Request(new URL('/Authority.html', request.url), request));
    }

    // Tambahan untuk halaman Login
    if (url.pathname === '/login') {
       return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
