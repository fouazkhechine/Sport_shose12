// AddProduct.js — Vue component for adding a new product
// Composition API; communicates with Flask POST /products

window.AddProduct{
  name: "AddProduct",
  emits: ["product-added"],

  setup(_, { emit }) {
    const { ref, reactive, computed } = Vue;

    /* ---- Form state ---- */
    const form = reactive({ name: "", description: "", price: "", image: "" });
    const errors = reactive({});
    const loading = ref(false);
    const preview = ref("");

    /* ---- Live image preview ---- */
    function onImageInput() {
      preview.value = form.image.trim();
    }

    /* ---- Step indicator (1 = basic info, 2 = pricing+image) ---- */
    const currentStep = computed(() => {
      if (!form.name.trim() && !form.description.trim()) return 1;
      if (!form.price && !form.image) return 2;
      return 3;
    });

    /* ---- Validation ---- */
    function validate() {
      Object.keys(errors).forEach(k => delete errors[k]);

      if (!form.name.trim()) errors.name = "Product name is required.";
      if (!form.description.trim()) errors.description = "Description is required.";
      if (!form.image.trim()) errors.image = "Image URL is required.";

      const priceVal = parseFloat(form.price);
      if (form.price === "" || form.price === null) {
        errors.price = "Price is required.";
      } else if (isNaN(priceVal) || priceVal < 0) {
        errors.price = "Enter a valid non-negative price.";
      }

      return Object.keys(errors).length === 0;
    }

    /* ---- Submit ---- */
    async function submit() {
      if (!validate() || loading.value) return;

      loading.value = true;
      try {
        const resp = await fetch("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            price: parseFloat(form.price),
            image: form.image.trim(),
          }),
        });

        const data = await resp.json();

        if (!resp.ok) {
          if (data.errors) Object.assign(errors, data.errors);
          else errors.general = data.error || "Something went wrong.";
          return;
        }

        Object.assign(form, { name: "", description: "", price: "", image: "" });
        preview.value = "";
        emit("product-added");

      } catch (err) {
        errors.general = "Cannot reach the server. Is the backend running?";
      } finally {
        loading.value = false;
      }
    }

    /* ---- Reset ---- */
    function reset() {
      Object.assign(form, { name: "", description: "", price: "", image: "" });
      Object.keys(errors).forEach(k => delete errors[k]);
      preview.value = "";
    }

    /* ---- Helpers ---- */
    function formatPrice(p) {
      if (!p || isNaN(+p)) return "—";
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(+p);
    }

    const descCount = computed(() => form.description.length);

    return { form, errors, loading, preview, submit, reset, onImageInput, currentStep, formatPrice, descCount };
  },

  template: `
  <div>
    <div class="section-header">
      <div class="section-title-group">
        <div class="section-label">✦ Inventory</div>
        <h2 class="section-title">Add New Shoe</h2>
        <p class="section-sub">Fill in the details to list a product in the catalog</p>
      </div>
    </div>

    <div class="add-product-layout">

      <!-- ===== FORM ===== -->
      <div class="form-card">

        <!-- Progress steps -->
        <div class="form-steps">
          <div class="form-step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
            <div class="step-circle">{{ currentStep > 1 ? '✓' : '1' }}</div>
            <span class="step-label">Details</span>
          </div>
          <div class="form-step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
            <div class="step-circle">{{ currentStep > 2 ? '✓' : '2' }}</div>
            <span class="step-label">Pricing</span>
          </div>
          <div class="form-step" :class="{ active: currentStep >= 3 }">
            <div class="step-circle">3</div>
            <span class="step-label">Review</span>
          </div>
        </div>

        <!-- General error banner -->
        <div v-if="errors.general" class="error-banner">
          <span>⚠</span> {{ errors.general }}
        </div>

        <!-- Product Name -->
        <div class="form-group">
          <label for="f-name">
            <span class="lbl-icon">✏️</span> Product Name
          </label>
          <input
            id="f-name"
            v-model="form.name"
            type="text"
            placeholder="e.g. Air Max Pro 2025"
            :class="{ 'field-error': errors.name }"
            autocomplete="off"
          />
          <span v-if="errors.name" class="error-msg">⚑ {{ errors.name }}</span>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="f-desc">
            <span class="lbl-icon">📝</span> Description
          </label>
          <textarea
            id="f-desc"
            v-model="form.description"
            placeholder="Describe the shoe — materials, fit, technology, use-case…"
            :class="{ 'field-error': errors.description }"
            maxlength="400"
          ></textarea>
          <div class="char-count">{{ descCount }}/400</div>
          <span v-if="errors.description" class="error-msg">⚑ {{ errors.description }}</span>
        </div>

        <!-- Price + Image URL (two-col) -->
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label for="f-price">
              <span class="lbl-icon">💲</span> Price ($)
            </label>
            <div class="input-wrap">
              <span class="input-prefix">$</span>
              <input
                id="f-price"
                v-model="form.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="has-prefix"
                :class="{ 'field-error': errors.price }"
              />
            </div>
            <span v-if="errors.price" class="error-msg">⚑ {{ errors.price }}</span>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label for="f-image">
              <span class="lbl-icon">🖼️</span> Image URL
            </label>
            <input
              id="f-image"
              v-model="form.image"
              type="url"
              placeholder="https://…/shoe.jpg"
              :class="{ 'field-error': errors.image }"
              @input="onImageInput"
            />
            <span v-if="errors.image" class="error-msg">⚑ {{ errors.image }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            class="btn btn-primary btn-lg"
            @click="submit"
            :disabled="loading"
            id="btn-submit-product"
          >
            <span v-if="loading" class="submit-spinner"></span>
            <span v-if="loading">Saving…</span>
            <span v-else>✦ &nbsp;Add to Catalog</span>
          </button>
          <button class="btn btn-ghost" @click="reset" id="btn-reset-form">Reset</button>
        </div>

      </div><!-- /form-card -->

      <!-- ===== PREVIEW PANE ===== -->
      <aside class="preview-pane">
        <div class="preview-pane-title">Live Preview</div>

        <div class="preview-img-box" :class="{ 'has-image': preview }">
          <img v-if="preview" :src="preview" alt="Preview" @error="preview = ''" />
          <span v-else>🖼️</span>
        </div>

        <div class="mini-card">
          <div class="card-brand">Sport Shoes</div>
          <div class="mini-card-name">{{ form.name || 'Product name…' }}</div>
          <div class="mini-card-price">{{ formatPrice(form.price) }}</div>
        </div>

        <p style="font-size:0.78rem; color:var(--text-muted); line-height:1.5;">
          Fill in the form fields and your product will appear instantly here before saving.
        </p>
      </aside>

    </div><!-- /add-product-layout -->
  </div>
  `,
};
