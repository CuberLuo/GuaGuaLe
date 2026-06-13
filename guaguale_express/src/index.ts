import express from 'express';
import cors from 'cors';
import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'guaguale_db';

let pool: Pool;

// 初始化连接池
async function initPool() {
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const conn = await pool.getConnection();
    console.log(`[数据库] 连接成功: ${dbConfig.host}:${dbConfig.port}/${dbName}`);
    conn.release();
  } catch (error) {
    console.error('[数据库] 连接失败:', error);
  }
}

// 格式化时间
function formatTime(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

// 校验用户名
app.get('/api/validate-name', async (req, res) => {
  const name = req.query.name as string;
  console.log(`[用户校验] name=${name || '(空)'}`);

  if (!name) {
    res.json({ valid: false });
    return;
  }

  try {
    const [rows] = await pool.query('SELECT id, remaining_count FROM users WHERE name = ?', [name]);
    const users = rows as any[];
    if (users.length === 0) {
      console.log('[用户校验] 用户不存在');
      res.json({ valid: false });
      return;
    }
    const user = users[0];
    console.log(`[用户校验] name=${name}, id=${user.id}, remaining=${user.remaining_count}`);

    // 查询该用户的刮奖记录
    const [recordRows] = await pool.query(
      'SELECT money, created_at FROM scratch_records WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );
    const records = (recordRows as any[]).map(r => ({
      money: r.money,
      time: formatTime(r.created_at),
    }));

    res.json({ valid: true, userId: user.id, remainingCount: user.remaining_count, history: records });
  } catch (error) {
    console.error('[用户校验] 查询失败:', error);
    res.json({ valid: false });
  }
});

// 生成随机金额 (0.005 - 44.4)
function getRandomMoney(): number {
  return Math.random() * (44.4 - 0.005) + 0.005;
}

// 获取刮奖金额
app.get('/api/prize', async (req, res) => {
  const userId = parseInt(req.query.userId as string);
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const original = getRandomMoney();
  const lucky = original * 2;
  const originalStr = original.toFixed(2);
  const luckyStr = lucky.toFixed(2);
  console.log(`[刮刮乐] 原始: ¥${originalStr}, 幸运: ¥${luckyStr}, userId=${userId}`);

  try {
    await pool.query('INSERT INTO scratch_records (money, user_id) VALUES (?, ?)', [luckyStr, userId]);
    await pool.query('UPDATE users SET remaining_count = remaining_count - 1 WHERE id = ?', [userId]);
    console.log('[数据库] 幸运金额已存入数据库，次数已扣减');
  } catch (error) {
    console.error('[数据库] 操作失败:', error);
  }

  res.json({ originalMoney: originalStr, luckyMoney: luckyStr });
});

// 启动服务
initPool();
app.listen(PORT, () => {
  console.log(`[刮刮乐] 后端服务已启动: http://localhost:${PORT}`);
});
