# CI/CD Setup Guide - Auto Deploy to Vercel

## Cấu hình GitHub Secrets

Vào **GitHub Repository → Settings → Secrets and variables → Actions** và thêm các secrets sau:

### 1. VERCEL_TOKEN
Lấy từ Vercel Dashboard:
1. Vào https://vercel.com/account/tokens
2. Click "Create Token"
3. Đặt tên: `github-actions`
4. Copy token và paste vào GitHub Secret

### 2. VERCEL_ORG_ID
Lấy từ file `.vercel/project.json` trong thư mục backend hoặc client:
```bash
cat backend/.vercel/project.json | grep orgId
```

### 3. VERCEL_BACKEND_PROJECT_ID
Lấy từ file `backend/.vercel/project.json`:
```bash
cat backend/.vercel/project.json | grep projectId
```

### 4. VERCEL_CLIENT_PROJECT_ID
Lấy từ file `client/.vercel/project.json`:
```bash
cat client/.vercel/project.json | grep projectId
```

> ⚠️ **Lưu ý bảo mật:** Không commit các ID này vào repository. Luôn sử dụng GitHub Secrets.

## Workflow

Khi push code lên branch `master` hoặc `main`:
1. GitHub Actions tự động chạy
2. Deploy Backend và Client song song
3. Cả 2 được deploy lên Vercel Production

## Kiểm tra

- Xem status tại: **GitHub → Actions tab**
- Mỗi commit sẽ có badge ✅ hoặc ❌
