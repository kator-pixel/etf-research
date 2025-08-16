import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import List, Dict
import yfinance as yf
from datetime import datetime

class ETFAnalyzer:
    def __init__(self, fetcher):
        self.fetcher = fetcher
        self.analysis_results = []
        
    def analyze_top_etfs(self) -> pd.DataFrame:
        print("Fetching top 10 ETFs by market cap...")
        top_etfs = self.fetcher.get_top_etfs_by_market_cap(10)
        
        results = []
        for ticker, market_cap in top_etfs:
            print(f"Analyzing {ticker}...")
            
            drops = self.fetcher.find_price_drops(ticker)
            
            if drops:
                recoveries = self.fetcher.find_recoveries(ticker, drops)
                
                if recoveries:
                    for recovery in recoveries:
                        recovery['market_cap'] = market_cap
                        results.append(recovery)
        
        self.analysis_results = results
        return pd.DataFrame(results)
    
    def create_recovery_chart(self, ticker: str) -> go.Figure:
        etf = yf.Ticker(ticker)
        hist = etf.history(period="2y")
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=hist.index,
            y=hist['Close'],
            mode='lines',
            name=f'{ticker} Price',
            line=dict(color='blue', width=2)
        ))
        
        recoveries = [r for r in self.analysis_results if r['ticker'] == ticker]
        
        for recovery in recoveries:
            fig.add_trace(go.Scatter(
                x=[recovery['drop_date'], recovery['recovery_date']],
                y=[recovery['bottom_price'], recovery['recovery_price']],
                mode='markers+lines',
                name=f"Recovery: {recovery['recovery_percentage']:.1f}%",
                line=dict(color='green', width=2, dash='dash'),
                marker=dict(size=10, color=['red', 'green'])
            ))
            
            fig.add_annotation(
                x=recovery['drop_date'],
                y=recovery['bottom_price'],
                text=f"Drop: {recovery['original_drop_percentage']:.1f}%",
                showarrow=True,
                arrowhead=2,
                ax=0,
                ay=-40
            )
            
            fig.add_annotation(
                x=recovery['recovery_date'],
                y=recovery['recovery_price'],
                text=f"Recovery: {recovery['recovery_percentage']:.1f}%",
                showarrow=True,
                arrowhead=2,
                ax=0,
                ay=-40
            )
        
        fig.update_layout(
            title=f'{ticker} - Price Drops and Recoveries (2 Years)',
            xaxis_title='Date',
            yaxis_title='Price ($)',
            height=600,
            hovermode='x unified'
        )
        
        return fig
    
    def create_summary_chart(self) -> go.Figure:
        df = pd.DataFrame(self.analysis_results)
        
        if df.empty:
            return go.Figure()
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Recovery Percentages by ETF', 'Days to Recovery',
                          'Drop vs Recovery Comparison', 'Market Cap vs Recovery'),
            specs=[[{'type': 'bar'}, {'type': 'box'}],
                   [{'type': 'scatter'}, {'type': 'scatter'}]]
        )
        
        recovery_by_ticker = df.groupby('ticker')['recovery_percentage'].mean().sort_values(ascending=False)
        fig.add_trace(
            go.Bar(x=recovery_by_ticker.index, y=recovery_by_ticker.values,
                  name='Avg Recovery %', marker_color='green'),
            row=1, col=1
        )
        
        fig.add_trace(
            go.Box(y=df['days_to_recover'], name='Days to Recovery',
                  marker_color='blue'),
            row=1, col=2
        )
        
        fig.add_trace(
            go.Scatter(x=df['original_drop_percentage'], y=df['recovery_percentage'],
                      mode='markers', text=df['ticker'],
                      marker=dict(size=10, color='purple'),
                      name='Drop vs Recovery'),
            row=2, col=1
        )
        
        fig.add_trace(
            go.Scatter(x=df['market_cap']/1e9, y=df['recovery_percentage'],
                      mode='markers', text=df['ticker'],
                      marker=dict(size=10, color='orange'),
                      name='Market Cap vs Recovery'),
            row=2, col=2
        )
        
        fig.update_xaxes(title_text="ETF", row=1, col=1)
        fig.update_yaxes(title_text="Recovery %", row=1, col=1)
        
        fig.update_yaxes(title_text="Days", row=1, col=2)
        
        fig.update_xaxes(title_text="Drop %", row=2, col=1)
        fig.update_yaxes(title_text="Recovery %", row=2, col=1)
        
        fig.update_xaxes(title_text="Market Cap (Billions)", row=2, col=2)
        fig.update_yaxes(title_text="Recovery %", row=2, col=2)
        
        fig.update_layout(height=800, showlegend=False,
                         title_text="ETF Recovery Analysis Summary")
        
        return fig
    
    def generate_report(self) -> str:
        df = pd.DataFrame(self.analysis_results)
        
        if df.empty:
            return "No ETFs found matching the criteria."
        
        report = []
        report.append("=" * 80)
        report.append("ETF RECOVERY ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        report.append("CRITERIA:")
        report.append("- Top 10 ETFs by market capitalization")
        report.append("- Drops of 10% or more in the past 2 years")
        report.append("- Recoveries of 15% or more within 6-12 months of the drop")
        report.append("")
        
        report.append("SUMMARY STATISTICS:")
        report.append(f"- Total qualifying ETFs: {df['ticker'].nunique()}")
        report.append(f"- Total recovery events: {len(df)}")
        report.append(f"- Average recovery percentage: {df['recovery_percentage'].mean():.2f}%")
        report.append(f"- Average days to recovery: {df['days_to_recover'].mean():.0f} days")
        report.append("")
        
        report.append("TOP PERFORMERS (by average recovery percentage):")
        top_performers = df.groupby('ticker').agg({
            'recovery_percentage': 'mean',
            'days_to_recover': 'mean',
            'market_cap': 'first'
        }).sort_values('recovery_percentage', ascending=False).head(5)
        
        for ticker, row in top_performers.iterrows():
            report.append(f"  {ticker}: {row['recovery_percentage']:.2f}% recovery "
                         f"in {row['days_to_recover']:.0f} days "
                         f"(Market Cap: ${row['market_cap']/1e9:.1f}B)")
        
        report.append("")
        report.append("DETAILED RECOVERY EVENTS:")
        report.append("-" * 80)
        
        for _, row in df.sort_values('recovery_percentage', ascending=False).iterrows():
            report.append(f"\n{row['ticker']}:")
            report.append(f"  Drop Date: {row['drop_date'].strftime('%Y-%m-%d')}")
            report.append(f"  Recovery Date: {row['recovery_date'].strftime('%Y-%m-%d')}")
            report.append(f"  Original Drop: {row['original_drop_percentage']:.2f}%")
            report.append(f"  Recovery: {row['recovery_percentage']:.2f}%")
            report.append(f"  Days to Recover: {row['days_to_recover']} days")
            report.append(f"  Bottom Price: ${row['bottom_price']:.2f}")
            report.append(f"  Recovery Price: ${row['recovery_price']:.2f}")
        
        return "\n".join(report)