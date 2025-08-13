# KHS CRM Sync Server Setup Instructions

## InMotion Hosting Setup

### Step 1: Upload Files via cPanel

1. **Login to cPanel** at InMotion Hosting
2. Open **File Manager**
3. Navigate to `public_html`
4. Create a new folder: `crm-sync`
5. Upload `index.php` to this folder
6. Set file permissions to `644` (right-click → Permissions)

### Step 2: Create sync-data folder

1. Inside `crm-sync` folder, create: `sync-data`
2. Set folder permissions to `755`

### Step 3: Create .htaccess for security

Create `.htaccess` file in `crm-sync` folder with:
```
# Enable PHP
AddHandler application/x-httpd-php .php

# Protect sync-data directory
<FilesMatch "sync-data">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

### Step 4: Test the sync server

Visit: `https://kenhawk.biz/crm-sync/`

You should see an "Unauthorized" message (this is good!)

### Step 5: Update your CRM

The sync server URL will be:
```
https://kenhawk.biz/crm-sync/
```

## Security Token

**IMPORTANT**: Change the `$AUTH_TOKEN` in index.php to something secure!

Current token: `khs-sync-2024-secure-token`

Change it to something like: `your-company-name-random-numbers-2024`

## Folder Structure

```
public_html/
└── crm-sync/
    ├── index.php
    ├── .htaccess
    └── sync-data/
        └── (sync files will go here)
```