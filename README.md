# AI-Powered Personal Finance & Subscription Manager

A full-stack personal finance management application built with Next.js, TypeScript, MongoDB, and Google's Gemini AI. Import transactions, detect subscriptions, visualize spending patterns, and get AI-powered insights on your financial habits.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange?style=flat&logo=google)

## 🚀 Features

### Core Functionality
- **CSV Transaction Import**: Upload bank statements in CSV format (date, amount, merchant, description)
- **CSV Export**: Download all transactions as CSV for backup or analysis
- **Dashboard Overview**: Real-time financial summary with income, expenses, and net worth
- **Spending Visualization**: Interactive charts showing top merchants and spending patterns
- **Smart Subscription Detection**: Automatically identifies recurring payments (weekly, monthly, yearly)
- **AI-Powered Insights**: Get natural language explanations of spending patterns using Google's Gemini AI
- **Alerts System**: Notifications for upcoming subscription renewals and unusual spending patterns

### Technical Highlights
- **Full-Stack TypeScript**: Type-safe codebase with Next.js App Router
- **MongoDB Integration**: Scalable data storage with MongoDB Atlas
- **AI Integration**: LLM-powered financial analysis using Gemini API
- **Modern UI**: Dark theme with Tailwind CSS and responsive design
- **RESTful API**: Clean API routes for all backend operations

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)
- Google AI Studio account for Gemini API key (free tier available)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bsahil979/Ai-finance-manager.git
   cd Ai-finance-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   MONGODB_DB=ai-finance-manager
   GEMINI_API_KEY=your_gemini_api_key
   ```

   - **MongoDB URI**: Get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Create cluster → Connect → Get connection string
   - **GEMINI_API_KEY**: Get from [Google AI Studio](https://aistudio.google.com) → Get API Key

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ai-finance-manager/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── transactions/
│   │   │   ├── subscriptions/
│   │   │   ├── dashboard/
│   │   │   ├── ai/
│   │   │   └── alerts/
│   │   ├── dashboard/        # Dashboard page
│   │   ├── transactions/     # Transactions page
│   │   ├── subscriptions/    # Subscriptions page
│   │   ├── alerts/           # Alerts page
│   │   └── page.tsx          # Landing page
│   ├── lib/
│   │   └── db/
│   │       └── mongo.ts      # MongoDB connection
│   └── models/               # TypeScript interfaces
├── public/                   # Static assets
├── .env                      # Environment variables (not committed)
└── package.json
```

## 🎯 Usage

### 1. Import Transactions

1. Go to **Transactions** page
2. Prepare a CSV file with columns: `date, amount, merchant, description`
   ```csv
   date,amount,merchant,description
   2025-01-01,-9.99,Spotify,Spotify subscription
   2025-01-02,-15.50,Starbucks,Coffee
   2025-01-05,2000,Company,Salary
   ```
3. Click **Choose File** and upload your CSV
4. Click **Upload CSV** to import

### 2. View Dashboard

- See financial overview with income, expenses, and net worth
- View spending breakdown chart by merchant
- Get AI-powered insights by clicking **"Explain my spending"**

### 3. Detect Subscriptions

1. Go to **Subscriptions** page
2. Click **"Detect Subscriptions"**
3. The system analyzes your transactions for recurring patterns
4. View detected subscriptions with renewal dates

### 4. Check Alerts

1. Go to **Alerts** page
2. Click **"Generate Alerts"** to check for:
   - Upcoming subscription renewals (within 7 days)
   - Unusual spending patterns (2x increase vs last month)

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini 1.5 (via REST API)
- **Deployment**: Vercel-ready (or AWS/GCP)

## 🔧 API Endpoints

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/upload` - Upload CSV file
- `GET /api/transactions/export` - Export all transactions as CSV

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions/detect` - Detect subscriptions from transactions
- `DELETE /api/subscriptions?id={id}` - Delete subscription

### Dashboard
- `GET /api/dashboard/overview` - Get financial overview
- `GET /api/dashboard/spending-breakdown` - Get spending by merchant

### AI
- `GET /api/ai/explain-spending` - Get AI-powered spending analysis

### Alerts
- `GET /api/alerts` - List all alerts
- `POST /api/alerts/generate` - Generate new alerts
- `PATCH /api/alerts?id={id}` - Update alert (mark as read)

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `GEMINI_API_KEY`
4. Deploy!

### Deploy to AWS/GCP

- Use Docker or serverless functions (Lambda/Cloud Run)
- Set environment variables in your cloud provider's console
- MongoDB Atlas works from any cloud provider

## 📝 CSV Format

Your CSV file should have these columns (header row required):

```csv
date,amount,merchant,description
2025-01-01,-9.99,Spotify,Spotify subscription
2025-01-02,-15.50,Starbucks,Coffee
2025-01-05,2000,Company,Salary
```

- **date**: ISO format (YYYY-MM-DD) or any parseable date
- **amount**: Positive for income, negative for expenses
- **merchant**: Store/service name (optional)
- **description**: Transaction description (optional)

## 🎨 Features in Detail

### AI-Powered Insights
- Analyzes your spending patterns using Google's Gemini AI
- Provides natural language explanations
- Suggests concrete actions to save money
- Identifies unusual patterns and trends

### Subscription Detection
- Automatically detects recurring payments
- Supports weekly, monthly, and yearly cycles
- Calculates next renewal dates
- Tracks subscription spending

### Alerts System
- **Renewal Alerts**: Notifies you 7 days before subscription renewals
- **Unusual Spending**: Detects when spending on a merchant doubles compared to last month

## 🤝 Contributing

This is a portfolio project, but suggestions and improvements are welcome!

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Sahil Belchada**
- Portfolio project demonstrating full-stack development skills
- Built with modern technologies and best practices

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database solution
- Google for Gemini AI API
- Tailwind CSS for the styling system

---

**Note**: This is a portfolio project. For production use, consider adding authentication, user management, and additional security measures.
