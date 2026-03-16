const jwt = require("jsonwebtoken");

const isAuth = async (req, res, next) => {
  // Support token from cookie OR Authorization header (Bearer token)
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.userId; // attach userId to request
    next();
  } catch (error) {
    console.error("JWT ERROR:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { isAuth };
