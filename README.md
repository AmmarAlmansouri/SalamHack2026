# Barq Transfer

Barq Transfer is a payment gateway built to help freelancers and startups in the Arab region receive international payments faster, with fewer fees, and without depending on difficult international banking access.

## The Problem

Freelancers and startups in the Arab region often face a "commission massacre" when receiving international payments. Traditional wire transfers can reduce the final received amount by up to 30% because of intermediary bank fees, currency conversion costs, and hidden charges.

These payments can also take several days to arrive, and many founders or freelancers face serious difficulty opening international bank accounts in their country. This creates a major barrier for people who work with global clients but need fast, reliable access to their money.

## The Solution

Barq Transfer allows freelancers to issue professional payment links and receive payments through:

- Visa
- Mastercard
- Crypto wallet payments

Behind the scenes, Barq Transfer converts received funds into stablecoins such as USDT or USDC. This gives users faster settlement, lower costs, and better liquidity compared with traditional international transfers.

The main goals are:

- Maximum Speed: reduce payment delays from days to near-instant settlement.
- Minimal Fees: avoid unnecessary intermediary banking fees.
- Instant Liquidity: give users fast access to stable digital assets.
- Professional Invoicing: help freelancers send clean payment links to clients.

## Tech Stack

- Frontend: React with Vite
- Backend: Express.js
- Database: MySQL
- Authentication: JWT
- Payments: Triple-A integration / mock Triple-A test server
- Email: SMTP with Nodemailer

## Project Structure

```text
Crypto Wallet App/
├── Backend/
│   ├── app.js
│   ├── database.sql
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Main Features

- User signup and login
- Email confirmation
- Password reset flow
- Account profile management
- Crypto wallet address management
- Payment link creation
- Public payment page for clients
- Transaction history
- Payment success, cancel, and status pages
- Triple-A payment and payout integration
- Webhook handling for payment updates

## Requirements

Install these before running the project:

- Node.js
- npm or yarn
- MySQL server

## Database Setup

Create a MySQL database:

```sql
CREATE DATABASE barq_transfer;
```

Import the schema:

```bash
mysql -u root -p barq_transfer < Backend/database.sql
```

You can choose another database name, but it must match the `DB_NAME` value in the backend `.env` file.

## Backend Setup

Go to the backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside `Backend/`:

```env
PORT=3000
APP_NAME=Barq Transfer
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=barq_transfer

JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=replace_with_another_strong_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

TRIPLEA_BASE_URL=http://localhost:4000/v1
TRIPLEA_API_KEY=your_triplea_api_key
TRIPLEA_API_SECRET=your_triplea_api_secret
TRIPLEA_MERCHANT_ID=your_triplea_merchant_id
```

Run the backend server:

```bash
node app.js
```

The backend will run on:

```text
http://localhost:3000
```

## Optional: Run the Triple-A Mock Server

The backend includes a mock Triple-A server for local payment testing.

In a second terminal:

```bash
cd Backend
node test-triplea-server.js
```

Then keep this value in your backend `.env` file:

```env
TRIPLEA_BASE_URL=http://localhost:4000/v1
```

The mock dashboard runs on:

```text
http://localhost:4000/dashboard
```

## Frontend Setup

Open a new terminal and go to the frontend folder:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend development server:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

The frontend currently sends API requests to:

```text
http://localhost:3000/api
```

If you change the backend port, update the `API_BASE` value in:

```text
Frontend/src/app/api.ts
```

## How to Run the Full Project

Use three terminals:

Terminal 1, backend:

```bash
cd Backend
node app.js
```

Terminal 2, frontend:

```bash
cd Frontend
npm run dev
```

Terminal 3, optional payment mock server:

```bash
cd Backend
node test-triplea-server.js
```

Then open:

```text
http://localhost:5173
```

## Important Notes

- Make sure MySQL is running before starting the backend.
- Make sure the database tables are created using `Backend/database.sql`.
- Keep `.env` files private and never commit real API keys, SMTP passwords, JWT secrets, or merchant credentials.
- For production, use strong secrets, HTTPS URLs, secure cookies if added later, and real payment provider credentials.
- The backend CORS configuration allows the frontend URL defined in `FRONTEND_URL`.
- Webhooks require a public backend URL in production, so `APP_URL` must point to the deployed backend server.

## Build Frontend for Production

From the `Frontend/` folder:

```bash
npm run build
```

The production build will be generated in:

```text
Frontend/dist
```

## API Overview

The backend exposes these main route groups:

- `/api/auth` for signup, login, email confirmation, and password reset.
- `/api/account` for profile and wallet address management.
- `/api/links` for payment link creation and payment actions.
- `/api/transactions` for transaction history.
- `/api/webhooks` for payment provider webhook events.

## License

This project was created as a prototype for Barq Transfer.
