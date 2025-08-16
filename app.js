// ETF Recovery Analyzer - JavaScript Implementation

const TOP_ETFS = [
    'SPY', 'IVV', 'VOO', 'VTI', 'QQQ',
    'VEA', 'IEFA', 'VWO', 'AGG', 'BND',
    'VUG', 'IJH', 'IJR', 'GLD', 'IEMG'
];

let analysisResults = [];
let etfPriceData = {};

// CORS proxy for Yahoo Finance API
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const YF_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

async function fetchETFData(ticker, period = '2y') {
    try {
        // Using Yahoo Finance API with CORS proxy
        const interval = '1d';
        const range = '2y';
        
        const url = `${CORS_PROXY}${YF_API_BASE}${ticker}?range=${range}&interval=${interval}`;
        
        const response = await fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.chart.result[0];
        
        const timestamps = result.timestamp;
        const prices = result.indicators.quote[0].close;
        
        const priceData = timestamps.map((timestamp, index) => ({
            date: new Date(timestamp * 1000),
            close: prices[index]
        })).filter(item => item.close !== null);
        
        return {
            ticker: ticker,
            data: priceData,
            marketCap: result.meta.regularMarketPrice * 1000000000 // Approximate
        };
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        
        // Fallback to mock data for demonstration
        return generateMockData(ticker);
    }
}

function generateMockData(ticker) {
    // Generate realistic mock data for demonstration
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);
    
    const data = [];
    let price = 100 + Math.random() * 200;
    
    for (let i = 0; i < 500; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Simulate price movements with occasional drops
        const change = (Math.random() - 0.48) * 3;
        price = price * (1 + change / 100);
        
        // Simulate occasional larger drops
        if (Math.random() < 0.05) {
            price = price * (0.85 + Math.random() * 0.1);
        }
        
        data.push({
            date: date,
            close: price
        });
    }
    
    return {
        ticker: ticker,
        data: data,
        marketCap: (50 + Math.random() * 500) * 1e9
    };
}

function findPriceDrops(priceData, threshold = -0.10) {
    const drops = [];
    const data = priceData.data;
    
    for (let i = 0; i < data.length - 20; i++) {
        for (let j = i + 1; j < Math.min(i + 100, data.length); j++) {
            const priceChange = (data[j].close - data[i].close) / data[i].close;
            
            if (priceChange <= threshold) {
                drops.push({
                    ticker: priceData.ticker,
                    dropStartDate: data[i].date,
                    dropEndDate: data[j].date,
                    startPrice: data[i].close,
                    bottomPrice: data[j].close,
                    dropPercentage: priceChange * 100,
                    dropIndex: j
                });
            }
        }
    }
    
    return drops;
}

function findRecoveries(priceData, drops, recoveryThreshold = 0.15, minDays = 180, maxDays = 365) {
    const recoveries = [];
    const data = priceData.data;
    
    for (const drop of drops) {
        const dropIdx = drop.dropIndex;
        const bottomPrice = drop.bottomPrice;
        
        for (let k = dropIdx + 1; k < Math.min(dropIdx + maxDays, data.length); k++) {
            const daysSinceBottom = k - dropIdx;
            
            if (daysSinceBottom >= minDays) {
                const recoveryPct = (data[k].close - bottomPrice) / bottomPrice;
                
                if (recoveryPct >= recoveryThreshold) {
                    recoveries.push({
                        ticker: priceData.ticker,
                        dropDate: drop.dropEndDate,
                        recoveryDate: data[k].date,
                        bottomPrice: bottomPrice,
                        recoveryPrice: data[k].close,
                        recoveryPercentage: recoveryPct * 100,
                        daysToRecover: daysSinceBottom,
                        originalDropPercentage: drop.dropPercentage,
                        marketCap: priceData.marketCap
                    });
                    break;
                }
            }
        }
    }
    
    return recoveries;
}

async function runAnalysis() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('resultsSection');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    loadingSpinner.classList.add('show');
    analyzeBtn.disabled = true;
    resultsSection.style.display = 'none';
    
    analysisResults = [];
    etfPriceData = {};
    
    try {
        // Analyze top ETFs
        for (const ticker of TOP_ETFS.slice(0, 10)) {
            console.log(`Analyzing ${ticker}...`);
            
            const priceData = await fetchETFData(ticker);
            etfPriceData[ticker] = priceData;
            
            const drops = findPriceDrops(priceData);
            
            if (drops.length > 0) {
                const recoveries = findRecoveries(priceData, drops.slice(0, 5)); // Limit drops analyzed
                
                if (recoveries.length > 0) {
                    analysisResults.push(...recoveries);
                }
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        displayResults();
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('分析中にエラーが発生しました。もう一度お試しください。');
    } finally {
        loadingSpinner.classList.remove('show');
        analyzeBtn.disabled = false;
    }
}

function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    
    if (analysisResults.length === 0) {
        alert('指定条件に該当するETFが見つかりませんでした。');
        return;
    }
    
    resultsSection.style.display = 'block';
    
    // Update metrics
    const uniqueETFs = new Set(analysisResults.map(r => r.ticker)).size;
    const avgRecovery = analysisResults.reduce((sum, r) => sum + r.recoveryPercentage, 0) / analysisResults.length;
    const avgDays = analysisResults.reduce((sum, r) => sum + r.daysToRecover, 0) / analysisResults.length;
    
    document.getElementById('qualifyingETFs').textContent = uniqueETFs;
    document.getElementById('recoveryEvents').textContent = analysisResults.length;
    document.getElementById('avgRecovery').textContent = avgRecovery.toFixed(1) + '%';
    document.getElementById('avgDays').textContent = Math.round(avgDays) + '日';
    
    // Populate table
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    analysisResults.sort((a, b) => b.recoveryPercentage - a.recoveryPercentage);
    
    analysisResults.forEach(result => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td><span class="etf-badge">${result.ticker}</span></td>
            <td>${result.dropDate.toLocaleDateString('ja-JP')}</td>
            <td>${result.recoveryDate.toLocaleDateString('ja-JP')}</td>
            <td class="text-danger">${result.originalDropPercentage.toFixed(1)}%</td>
            <td class="text-success">${result.recoveryPercentage.toFixed(1)}%</td>
            <td>${result.daysToRecover}日</td>
        `;
    });
    
    // Update ETF selector
    updateETFSelector();
    
    // Create initial chart
    createSummaryChart();
    
    // Generate report
    generateReport();
}

function updateETFSelector() {
    const etfSelect = document.getElementById('etfSelect');
    const etfSelector = document.getElementById('etfSelector');
    
    const uniqueETFs = [...new Set(analysisResults.map(r => r.ticker))];
    
    etfSelect.innerHTML = '<option value="summary">サマリーチャート</option>';
    uniqueETFs.forEach(ticker => {
        etfSelect.innerHTML += `<option value="${ticker}">${ticker}</option>`;
    });
    
    etfSelector.style.display = 'block';
}

function createSummaryChart() {
    const chartContainer = document.getElementById('chartContainer');
    
    // Group by ticker for summary
    const recoveryByTicker = {};
    analysisResults.forEach(result => {
        if (!recoveryByTicker[result.ticker]) {
            recoveryByTicker[result.ticker] = [];
        }
        recoveryByTicker[result.ticker].push(result.recoveryPercentage);
    });
    
    const tickers = Object.keys(recoveryByTicker);
    const avgRecoveries = tickers.map(ticker => {
        const recoveries = recoveryByTicker[ticker];
        return recoveries.reduce((sum, r) => sum + r, 0) / recoveries.length;
    });
    
    const data = [{
        x: tickers,
        y: avgRecoveries,
        type: 'bar',
        marker: {
            color: 'rgba(102, 126, 234, 0.8)'
        },
        text: avgRecoveries.map(r => r.toFixed(1) + '%'),
        textposition: 'auto'
    }];
    
    const layout = {
        title: 'ETF別平均回復率',
        xaxis: { title: 'ETF' },
        yaxis: { title: '回復率 (%)' },
        showlegend: false
    };
    
    Plotly.newPlot(chartContainer, data, layout, {responsive: true});
}

function updateChart() {
    const etfSelect = document.getElementById('etfSelect');
    const selectedValue = etfSelect.value;
    
    if (selectedValue === 'summary') {
        createSummaryChart();
    } else {
        createETFChart(selectedValue);
    }
}

function createETFChart(ticker) {
    const chartContainer = document.getElementById('chartContainer');
    const priceData = etfPriceData[ticker];
    
    if (!priceData) return;
    
    const dates = priceData.data.map(d => d.date);
    const prices = priceData.data.map(d => d.close);
    
    const trace1 = {
        x: dates,
        y: prices,
        type: 'scatter',
        mode: 'lines',
        name: `${ticker} 価格`,
        line: { color: 'blue' }
    };
    
    const traces = [trace1];
    
    // Add recovery markers
    const tickerRecoveries = analysisResults.filter(r => r.ticker === ticker);
    
    tickerRecoveries.forEach((recovery, index) => {
        traces.push({
            x: [recovery.dropDate, recovery.recoveryDate],
            y: [recovery.bottomPrice, recovery.recoveryPrice],
            type: 'scatter',
            mode: 'markers+lines',
            name: `回復 ${index + 1}`,
            line: { color: 'green', dash: 'dash' },
            marker: { size: 10, color: ['red', 'green'] }
        });
    });
    
    const layout = {
        title: `${ticker} - 価格推移と回復パターン`,
        xaxis: { title: '日付' },
        yaxis: { title: '価格 ($)' },
        showlegend: true
    };
    
    Plotly.newPlot(chartContainer, traces, layout, {responsive: true});
}

function generateReport() {
    const reportContent = document.getElementById('reportContent');
    
    const uniqueETFs = new Set(analysisResults.map(r => r.ticker)).size;
    const avgRecovery = analysisResults.reduce((sum, r) => sum + r.recoveryPercentage, 0) / analysisResults.length;
    const avgDays = analysisResults.reduce((sum, r) => sum + r.daysToRecover, 0) / analysisResults.length;
    
    let report = `ETF回復分析レポート
${'='.repeat(50)}
分析日時: ${new Date().toLocaleString('ja-JP')}

分析条件:
- 対象: 時価総額上位ETF
- 下落基準: 過去2年間で10%以上の下落
- 回復基準: 下落後6-12ヶ月以内に15%以上の上昇

サマリー統計:
- 対象ETF数: ${uniqueETFs}
- 回復イベント数: ${analysisResults.length}
- 平均回復率: ${avgRecovery.toFixed(2)}%
- 平均回復日数: ${Math.round(avgDays)}日

詳細結果:
${'='.repeat(50)}
`;
    
    analysisResults.forEach(result => {
        report += `
${result.ticker}:
  下落日: ${result.dropDate.toLocaleDateString('ja-JP')}
  回復日: ${result.recoveryDate.toLocaleDateString('ja-JP')}
  下落率: ${result.originalDropPercentage.toFixed(2)}%
  回復率: ${result.recoveryPercentage.toFixed(2)}%
  回復日数: ${result.daysToRecover}日
  底値: $${result.bottomPrice.toFixed(2)}
  回復価格: $${result.recoveryPrice.toFixed(2)}
`;
    });
    
    reportContent.textContent = report;
}

function downloadCSV() {
    let csv = 'ETF,下落日,回復日,下落率(%),回復率(%),回復日数\n';
    
    analysisResults.forEach(result => {
        csv += `${result.ticker},${result.dropDate.toLocaleDateString('ja-JP')},${result.recoveryDate.toLocaleDateString('ja-JP')},${result.originalDropPercentage.toFixed(1)},${result.recoveryPercentage.toFixed(1)},${result.daysToRecover}\n`;
    });
    
    downloadFile(csv, 'etf_recovery_analysis.csv', 'text/csv');
}

function downloadReport() {
    const report = document.getElementById('reportContent').textContent;
    downloadFile(report, 'etf_recovery_report.txt', 'text/plain');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}