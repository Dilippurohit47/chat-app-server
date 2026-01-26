import jwt from "jsonwebtoken"
import { Response ,Request , NextFunction } from "express";
import { JWT_PASSWORD } from "../utils/helper";
export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      res.status(401).json({ message: "Access token missing" });
      return;
    }
    const token = authHeader.split(" ")[1];


    if (!token) {
      res.status(401).json({ message: "Invalid authorization header" });
      return;
    }

    jwt.verify(token, JWT_PASSWORD, (err, decoded) => {
      if (err) {
        res.status(403).json({ message: "Invalid or expired token" });
        return;
      }
      if (typeof decoded === "string") {
        return;
      }
      req.user = decoded; 
      next();
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
    return;
  }
};