// app.js — Vue 3 root (Composition API)
// SoleVault — Sport Shoes Catalog



const { createApp, ref } = Vue;

createApp({
  components: { AddProduct, ViewProducts },

  setup() {
    const activeView = ref("view");

    // Toast state
    const toast = ref(false);
    const toastMsg = ref("");
    const toastType = ref("success"); // "success" | "error"
    let toastTimer = null;

    function showToast(msg, type = "success") {
      toastMsg.value = msg;
      toastType.value = type;
      toast.value = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (toast.value = false), 3800);
    }

    function dismissToast() { toast.value = false; }

    function navigate(view) { activeView.value = view; }

    function onProductAdded() {
      showToast("Product added to the catalog!", "success");
      setTimeout(() => navigate("view"), 700);
    }

    return { activeView, toast, toastMsg, toastType, navigate, onProductAdded, dismissToast };
  },

  template: `
    <!-- ===== HEADER ===== -->
    <header>
      <div class="header-inner">
        <a class="logo" href="#" @click.prevent>
          <div class="logo-icon">👟</div>
          <div class="logo-text">
            <span class="logo-title">SoleVault</span>
            <span class="logo-sub">Sport Catalog</span>
          </div>
        </a>

        <nav>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'view' }"
            @click="navigate('view')"
            id="nav-view"
          >
            <span class="tab-icon">☷</span> Catalog
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeView === 'add' }"
            @click="navigate('add')"
            id="nav-add"
          >
            <span class="tab-icon">＋</span> Add Shoe
          </button>
        </nav>

        <div class="header-badge">
          <span class="header-badge-dot"></span>
          Live
        </div>
      </div>
    </header>

    <!-- ===== HERO ===== -->
    <section class="hero" v-if="activeView === 'view'">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="hero-tag">✦ New Season 2025</div>
          <h1 class="hero-title">
            Find Your <span class="gradient-text">Perfect Pair</span><br/>of Sport Shoes
          </h1>
          <p class="hero-desc">
            Explore our curated collection of premium sport footwear — from road runners to court champions.
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-value">500+</span>
              <span class="stat-label">Styles</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">30+</span>
              <span class="stat-label">Brands</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">4.9★</span>
              <span class="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-shoe-card">
            <span class="hero-shoe-icon">🏃</span>
            <div class="hero-shoe-name">Running</div>
            <div class="hero-shoe-price">$89+</div>
          </div>
          <div class="hero-shoe-card">
            <span class="hero-shoe-icon">⛹️</span>
            <div class="hero-shoe-name">Basketball</div>
            <div class="hero-shoe-price">$120+</div>
          </div>
          <div class="hero-shoe-card">
            <span class="hero-shoe-icon">🥾</span>
            <div class="hero-shoe-name">Trail</div>
            <div class="hero-shoe-price">$110+</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== MAIN CONTENT ===== -->
    <main>
      <transition name="fade" mode="out-in">
        <add-product
          v-if="activeView === 'add'"
          key="add"
          @product-added="onProductAdded"
        />
        <view-products
          v-else
          key="view"
        />
      </transition>
    </main>

    <!-- ===== FOOTER ===== -->
    <footer class="app-footer">
      <p>© 2025 <span>SoleVault</span> · Premium Sport Shoes Catalog</p>
    </footer>

    <!-- ===== TOAST ===== -->
    <transition name="fade">
      <div v-if="toast" class="toast" :class="toastType">
        <span class="toast-icon">{{ toastType === 'success' ? '✓' : '✕' }}</span>
        {{ toastMsg }}
        <button class="toast-close" @click="dismissToast">×</button>
      </div>
    </transition>
  `,
}).mount("#app");
