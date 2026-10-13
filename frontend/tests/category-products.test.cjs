const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the actual API module, replacing only the network transport.
function loadApi(get = async () => { throw new Error("Unexpected request"); }) {
  const filename = path.join(__dirname, "../src/lib/storeproducts/categoryProducts.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) { ${source}\n})`, { filename })(
    (name) => {
      assert.equal(name, "../http3");
      return { http3: { get } };
    }, module, module.exports,
  );
  return module.exports;
}

test("uses the route slug and API defaults", () => {
  const { readCategoryQuery } = loadApi();
  assert.deepEqual(readCategoryQuery("grocery-food", new URLSearchParams()), {
    category: "grocery-food", page: 1, limit: 12, search: undefined,
    min_price: undefined, max_price: undefined, min_rating: undefined, sort_by: "newest",
  });
});

test("reads supported server filters, including zero prices", () => {
  const { readCategoryQuery } = loadApi();
  const query = readCategoryQuery("grocery-food", new URLSearchParams({
    page: "3", search: "  urad dal  ", min_price: "0", max_price: "120.5", min_rating: "4", sort_by: "rating",
  }));
  assert.equal(query.page, 3);
  assert.equal(query.search, "urad dal");
  assert.equal(query.min_price, 0);
  assert.equal(query.max_price, 120.5);
  assert.equal(query.min_rating, 4);
  assert.equal(query.sort_by, "rating");
});

test("rejects malformed numeric URL parameters and unsupported sort", () => {
  const { readCategoryQuery } = loadApi();
  for (const page of ["0", "-1", "1.5", "Infinity", "NaN", "9007199254740992"]) {
    const query = readCategoryQuery("food", new URLSearchParams({ page, min_price: "-1", max_price: "Infinity", min_rating: "6", sort_by: "price_asc" }));
    assert.equal(query.page, 1);
    assert.equal(query.min_price, undefined);
    assert.equal(query.max_price, undefined);
    assert.equal(query.min_rating, undefined);
    assert.equal(query.sort_by, "newest");
  }
});

test("preserves every supported sort value", () => {
  const { readCategoryQuery } = loadApi();
  for (const sort_by of ["newest", "price_low", "price_high", "rating"]) {
    assert.equal(readCategoryQuery("food", new URLSearchParams({ sort_by })).sort_by, sort_by);
  }
});

test("calls the category endpoint with snake_case parameters and cancellation signal", async () => {
  const controller = new AbortController();
  const response = { success: true, category: { name: "Grocery & Food" }, pagination: { totalProducts: 0 }, products: [] };
  const { getCategoryProducts, readCategoryQuery } = loadApi(async (url, options) => {
    assert.equal(url, "/api/products/categorywiseproducts");
    assert.equal(options.params.category, "grocery-food");
    assert.equal(options.params.min_price, 50);
    assert.equal(options.params.sort_by, "price_low");
    assert.equal(options.signal, controller.signal);
    return { data: response };
  });
  const result = await getCategoryProducts(readCategoryQuery("grocery-food", new URLSearchParams({ min_price: "50", sort_by: "price_low" })), controller.signal);
  assert.equal(result, response);
});

test("reports unsuccessful or malformed API responses", async () => {
  for (const data of [null, { success: false }, { success: true, category: {}, pagination: {}, products: null }]) {
    const { getCategoryProducts } = loadApi(async () => ({ data }));
    await assert.rejects(getCategoryProducts({ category: "food" }), /temporarily unavailable/);
  }
});

test("preserves transport errors for retry and missing-category handling", async () => {
  const error = { status: 404, message: "Category not found" };
  const { getCategoryProducts } = loadApi(async () => { throw error; });
  await assert.rejects(getCategoryProducts({ category: "missing" }), (actual) => actual === error);
});
