import type { OrderBook, OrderLevel } from './types.ts';
import { ORDER_BOOK_LEVELS } from './constants.ts';

export function generateOrderBook(
  price: number,
  tickSize: number,
  baseVolume: number,
): OrderBook {
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];

  let bidTotal = 0;
  let askTotal = 0;

  const spreadTicks = 1 + Math.floor(Math.random() * 3);
  const halfSpread = spreadTicks * tickSize / 2;

  for (let i = 0; i < ORDER_BOOK_LEVELS; i++) {
    // Deeper levels tend to have more liquidity
    const depthMultiplier = 1 + i * 0.3 + Math.random() * 0.5;

    const bidPrice = price - halfSpread - i * tickSize;
    const bidSize = Math.round(baseVolume * depthMultiplier * (0.5 + Math.random()));
    bidTotal += bidSize;
    bids.push({
      price: Math.round(bidPrice / tickSize) * tickSize,
      size: bidSize,
      total: bidTotal,
    });

    const askPrice = price + halfSpread + i * tickSize;
    const askSize = Math.round(baseVolume * depthMultiplier * (0.5 + Math.random()));
    askTotal += askSize;
    asks.push({
      price: Math.round(askPrice / tickSize) * tickSize,
      size: askSize,
      total: askTotal,
    });
  }

  return {
    bids,
    asks,
    spread: Math.round((asks[0].price - bids[0].price) / tickSize) * tickSize,
  };
}
