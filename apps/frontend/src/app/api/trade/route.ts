import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// This endpoint proxies trade requests to angel-mcp's place_order tool
export async function POST(req: NextRequest) {
  const { exchange, symbol, action, quantity } = await req.json();

  // Map frontend action to MCP tool transactiontype
  const transactiontype = action.toUpperCase(); // BUY, SELL, HOLD
  if (!['BUY', 'SELL'].includes(transactiontype)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // You may want to fetch token or other details here
  try {
    const response = await axios.post(
      `${process.env.ANGEL_MCP_URL || 'http://localhost:8000'}/tools/place_order`,
      {
        exchange,
        tradingsymbol: symbol,
        transactiontype,
        quantity,
        ordertype: 'MARKET',
        // price, token, etc. can be added as needed
      }
    );
    return NextResponse.json(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return NextResponse.json({ error: err.response?.data?.error || err.message }, { status: 500 });
    }
    return NextResponse.json({ error: (err as Error).message || 'Unknown error' }, { status: 500 });
  }
}
