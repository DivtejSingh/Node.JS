import jwt from 'jsonwebtoken';

export const AdminVerify = (req, res, next) => {
  const token = req.get('Authorization')?.split('Bearer ')[1];
  

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no admin token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Check if the token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: 'Token has expired, please login again' });
    }

 
    // console.log(decoded,"decoded")
    // Attach user information to the request object
    req.username = decoded.username;
    req.email = decoded.email; 
    req.role = decoded.role; 
    req.id = decoded.id;


    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(400).json({ message: 'Invalid token' });
  }
};
