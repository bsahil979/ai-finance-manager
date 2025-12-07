# LEDG - Manual Testing Checklist

## Prerequisites
- [ ] MongoDB connection is configured (check `.env` file)
- [ ] GEMINI_API_KEY is set in `.env` (for AI features)
- [ ] Application is running (`npm run dev`)
- [ ] Browser console is open (F12) to check for errors

---

## 1. Authentication & User Management

### Registration
- [ ] Navigate to `/register`
- [ ] Fill in name, email, password (min 8 characters)
- [ ] Submit registration
- [ ] Verify redirect to dashboard or login
- [ ] Check browser console for errors

### Login
- [ ] Navigate to `/login`
- [ ] Enter registered email and password
- [ ] Submit login
- [ ] Verify redirect to dashboard
- [ ] Check that user name/email appears in header

### Logout
- [ ] Click "Logout" button in header
- [ ] Verify redirect to home page
- [ ] Verify user is logged out (no user name in header)

### Profile Management
- [ ] Navigate to `/profile`
- [ ] **Edit Profile Tab:**
  - [ ] Update name
  - [ ] Update email
  - [ ] Save changes
  - [ ] Verify changes are saved
- [ ] **Change Password Tab:**
  - [ ] Enter current password
  - [ ] Enter new password
  - [ ] Confirm new password
  - [ ] Save changes
  - [ ] Verify password is changed (try logging in with new password)
- [ ] **Delete Account Tab:**
  - [ ] Enter password to confirm
  - [ ] Click delete (⚠️ Only test if you have test data)
  - [ ] Verify account is deleted

---

## 2. Accounts Management

### Create Account
- [ ] Navigate to `/accounts`
- [ ] Click "Add Account"
- [ ] Fill in:
  - [ ] Account name (e.g., "Main Checking")
  - [ ] Type (checking, savings, credit, cash, investment, other)
  - [ ] Initial balance
  - [ ] Currency (INR, USD, EUR, GBP)
- [ ] Submit
- [ ] Verify account appears in list
- [ ] Verify total balance is calculated correctly

### Edit Account
- [ ] Click "Edit" on an account
- [ ] Modify name, type, balance, or currency
- [ ] Save changes
- [ ] Verify changes are reflected

### Transfer Money
- [ ] Click "Transfer Money" button
- [ ] Select "From Account"
- [ ] Select "To Account" (different from source)
- [ ] Enter amount
- [ ] Add description (optional)
- [ ] Submit transfer
- [ ] Verify both account balances are updated correctly
- [ ] Check transactions list for transfer entries (should see two: one debit, one credit)

### Delete Account
- [ ] Click "Delete" on an account
- [ ] Confirm deletion
- [ ] Verify account is removed from list
- [ ] Verify total balance is recalculated

---

## 3. Transactions

### CSV Import
- [ ] Navigate to `/transactions`
- [ ] Prepare a CSV file with columns: `date`, `amount`, `merchant`, `description`
- [ ] Example CSV content:
  ```csv
  date,amount,merchant,description
  2025-01-15,-500.00,Amazon,Online purchase
  2025-01-14,-50.00,Starbucks,Coffee
  2025-01-10,5000.00,Salary,Monthly salary
  ```
- [ ] Click "Choose File" and select CSV
- [ ] Click "Upload CSV"
- [ ] Verify success message
- [ ] Verify transactions appear in the table

### View Transactions
- [ ] Verify transactions are displayed in a table
- [ ] Check columns: Date, Account, Merchant, Description, Category, Amount, Actions
- [ ] Verify amounts are formatted correctly (₹ symbol)
- [ ] Verify income (positive) is green, expenses (negative) are red

### Filter Transactions
- [ ] **Search:**
  - [ ] Type merchant name in search box
  - [ ] Verify filtered results
- [ ] **Account Filter:**
  - [ ] Select an account from dropdown
  - [ ] Verify only transactions for that account are shown
- [ ] **Category Filter:**
  - [ ] Select a category
  - [ ] Verify filtered results
- [ ] **Type Filter:**
  - [ ] Select "Income" or "Expense"
  - [ ] Verify filtered results
- [ ] **Merchant Filter:**
  - [ ] Select a merchant
  - [ ] Verify filtered results
- [ ] **Quick Filters:**
  - [ ] Click "This Month" - verify date range is set
  - [ ] Click "Last 7 Days" - verify date range is set
  - [ ] Click "Last 30 Days" - verify date range is set
  - [ ] Click "Income Only" - verify only income shown
  - [ ] Click "Expenses Only" - verify only expenses shown
  - [ ] Click "Clear All" - verify all filters reset
- [ ] **Advanced Filters:**
  - [ ] Click "Show Advanced Filters"
  - [ ] Set min amount
  - [ ] Set max amount
  - [ ] Set start date
  - [ ] Set end date
  - [ ] Verify filtered results

### Edit Transaction
- [ ] Click "Edit" on a transaction
- [ ] Modify date, merchant, description, category, or amount
- [ ] Use "✨" button to get AI category suggestion (requires GEMINI_API_KEY)
- [ ] Click "Save"
- [ ] Verify changes are saved
- [ ] Click "Cancel" - verify edit mode closes without saving

### Delete Transaction
- [ ] Click "Delete" on a transaction
- [ ] Confirm deletion
- [ ] Verify transaction is removed from list

### Export CSV
- [ ] Click "Export as CSV" button
- [ ] Verify CSV file downloads
- [ ] Open downloaded file
- [ ] Verify all transactions are included

### Link Transaction to Account
- [ ] Create a new transaction manually (if possible) or edit existing
- [ ] Select an account
- [ ] Save transaction
- [ ] Verify account balance is updated
- [ ] Verify transaction shows account name in table

---

## 4. Recurring Transactions (Transactions Tab)

### Switch to Recurring Tab
- [ ] Navigate to `/transactions`
- [ ] Click "Recurring Transactions" tab
- [ ] Verify tab switches correctly

### Create Recurring Transaction
- [ ] Click "+ New Recurring"
- [ ] Fill in form:
  - [ ] Name (e.g., "Netflix Subscription")
  - [ ] Type (Income/Expense)
  - [ ] Description (optional)
  - [ ] Amount
  - [ ] Frequency (Daily, Weekly, Monthly, Yearly)
  - [ ] Category (optional)
  - [ ] Merchant (optional)
  - [ ] Start Date
  - [ ] End Date (optional)
- [ ] Submit
- [ ] Verify recurring transaction appears in list

### View Recurring Transactions
- [ ] Verify table shows: Name, Type, Amount, Frequency, Next Occurrence, Status, Actions
- [ ] Verify amounts are formatted correctly
- [ ] Verify next occurrence date is displayed

### Edit Recurring Transaction
- [ ] Click "Edit" on a recurring transaction
- [ ] Modify fields
- [ ] Save
- [ ] Verify changes are saved

### Toggle Active/Inactive
- [ ] Click "Pause" on an active recurring transaction
- [ ] Verify status changes to "Inactive"
- [ ] Click "Activate" on inactive transaction
- [ ] Verify status changes to "Active"

### Delete Recurring Transaction
- [ ] Click "Delete" on a recurring transaction
- [ ] Confirm deletion
- [ ] Verify it's removed from list

---

## 5. Subscriptions

### Detect Subscriptions
- [ ] Navigate to `/subscriptions`
- [ ] Ensure you have transactions imported first
- [ ] Click "Detect Subscriptions" button
- [ ] Wait for detection to complete
- [ ] Verify success message
- [ ] Verify detected subscriptions appear in table

### View Subscriptions
- [ ] Verify table shows: Merchant, Amount, Billing Cycle, Next Renewal, Actions
- [ ] Verify amounts are formatted correctly
- [ ] Verify billing cycles are displayed

### Remove Subscription
- [ ] Click "Remove" on a subscription
- [ ] Confirm removal
- [ ] Verify subscription is removed

---

## 6. Bills (Subscriptions Tab)

### Switch to Bills Tab
- [ ] Navigate to `/subscriptions`
- [ ] Click "Bills" tab
- [ ] Verify tab switches correctly

### Create Bill
- [ ] Click "+ New Bill" button
- [ ] Fill in form:
  - [ ] Name (e.g., "Electricity Bill")
  - [ ] Amount
  - [ ] Due Date
  - [ ] Category
  - [ ] Is Recurring (checkbox)
  - [ ] Recurring Frequency (if recurring)
  - [ ] Account (optional)
  - [ ] Notes (optional)
- [ ] Submit
- [ ] Verify bill appears in list

### View Bills
- [ ] Verify bills are categorized: Upcoming, Overdue, Paid
- [ ] Verify summary cards show correct totals
- [ ] Verify table shows: Name, Amount, Due Date, Days Until Due, Status, Actions

### Filter Bills
- [ ] Click filter buttons: "All", "Upcoming", "Overdue", "Paid"
- [ ] Verify bills are filtered correctly

### Pay Bill
- [ ] Click "Pay" on an unpaid bill
- [ ] Choose to create transaction (checkbox)
- [ ] Select account (if available)
- [ ] Submit
- [ ] Verify bill status changes to "Paid"
- [ ] Verify paid date is set
- [ ] If transaction created, verify it appears in transactions list

### Edit Bill
- [ ] Click "Edit" on a bill
- [ ] Modify fields
- [ ] Save
- [ ] Verify changes are saved

### Delete Bill
- [ ] Click "Delete" on a bill
- [ ] Confirm deletion
- [ ] Verify bill is removed

---

## 7. Budgets

### Create Budget
- [ ] Navigate to `/budgets`
- [ ] Click "Create Budget" or "+ New Budget"
- [ ] Fill in:
  - [ ] Category
  - [ ] Amount (budget limit)
  - [ ] Period (Monthly, Weekly, Yearly)
- [ ] Submit
- [ ] Verify budget appears in list

### View Budgets
- [ ] Verify budgets show: Category, Budget Amount, Spent, Remaining, Progress Bar
- [ ] Verify progress bars are accurate
- [ ] Verify colors (green for under budget, red for over budget)

### Edit Budget
- [ ] Click "Edit" on a budget
- [ ] Modify amount or period
- [ ] Save
- [ ] Verify changes are saved

### Delete Budget
- [ ] Click "Delete" on a budget
- [ ] Confirm deletion
- [ ] Verify budget is removed

---

## 8. Goals

### Create Goal
- [ ] Navigate to `/goals`
- [ ] Click "Create Goal" or "+ New Goal"
- [ ] Fill in:
  - [ ] Name (e.g., "Emergency Fund")
  - [ ] Category (Emergency, Vacation, Car, House, Education, Other)
  - [ ] Target Amount
  - [ ] Current Amount
  - [ ] Target Date (optional)
- [ ] Submit
- [ ] Verify goal appears in list

### View Goals
- [ ] Verify goals show: Name, Category, Progress Bar, Target Amount, Current Amount, Status
- [ ] Verify progress bars are accurate
- [ ] Verify completed goals are marked

### Edit Goal
- [ ] Click "Edit" on a goal
- [ ] Update current amount or other fields
- [ ] Save
- [ ] Verify changes are saved
- [ ] Verify progress bar updates

### Delete Goal
- [ ] Click "Delete" on a goal
- [ ] Confirm deletion
- [ ] Verify goal is removed

---

## 9. Alerts

### View Alerts
- [ ] Navigate to `/alerts`
- [ ] Verify alerts are displayed (if any)
- [ ] Check for:
  - [ ] Subscription renewal alerts
  - [ ] Budget exceeded alerts
  - [ ] Unusual spending alerts

### Generate Alerts
- [ ] Click "Generate Alerts" button (if available)
- [ ] Wait for processing
- [ ] Verify alerts are generated

### Dismiss Alert
- [ ] Click dismiss/close on an alert
- [ ] Verify alert is removed

---

## 10. Reports

### View Monthly Report
- [ ] Navigate to `/reports`
- [ ] Select "Monthly" report type
- [ ] Select year and month
- [ ] Click "Generate Report"
- [ ] Verify report displays:
  - [ ] Summary (Income, Expenses, Net)
  - [ ] Monthly breakdown chart
  - [ ] Top categories
  - [ ] Top merchants

### View Yearly Report
- [ ] Select "Yearly" report type
- [ ] Select year
- [ ] Click "Generate Report"
- [ ] Verify report displays:
  - [ ] Summary
  - [ ] Monthly breakdown chart
  - [ ] Top categories
  - [ ] Top merchants

### Export Report
- [ ] Generate a report
- [ ] Click "Export CSV" button
- [ ] Verify CSV file downloads
- [ ] Open file and verify data

---

## 11. Dashboard

### View Dashboard
- [ ] Navigate to `/dashboard`
- [ ] Verify all sections load:
  - [ ] Financial Summary (Net Worth, Income, Expenses)
  - [ ] Spending Breakdown (by category)
  - [ ] Top Spending by Merchant
  - [ ] AI Insights (if GEMINI_API_KEY is set)
  - [ ] Goals Summary
  - [ ] Upcoming Subscriptions
  - [ ] Recent Transactions
  - [ ] Monthly Comparison
  - [ ] Cash Flow Projection

### Detailed Review Section
- [ ] Click "Detailed Review" button
- [ ] Verify section expands
- [ ] Verify charts are displayed:
  - [ ] Category Pie Chart
  - [ ] Merchant Pie Chart
  - [ ] Spending Trends Line Chart
  - [ ] Monthly Comparison Bar Chart
- [ ] Click again to collapse
- [ ] Verify section collapses

### AI Insights
- [ ] Click "Explain my spending" button (if available)
- [ ] Wait for AI response
- [ ] Verify insights are displayed
- [ ] Check browser console for errors (if GEMINI_API_KEY is missing)

### Quick Actions
- [ ] Click "View Transactions" link
- [ ] Verify redirects to transactions page
- [ ] Click "Manage Recurring" link
- [ ] Verify redirects to recurring transactions tab
- [ ] Click "View Subscriptions" link
- [ ] Verify redirects to subscriptions page

---

## 12. Navigation & UI

### Header Navigation
- [ ] Verify all links work:
  - [ ] Dashboard
  - [ ] Transactions
  - [ ] Subscriptions
  - [ ] Alerts
  - [ ] Budgets
  - [ ] Goals
  - [ ] Reports
  - [ ] Accounts
  - [ ] Profile
- [ ] Verify LEDG logo links to home page
- [ ] Verify user name/email is displayed
- [ ] Verify logout button works

### Responsive Design
- [ ] Resize browser window
- [ ] Verify layout adapts on mobile/tablet sizes
- [ ] Verify tables are scrollable on small screens
- [ ] Verify forms are usable on mobile

### Error Handling
- [ ] Try accessing protected routes without login (should redirect)
- [ ] Try invalid form submissions
- [ ] Verify error messages are displayed
- [ ] Check browser console for JavaScript errors

---

## 13. Data Integrity

### Account Balance Updates
- [ ] Create transaction linked to account
- [ ] Verify account balance decreases (for expense) or increases (for income)
- [ ] Delete transaction
- [ ] Verify account balance reverts
- [ ] Transfer money between accounts
- [ ] Verify both balances update correctly

### Transaction Consistency
- [ ] Create recurring transaction
- [ ] Verify it appears in recurring transactions list
- [ ] Pay a bill with transaction creation
- [ ] Verify transaction appears in transactions list
- [ ] Verify account balance is updated

---

## 14. Currency Formatting

### Verify Currency Display
- [ ] Check all pages display currency in INR (₹)
- [ ] Verify amounts are formatted correctly (e.g., ₹1,234.56)
- [ ] Check accounts with different currencies display correctly

---

## 15. Performance & Loading States

### Loading Indicators
- [ ] Verify loading spinners appear during data fetch
- [ ] Verify "Loading..." messages are shown
- [ ] Verify no blank screens during loading

### Error States
- [ ] Disconnect MongoDB (or use invalid connection)
- [ ] Try to load data
- [ ] Verify error messages are displayed
- [ ] Verify application doesn't crash

---

## Common Issues to Check

### Browser Console Errors
- [ ] Open browser console (F12)
- [ ] Check for:
  - [ ] JavaScript errors
  - [ ] Network errors (404, 500, etc.)
  - [ ] CORS errors
  - [ ] Authentication errors

### Network Tab
- [ ] Open Network tab in DevTools
- [ ] Check API requests:
  - [ ] Verify requests are successful (200 status)
  - [ ] Check request/response payloads
  - [ ] Verify authentication headers are sent

### Database Verification
- [ ] Connect to MongoDB
- [ ] Verify data is being saved:
  - [ ] Users collection
  - [ ] Transactions collection
  - [ ] Accounts collection
  - [ ] Subscriptions collection
  - [ ] Bills collection
  - [ ] Budgets collection
  - [ ] Goals collection

---

## Testing Tips

1. **Use Test Data**: Create test accounts, transactions, and other data to thoroughly test features
2. **Test Edge Cases**: 
   - Empty states (no data)
   - Large amounts
   - Special characters in names
   - Very long descriptions
3. **Test User Flow**: Complete a full workflow (register → add account → add transaction → view dashboard)
4. **Test on Different Browsers**: Chrome, Firefox, Edge, Safari
5. **Test Mobile View**: Use browser DevTools device emulation
6. **Check Accessibility**: Keyboard navigation, screen reader compatibility

---

## Notes Section

Use this space to document any issues found:

### Issues Found:
1. 
2. 
3. 

### Suggestions:
1. 
2. 
3. 

---

**Last Updated**: [Date]
**Tester**: [Your Name]
**Application Version**: LEDG v1.0


