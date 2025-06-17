import jwt from 'jsonwebtoken';
import 'dotenv/config';
export const authmiddleware = (req,res,next)=>{
const token = req.get("Authorization").split("Bearer ")[1];


    try{
        if(!token){
     return res.status(401).json({ message: "Authorization header missing or invalid" });
}
else{
    const decode = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decode;
    req.token = token;
  
    next();
}
        
    }catch(err){
        res.status(401).json({message:err.message})
    }
}