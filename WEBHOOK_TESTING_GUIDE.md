# WhatsApp Webhook Testing Guide

## 🔧 Step-by-Step Configuration

### 1. Deploy Your Application
Your app must be publicly accessible for Meta to verify the webhook.

**Vercel Deployment:**
```bash
vercel --prod
```

**Or use ngrok for testing:**
```bash
npm run dev
# In another terminal:
ngrok http 3000
```

### 2. Configure in Meta Developer Console

1. Go to https://developers.facebook.com/apps
2. Select your app → WhatsApp → Configuration
3. Set webhook:
   - **URL**: `https://your-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: `your_webhook_1234`
   - **Fields**: messages, message_deliveries, message_reads

### 3. Manual Webhook Test

Test your webhook before Meta verification:
```
GET https://your-domain.com/api/test-webhook?hub.mode=subscribe&hub.verify_token=your_webhook_1234&hub.challenge=test123
```

Expected response: `test123` (status 200)

### 4. Verify in Meta Console

Click "Verify and Save" in Meta Developer Console. You should see:
- ✅ Green checkmark if successful
- ❌ Error message if failed

### 5. Test WhatsApp Message Sending

Use the test endpoint:
```bash
curl -X POST https://your-domain.com/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "phoneNumber": "919764664021",
    "recipientName": "Test User",
    "testMessage": "Testing WhatsApp integration"
  }'
```

### 6. Create New Service (End-to-End Test)

1. Login as admin
2. Go to `/dashboard/admin/services`
3. Create a new service
4. Check console logs for WhatsApp notifications
5. Verify messages are sent to users with phone numbers

## 🐛 Troubleshooting

### Webhook Verification Fails
- Check if your app is publicly accessible
- Verify the verify token matches exactly
- Check server logs for errors
- Ensure HTTPS is used (not HTTP)

### Messages Not Sending
- Verify your access token is valid
- Check if message template is approved
- Ensure phone numbers are in correct format (+919XXXXXXXXX)
- Check Meta API rate limits

### Common Issues
1. **Token mismatch**: Verify token in .env matches Meta console
2. **URL not accessible**: Deploy app or use ngrok
3. **Template not approved**: Wait for Meta approval (24-48 hours)
4. **Phone format**: Use international format without + symbol

## 📊 Monitoring

Check these for successful setup:
- Browser console logs during service creation
- Database `whatsapp_notifications` table for logged messages
- Meta Developer Console webhook logs
- WhatsApp Business Manager for delivery reports

## 🎯 Success Indicators

✅ Webhook verification shows green checkmark in Meta console
✅ Test endpoint returns correct challenge response
✅ Service creation triggers console logs about WhatsApp notifications
✅ Database shows new entries in `whatsapp_notifications` table
✅ Users receive WhatsApp messages (after template approval)
