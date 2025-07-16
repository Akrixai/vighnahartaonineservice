# Meta WhatsApp Cloud API Integration Guide

## 1️⃣ Install Dependencies

```bash
npm install axios
# axios is already installed in your project
```

## 2️⃣ Environment Variables Setup

Add these to your `.env.local` file:

```env
# Meta WhatsApp Cloud API Configuration
META_WHATSAPP_ACCESS_TOKEN="your_permanent_access_token_here"
META_WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"
META_WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id_here"
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_webhook_verify_token_here"
META_WHATSAPP_APP_SECRET="your_app_secret_here"

# WhatsApp Template Configuration
WHATSAPP_TEMPLATE_NAME="new_scheme_notification"
WHATSAPP_TEMPLATE_LANGUAGE="en_US"
```

## 3️⃣ Setup Steps

### Step 1: Create Meta Developer Account
1. Go to https://developers.facebook.com/
2. Create a developer account
3. Create a new app with "Business" type
4. Add "WhatsApp" product to your app

### Step 2: Get Phone Number ID
1. In WhatsApp Business API setup
2. Note down your Phone Number ID
3. Get your permanent access token

### Step 3: Create Message Template
1. Go to WhatsApp Manager
2. Create a new message template named "new_scheme_notification"
3. Template content:
```
🎉 *New Service Available!*

Hello {{1}}, 

A new service "{{2}}" is now available on our portal.

{{3}}

Visit our portal to apply now!

*Vignaharta Janseva*
Government Services Portal
📞 Support: 9764664021
```

## 4️⃣ Implementation Files

The following files will be created:
- `src/lib/whatsapp-meta-api.ts` - Core WhatsApp API functions
- `src/app/api/webhooks/whatsapp/route.ts` - Webhook handler
- Updated service creation API to trigger notifications

## 5️⃣ Production Considerations

### Free Tier Limits:
- 1,000 conversations per month
- Each conversation = 24-hour window
- Template messages don't count toward conversation limit

### Best Practices:
1. Use permanent access tokens (don't expire)
2. Implement proper error handling and retry logic
3. Store message delivery status in database
4. Use webhook to track delivery status
5. Respect rate limits (80 messages per second)

### Common Mistakes to Avoid:
1. Using temporary access tokens in production
2. Not formatting phone numbers correctly (+91XXXXXXXXXX)
3. Not handling webhook verification
4. Sending messages without approved templates
5. Not implementing proper error handling for failed deliveries

## 6️⃣ Testing

1. Test with your own WhatsApp number first
2. Verify template approval status
3. Check webhook delivery status
4. Monitor API response codes and error messages
