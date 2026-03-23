# WhatsApp Campaign Note

## Campaign
- Template: `year_ending_sale_activa_2026`
- Channel: MSG91 WhatsApp Template
- Date prepared: 23 March 2026

## Final Message Draft (Lock Before Send)
Year Ending Sale 🎉 ab shuru ho chuki hai.

Honda Activa Standard 🛵 ab special on-road price ₹84,999 par uplabdh hai.

Is special offer mein shamil hai:

✅ Ex-Showroom: ₹77,375  
✅ Registration: ₹9,253  
✅ Insurance: ₹5,515

*Total Onroad: ₹92,143*

✅ O’ Circle Privileged: -₹6,144  
✅ B-Coin Welcome Reward: -₹1,000

*Offer Onroad: ₹84,999*  
Kul bachat: ₹7,144 ✨

Offer 23 March 2026 se 30 March 2026 tak valid hai ⏳

Footer: `Reply STOP to unsubscribe`

Note: `Reply STOP to unsubscribe` is a mandatory regulatory/compliance footer and should be configured in MSG91 template footer (hardcoded), not manually edited per campaign send.

## Important Correction
- Earlier draft had mismatch (`₹83,999` vs `₹84,999`).
- Keep one final price everywhere: **₹84,999**.

## Calculation Check
- Ex-Showroom `₹77,375` + Registration `₹9,253` + Insurance `₹5,515` = `₹92,143`
- Discount `₹6,144` + `₹1,000` = `₹7,144`
- Offer on-road `₹92,143 - ₹7,144 = ₹84,999`

## Audience Filter (Must)
- Serviceable members only
- Active members only
- Valid WhatsApp number
- Exclude opted-out users
- Exclude blacklist numbers

## Campaign Metadata
- MSG91 Template ID: `[fill before send]`
- Template status: `Approved / Pending`
- Total eligible recipients: `[fill before send]`
- Sent by: `[fill before send]`
- Approved by: `[fill before send]`

## Safe Rollout SOP
1. Batch 1: 100 users
2. Wait 30-45 minutes, check delivery/failures/replies
3. If healthy, run next batches of 200-300
4. Keep 10-15 minutes gap between batches
5. Pause immediately if failure/report rate spikes

## Required Controls (for future dedicated AUMS page)
- **Direct page link** (shareable URL: `/aums/campaigns/[campaign-id]`)
- Preview + recipient count before send
- Test batch -> Approve -> Next batch flow
- Pause/Resume campaign
- Live batch logs (sent/delivered/failed/replied)
- Auto-stop threshold for risk control
