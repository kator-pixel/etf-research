import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np

class ETFDataFetcher:
    TOP_ETFS = [
        'SPY', 'IVV', 'VOO', 'VTI', 'QQQ', 
        'VEA', 'IEFA', 'VWO', 'AGG', 'BND',
        'VUG', 'IJH', 'IJR', 'GLD', 'IEMG',
        'VTV', 'VO', 'VB', 'VNQ', 'VXUS'
    ]
    
    def __init__(self):
        self.etf_data = {}
        
    def fetch_etf_data(self, ticker: str, period: str = "2y") -> pd.DataFrame:
        try:
            etf = yf.Ticker(ticker)
            hist = etf.history(period=period)
            info = etf.info
            
            if not hist.empty:
                hist['Ticker'] = ticker
                hist['MarketCap'] = info.get('totalAssets', 0)
                return hist
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
        return pd.DataFrame()
    
    def get_top_etfs_by_market_cap(self, n: int = 10) -> List[Tuple[str, float]]:
        market_caps = []
        
        for ticker in self.TOP_ETFS:
            try:
                etf = yf.Ticker(ticker)
                info = etf.info
                market_cap = info.get('totalAssets', 0)
                if market_cap > 0:
                    market_caps.append((ticker, market_cap))
            except Exception as e:
                print(f"Error getting market cap for {ticker}: {e}")
                
        market_caps.sort(key=lambda x: x[1], reverse=True)
        return market_caps[:n]
    
    def find_price_drops(self, ticker: str, threshold: float = -0.05) -> List[Dict]:
        drops = []
        
        try:
            data = self.fetch_etf_data(ticker, period="2y")
            if data.empty:
                return drops
                
            data = data.reset_index()
            prices = data['Close'].values
            dates = pd.to_datetime(data['Date']).values
            
            # Find daily drops (5%+ in a single day)
            for i in range(1, len(prices)):
                daily_change = (prices[i] - prices[i-1]) / prices[i-1]
                
                if daily_change <= threshold:
                    drops.append({
                        'ticker': ticker,
                        'type': 'Daily',
                        'drop_date': pd.Timestamp(dates[i]),
                        'previous_close': prices[i-1],
                        'current_close': prices[i],
                        'drop_percentage': daily_change * 100,
                        'day_of_week': pd.Timestamp(dates[i]).strftime('%A')
                    })
            
            # Find weekly drops (5%+ in a week)
            for i in range(5, len(prices)):
                weekly_change = (prices[i] - prices[i-5]) / prices[i-5]
                
                if weekly_change <= threshold:
                    # Check if this isn't already captured as daily drops
                    is_daily_drop = False
                    for j in range(i-4, i+1):
                        if j > 0 and (prices[j] - prices[j-1]) / prices[j-1] <= threshold:
                            is_daily_drop = True
                            break
                    
                    if not is_daily_drop:
                        drops.append({
                            'ticker': ticker,
                            'type': 'Weekly',
                            'drop_start_date': pd.Timestamp(dates[i-5]),
                            'drop_end_date': pd.Timestamp(dates[i]),
                            'start_price': prices[i-5],
                            'end_price': prices[i],
                            'drop_percentage': weekly_change * 100
                        })
            
        except Exception as e:
            print(f"Error finding drops for {ticker}: {e}")
            
        return drops
    
    # Recovery analysis removed - focusing on drop detection only