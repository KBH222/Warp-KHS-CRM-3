# KHS CRM - Practical Security Implementation

## Overview

This CRM uses a **practical security approach** designed for real construction businesses. It balances data protection with the need for remote workers to access job information.

## What Syncs vs What Stays Local

### ✅ Syncs to Google Drive (Business Data)
- **Customer Information**
  - Names and addresses (public record data)
  - Phone numbers (for worker communication)
  - Email addresses (business correspondence)
  - General notes about jobs
  
- **Job Details**
  - Job site locations and descriptions
  - Task assignments and schedules  
  - Material requirements
  - Worker assignments
  - Project photos and documents
  - Status updates and comments

### 🔒 Stays Local Only (Financial/Private Data)
- **Financial Information**
  - Payment methods and credit cards
  - Bank account details
  - Job pricing and profit margins
  - Invoice details
  
- **Private Information**
  - Social Security Numbers
  - Employee wages
  - Medical information
  - Private family notes

## Setup Google Drive Sync

1. **Get Google API Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add authorized origins: `http://localhost:5173` and your production URL

2. **Configure the App**
   - Copy `.env.example` to `.env`
   - Add your credentials:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

3. **Sign In**
   - Click "Sign in with Google" in the sync status bar
   - Authorize the app to access Google Drive
   - Data will sync automatically

## Security Features

### 1. Selective Field Sync
The app automatically filters what data syncs to Google Drive. Financial fields like payment info, pricing, and margins always stay on your device.

### 2. Financial Data Encryption (Optional)
- Encrypts payment methods, bank details, and pricing
- Set up in Security Settings
- Uses a password you create
- Only needed if you store financial data

### 3. App Password Protection (Optional)
- Adds a login screen to the app
- Useful for shared devices
- Can be disabled for convenience
- 24-hour session timeout for field workers

## For Construction Business Owners

### Why This Approach?
- **Customer addresses are public record** (county tax records)
- **Workers need job site info** to navigate and complete work
- **Contact info is required** for business operations
- **Financial data is protected** where it actually matters

### Benefits
1. **Remote Access** - Workers see job details from anywhere
2. **Real-time Updates** - Changes sync immediately
3. **Practical Security** - Protects what's actually sensitive
4. **No Over-Engineering** - Simple, working solution

### What Remote Workers Can Access
- Customer names and addresses for navigation
- Phone numbers to contact customers
- Job descriptions and requirements
- Material lists and schedules
- Task assignments
- Project photos

### What Remote Workers CANNOT Access
- Payment information
- Pricing and margins
- Bank details
- Private notes
- Employee wages

## Testing the Implementation

1. **Add a Test Customer**
   - Include name, address, phone
   - Add payment method (stays local)
   - Add a private note (stays local)

2. **Sync to Google Drive**
   - Click "Sync Now"
   - Check Google Drive for `KHS-CRM-Data` folder
   - Verify only business data is uploaded

3. **Test on Another Device**
   - Sign in with same Google account
   - Verify customer info syncs
   - Confirm financial data is missing (as intended)

4. **Test Remote Worker Access**
   - Workers can see job locations
   - Can click phone numbers to call
   - Can view task assignments
   - Cannot see pricing information

## Troubleshooting

### "Google Drive not configured"
- Check `.env` file has correct credentials
- Ensure API is enabled in Google Cloud Console
- Verify authorized origins include your URL

### Data Not Syncing
- Check internet connection
- Verify signed into Google
- Click "Sync Now" manually
- Check browser console for errors

### Financial Data Visible
- Enable encryption in Security Settings
- Set a password for financial data
- Restart the app after enabling

## Security Best Practices

1. **Use encryption** if storing credit card info
2. **Enable app password** on shared devices
3. **Regular backups** of local data
4. **Train workers** on data handling
5. **Review permissions** periodically

## Support

For questions about this practical security implementation:
1. Check Security Settings page in app
2. Review this documentation
3. Contact support with specific issues

---

This approach recognizes that construction businesses need practical access to customer and job information while protecting genuinely sensitive financial and personal data.