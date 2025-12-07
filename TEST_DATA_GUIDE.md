# LEDG - Test Data Guide

## Sample CSV for Transaction Import

Create a file named `test-transactions.csv` with the following content:

```csv
date,amount,merchant,description
2025-01-15,-500.00,Amazon,Online purchase - Electronics
2025-01-14,-50.00,Starbucks,Coffee and snacks
2025-01-13,-1200.00,Rent,Monthly rent payment
2025-01-12,-299.99,Netflix,Monthly subscription
2025-01-11,-89.99,Spotify,Monthly subscription
2025-01-10,5000.00,Salary,Monthly salary deposit
2025-01-09,-150.00,Grocery Store,Weekly groceries
2025-01-08,-45.00,Uber,Transportation
2025-01-07,-200.00,Gas Station,Fuel
2025-01-06,-350.00,Restaurant,Dinner with friends
2025-01-05,-99.99,Amazon Prime,Annual subscription
2025-01-04,-25.00,Starbucks,Coffee
2025-01-03,-180.00,Phone Bill,Monthly phone bill
2025-01-02,-500.00,Electricity Bill,Monthly electricity
2025-01-01,-2000.00,Credit Card Payment,Monthly payment
```

## Quick Test Scenarios

### Scenario 1: New User Setup
1. Register new account
2. Create 2-3 accounts (Checking, Savings, Credit Card)
3. Import CSV transactions
4. Detect subscriptions
5. View dashboard

### Scenario 2: Budget Management
1. Create budgets for:
   - Food & Dining: ₹2000/month
   - Shopping: ₹5000/month
   - Bills & Utilities: ₹3000/month
2. Add transactions that exceed budgets
3. Check alerts for budget exceeded

### Scenario 3: Goal Tracking
1. Create goal: "Emergency Fund" - Target ₹50,000
2. Add transactions that contribute to goal
3. Update goal progress manually
4. View goal on dashboard

### Scenario 4: Multi-Account Management
1. Create 3 accounts with different balances
2. Transfer ₹1000 from Checking to Savings
3. Add transactions to different accounts
4. Filter transactions by account
5. Verify account balances are correct

### Scenario 5: Bills Management
1. Create 5 bills:
   - Electricity (₹500, due in 5 days)
   - Internet (₹800, due in 10 days)
   - Credit Card (₹2000, overdue)
   - Rent (₹1200, due in 3 days)
   - Phone (₹300, paid)
2. Pay 2 bills (one with transaction, one without)
3. Filter bills by status
4. View bills summary

### Scenario 6: Recurring Transactions
1. Create recurring transactions:
   - Salary: ₹5000/month (Income)
   - Netflix: ₹299/month (Expense)
   - Gym: ₹500/month (Expense)
2. View cash flow projection
3. Toggle one recurring transaction inactive
4. Edit recurring transaction

### Scenario 7: Reports
1. Generate monthly report for current month
2. Generate yearly report
3. Export reports to CSV
4. Verify data accuracy

## Test Accounts to Create

### Account 1: Main Checking
- Type: Checking
- Balance: ₹25,000
- Currency: INR

### Account 2: Savings Account
- Type: Savings
- Balance: ₹50,000
- Currency: INR

### Account 3: Credit Card
- Type: Credit Card
- Balance: -₹5,000 (negative for credit card)
- Currency: INR

### Account 4: Cash Wallet
- Type: Cash
- Balance: ₹2,000
- Currency: INR

## Test Budgets to Create

1. **Food & Dining**: ₹3,000/month
2. **Shopping**: ₹5,000/month
3. **Bills & Utilities**: ₹4,000/month
4. **Transportation**: ₹2,000/month
5. **Entertainment**: ₹1,500/month

## Test Goals to Create

1. **Emergency Fund**
   - Category: Emergency
   - Target: ₹50,000
   - Current: ₹10,000
   - Target Date: 2025-12-31

2. **Vacation Fund**
   - Category: Vacation
   - Target: ₹30,000
   - Current: ₹5,000
   - Target Date: 2025-06-30

3. **New Car**
   - Category: Car
   - Target: ₹500,000
   - Current: ₹50,000
   - Target Date: 2026-12-31

## Common Test Cases

### Positive Test Cases
- ✅ Valid registration
- ✅ Valid login
- ✅ Create account with valid data
- ✅ Add transaction with valid data
- ✅ Import valid CSV
- ✅ Filter transactions correctly
- ✅ Transfer money between accounts
- ✅ Create and pay bills
- ✅ Generate reports

### Negative Test Cases
- ❌ Register with existing email (should show error)
- ❌ Login with wrong password (should show error)
- ❌ Create account without name (should show validation error)
- ❌ Transfer more money than available (should show error)
- ❌ Import invalid CSV format (should show error)
- ❌ Access protected route without login (should redirect)

### Edge Cases
- 🔍 Empty state (no transactions, no accounts)
- 🔍 Very large amounts (₹1,000,000+)
- 🔍 Very small amounts (₹0.01)
- 🔍 Special characters in names/descriptions
- 🔍 Very long descriptions (500+ characters)
- 🔍 Future dates
- 🔍 Past dates (very old transactions)

## Browser Testing Checklist

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile browser (Chrome/Firefox on phone)

## Performance Testing

- [ ] Load dashboard with 100+ transactions
- [ ] Load transactions page with 1000+ transactions
- [ ] Test CSV import with 500+ rows
- [ ] Test filtering with large dataset
- [ ] Check page load times (< 3 seconds)

## Security Testing

- [ ] Try accessing other user's data (should fail)
- [ ] Try SQL injection in search fields
- [ ] Try XSS in input fields
- [ ] Verify authentication tokens are secure
- [ ] Check that passwords are not visible in network requests

## API Testing (Optional)

You can also test API endpoints directly using:
- Postman
- curl commands
- Browser DevTools Network tab

Example curl commands:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get transactions (requires session cookie)
curl http://localhost:3000/api/transactions \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

---

**Note**: Always use test data. Don't use real financial information during testing.


