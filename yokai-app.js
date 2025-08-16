// 妖怪検索・情報抽出アプリ - JavaScript Implementation

let yokaiResults = [];
let yamlData = {};

// 妖怪データベース（実際の実装では外部APIを使用）
const yokaiDatabase = [
    {
        name: "鬼",
        description: "日本の伝統的な妖怪。赤い肌、角、牙を持つ強力な存在。節分では悪役として扱われるが、地域によっては守護神的存在でもある。",
        characteristics: ["赤い肌", "角", "牙", "怪力"],
        regions: ["全国", "特に山間部"],
        type: "妖怪",
        image_url: "https://example.com/oni.jpg",
        source_url: "https://ja.wikipedia.org/wiki/鬼"
    },
    {
        name: "河童",
        description: "水辺に住む妖怪。頭に皿があり、水泳が得意。きゅうりを好物とし、相撲が強い。時には人を水中に引きずり込むとされる。",
        characteristics: ["頭の皿", "緑の肌", "水泳上手", "相撲好き"],
        regions: ["全国の河川", "特に九州"],
        type: "水妖",
        image_url: "https://example.com/kappa.jpg",
        source_url: "https://ja.wikipedia.org/wiki/河童"
    },
    {
        name: "天狗",
        description: "山に住む半人半鳥の妖怪。赤い顔に長い鼻、翼を持つ。武術に長け、修行僧を試すことで知られる。",
        characteristics: ["長い鼻", "赤い顔", "翼", "武術の達人"],
        regions: ["山間部", "特に高尾山、愛宕山"],
        type: "山妖",
        image_url: "https://example.com/tengu.jpg",
        source_url: "https://ja.wikipedia.org/wiki/天狗"
    },
    {
        name: "狐",
        description: "知能の高い妖怪。人に化けることができ、稲荷神の使いとしても知られる。白い毛の老狐は特に神聖視される。",
        characteristics: ["変身能力", "知能", "九本の尻尾", "白い毛"],
        regions: ["全国", "特に稲荷神社周辺"],
        type: "獣妖",
        image_url: "https://example.com/kitsune.jpg",
        source_url: "https://ja.wikipedia.org/wiki/狐_(妖怪)"
    },
    {
        name: "雪女",
        description: "雪山に現れる美しい女性の妖怪。白い着物を着て、触れるものを凍らせる力を持つ。迷子を助けることもあれば、遭難させることもある。",
        characteristics: ["美しい女性", "白い着物", "冷気", "雪山"],
        regions: ["雪国", "特に東北地方"],
        type: "自然妖怪",
        image_url: "https://example.com/yukionna.jpg",
        source_url: "https://ja.wikipedia.org/wiki/雪女"
    }
];

// 検索関数
async function searchYokai() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        alert('検索キーワードを入力してください');
        return;
    }
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('resultsSection');
    
    loadingSpinner.classList.add('show');
    resultsSection.style.display = 'none';
    
    try {
        // 妖怪を検索
        yokaiResults = searchYokaiInDatabase(searchTerm);
        
        if (yokaiResults.length === 0) {
            alert('関連する妖怪が見つかりませんでした');
            return;
        }
        
        // 検索結果を表示
        displayYokaiResults();
        
        // YAML生成
        generateYAML();
        
        // 結果セクションを表示
        resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('検索エラー:', error);
        alert('検索中にエラーが発生しました');
    } finally {
        loadingSpinner.classList.remove('show');
    }
}

// データベースから妖怪を検索
function searchYokaiInDatabase(searchTerm) {
    const results = [];
    const searchLower = searchTerm.toLowerCase();
    
    yokaiDatabase.forEach(yokai => {
        let score = 0;
        
        // 名前での完全一致
        if (yokai.name.includes(searchTerm)) {
            score += 10;
        }
        
        // 説明文での部分一致
        if (yokai.description.includes(searchTerm)) {
            score += 5;
        }
        
        // 特徴での一致
        yokai.characteristics.forEach(char => {
            if (char.includes(searchTerm)) {
                score += 3;
            }
        });
        
        // 地域での一致
        yokai.regions.forEach(region => {
            if (region.includes(searchTerm)) {
                score += 2;
            }
        });
        
        // 種類での一致
        if (yokai.type.includes(searchTerm)) {
            score += 3;
        }
        
        if (score > 0) {
            results.push({
                ...yokai,
                relevanceScore: score
            });
        }
    });
    
    // スコア順でソート
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// 検索結果を表示
function displayYokaiResults() {
    const yokaiResultsContainer = document.getElementById('yokaiResults');
    yokaiResultsContainer.innerHTML = '';
    
    yokaiResults.forEach((yokai, index) => {
        const yokaiCard = document.createElement('div');
        yokaiCard.className = 'yokai-card';
        yokaiCard.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <img src="${yokai.image_url}" alt="${yokai.name}" class="yokai-image" 
                         onerror="this.src='https://via.placeholder.com/200x200?text=${encodeURIComponent(yokai.name)}'">
                </div>
                <div class="col-md-9">
                    <div class="yokai-name">${yokai.name}</div>
                    <div class="yokai-description mb-3">${yokai.description}</div>
                    <div class="row">
                        <div class="col-md-6">
                            <strong>特徴:</strong> ${yokai.characteristics.join(', ')}<br>
                            <strong>地域:</strong> ${yokai.regions.join(', ')}<br>
                            <strong>種類:</strong> ${yokai.type}
                        </div>
                        <div class="col-md-6">
                            <div class="source-url">
                                <strong>出典:</strong> 
                                <a href="${yokai.source_url}" target="_blank" class="text-decoration-none">
                                    ${yokai.source_url}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        yokaiResultsContainer.appendChild(yokaiCard);
    });
}

// YAML生成
function generateYAML() {
    yamlData = {
        search_info: {
            query: document.getElementById('searchInput').value,
            search_date: new Date().toISOString(),
            results_count: yokaiResults.length
        },
        yokai_data: yokaiResults.map(yokai => ({
            name: yokai.name,
            description: yokai.description,
            characteristics: yokai.characteristics,
            regions: yokai.regions,
            type: yokai.type,
            image_url: yokai.image_url,
            source_url: yokai.source_url,
            relevance_score: yokai.relevanceScore
        }))
    };
    
    const yamlOutput = document.getElementById('yamlOutput');
    const yamlString = jsyaml.dump(yamlData, {
        indent: 2,
        lineWidth: 80,
        noRefs: true
    });
    yamlOutput.textContent = yamlString;
}

// YAMLダウンロード
function downloadYAML() {
    const yamlString = jsyaml.dump(yamlData, {
        indent: 2,
        lineWidth: 80,
        noRefs: true
    });
    
    const blob = new Blob([yamlString], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const searchTerm = document.getElementById('searchInput').value || 'yokai';
    const filename = `yokai_search_${searchTerm}_${new Date().toISOString().split('T')[0]}.yaml`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// YAMLコピー
function copyYAML() {
    const yamlOutput = document.getElementById('yamlOutput');
    const yamlText = yamlOutput.textContent;
    
    navigator.clipboard.writeText(yamlText).then(() => {
        // 一時的にボタンのテキストを変更
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i> コピー完了!';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
        }, 2000);
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    });
}

// Enterキーで検索
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchYokai();
        }
    });
});

// Web scraping用の関数（実際の実装では外部APIを使用）
async function fetchYokaiFromWeb(searchTerm) {
    // 実際の実装では、妖怪関連のWebサイトから情報を取得
    // 例: Wikipedia API, 妖怪データベースAPI等
    
    try {
        // Wikipedia APIの例
        const response = await fetch(`https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(searchTerm + ' 妖怪')}`);
        const data = await response.json();
        
        // 結果を処理してyokaiオブジェクトに変換
        // この部分は実際の実装で詳細化が必要
        
        return data.query.search.map(item => ({
            name: item.title,
            description: item.snippet,
            source_url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            // 画像URLやその他の情報は別途取得が必要
        }));
    } catch (error) {
        console.error('Web検索エラー:', error);
        return [];
    }
}