import streamlit as st
import pandas as pd
from etf_data_fetcher import ETFDataFetcher
from etf_analyzer import ETFAnalyzer
import plotly.graph_objects as go

st.set_page_config(
    page_title="ETF Recovery Analyzer",
    page_icon="📈",
    layout="wide"
)

st.title("📈 ETF Recovery Analyzer")
st.markdown("""
This application analyzes the top 10 ETFs by market capitalization and identifies:
- ETFs that dropped 10% or more in the past 2 years
- ETFs that recovered 15% or more within 6-12 months after the drop
""")

@st.cache_data(ttl=3600)
def run_analysis():
    fetcher = ETFDataFetcher()
    analyzer = ETFAnalyzer(fetcher)
    results_df = analyzer.analyze_top_etfs()
    return analyzer, results_df

def main():
    with st.sidebar:
        st.header("Analysis Settings")
        st.info("""
        **Default Parameters:**
        - Drop Threshold: -10%
        - Recovery Threshold: +15%
        - Recovery Window: 6-12 months
        - Lookback Period: 2 years
        """)
        
        if st.button("🔄 Refresh Analysis", type="primary"):
            st.cache_data.clear()
            st.rerun()
    
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Analysis Results", "📈 Charts", "📄 Report", "ℹ️ About"])
    
    with tab1:
        st.header("Analysis Results")
        
        with st.spinner("Analyzing ETFs... This may take a minute..."):
            analyzer, results_df = run_analysis()
        
        if not results_df.empty:
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Qualifying ETFs", results_df['ticker'].nunique())
            with col2:
                st.metric("Recovery Events", len(results_df))
            with col3:
                st.metric("Avg Recovery %", f"{results_df['recovery_percentage'].mean():.2f}%")
            with col4:
                st.metric("Avg Days to Recovery", f"{results_df['days_to_recover'].mean():.0f}")
            
            st.subheader("Detailed Results")
            
            display_df = results_df.copy()
            display_df['market_cap_billions'] = display_df['market_cap'] / 1e9
            display_df['drop_date'] = pd.to_datetime(display_df['drop_date']).dt.date
            display_df['recovery_date'] = pd.to_datetime(display_df['recovery_date']).dt.date
            
            display_columns = [
                'ticker', 'drop_date', 'recovery_date', 
                'original_drop_percentage', 'recovery_percentage',
                'days_to_recover', 'bottom_price', 'recovery_price',
                'market_cap_billions'
            ]
            
            formatted_df = display_df[display_columns].round(2)
            formatted_df.columns = [
                'ETF', 'Drop Date', 'Recovery Date',
                'Drop %', 'Recovery %', 'Days to Recover',
                'Bottom Price ($)', 'Recovery Price ($)', 'Market Cap (B$)'
            ]
            
            st.dataframe(
                formatted_df.sort_values('Recovery %', ascending=False),
                use_container_width=True,
                hide_index=True
            )
            
            csv = formatted_df.to_csv(index=False)
            st.download_button(
                label="📥 Download Results as CSV",
                data=csv,
                file_name="etf_recovery_analysis.csv",
                mime="text/csv"
            )
        else:
            st.warning("No ETFs found matching the specified criteria.")
    
    with tab2:
        st.header("Visualization")
        
        if not results_df.empty:
            st.subheader("Summary Charts")
            summary_fig = analyzer.create_summary_chart()
            st.plotly_chart(summary_fig, use_container_width=True)
            
            st.subheader("Individual ETF Charts")
            unique_tickers = results_df['ticker'].unique()
            selected_ticker = st.selectbox("Select ETF to visualize:", unique_tickers)
            
            if selected_ticker:
                etf_fig = analyzer.create_recovery_chart(selected_ticker)
                st.plotly_chart(etf_fig, use_container_width=True)
        else:
            st.info("Run the analysis first to see visualizations.")
    
    with tab3:
        st.header("Analysis Report")
        
        if not results_df.empty:
            report = analyzer.generate_report()
            st.text(report)
            
            st.download_button(
                label="📥 Download Report as Text",
                data=report,
                file_name="etf_recovery_report.txt",
                mime="text/plain"
            )
        else:
            st.info("Run the analysis first to generate a report.")
    
    with tab4:
        st.header("About This Application")
        
        st.markdown("""
        ### How It Works
        
        This application performs the following analysis:
        
        1. **Identifies Top ETFs**: Fetches the top 10 ETFs by market capitalization
        2. **Detects Price Drops**: Finds periods where ETFs dropped 10% or more within the past 2 years
        3. **Identifies Recoveries**: Locates instances where ETFs recovered 15% or more within 6-12 months after a drop
        4. **Generates Insights**: Provides detailed analysis, visualizations, and reports
        
        ### Data Source
        - Real-time market data from Yahoo Finance
        - Analysis covers the past 2 years of trading data
        
        ### Key Metrics
        - **Drop Percentage**: The percentage decline from peak to trough
        - **Recovery Percentage**: The percentage gain from the bottom
        - **Days to Recovery**: Number of trading days from bottom to recovery point
        - **Market Cap**: Total assets under management for the ETF
        
        ### Use Cases
        - Identify resilient ETFs that recover quickly from market downturns
        - Analyze market recovery patterns
        - Support investment decision-making with historical recovery data
        
        ### Disclaimer
        This tool is for educational and informational purposes only. It should not be considered as financial advice.
        Always consult with a qualified financial advisor before making investment decisions.
        """)

if __name__ == "__main__":
    main()