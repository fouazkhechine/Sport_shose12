// ViewProducts.js — Vue component for the products catalog
// Uses jQuery for the real-time search (keyup → GET /products?q=)

window.ViewProducts  {
  name: "ViewProducts",

  setup() {
    const { ref, onMounted, onUnmounted, computed } = Vue;

    const products = ref([]);
    const loading = ref(true);
    const apiError = ref("");
    const sortBy = ref("default");

    /* ---- Fetch products ---- */
    async function fetchProducts(query = "") {
      loading.value = true;
      apiError.value = "";
      try {
        const url = query
  ? `/products?q=${encodeURIComponent(query)}`
  : "/products";
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        products.value = await resp.json();
      } catch (err) {
        apiError.value = "Failed to load products. Is the backend running?";
      } finally {
        loading.value = false;
      }
    }

    /* ---- Sorted products ---- */
    const sortedProducts = computed(() => {
      const list = [...products.value];
      if (sortBy.value === "price-asc") return list.sort((a, b) => a.price - b.price);
      if (sortBy.value === "price-desc") return list.sort((a, b) => b.price - a.price);
      if (sortBy.value === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
      return list; // default = newest first (as returned by API)
    });

    /* ---- jQuery debounced search ---- */
    let searchDebounce = null;

    function initSearch() {
      if (typeof $ === "undefined") {
        document.getElementById("search-input")?.addEventListener("input", e => {
          clearTimeout(searchDebounce);
          searchDebounce = setTimeout(() => fetchProducts(e.target.value.trim()), 280);
        });
        return;
      }
      $(document).on("keyup.search", "#search-input", function () {
        const q = $(this).val().trim();
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => fetchProducts(q), 280);
      });
    }

    function destroySearch() {
      clearTimeout(searchDebounce);
      if (typeof $ !== "undefined") $(document).off("keyup.search");
    }

    onMounted(() => {
      fetchProducts();
      setTimeout(initSearch, 50);
    });
    onUnmounted(destroySearch);

    /* ---- Helpers ---- */
    function formatPrice(p) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p);
    }

  function imgFallback(e) {
  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%230d1120' width='400' height='300'/%3E%3Ctext fill='%23888' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='48'%3E👟%3C/text%3E%3C/svg%3E";
}

    // Pick a badge label based on index / price — demo heuristic
    function getBadge(product, idx) {
      if (idx === 0) return { label: "Hot", cls: "hot" };
      if (product.price < 80) return { label: "Sale", cls: "sale" };
      if (idx % 3 === 0) return { label: "New", cls: "new" };
      return null;
    }

    return { sortedProducts, products, loading, apiError, sortBy, formatPrice, imgFallback, getBadge };
  },

  template: `
  <div>
    <div class="section-header">
      <div class="section-title-group">
        <div class="section-label">✦ Collection</div>
        <h2 class="section-title">All Shoes</h2>
        <p class="section-sub">Browse our full sport footwear lineup</p>
      </div>
      <span class="count-badge" v-if="!loading && !apiError">
        {{ products.length }} {{ products.length === 1 ? 'item' : 'items' }}
      </span>
    </div>

    <!-- Toolbar: search + sort + view -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-icon-svg" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="search-input"
          type="text"
          placeholder="Search shoes, brands…"
          autocomplete="off"
        />
      </div>

      <select class="sort-select" v-model="sortBy" id="sort-select">
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
        <option value="name">Name: A → Z</option>
      </select>

      <div class="view-toggle">
        <button class="view-btn active" title="Grid view" id="view-grid">⊞</button>
        <button class="view-btn" title="List view" id="view-list">☰</button>
      </div>
    </div>

    <!-- Grid -->
    <div class="products-grid">

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner-wrap">
          <div class="spinner"></div>
          <span class="spinner-text">Loading products…</span>
        </div>
      </div>

      <!-- API error -->
      <div v-else-if="apiError" class="state-box">
        <div class="state-icon-wrap">⚠️</div>
        <div class="state-title">Connection Error</div>
        <p class="state-desc">{{ apiError }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="sortedProducts.length === 0" class="state-box">
        <div class="state-icon-wrap">👟</div>
        <div class="state-title">No shoes found</div>
        <p class="state-desc">Try a different search term, or be the first to add some shoes to the catalog!</p>
      </div>

      <!-- Cards -->
      <div
        v-else
        v-for="(product, idx) in sortedProducts"
        :key="product.id"
        class="product-card"
        :style="{ animationDelay: idx * 0.055 + 's' }"
      >
        <div class="card-img-wrap">
          <img
            :src="product.image"
            :alt="product.name"
            class="card-img"
            @error="imgFallback"
          />
          <div class="card-overlay">
            <span
              v-if="getBadge(product, idx)"
              class="card-badge"
              :class="getBadge(product, idx).cls"
            >{{ getBadge(product, idx).label }}</span>
            <span v-else></span>
            <button class="card-wishlist" title="Save to wishlist">♡</button>
          </div>
        </div>

        <div class="card-body">
          <div class="card-brand">Sport Shoes</div>
          <div class="card-name">{{ product.name }}</div>
          <div class="card-desc">{{ product.description }}</div>
          <div class="card-footer">
            <div class="card-price">{{ formatPrice(product.price) }}</div>
            <button class="card-add-btn" title="Add to cart">+</button>
          </div>
        </div>
      </div>

    </div>
  </div>
  `,
};
