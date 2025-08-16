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
    
    def find_price_drops(self, ticker: str, threshold: float = -0.10, lookback_days: int = 730) -> List[Dict]:
        drops = []
        
        try:
            data = self.fetch_etf_data(ticker, period="2y")
            if data.empty:
                return drops
                
            data = data.reset_index()
            prices = data['Close'].values
            dates = pd.to_datetime(data['Date']).values
            
            for i in range(len(prices) - 1):
                for j in range(i + 1, min(i + lookback_days, len(prices))):
                    price_change = (prices[j] - prices[i]) / prices[i]
                    
                    if price_change <= threshold:
                        drops.append({
                            'ticker': ticker,
                            'drop_start_date': pd.Timestamp(dates[i]),
                            'drop_end_date': pd.Timestamp(dates[j]),
                            'start_price': prices[i],
                            'bottom_price': prices[j],
                            'drop_percentage': price_change * 100,
                            'drop_index': j
                        })
            
        except Exception as e:
            print(f"Error finding drops for {ticker}: {e}")
            
        return drops
    
    def find_recoveries(self, ticker: str, drops: List[Dict], recovery_threshold: float = 0.15,
                       min_days: int = 180, max_days: int = 365) -> List[Dict]:
        recoveries = []
        
        try:
            data = self.fetch_etf_data(ticker, period="2y")
            if data.empty:
                return recoveries
                
            data = data.reset_index()
            prices = data['Close'].values
            dates = pd.to_datetime(data['Date']).values
            
            for drop in drops:
                drop_idx = drop['drop_index']
                bottom_price = drop['bottom_price']
                
                for k in range(drop_idx + 1, min(drop_idx + max_days, len(prices))):
                    days_since_bottom = k - drop_idx
                    
                    if days_since_bottom >= min_days:
                        recovery_pct = (prices[k] - bottom_price) / bottom_price
                        
                        if recovery_pct >= recovery_threshold:
                            recoveries.append({
                                'ticker': ticker,
                                'drop_date': drop['drop_end_date'],
                                'recovery_date': pd.Timestamp(dates[k]),
                                'bottom_price': bottom_price,
                                'recovery_price': prices[k],
                                'recovery_percentage': recovery_pct * 100,
                                'days_to_recover': days_since_bottom,
                                'original_drop_percentage': drop['drop_percentage']
                            })
                            break
                            
        except Exception as e:
            print(f"Error finding recoveries for {ticker}: {e}")
            
        return recoveries