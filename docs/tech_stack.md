# 技術選定 - レシピ管理アプリ

[要件定義書](./requirements.md) の詳細ドキュメント。

## 1. 前提

- 無料枠の範囲内で構築・運用できること
- 個人が学習目的で一から手を動かして実装すること（既存コードの流用はしない）

## 2. 技術スタックと選定理由

| レイヤー | 採用technology | 選定理由 | 検討した代替候補 |
|---|---|---|---|
| フロントエンド | Next.js + TypeScript | React単体より学習教材が豊富で、ルーティングやAPI通信の型が最初から整っているため、学習コストと機能実装のバランスが良い。型安全性により、Rails API側とのレスポンス形状のズレ（プロパティ名の誤りや型違い）を実装時・ビルド時に検出できる | React (CRA/Vite)、Vue.js / Nuxt.js、JavaScriptのみ（型なし） |
| バックエンド | Ruby on Rails（APIモード） | スクールで学習した言語・フレームワークであり、CRUD+検索程度の機能ならRailsの規約に乗ることで素早く実装できる | Node.js (Express)、Django |
| データベース | MySQL | 無料枠で使えるホスティングサービスが多く、学習教材・情報量も豊富なリレーショナルDBであるため | PostgreSQL、SQLite |
| デプロイ先 | 未定（実装が一通り進んだ後に検討） | フロント・バック・DBそれぞれの無料枠の制約（スリープ仕様、DB容量上限等）を比較してから決定したいため | Vercel + Railway、Render、Fly.io など |

## 3. フロントエンド周辺ツール（TypeScript構成に合わせた選定）

| 用途 | 採用technology | 選定理由 |
|---|---|---|
| Lint | ESLint（`eslint-config-next` + `@typescript-eslint`） | Next.js公式テンプレートに標準で組み込まれており、TypeScriptの型情報を使ったLintルールも適用できる |
| フォーマッタ | Prettier | ESLintと役割を分離し、フォーマット崩れによるレビュー時の差分ノイズを防ぐ定番構成 |
| APIレスポンスの型定義 | TypeScriptの型（手書き、または将来的にOpenAPIスキーマから生成） | 本アプリの規模ではエンドポイント数が少ないため、まずは手書きの型定義で開始し、API設計確定後に自動生成の導入を検討する |
| テスト（必要に応じて） | Jest + React Testing Library | Next.js + TypeScript構成で広く使われており、学習教材も豊富なため |
