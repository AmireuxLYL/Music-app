# Music App — Setup & Deployment Guide

## 快速启动

```bash
cd music-app
npm install
npm run dev
```

浏览器打开 http://localhost:3000

---

## 接入真实音乐 API

### Jamendo（免费，推荐首选）

1. 访问 https://developers.jamendo.com/v3.0
2. 注册账号，创建应用
3. 获取 Client ID
4. 在 `.env.local` 中配置：

```
JAMENDO_CLIENT_ID=你的ClientID
```

配置后重启 `npm run dev`，搜索和推荐会自动调用 Jamendo 真实音乐库（50万+ 首免费音乐）。

### SoundCloud / YouTube

在 `.env.local` 中添加对应 Key：
```
SOUNDCLOUD_CLIENT_ID=
YOUTUBE_API_KEY=
```

---

## 部署到 Vercel

### 自动部署（推荐）

```bash
# 登录（只需一次）
npx vercel login

# 部署预览版
npx vercel

# 部署生产环境
npx vercel --prod
```

### 部署后配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：
- `JAMENDO_CLIENT_ID`

### 自动 Git 部署

在 Vercel 中关联 GitHub 仓库后，每次 push 自动部署。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | 全栈框架 |
| React 19 | UI |
| Tailwind CSS v4 | 样式 |
| Howler.js | 音频播放 |
| Dexie.js | 浏览器数据库 |
| Framer Motion | 动画 |
| Jamendo API | 音乐数据 |

---

## 项目结构

```
music-app/
├── app/           # Next.js 页面和 API 路由
├── components/    # React 组件
├── hooks/         # 自定义 Hooks
├── lib/           # 工具库、数据、类型定义
└── public/        # 静态资源
```
