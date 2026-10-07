# データ設計 - レシピ管理アプリ

## 1. 設計方針

- [要件定義書](./requirements.md) 6章「レシピが持つ情報」および 9章「今後決めること」を受けて作成する。
- 材料・手順は検索性・拡張性（分量の型分け、手順の並び替え等）を考慮し、それぞれ別テーブルとする。
- カテゴリは一覧画面での絞り込みに使うため、マスタテーブル（`categories`）として切り出す。
- タグは1レシピに複数付与でき、同じタグを複数レシピで使い回すことを想定し、多対多（中間テーブル）とする。
- 認証機能はスコープ外のため、ユーザーに関するテーブルは持たない。

## 2. ER図

```
┌───────────────┐        ┌──────────────────┐        ┌───────────────┐
│   categories  │        │      recipes      │        │      tags      │
├───────────────┤        ├──────────────────┤        ├───────────────┤
│ id (PK)       │ 1    N │ id (PK)          │ N    N │ id (PK)       │
│ name          │───────<│ category_id (FK) │>───────│ name          │
│ created_at    │        │ title            │  (via  │ created_at    │
│ updated_at    │        │ cooking_time     │ recipe_│ updated_at    │
└───────────────┘        │ servings         │  _tags)│               │
                          │ calories         │        └───────────────┘
                          │ created_at       │
                          │ updated_at       │
                          └─────────┬────────┘
                            1       │       1
                    ┌───────────────┼───────────────┐
                    │ N                             │ N
          ┌─────────────────┐             ┌──────────────────┐
          │  ingredients     │             │      steps        │
          ├─────────────────┤             ├──────────────────┤
          │ id (PK)         │             │ id (PK)          │
          │ recipe_id (FK)  │             │ recipe_id (FK)   │
          │ name            │             │ step_number      │
          │ quantity        │             │ description      │
          │ position        │             │ created_at       │
          │ created_at      │             │ updated_at       │
          │ updated_at      │             └──────────────────┘
          └─────────────────┘

                          ┌──────────────────┐
                          │   recipe_tags     │
                          ├──────────────────┤
                          │ id (PK)          │
                          │ recipe_id (FK)   │
                          │ tag_id (FK)      │
                          │ created_at       │
                          └──────────────────┘
```

- `recipes 1 - N ingredients`（レシピ削除時は材料も削除）
- `recipes 1 - N steps`（レシピ削除時は手順も削除）
- `recipes N - 1 categories`（カテゴリは必須・削除制限）
- `recipes N - N tags`（中間テーブル `recipe_tags` 経由、レシピ削除時は関連削除）

## 3. テーブル定義

### 3.1 categories（カテゴリ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| name | VARCHAR(50) | NOT NULL | - | カテゴリ名（例: 和食, 洋食, 中華, デザート） |
| created_at | DATETIME | NOT NULL | - | 作成日時 |
| updated_at | DATETIME | NOT NULL | - | 更新日時 |

- インデックス: `UNIQUE INDEX (name)`
- 初期データはseedで投入（和食/洋食/中華/デザート など）
- カテゴリは固定リストとして運用し、アプリ画面からのユーザーによる新規追加・編集は不可とする（追加が必要な場合はseed・管理者操作で対応）

### 3.2 recipes（レシピ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| category_id | BIGINT UNSIGNED | NOT NULL | - | FK → categories.id |
| title | VARCHAR(100) | NOT NULL | - | 料理名 |
| cooking_time | INT UNSIGNED | NULL | NULL | 調理時間（分） |
| servings | INT UNSIGNED | NULL | NULL | 人数（人前） |
| calories | INT UNSIGNED | NULL | NULL | カロリー（kcal） |
| source_url | VARCHAR(2048) | NULL | NULL | 参照元WebページのURL（任意入力） |
| created_at | DATETIME | NOT NULL | - | 作成日時 |
| updated_at | DATETIME | NOT NULL | - | 更新日時 |

- インデックス: `INDEX (category_id)`、`INDEX (title)`（キーワード検索用）
- 外部キー: `category_id REFERENCES categories(id)` ON DELETE RESTRICT
  - カテゴリ使用中は削除不可とし、誤操作でレシピのカテゴリが失われるのを防ぐ

### 3.3 ingredients（材料）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | FK → recipes.id |
| name | VARCHAR(100) | NOT NULL | - | 材料名（例: 玉ねぎ） |
| quantity | VARCHAR(50) | NULL | NULL | 分量（例: 1個, 200g） |
| position | INT UNSIGNED | NOT NULL | 0 | 表示順 |
| created_at | DATETIME | NOT NULL | - | 作成日時 |
| updated_at | DATETIME | NOT NULL | - | 更新日時 |

- インデックス: `INDEX (recipe_id)`
- 外部キー: `recipe_id REFERENCES recipes(id)` ON DELETE CASCADE
- 分量は単位表記が多様（g/本/個/少々等）のため、数値と単位に分割せずVARCHARで保持する

### 3.4 steps（手順）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | FK → recipes.id |
| step_number | INT UNSIGNED | NOT NULL | - | 手順番号（1始まり） |
| description | TEXT | NOT NULL | - | 手順の内容 |
| created_at | DATETIME | NOT NULL | - | 作成日時 |
| updated_at | DATETIME | NOT NULL | - | 更新日時 |

- インデックス: `INDEX (recipe_id)`、`UNIQUE INDEX (recipe_id, step_number)`
- 外部キー: `recipe_id REFERENCES recipes(id)` ON DELETE CASCADE

### 3.5 tags（タグ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| name | VARCHAR(30) | NOT NULL | - | タグ名（例: 簡単, 時短） |
| created_at | DATETIME | NOT NULL | - | 作成日時 |
| updated_at | DATETIME | NOT NULL | - | 更新日時 |

- インデックス: `UNIQUE INDEX (name)`

### 3.6 recipe_tags（レシピ-タグ 中間テーブル）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | NOT NULL | AUTO_INCREMENT | PK |
| recipe_id | BIGINT UNSIGNED | NOT NULL | - | FK → recipes.id |
| tag_id | BIGINT UNSIGNED | NOT NULL | - | FK → tags.id |
| created_at | DATETIME | NOT NULL | - | 作成日時 |

- インデックス: `UNIQUE INDEX (recipe_id, tag_id)`、`INDEX (tag_id)`
- 外部キー:
  - `recipe_id REFERENCES recipes(id)` ON DELETE CASCADE
  - `tag_id REFERENCES tags(id)` ON DELETE CASCADE

## 4. 主要な参照系クエリの想定

- レシピ一覧（カテゴリ絞り込み・キーワード検索）
  - `recipes` を `category_id` および `title LIKE` で絞り込み、`categories` をJOINしてカテゴリ名を取得
- レシピ詳細
  - `recipes` + `categories`（1件）+ `ingredients`（`position`順）+ `steps`（`step_number`順）+ `tags`（`recipe_tags`経由）

## 5. 今後の検討事項

- タグによる一覧の絞り込み検索は今回のスコープ外とする（タグは詳細画面での表示用途のみ）。将来対応する場合は `recipe_tags` へのJOIN・INDEXを見直す。
- データ量が数百件程度の想定のため、現時点ではキーワード検索に全文検索インデックスは導入しない（`LIKE`検索で十分と判断）。
