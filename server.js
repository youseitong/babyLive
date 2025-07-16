import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import openDb from "./src/db/config.js";
import bcrypt from "bcrypt"; // 需要安装此依赖
import jwt from "jsonwebtoken"; // 需要安装此依赖
// 在 server.js 中添加
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = "your-secret-key"; // 在生产环境中应使用环境变量

app.use(cors());
app.use(bodyParser.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 提供静态文件服务
app.use(express.static(path.join(__dirname, "dist")));

// 初始化数据库
async function initDb() {
  const db = await openDb();

  // 创建用户表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 检查是否存在管理员用户，如果不存在则创建默认管理员
  const adminUser = await db.get("SELECT * FROM users WHERE role = ?", [
    "admin",
  ]);
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.run(
      "INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        Date.now().toString(),
        "admin",
        hashedPassword,
        "admin",
        new Date().toISOString(),
      ]
    );
    console.log("已创建默认管理员账户: admin / admin123");
  }
  // 修改喂奶记录表
  await db.exec(`
  CREATE TABLE IF NOT EXISTS feeding_records (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    duration INTEGER,
    notes TEXT,
    exType TEXT,
    color TEXT,
    created_by TEXT,
    deleted INTEGER DEFAULT 0
  )
`);

  // 修改排泄记录表
  await db.exec(`
  CREATE TABLE IF NOT EXISTS excretion_records (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    deleted INTEGER DEFAULT 0
  )
`);

  // 创建身高体重记录表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS growth_records (
      id TEXT PRIMARY KEY,
      time TEXT NOT NULL,
      weight REAL,
      height REAL,
      notes TEXT
    )
  `);
  return db;
}

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "未提供认证令牌" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "令牌无效或已过期" });
    req.user = user;
    next();
  });
};

// 管理员权限中间件
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
};

// 用户或管理员权限中间件（允许用户访问自己的数据或管理员访问所有数据）
const isUserOrAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "user") {
    return res.status(403).json({ error: "权限不足" });
  }
  next();
};
// 修改吃奶记录查询 API
app.get("/api/feeding", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const records = await db.all(
      "SELECT * FROM feeding_records WHERE deleted = 0"
    );
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/feeding", authenticateToken, async (req, res) => {
  try {
    const record = req.body;
    record.id = Date.now().toString();
    record.created_by = req.user.id;

    const db = await openDb();
    await db.run(
      "INSERT INTO feeding_records (id, time, amount, type, duration, notes, exType, color, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        record.id,
        record.time,
        record.amount,
        record.type,
        record.duration,
        record.notes,
        record.exType,
        record.color,
        record.created_by,
      ]
    );

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/feeding/:id", authenticateToken, async (req, res) => {
  // 只有管理员可以修改记录
  try {
    const { id } = req.params;
    const record = req.body;

    // 确保所有字段都有值，即使是空值
    const time = record.time || null;
    // 修改这一行，确保amount不会是null
    const amount =
      record.amount !== undefined && record.amount !== null ? record.amount : 0;
    const type = record.type || null;
    const duration = record.duration !== undefined ? record.duration : null;
    const notes = record.notes || null;
    const exType = record.exType || null;
    const color = record.color || null;

    const db = await openDb();
    await db.run(
      "UPDATE feeding_records SET time = ?, amount = ?, type = ?, duration = ?, notes = ?, exType = ?, color = ? WHERE id = ?",
      [time, amount, type, duration, notes, exType, color, id]
    );

    res.json({ ...record, id });
  } catch (error) {
    console.error("更新吃奶记录错误:", error);
    res.status(500).json({ error: error.message });
  }
});

// 修改吃奶记录删除 API
app.delete("/api/feeding/:id", authenticateToken, async (req, res) => {
  // 只有管理员可以删除记录
  try {
    const { id } = req.params;

    const db = await openDb();
    // 不实际删除，只标记为已删除
    await db.run("UPDATE feeding_records SET deleted = 1 WHERE id = ?", id);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 修改排泄记录查询 API
app.get("/api/excretion", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const records = await db.all(
      "SELECT * FROM excretion_records WHERE deleted = 0"
    );
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/excretion", authenticateToken, async (req, res) => {
  try {
    const record = req.body;
    record.id = Date.now().toString();

    const db = await openDb();
    await db.run(
      "INSERT INTO excretion_records (id, time, type, color, notes) VALUES (?, ?, ?, ?, ?)",
      [record.id, record.time, record.type, record.color, record.notes]
    );

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/excretion/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = req.body;

    const db = await openDb();
    await db.run(
      "UPDATE excretion_records SET time = ?, type = ?, color = ?, notes = ? WHERE id = ?",
      [record.time, record.type, record.color, record.notes, id]
    );

    res.json({ ...record, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/excretion/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await openDb();
    // 不实际删除，只标记为已删除
    await db.run("UPDATE excretion_records SET deleted = 1 WHERE id = ?", id);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 身高体重记录API
app.get("/api/growth", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const records = await db.all("SELECT * FROM growth_records");
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/growth", authenticateToken, async (req, res) => {
  try {
    const record = req.body;
    record.id = Date.now().toString();

    const db = await openDb();
    await db.run(
      "INSERT INTO growth_records (id, time, weight, height, notes) VALUES (?, ?, ?, ?, ?)",
      [record.id, record.time, record.weight, record.height, record.notes]
    );

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/growth/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = req.body;

    const db = await openDb();
    await db.run(
      "UPDATE growth_records SET time = ?, weight = ?, height = ?, notes = ? WHERE id = ?",
      [record.time, record.weight, record.height, record.notes, id]
    );

    res.json({ ...record, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/growth/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await openDb();
    await db.run("DELETE FROM growth_records WHERE id = ?", id);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户认证API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const db = await openDb();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户注册API（仅管理员可用）
app.post("/api/auth/register", authenticateToken, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "用户名和密码不能为空" });
    }

    // 仅允许创建普通用户或管理员
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ error: "无效的用户角色" });
    }

    const db = await openDb();

    // 检查用户名是否已存在
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(400).json({ error: "用户名已存在" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    await db.run(
      "INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
      [userId, username, hashedPassword, role, new Date().toISOString()]
    );

    res.status(201).json({ id: userId, username, role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户列表（仅管理员可用）
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const users = await db.all(
      "SELECT id, username, role, created_at FROM users"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除用户（仅管理员可用）
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await openDb();

    // 检查是否为最后一个管理员
    const adminCount = await db.get(
      "SELECT COUNT(*) as count FROM users WHERE role = ?",
      ["admin"]
    );
    const userToDelete = await db.get("SELECT * FROM users WHERE id = ?", [id]);

    if (
      userToDelete &&
      userToDelete.role === "admin" &&
      adminCount.count <= 1
    ) {
      return res.status(400).json({ error: "不能删除最后一个管理员账户" });
    }

    await db.run("DELETE FROM users WHERE id = ?", [id]);

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ... existing code ...
// 启动服务器
initDb()
  .then(() => {
    // 所有未匹配的路由返回 index.html（移到这里）
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
    app.listen(port, "0.0.0.0", () => {
      console.log(`服务器运行在 http://localhost:${port}`);
      console.log(`局域网访问: http://<您的IP地址>:${port}`);
    });
  })
  .catch((err) => {
    console.error("数据库初始化失败:", err);
  });
