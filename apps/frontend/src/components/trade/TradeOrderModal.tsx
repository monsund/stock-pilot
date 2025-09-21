import React from 'react';

interface TradeOrderModalProps {
  show: boolean;
  submitting: boolean;
  orderForm: {
    exchange: string;
    tradingsymbol: string;
    transactiontype: 'BUY' | 'SELL';
    quantity: number;
    ordertype: string;
    price: string;
  };
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const TradeOrderModal: React.FC<TradeOrderModalProps> = ({ show, submitting, orderForm, onClose, onChange, onSubmit }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Place {orderForm.transactiontype} Order</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Exchange</label>
            <select name="exchange" value={orderForm.exchange} onChange={onChange} className="w-full rounded border px-2 py-1">
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Symbol</label>
            <input name="tradingsymbol" value={orderForm.tradingsymbol} onChange={onChange} className="w-full rounded border px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Transaction Type</label>
            <select name="transactiontype" value={orderForm.transactiontype} onChange={onChange} className="w-full rounded border px-2 py-1">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input name="quantity" type="number" min="1" value={orderForm.quantity} onChange={onChange} className="w-full rounded border px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Order Type</label>
            <select name="ordertype" value={orderForm.ordertype} onChange={onChange} className="w-full rounded border px-2 py-1">
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          </div>
          {orderForm.ordertype === 'LIMIT' && (
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input name="price" type="number" step="0.01" value={orderForm.price} onChange={onChange} className="w-full rounded border px-2 py-1" />
            </div>
          )}
          <button type="submit" disabled={submitting} className="w-full py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">Submit {orderForm.transactiontype} Order</button>
        </form>
      </div>
    </div>
  );
};

export default TradeOrderModal;
