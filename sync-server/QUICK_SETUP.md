# Quick Setup for InMotion Hosting

## What You're Uploading
Just ONE file: `index.php`

## Steps:

### 1. Login to cPanel
- Go to InMotion Hosting
- Login to cPanel

### 2. Create Folder
- Open File Manager
- Go to `public_html`
- Create new folder: `crm-sync`
- Inside `crm-sync`, create folder: `sync-data`

### 3. Upload File
- Upload `index.php` to `crm-sync` folder
- That's it!

### 4. Test It
Visit: https://kenhawk.biz/crm-sync/

You should see: `{"error":"Unauthorized"}`

That means it's working!

## Security
Edit `index.php` and change this line:
```php
$AUTH_TOKEN = 'khs-sync-2024-secure-token';
```

Change `khs-sync-2024-secure-token` to something only you know.

## Your Sync Server is Ready!
The CRM will automatically sync to this server when you push the update.