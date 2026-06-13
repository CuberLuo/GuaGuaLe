# 🎉 幸运刮刮乐 (GuaGuaLe)

一个基于 React + Express + MySQL 的在线刮刮乐抽奖应用，支持用户校验、刮奖动画、金额翻倍、兑奖码生成等完整流程。

## 功能特性

- **用户名校验** — 通过 URL 参数 `?name=xxx` 校验用户身份，未授权用户跳转禁止访问页面
- **刮刮乐交互** — Canvas 涂层刮开效果，支持鼠标和触屏操作
- **金额翻倍** — 刮开后显示原始金额，动画翻转为幸运金额（×2）
- **剩余次数管理** — 基于数据库的用户刮奖次数控制
- **兑奖码生成** — 次数用完后自动生成 15 位随机兑奖码，自动复制到剪贴板
- **刮奖记录** — 展示历史刮奖金额和时间
- **庆祝动画** — GSAP 驱动的彩纸爆炸 + 金额滚动动画
- **响应式设计** — 适配桌面端和移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + GSAP |
| 后端 | Express 5 + TypeScript |
| 数据库 | MySQL 8 |
| 部署 | Docker Compose + Nginx |

## 项目结构

```
GuaGuaLe/
├── guaguale_web/          # 前端 React 应用
│   ├── src/
│   │   ├── apis/          # API 请求封装
│   │   ├── components/    # UI 组件
│   │   ├── App.tsx        # 主应用
│   │   └── main.tsx       # 入口
│   ├── public/            # 静态资源
│   └── nginx.conf         # Nginx 配置
── guaguale_express/      # 后端 Express 服务
│   └── src/
│       └── index.ts       # 服务入口 + API 路由
├── .env                   # 环境变量（数据库配置）
├── docker-compose.yml     # Docker 编排
└── package.json           # 根脚本（并发启动 / Docker）
```

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8+
- Docker & Docker Compose（可选，用于容器化部署）

### 本地开发

1. **配置数据库**

   编辑根目录 `.env` 文件，填入你的 MySQL 连接信息：

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=guaguale_db
   ```

2. **安装依赖并启动**

   ```bash
   npm install
   cd guaguale_express && npm install && cd ..
   cd guaguale_web && npm install && cd ..
   ```

   ```bash
   # 同时启动前后端开发服务
   npm run dev
   ```

   前端访问 `http://localhost:5173?name=你的用户名`

### Docker 部署

```bash
# 构建并启动所有服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down

# 重新构建并启动
npm run docker:rebuild
```

部署后访问 `http://localhost?name=你的用户名`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/validate-name?name=xxx` | 校验用户名，返回用户信息、剩余次数和刮奖记录 |
| GET | `/api/prize?userId=xxx` | 生成刮奖金额（原始金额随机 0.005~44.4，幸运金额 ×2） |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | 数据库地址 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USER` | 数据库用户 | `root` |
| `DB_PASSWORD` | 数据库密码 | - |
| `DB_NAME` | 数据库名称 | `guaguale_db` |

## License

ISC © 罗俊涛
