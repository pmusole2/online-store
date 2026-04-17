# Release Checklist

## Automated checks

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build --workspace=apps/api`
- `npm run build --workspace=apps/web`

## Manual critical flows

### Auth

- Sign up on mobile
- Sign in on mobile
- Confirm the user is created or updated in Convex

### Listing creation

- Create a listing on mobile with multiple uploaded images
- Create a listing on web with browser-based image uploads
- Confirm the saved product has real public Convex URLs

### Discovery

- Browse categories
- Search products
- Open product detail

### Checkout and wallet

- Add product to cart
- Select shipping
- Place order
- Top up wallet
- Withdraw from wallet

### Payments and webhook flow

- Trigger a payment through the deployed API
- Confirm webhook delivery reaches Railway
- Confirm handled events fail on invalid signatures
- Confirm successful events update transaction state correctly

### Order lifecycle

- Paid
- Processing
- Shipped
- Delivered
- Completed

### Conversation and dispute

- Start a conversation
- Send a message
- Create a dispute
- Review dispute details and chat flow
