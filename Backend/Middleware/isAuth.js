import jwt from "jsonwebtoken";
export const isAuth = async(req, res, next) => {
  
  let {token} = req.cookies; 
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  console.log("TOKEN FROM COOKIE:", req.cookies.token);
  try {
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.userId;     // add userId to req object
    
    next(); // move to next process in route 
  } catch (error) {
    console.error("JWT ERROR:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

