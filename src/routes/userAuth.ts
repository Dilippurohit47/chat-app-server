import express from "express";
import { prisma } from "../utils/prisma";
import { JWT_PASSWORD, sendToken } from "../utils/helper";
import jwt from "jsonwebtoken";
const app = express.Router();

app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      res.status(404).json({
        message: "Please Fill all fields",
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "user not found",
      });
      return;
    }
    if (user?.password !== password) {
      res.status(403).json({
        message: "Password or email is incorrect",
      });
      return;
    }

    const token = sendToken(res, user);

    res.status(200).json({
      message: "Login successfull",
      token: token,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/get-user", async (req, res) => {
  try {
    const cookie = req.cookies["chat-token"];

    if (!cookie) {
      return res.status(404).json({
        message: "Please login first",
      });
    }
    const decoded = jwt.verify(cookie, JWT_PASSWORD);

    // ✅ Use `await` in an `async` function
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/all-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default app;
