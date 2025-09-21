

# Stock Pilot Frontend

This is a modern trading dashboard built with [Next.js](https://nextjs.org), React, and Tailwind CSS. The UI is designed for fast, intuitive stock trading and market analysis, integrating directly with the Angel One MCP backend via HTTP APIs.

**Note:** Currently, only PAPER trading mode is supported. All trades and positions are simulated; no live orders are placed with Angel One.

## UI Features

- **Trade Dashboard:** Place buy/sell orders, view live and paper trades, and track open positions.
- **Market Data:** Instantly fetch Last Traded Price (LTP) and historical candle data for any symbol and interval.
- **Symbol Search:** Quickly search and select trading symbols with guidance for correct formats.
- **Responsive Design:** Optimized for desktop and mobile, with sticky navigation and animated tickers.
- **Order Modal:** Clean modal for entering order details, quantity, and type (MARKET/LIMIT).
- **Session Management:** Login/logout, session sync, and error feedback.
- **Paper Trading:** Simulate trades and positions without financial risk.

## Backend APIs Used

All trading and market data is powered by the Angel MCP HTTP server. The frontend uses the following endpoints:

### POST Endpoints

- `/login` — Login to Angel One
- `/logout` — Logout from Angel One
- `/search_scrip` — Search for a scrip
	- `{ "exchange": "NSE", "tradingSymbol": "RELIANCE" }`
- `/set_mode` — Set trading mode
	- `{ "new_mode": "PAPER" }`
- `/place_order` — Place an order
	- `{ "exchange": "NSE", "tradingsymbol": "RELIANCE", "transactiontype": "BUY", "quantity": 10, "ordertype": "MARKET", "price": null }`
- `/ltp` — Get last traded price
	- `{ "exchange": "NSE", "tradingsymbol": "RELIANCE" }`
- `/candles` — Get candle data
	- `{ "exchange": "NSE", "tradingsymbol": "RELIANCE", "interval": "ONE_MINUTE", "from_date": "2025-09-13 09:15", "to_date": "2025-09-13 15:30" }`

### GET Endpoints

- `/list_orders` — List all orders
- `/list_positions` — List all positions

All endpoints return JSON responses. For POST endpoints, send a JSON body as shown above.

## Getting Started

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
