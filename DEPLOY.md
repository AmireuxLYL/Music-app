# MusicFlow — 安装和使用指南

## 🚀 本地运行

```bash
cd C:\Users\Administrator\music-app
npm run dev
```

浏览器打开 **http://localhost:3000**

---

## 📱 安装到手机/电脑（PWA）

App 已支持 PWA，可以像原生 App 一样安装：

### iPhone / iPad
1. Safari 打开 `http://你的IP:3000`
2. 点击底部 **分享按钮** (↑)
3. 选择 **添加到主屏幕**
4. 桌面出现 MusicFlow 图标，点击即可全屏使用

### Android
1. Chrome 打开 `http://你的IP:3000`
2. 弹出 **添加到主屏幕** 横幅（或菜单→安装应用）
3. 安装后像原生 App 一样使用

### 电脑
1. Chrome 打开 `http://localhost:3000`
2. 地址栏右侧出现 **安装图标** (⊕)
3. 安装为桌面应用

### 局域网访问（手机测试）
```bash
# 查看你的电脑IP
ipconfig  # 找 IPv4 地址，如 192.168.1.x

# 启动时绑定局域网
npm run dev -- -H 0.0.0.0
# 手机访问: http://192.168.1.x:3000
```

---

## 🎵 接入 Jamendo 真实音乐

1. 访问 https://developers.jamendo.com/v3.0 注册
2. 创建应用获取 Client ID
3. 在 `.env.local` 中填入：

```
JAMENDO_CLIENT_ID=你的ClientID
```

重启后搜索即接入 50万+ 真实音乐库。

---

## 🎨 当前功能

- 🏠 **推荐流** — 上下滑动，点击播放/暂停，双击收藏
- 🔍 **搜索** — 原唱/伴奏/纯音乐/翻唱筛选
- 🎵 **播放器** — 黑胶唱片旋转动效，霓虹光晕
- 📂 **我的** — 下载/收藏/历史管理
- 📱 **PWA** — 可安装为手机/桌面 App
