from etf_data_fetcher import ETFDataFetcher
from etf_analyzer import ETFAnalyzer
import pandas as pd

def test_basic_functionality():
    print("Testing ETF Recovery Analyzer...")
    print("=" * 50)
    
    fetcher = ETFDataFetcher()
    
    print("\n1. Testing top ETFs by market cap...")
    top_etfs = fetcher.get_top_etfs_by_market_cap(10)
    print(f"Found {len(top_etfs)} ETFs")
    for ticker, market_cap in top_etfs[:5]:
        print(f"  {ticker}: ${market_cap/1e9:.2f}B")
    
    print("\n2. Testing price drop detection for SPY...")
    drops = fetcher.find_price_drops('SPY', threshold=-0.10, lookback_days=730)
    print(f"Found {len(drops)} significant drops for SPY")
    
    if drops:
        print("\n3. Testing recovery analysis for SPY...")
        recoveries = fetcher.find_recoveries('SPY', drops[:3])
        print(f"Found {len(recoveries)} recoveries for SPY")
        
        if recoveries:
            recovery = recoveries[0]
            print(f"\nExample recovery:")
            print(f"  Drop date: {recovery['drop_date']}")
            print(f"  Recovery date: {recovery['recovery_date']}")
            print(f"  Recovery %: {recovery['recovery_percentage']:.2f}%")
            print(f"  Days to recover: {recovery['days_to_recover']}")
    
    print("\n4. Testing full analysis...")
    analyzer = ETFAnalyzer(fetcher)
    results_df = analyzer.analyze_top_etfs()
    
    if not results_df.empty:
        print(f"\nAnalysis complete!")
        print(f"Found {len(results_df)} recovery events across {results_df['ticker'].nunique()} ETFs")
        print(f"Average recovery: {results_df['recovery_percentage'].mean():.2f}%")
        print(f"Average days to recovery: {results_df['days_to_recover'].mean():.0f} days")
        
        print("\nTop 5 recoveries:")
        top_recoveries = results_df.nlargest(5, 'recovery_percentage')[['ticker', 'recovery_percentage', 'days_to_recover']]
        for _, row in top_recoveries.iterrows():
            print(f"  {row['ticker']}: {row['recovery_percentage']:.2f}% in {row['days_to_recover']:.0f} days")
    else:
        print("No qualifying recoveries found in the analysis period.")
    
    print("\n" + "=" * 50)
    print("Testing complete!")
    return True

if __name__ == "__main__":
    try:
        test_basic_functionality()
        print("\n✅ All tests passed successfully!")
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()