# 1142928 HW06 — Tic-Tac-Toe

井字棋 Web 版作業，使用原生 HTML、CSS、JavaScript，無需安裝套件或建置工具。

## 功能
- 玩家先手（X）、電腦後手（O）
- 電腦使用 Minimax 演算法完整搜尋剩餘局面，採最佳策略，保證不會輸
- 勝負與平手判定、勝利連線高亮
- 落子動畫、電腦思考動畫、結果彈窗
- Web Audio API 音效（可關閉）
- localStorage 保存勝／敗／平手統計
- RWD 手機版排版

## 本機執行
直接以瀏覽器開啟 `index.html` 即可。

## 發布到 GitHub Pages
1. 在 GitHub 建立一個新的 Repository，例如 `1142928-hw06`。
2. 將 `index.html`、`style.css`、`script.js`、`README.md` 上傳至 Repository 根目錄。
3. 開啟 Repository 的 **Settings → Pages**。
4. 在 **Build and deployment** 選擇 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/(root)`，按 Save。
6. 等待 GitHub Pages 部署完成，即可透過 GitHub Pages 網址遊玩。

## AI 演算法說明
Minimax 會遞迴模擬每個可行落子：
- AI 獲勝：`10 - depth`
- 玩家獲勝：`depth - 10`
- 平手：`0`

電腦選擇分數最高的走法。由於井字棋的狀態空間很小，可以完整搜尋至終局，因此玩家在最佳策略下最多只能逼和，無法戰勝電腦。
