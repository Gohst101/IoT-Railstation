// Check User Logged in
const checkUserLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }

  // User is not logged in - nod good
  console.log(`[Auth] ⚠️ Nicht autorisierter Zugriff auf: ${req.originalUrl}`);
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

/**
 * @param {string[]} allowedRoles
 */
const checkUserRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    const userRole = req.session.user.role;

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    console.log(`[Auth] ⛔ Zugriff verweigert für Rolle: ${userRole} auf ${req.originalUrl}`);
    res.status(403).render('error/403', { 
      message: 'Du hast keine Berechtigung für diese Seite.' 
    });
  };
};

// Redirect to the beatifull dashboard
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  checkUserLoggedIn,
  checkUserRole,
  redirectIfLoggedIn
};