# Webhook Transaction Lookup Error Fix - December 1, 2025

## Problem

When a `transfer.successful` webhook arrives for a withdrawal, the system was throwing an error:

```
Uncaught Error: Transaction not found for webhook - lencoId: 80044604-09d5-4e81-9a86-b029c7bb6db6, ref: WDR-MM-MIMX4PGB-80IZ
at handler (../convex/transactions.ts:276:45)
```

### Root Cause

The webhook handler was trying to look up withdrawal transactions in the wrong database table:

1. **Withdrawals are stored in**: `walletTransactions` table
2. **Webhook was looking in**: `transactions` table
3. **Result**: Transaction not found error

### Data Flow Mismatch

```
WITHDRAWAL FLOW:
App.tsx
  ↓
wallet.controller.ts (withdrawToMobileMoney)
  ↓
debitWallet()  ← Creates entry in walletTransactions table
  ↓
STORED IN: walletTransactions ✓

WEBHOOK PROCESSING:
Lenco sends transfer.successful
  ↓
payments.controller.ts (handleWebhook)
  ↓
updateTransactionByLencoId()  ← Looks in transactions table ✗
  ↓
SEARCHES IN: transactions ✗

Result: Transaction not found!
```

## Solution

Created a new mutation `updateWalletTransactionByLencoId` that:
1. Looks up transactions in the `walletTransactions` table (correct table!)
2. Finds by Lenco ID (stored as `externalReference`)
3. Falls back to reference lookup if needed
4. Updates status and handles fund reversals
5. Creates notifications

### Changes Made

#### 1. New Convex Mutation: `updateWalletTransactionByLencoId`
**File**: `convex/wallet.ts`

```typescript
export const updateWalletTransactionByLencoId = mutation({
  args: {
    lencoId: v.string(),           // Lenco transaction ID
    reference: v.optional(v.string()), // Fallback lookup
    status: v.union(...),          // completed|failed|cancelled
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1: Try to find by Lenco ID (stored in externalReference)
    let transaction = await ctx.db
      .query("walletTransactions")
      .filter((q) => q.eq(q.field("externalReference"), args.lencoId))
      .first();

    // Step 2: Fallback to reference lookup
    if (!transaction && args.reference) {
      transaction = await ctx.db
        .query("walletTransactions")
        .withIndex("by_reference", (q) => q.eq("reference", args.reference))
        .first();
    }

    // Step 3: Update status
    await ctx.db.patch(transaction._id, {
      status: args.status,
      failureReason: args.failureReason,
      completedAt: args.status === "completed" ? now : undefined,
      updatedAt: now,
    });

    // Step 4: If failed, reverse funds (add back to wallet)
    if (args.status === "failed" || args.status === "cancelled") {
      // Credit wallet back
      // Create reversal transaction
      // Notify user
    }

    // Step 5: If successful, notify user
    if (args.status === "completed") {
      // Create success notification
    }

    return { success: true, transaction: transaction.reference };
  },
});
```

**Benefits:**
- Searches in the correct table (`walletTransactions`)
- Handles both successful and failed transfers
- Automatically reverses failed transfers (credits funds back)
- Creates user notifications
- Fallback lookup by reference for safety

#### 2. New ConvexService Method
**File**: `apps/api/src/convex/convex.service.ts`

```typescript
async updateWalletTransactionByLencoId(data: {
  lencoId: string;
  reference?: string;
  status: 'completed' | 'failed' | 'cancelled';
  failureReason?: string;
}): Promise<{ success: boolean; transaction: string }> {
  return await this.mutation('wallet:updateWalletTransactionByLencoId', data);
}
```

**Purpose:**
- Bridges between API and Convex
- Type-safe wrapper for webhook handler

#### 3. Updated Webhook Handler
**File**: `apps/api/src/payments/payments.controller.ts`

Changed from:
```typescript
// WRONG: Looks in transactions table
await this.convexService.updateTransactionByLencoId({
  lencoCollectionId: data.id,
  // ...
})
```

To:
```typescript
// CORRECT: Looks in walletTransactions table
await this.convexService.updateWalletTransactionByLencoId({
  lencoId: data.id,
  reference: data.reference,
  status: 'completed',
  failureReason: data.failureReason,
})
```

## How It Works Now

### For Successful Withdrawal (`transfer.successful`)

```
1. Withdrawal initiated by user
   ↓
2. debitWallet creates entry in walletTransactions table
   - reference: WDR-MM-MIMX4PGB-80IZ
   - externalReference: null (initially)
   - status: pending
   - amount: 50

3. Lenco API called
   ↓
4. Response includes Lenco transaction ID
   ↓
5. updateTransactionExternalReference updates the externalReference field
   - externalReference: 80044604-09d5-4e81-9a86-b029c7bb6db6

6. Lenco webhook arrives with transfer.successful
   ↓
7. updateWalletTransactionByLencoId searches:
   a) First: by externalReference (Lenco ID) - FOUND!
   b) Updates status: pending → completed
   c) Creates success notification

   ✅ User gets notification: "Your withdrawal has been completed"
```

### For Failed Withdrawal (`transfer.failed`)

```
1. User initiates withdrawal
   ↓
2. Transaction created in walletTransactions (status: pending)
   ↓
3. Lenco API call fails or transfer fails
   ↓
4. Lenco webhook arrives with transfer.failed
   ↓
5. updateWalletTransactionByLencoId:
   a) Finds transaction by Lenco ID
   b) Updates status: pending → failed
   c) REVERSES FUNDS:
      - Gets wallet record
      - Adds withdrawal amount back to balance
      - Creates reversal transaction
   d) Creates failure notification

   ✅ User gets notification: "Withdrawal failed. Funds returned to wallet"
   ✅ Funds automatically credited back
```

## Database Tables Used

### walletTransactions table (for withdrawals)
```
_id: Id
reference: string              // WDR-MM-MIMX4PGB-80IZ
externalReference: string      // Lenco ID (80044604-09d5-4e81-9a86-b029c7bb6db6)
status: pending|completed|failed|cancelled
amount: number                 // 50
source: withdrawal_mobile_money|withdrawal_bank
userId: Id
walletId: Id
createdAt: number
completedAt?: number
updatedAt: number
```

### transactions table (for top-ups/payments)
```
_id: Id
reference: string              // TOP-TIMESTAMP-RANDOM
lencoCollectionId: string      // Lenco collection ID
status: pending|processing|successful|failed
amount: number
userId: Id
createdAt: number
```

## Event Mapping

| Event | Where Stored | Handler | Action |
|-------|--------------|---------|--------|
| `collection.successful` | transactions | updateTransactionByLencoId | Credit wallet for top-up |
| `transfer.successful` | walletTransactions | updateWalletTransactionByLencoId | Mark withdrawal as complete, notify user |
| `transfer.failed` | walletTransactions | updateWalletTransactionByLencoId | Reverse withdrawal, credit funds, notify user |
| Other events | - | - | Skipped (not in whitelist) |

## Error Handling & Recovery

### Scenario 1: Transaction found on first try
```
✅ Attempt 1/3 to find wallet withdrawal
✅ Wallet withdrawal WDR-MM-MIMX4PGB-80IZ marked as completed
```

### Scenario 2: Transaction found on retry
```
⚠️ Withdrawal attempt 1/3 failed: (error)
⏸️ Wait 500ms...
✅ Attempt 2/3 to find wallet withdrawal
✅ Wallet withdrawal marked as completed
```

### Scenario 3: Transaction not found after all retries
```
❌ Final attempt failed for withdrawal WDR-MM-MIMX4PGB-80IZ: Transaction not found
(error logged, webhook still returns 200 to prevent Lenco retry)
```

## Files Modified

1. **convex/wallet.ts**
   - Added: `updateWalletTransactionByLencoId` mutation
   - Searches walletTransactions table
   - Handles status updates and fund reversals

2. **apps/api/src/convex/convex.service.ts**
   - Added: `updateWalletTransactionByLencoId` method
   - Type-safe wrapper for the mutation

3. **apps/api/src/payments/payments.controller.ts**
   - Updated: transfer.successful webhook handler
   - Now uses walletTransactionByLencoId instead of updateTransactionByLencoId
   - Improved logging for withdrawal processing

## Testing

### Test successful withdrawal webhook:
```bash
# Simulate Lenco sending transfer.successful
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-lenco-signature: (valid signature)" \
  -d '{
    "event": "transfer.successful",
    "data": {
      "id": "80044604-09d5-4e81-9a86-b029c7bb6db6",
      "reference": "WDR-MM-MIMX4PGB-80IZ",
      "status": "successful",
      "failureReason": null
    }
  }'
```

### Expected logs:
```
📩 Received Lenco webhook: transfer.successful
🔍 Looking up wallet withdrawal - lencoId: 80044604-09d5-4e81-9a86-b029c7bb6db6
📍 Attempt 1/3 to find wallet withdrawal
✅ Wallet withdrawal WDR-MM-MIMX4PGB-80IZ marked as completed
✅ Withdrawal transfer successful: WDR-MM-MIMX4PGB-80IZ
```

## Verification

After deployment, verify:

1. ✅ Withdrawal webhooks process without "Transaction not found" error
2. ✅ Transaction status updates from pending → completed
3. ✅ User receives success notification
4. ✅ Failed withdrawals reverse funds automatically
5. ✅ Logs show proper transaction lookup and update

## Migration Notes

No data migration needed - the changes are backward compatible:
- New mutation coexists with old one
- Old transaction table lookups still work for top-ups
- Wallet withdrawal lookups now use correct table

## Future Improvements

1. Consider adding transaction timeout handling (if webhook never arrives)
2. Add manual reconciliation tool for stuck transactions
3. Add retry mechanism for failed webhook processing
4. Consider caching Lenco transaction details for quick lookup
