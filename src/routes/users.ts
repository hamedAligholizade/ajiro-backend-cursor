import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Middleware to check admin authentication
const checkAdminAuth = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== "Basic YWRtaW46YWppcm8yMDI0") { // Base64 encoded "admin:ajiro2024"
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Get all users
router.get("/", checkAdminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 