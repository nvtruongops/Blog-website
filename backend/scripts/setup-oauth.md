# Google OAuth Setup cho Vercel

## URLs cần thêm vào Google Cloud Console

### Backend URL
```
https://your-backend-domain.vercel.app
```

### Frontend URL  
```
https://your-frontend-domain.vercel.app
```

## Bước 1: Mở Google Cloud Console
1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Chọn project của bạn
3. Click vào OAuth 2.0 Client ID tương ứng

## Bước 2: Thêm Authorized JavaScript origins
```
https://your-backend-domain.vercel.app
https://your-frontend-domain.vercel.app
```

## Bước 3: Thêm Authorized redirect URIs
```
https://your-backend-domain.vercel.app/auth/google/callback
```

## Bước 4: Save và đợi 5 phút để có hiệu lực
