import jwt from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
  const token = req.get("Authorization").split("Bearer ")[1];

  if (!token) {
    return res.status(403).json({ message: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY);
    // console.log(decoded,"decoded")
    req.user = decoded.data;
    
    req.role = decoded.role;

  

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};
