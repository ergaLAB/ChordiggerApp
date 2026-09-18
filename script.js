// 半音階の配列（シャープ表記）
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 各コード進行の定義
const chordProgressions = {
  0: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'],
  1: ['Am', 'F', 'G', 'C'],
  2: ['F', 'G', 'Em', 'Am']
};

// 現在の状態を管理
let currentKeyOffset = 0;
let selectedProgression = 0;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', function() {
  updateChordDisplay();
  
  // ラジオボタンの変更を監視
  const chords = document.selectchords.chords;
  for (let i = 0; i < chords.length; i++) {
    chords[i].addEventListener('change', function() {
      if (this.checked) {
        selectedProgression = parseInt(this.value);
        currentKeyOffset = 0;
        updateChordDisplay();
      }
    });
  }
});

// キーを変更する関数
function changeKey(semitones) {
  currentKeyOffset += semitones;
  
  // -12 から +12 の範囲に制限
  if (currentKeyOffset < -12) {
    currentKeyOffset = -12;
  } else if (currentKeyOffset > 12) {
    currentKeyOffset = 12;
  }
  
  updateChordDisplay();
}

// コード表示を更新する関数
function updateChordDisplay() {
  const currentChords = chordProgressions[selectedProgression];
  const transposedChords = currentChords.map(chord => transposeChord(chord, currentKeyOffset));
  
  // 表示更新
  document.getElementById('currentChords').textContent = transposedChords.join(' - ');
  
  // キー表示の更新
  const keyDisplay = document.getElementById('currentKeyDisplay');
  if (currentKeyOffset === 0) {
    keyDisplay.textContent = 'オリジナル';
  } else if (currentKeyOffset > 0) {
    keyDisplay.textContent = `+${currentKeyOffset}`;
  } else {
    keyDisplay.textContent = `${currentKeyOffset}`;
  }
  
  // ボタンの無効化処理
  document.getElementById('keyDown').disabled = currentKeyOffset <= -12;
  document.getElementById('keyUp').disabled = currentKeyOffset >= 12;
}

// コードをトランスポーズする関数
function transposeChord(chord, semitones) {
  // コードをルートノートとサフィックスに分割
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) {
    return chord;
  }
  
  const rootNote = match[1];
  const suffix = match[2] || '';
  
  // ノートをインデックスに変換
  let noteIndex = notes.indexOf(rootNote);
  
  // フラット表記の場合はシャープに変換
  if (noteIndex === -1) {
    const flatToSharp = {
      'Db': 'C#',
      'Eb': 'D#',
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#'
    };
    if (flatToSharp[rootNote]) {
      noteIndex = notes.indexOf(flatToSharp[rootNote]);
    }
  }
  
  if (noteIndex === -1) {
    return chord;
  }
  
  // トランスポーズ
  let newIndex = (noteIndex + semitones) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }
  
  return notes[newIndex] + suffix;
}

// GO ボタンがクリックされた時の処理
function clickbtn() {
  const currentChords = chordProgressions[selectedProgression];
  const transposedChords = currentChords.map(chord => transposeChord(chord, currentKeyOffset));
  const query = transposedChords.join(' ');
  
  let maxpagenum = 250;
  if (selectedProgression === 0) {
    maxpagenum = 45;
  }
  
  callAPI(query, maxpagenum);
}

// API を呼び出す関数
function callAPI(query, maxpagenum) {
  const pagenum = Math.floor(Math.random() * maxpagenum) + 1;
  
  fetch(`https://widget.songle.jp/api/v1/songs/search.json?q=${encodeURIComponent(query)}&page=${pagenum}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('ネットワークエラー');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        const songno = Math.floor(Math.random() * data.length);
        const url = data[songno].permalink;
        const title = data[songno].title;
        drawresult(url, title);
      } else {
        drawresult('', '該当する曲が見つかりませんでした');
      }
    })
    .catch(error => {
      console.error('エラー:', error);
      document.getElementById('result').innerHTML = '<p style="color: #e74c3c;">エラーが発生しました。しばらく時間をおいてお試しください。</p>';
    });
}

// 結果を表示する関数
function drawresult(url, title) {
  const resultElement = document.getElementById('result');
  
  // 既存の Songle Widget を削除
  const existingWidget = document.getElementById('songle-widget');
  if (existingWidget) {
    existingWidget.remove();
  }
  
  if (url) {
    // div を使った Songle Widget の埋め込み
    const widgetDiv = document.createElement('div');
    widgetDiv.setAttribute('data-api', 'songle-widget-extra-module');
    widgetDiv.setAttribute('data-url', url);
    widgetDiv.id = 'songle-widget';
    
    resultElement.innerHTML = '';
    resultElement.appendChild(widgetDiv);
    
    // ウィジェットのスクリプトを再読み込み（既に読み込まれていても問題なし）
    const script = document.createElement('script');
    script.src = 'https://widget.songle.jp/v1/widgets.js';
    resultElement.appendChild(script);
  } else {
    resultElement.innerHTML = `<p style="color: #666;">${title}</p>`;
  }
}
