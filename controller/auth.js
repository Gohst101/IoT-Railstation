function buildRedirectUrl(targetPath, notificationType, message) {
  const targetUrl = new URL(targetPath || '/dashboard', 'http://localhost');
  targetUrl.searchParams.set('notification', notificationType);

  if (message) {
    targetUrl.searchParams.set('message', message);
  }

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

const handleLogin = (req, res) => {
  const { username, password } = req.body;

  // LA VALIDATION
  if (!username || !password) {
    return res.status(400).render('public/login', {
      error: 'Benutzername und Passwort sind erforderlich.'
    });
  }

  // Admin Login
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_USER_PASS) {
    req.session.user = {
      username: username,
      role: 'admin',
      loginTime: new Date()
    };
    console.log(`[Auth] ✅ Admin '${username}' erfolgreich angemeldet`);
    const redirectTarget = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    return res.redirect(buildRedirectUrl(redirectTarget, 'login-success', 'Du bist jetzt angemeldet.'));
  }

  // Normal User Login
  if (username === process.env.NORMAL_USER && password === process.env.NORMAL_USER_PASS) {
    req.session.user = {
      username: username,
      role: 'user',
      loginTime: new Date()
    };
    console.log(`[Auth] ✅ Benutzer '${username}' erfolgreich angemeldet`);
    const redirectTarget = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    return res.redirect(buildRedirectUrl(redirectTarget, 'login-success', 'Du bist jetzt angemeldet.'));
  }

  console.log(`[Auth] ❌ Gescheiterte Anmeldung für Benutzer: ${username}`);
  res.status(401).render('public/login', {
    error: 'Ungültiger Benutzername oder Passwort.'
  });
};

const handleLogout = (req, res) => {
  const username = req.session.user?.username || 'Unbekannt';
  
  req.session.destroy((err) => {
    if (err) {
      console.log(`[Auth] ⚠️ Fehler beim Logout für Benutzer ${username}`);
      return res.status(500).send('Fehler beim Abmelden');
    }
    console.log(`[Auth] ✅ Benutzer '${username}' erfolgreich abgemeldet`);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

module.exports = {
  handleLogin,
  handleLogout
};