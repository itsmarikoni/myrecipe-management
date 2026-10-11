// ==============================
// データ層（localStorage）
// ==============================
const STORAGE_KEY = "recipes";

const SAMPLE_RECIPES = [
  {
    id: 1,
    name: "肉じゃが",
    category: "和食",
    tags: ["定番", "煮物"],
    time: 30,
    servings: 2,
    calories: 450,
    ingredients: ["じゃがいも 3個", "玉ねぎ 1個", "牛肉 200g", "しょうゆ 大さじ3"],
    steps: ["野菜を切る", "肉と野菜を炒める", "だしと調味料を入れて煮込む"],
    sourceUrl: "https://cookpad.com/recipe/123456",
  },
  {
    id: 2,
    name: "ナポリタン",
    category: "洋食",
    tags: ["簡単", "時短"],
    time: 20,
    servings: 1,
    calories: 600,
    ingredients: ["パスタ 100g", "ケチャップ 大さじ4", "ウインナー 2本", "ピーマン 1個"],
    steps: ["パスタを茹でる", "具材を炒める", "ケチャップを絡めて仕上げる"],
    sourceUrl: "",
  },
  {
    id: 3,
    name: "麻婆豆腐",
    category: "中華",
    tags: ["辛い", "ご飯に合う"],
    time: 25,
    servings: 2,
    calories: 500,
    ingredients: ["豆腐 1丁", "ひき肉 150g", "豆板醤 小さじ1", "ねぎ 1本"],
    steps: ["ひき肉と豆板醤を炒める", "豆腐を加えて煮る", "水溶き片栗粉でとろみをつける"],
    sourceUrl: "https://www.kurashiru.com/recipes/example",
  },
  {
    id: 4,
    name: "ティラミス",
    category: "デザート",
    tags: ["冷やす", "おもてなし"],
    time: 40,
    servings: 4,
    calories: 350,
    ingredients: ["マスカルポーネ 250g", "卵 2個", "コーヒー 適量", "ココアパウダー 適量"],
    steps: ["クリームを作る", "スポンジにコーヒーを染み込ませて重ねる", "冷蔵庫で冷やしココアをふる"],
    sourceUrl: "https://www.kurashiru.com/recipes/example2",
  },
];

function loadRecipes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveRecipes(SAMPLE_RECIPES);
    return structuredClone(SAMPLE_RECIPES);
  }
  try {
    return JSON.parse(raw);
  } catch {
    saveRecipes(SAMPLE_RECIPES);
    return structuredClone(SAMPLE_RECIPES);
  }
}

function saveRecipes(recipes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function nextId(recipes) {
  return recipes.length ? Math.max(...recipes.map((r) => r.id)) + 1 : 1;
}

let recipes = loadRecipes();
let currentDetailId = null;
let currentFormMode = "new"; // "new" | "edit"
let currentFormId = null;

// ==============================
// 画面切り替え
// ==============================
const screens = {
  list: document.getElementById("screen-list"),
  detail: document.getElementById("screen-detail"),
  form: document.getElementById("screen-form"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => (el.hidden = true));
  screens[name].hidden = false;
  hideGlobalError();
  window.scrollTo(0, 0);
}

function showGlobalError(message) {
  const el = document.getElementById("global-error");
  el.textContent = message;
  el.hidden = false;
}

function hideGlobalError() {
  const el = document.getElementById("global-error");
  el.hidden = true;
}

// ==============================
// S1: レシピ一覧画面
// ==============================
function renderList() {
  const keyword = document.getElementById("search-keyword").value.trim();
  const category = document.getElementById("filter-category").value;

  const filtered = recipes.filter((r) => {
    const matchKeyword = !keyword || r.name.includes(keyword);
    const matchCategory = !category || r.category === category;
    return matchKeyword && matchCategory;
  });

  const listEl = document.getElementById("recipe-list");
  const emptyEl = document.getElementById("empty-message");
  listEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  filtered.forEach((r) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${escapeHtml(r.name)}</h3>
      <p>カテゴリ: ${escapeHtml(r.category || "未分類")}</p>
      <p>調理時間: ${r.time ? `${r.time}分` : "未登録"}</p>
    `;
    card.addEventListener("click", () => openDetail(r.id));
    listEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

document.getElementById("btn-search").addEventListener("click", renderList);
document.getElementById("search-keyword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") renderList();
});
document.getElementById("filter-category").addEventListener("change", renderList);
document.getElementById("btn-new").addEventListener("click", () => openForm("new"));

// ==============================
// S2: レシピ詳細画面
// ==============================
function openDetail(id) {
  currentDetailId = id;
  const recipe = recipes.find((r) => r.id === id);

  const notFoundEl = document.getElementById("detail-not-found");
  const contentEl = document.getElementById("detail-content");

  if (!recipe) {
    notFoundEl.hidden = false;
    contentEl.hidden = true;
    showScreen("detail");
    return;
  }

  notFoundEl.hidden = true;
  contentEl.hidden = false;

  document.getElementById("detail-title").textContent = recipe.name;
  document.getElementById("detail-category").textContent = recipe.category || "未分類";
  document.getElementById("detail-tags").textContent = recipe.tags.length ? recipe.tags.join(", ") : "なし";
  document.getElementById("detail-time").textContent = recipe.time ? `${recipe.time}分` : "未登録";
  document.getElementById("detail-servings").textContent = recipe.servings ? `${recipe.servings}人前` : "未登録";
  document.getElementById("detail-calories").textContent = recipe.calories ? `${recipe.calories}kcal` : "未登録";

  const sourceRowEl = document.getElementById("detail-source-row");
  const sourceUrlEl = document.getElementById("detail-source-url");
  if (recipe.sourceUrl) {
    sourceUrlEl.href = recipe.sourceUrl;
    sourceUrlEl.textContent = recipe.sourceUrl;
    sourceRowEl.hidden = false;
  } else {
    sourceRowEl.hidden = true;
  }

  const ingredientsEl = document.getElementById("detail-ingredients");
  ingredientsEl.innerHTML = recipe.ingredients.length
    ? recipe.ingredients.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : `<li class="empty-list-item">材料は未登録です</li>`;

  const stepsEl = document.getElementById("detail-steps");
  stepsEl.innerHTML = recipe.steps.length
    ? recipe.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")
    : `<li class="empty-list-item">作り方は未登録です</li>`;

  showScreen("detail");
}

document.getElementById("btn-back-to-list-from-detail").addEventListener("click", () => {
  renderList();
  showScreen("list");
});
document.getElementById("btn-back-to-list-from-notfound").addEventListener("click", () => {
  renderList();
  showScreen("list");
});

document.getElementById("btn-edit").addEventListener("click", () => {
  openForm("edit", currentDetailId);
});

document.getElementById("btn-delete").addEventListener("click", () => {
  if (!confirm("本当に削除しますか？")) return;
  recipes = recipes.filter((r) => r.id !== currentDetailId);
  saveRecipes(recipes);
  renderList();
  showScreen("list");
});

// ==============================
// S3: レシピ登録編集フォーム画面
// ==============================
function openForm(mode, id = null) {
  currentFormMode = mode;
  currentFormId = id;

  document.getElementById("recipe-form").reset();
  clearAllErrors();

  const ingredientsFieldsEl = document.getElementById("ingredients-fields");
  const stepsFieldsEl = document.getElementById("steps-fields");
  ingredientsFieldsEl.innerHTML = "";
  stepsFieldsEl.innerHTML = "";

  if (mode === "edit") {
    const recipe = recipes.find((r) => r.id === id);
    document.getElementById("form-title").textContent = `編集：${recipe.name}`;
    document.getElementById("f-name").value = recipe.name;
    document.getElementById("f-category").value = recipe.category;
    document.getElementById("f-tags").value = recipe.tags.join(", ");
    document.getElementById("f-time").value = recipe.time;
    document.getElementById("f-servings").value = recipe.servings;
    document.getElementById("f-calories").value = recipe.calories;
    document.getElementById("f-source-url").value = recipe.sourceUrl || "";
    recipe.ingredients.forEach((v) => addRepeatField(ingredientsFieldsEl, v));
    recipe.steps.forEach((v) => addRepeatField(stepsFieldsEl, v));
  } else {
    document.getElementById("form-title").textContent = "新規登録";
    addRepeatField(ingredientsFieldsEl, "");
    addRepeatField(stepsFieldsEl, "");
  }

  showScreen("form");
}

function addRepeatField(container, value) {
  const row = document.createElement("div");
  row.className = "repeat-field";
  row.innerHTML = `
    <input type="text" value="${escapeHtml(value)}">
    <button type="button" class="remove-btn">×</button>
  `;
  row.querySelector(".remove-btn").addEventListener("click", () => {
    if (container.children.length > 1) {
      row.remove();
    }
  });
  container.appendChild(row);
}

document.getElementById("btn-add-ingredient").addEventListener("click", () => {
  addRepeatField(document.getElementById("ingredients-fields"), "");
});
document.getElementById("btn-add-step").addEventListener("click", () => {
  addRepeatField(document.getElementById("steps-fields"), "");
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  if (currentFormMode === "edit" && currentFormId != null) {
    openDetail(currentFormId);
  } else {
    renderList();
    showScreen("list");
  }
});
document.getElementById("btn-back-to-list-from-form").addEventListener("click", () => {
  renderList();
  showScreen("list");
});

function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.hidden = true;
    el.textContent = "";
  });
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function setFieldError(fieldEl, errorEl, message) {
  fieldEl.classList.add("invalid");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function getRepeatFieldValues(container) {
  return Array.from(container.querySelectorAll("input"))
    .map((i) => i.value.trim())
    .filter((v) => v.length > 0);
}

function validateNumberField(value) {
  if (value === "") return true; // 任意項目
  return /^[0-9]+$/.test(value);
}

document.getElementById("recipe-form").addEventListener("submit", (e) => {
  e.preventDefault();
  clearAllErrors();

  let hasError = false;

  const nameInput = document.getElementById("f-name");
  const name = nameInput.value.trim();
  if (!name) {
    setFieldError(nameInput, document.getElementById("err-name"), "料理名は必須です");
    hasError = true;
  }

  const ingredientsContainer = document.getElementById("ingredients-fields");
  const ingredients = getRepeatFieldValues(ingredientsContainer);

  const stepsContainer = document.getElementById("steps-fields");
  const steps = getRepeatFieldValues(stepsContainer);

  const categorySelect = document.getElementById("f-category");
  const category = categorySelect.value;

  const timeInput = document.getElementById("f-time");
  const servingsInput = document.getElementById("f-servings");
  const caloriesInput = document.getElementById("f-calories");

  if (!validateNumberField(timeInput.value.trim())) {
    setFieldError(timeInput, document.getElementById("err-time"), "数値を入力してください");
    hasError = true;
  }
  if (!validateNumberField(servingsInput.value.trim())) {
    setFieldError(servingsInput, document.getElementById("err-servings"), "数値を入力してください");
    hasError = true;
  }
  if (!validateNumberField(caloriesInput.value.trim())) {
    setFieldError(caloriesInput, document.getElementById("err-calories"), "数値を入力してください");
    hasError = true;
  }

  const sourceUrlInput = document.getElementById("f-source-url");
  const sourceUrl = sourceUrlInput.value.trim();
  if (sourceUrl !== "" && !/^https?:\/\/.+/.test(sourceUrl)) {
    setFieldError(sourceUrlInput, document.getElementById("err-source-url"), "http(s)://から始まるURLを入力してください");
    hasError = true;
  }

  if (hasError) return;

  const tags = document.getElementById("f-tags").value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const recipeData = {
    name,
    category,
    tags,
    time: timeInput.value.trim() === "" ? 0 : Number(timeInput.value.trim()),
    servings: servingsInput.value.trim() === "" ? 0 : Number(servingsInput.value.trim()),
    calories: caloriesInput.value.trim() === "" ? 0 : Number(caloriesInput.value.trim()),
    ingredients,
    steps,
    sourceUrl,
  };

  if (currentFormMode === "edit") {
    const idx = recipes.findIndex((r) => r.id === currentFormId);
    recipes[idx] = { ...recipes[idx], ...recipeData };
    saveRecipes(recipes);
    openDetail(currentFormId);
  } else {
    const newRecipe = { id: nextId(recipes), ...recipeData };
    recipes.push(newRecipe);
    saveRecipes(recipes);
    renderList();
    showScreen("list");
  }
});

// ==============================
// 初期化
// ==============================
renderList();
showScreen("list");
