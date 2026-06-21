(function () {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg',
    projectId: 'chic-charms-store'
  };

  const API_BASE = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId + '/databases/(default)/documents';
  let datasetPromise = null;

  const FALLBACK_BACKEND_CATEGORIES = [
    {
      id: 'everyday-elegance',
      slug: 'everyday-elegance',
      name: 'Everyday Elegance',
      title: 'Everyday Elegance',
      description: 'Timeless pieces designed for effortless sophistication and everyday beauty.',
      shortDescription: 'Timeless pieces for everyday beauty.',
      heroImage: 'images/style-everyday-elegance.png',
      editorialImage: 'images/editorial-minimal-soul-closeup.png'
    },
    {
      id: 'modern-romance',
      slug: 'modern-romance',
      name: 'Modern Romance',
      title: 'Modern Romance',
      description: 'Softly feminine designs created for graceful styling, romantic moods, and polished gifting moments.',
      shortDescription: 'Feminine designs with a romantic mood.',
      heroImage: 'images/style-modern-romance.jpg',
      editorialImage: 'images/story-soft-pearl-drop.png'
    },
    {
      id: 'after-dark',
      slug: 'after-dark',
      name: 'After Dark',
      title: 'After Dark',
      description: 'Bold designs created for evenings, celebrations, and unforgettable moments.',
      shortDescription: 'Evening-led pieces with standout presence.',
      heroImage: 'images/style-after-dark.png',
      editorialImage: 'images/editorial-soft-date-night.png'
    },
    {
      id: 'heritage-muse',
      slug: 'heritage-muse',
      name: 'Heritage Muse',
      title: 'Heritage Muse',
      description: 'Heritage-inspired pieces blending timeless Indian elegance with a refined modern finish.',
      shortDescription: 'Traditional elegance with a modern finish.',
      heroImage: 'images/style-heritage-muse.png',
      editorialImage: 'images/editorial-light-meets-gold.png'
    }
  ];

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function formatPrice(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN');
  }

  function readField(fields, key) {
    const field = fields && fields[key];
    if (!field) return null;
    if (Object.prototype.hasOwnProperty.call(field, 'stringValue')) return field.stringValue;
    if (Object.prototype.hasOwnProperty.call(field, 'integerValue')) return field.integerValue;
    if (Object.prototype.hasOwnProperty.call(field, 'doubleValue')) return field.doubleValue;
    if (Object.prototype.hasOwnProperty.call(field, 'booleanValue')) return field.booleanValue;
    if (Object.prototype.hasOwnProperty.call(field, 'timestampValue')) return field.timestampValue;
    return null;
  }

  function readNestedString(fields, path) {
    let current = fields;
    for (let i = 0; i < path.length; i += 1) {
      const key = path[i];
      if (!current || !current[key]) return null;
      const node = current[key];
      if (i === path.length - 1) {
        if (node.stringValue) return node.stringValue;
        if (node.integerValue) return node.integerValue;
        if (node.doubleValue) return node.doubleValue;
        return null;
      }
      current = node.mapValue && node.mapValue.fields;
    }
    return null;
  }

  function parseFirestoreProduct(doc) {
    const fields = doc && doc.fields ? doc.fields : {};
    const name = readField(fields, 'name') || readField(fields, 'title') || 'Chic Charms Piece';
    const product = {
      id: String((doc && doc.name ? doc.name.split('/').pop() : '') || slugify(name) || 'chic-charms-piece'),
      name: name,
      title: name,
      price: Number(readField(fields, 'price') || 0),
      image:
        readField(fields, 'image') ||
        readField(fields, 'variantProductImage') ||
        readNestedString(fields, ['images', 'productImage']) ||
        readNestedString(fields, ['images', 'modelImage']) ||
        readField(fields, 'variantModelImage') ||
        '',
      modelImage:
        readField(fields, 'variantModelImage') ||
        readNestedString(fields, ['images', 'modelImage']) ||
        readField(fields, 'image') ||
        readField(fields, 'variantProductImage') ||
        '',
      category: String(readField(fields, 'category') || '').trim(),
      description: String(readField(fields, 'description') || '').trim(),
      tag: String(readField(fields, 'tag') || '').trim(),
      stock: Number(readField(fields, 'stock') || readField(fields, 'variantStock') || 0),
      createdAt: String(readField(fields, 'createdAt') || ''),
      pieceType: String(readField(fields, 'pieceType') || '').trim()
    };

    product.categorySlug = slugify(product.category);
    product.categoryText = normalizeText(product.category);
    product.searchText = normalizeText([
      product.name,
      product.category,
      product.description,
      product.tag,
      product.pieceType
    ].join(' '));

    return product;
  }

  function parseCategoryDoc(doc) {
    const fields = doc && doc.fields ? doc.fields : {};
    const name = String(readField(fields, 'name') || readField(fields, 'title') || readField(fields, 'label') || '').trim();
    if (!name) return null;
    const slug = slugify(readField(fields, 'slug') || name);
    return {
      id: String((doc && doc.name ? doc.name.split('/').pop() : '') || slug),
      slug: slug,
      name: name,
      label: name,
      title: String(readField(fields, 'title') || name).trim(),
      description: String(readField(fields, 'description') || '').trim(),
      shortDescription: String(readField(fields, 'shortDescription') || '').trim(),
      heroImage:
        readField(fields, 'heroImage') ||
        readField(fields, 'image') ||
        readField(fields, 'coverImage') ||
        '',
      editorialImage:
        readField(fields, 'editorialImage') ||
        readField(fields, 'secondaryImage') ||
        readField(fields, 'heroImage') ||
        '',
      raw: doc
    };
  }

  function productMatchesQuery(product, query) {
    if (!query) return true;
    const q = normalizeText(query);
    return q.split(' ').filter(Boolean).every(function (token) {
      return product.searchText.indexOf(token) !== -1;
    });
  }

  function getBestImage(products, index) {
    const list = Array.isArray(products) ? products : [];
    const preferred = list[index] || list[0] || null;
    if (preferred && (preferred.modelImage || preferred.image)) {
      return preferred.modelImage || preferred.image;
    }
    const firstWithImage = list.find(function (product) {
      return product && (product.modelImage || product.image);
    });
    return firstWithImage ? (firstWithImage.modelImage || firstWithImage.image) : 'images/hero-quiet-luxury-main.jpg';
  }

  function getTopTag(products) {
    const counts = Object.create(null);
    (products || []).forEach(function (product) {
      const key = String(product.tag || '').trim();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0] || '';
  }

  function buildDerivedDescriptions(name, products) {
    const count = (products || []).length;
    const topTag = getTopTag(products);
    const description = topTag
      ? 'Explore ' + count + ' live pieces in ' + name + ', featuring ' + topTag.toLowerCase() + ' selections from the Chic Charms backend.'
      : 'Explore ' + count + ' live pieces in ' + name + ' from the Chic Charms backend.';
    const shortDescription = topTag
      ? topTag + ' pieces curated in ' + name + '.'
      : count + ' live products in ' + name + '.';
    return { description: description, shortDescription: shortDescription };
  }

  function buildDerivedCategories(products) {
    const grouped = new Map();
    (products || []).forEach(function (product, index) {
      const categoryName = String(product.category || '').trim();
      if (!categoryName) return;
      const slug = slugify(categoryName);
      if (!grouped.has(slug)) {
        grouped.set(slug, {
          id: slug,
          slug: slug,
          name: categoryName,
          label: categoryName,
          title: categoryName,
          description: '',
          shortDescription: '',
          heroImage: '',
          editorialImage: '',
          products: [],
          index: index
        });
      }
      grouped.get(slug).products.push(product);
    });

    return Array.from(grouped.values()).map(function (category) {
      const derivedDescriptions = buildDerivedDescriptions(category.name, category.products);
      category.description = derivedDescriptions.description;
      category.shortDescription = derivedDescriptions.shortDescription;
      category.heroImage = getBestImage(category.products, 0);
      category.editorialImage = getBestImage(category.products, 1);
      category.productCount = category.products.length;
      return category;
    }).sort(function (a, b) {
      return a.index - b.index;
    });
  }

  function mergeCategoryData(categoryDocs, derivedCategories) {
    const map = new Map();
    (FALLBACK_BACKEND_CATEGORIES || []).forEach(function (fallback, index) {
      map.set(fallback.slug, {
        id: fallback.id,
        slug: fallback.slug,
        name: fallback.name,
        label: fallback.name,
        title: fallback.title || fallback.name,
        description: fallback.description || '',
        shortDescription: fallback.shortDescription || '',
        heroImage: fallback.heroImage || '',
        editorialImage: fallback.editorialImage || '',
        products: [],
        index: index
      });
    });

    (derivedCategories || []).forEach(function (category, index) {
      const existing = map.get(category.slug) || {
        id: category.id,
        slug: category.slug,
        name: category.name,
        label: category.name,
        title: category.title || category.name,
        description: '',
        shortDescription: '',
        heroImage: '',
        editorialImage: '',
        products: [],
        index: index + 100
      };
      map.set(category.slug, {
        id: category.id || existing.id,
        slug: category.slug || existing.slug,
        name: category.name || existing.name,
        label: category.name || existing.label,
        title: category.title || existing.title,
        description: existing.description || category.description || '',
        shortDescription: existing.shortDescription || category.shortDescription || '',
        heroImage: existing.heroImage || category.heroImage || '',
        editorialImage: existing.editorialImage || category.editorialImage || '',
        products: category.products || existing.products || [],
        index: existing.index
      });
    });

    (categoryDocs || []).forEach(function (docCategory, index) {
      if (!docCategory) return;
      const existing = map.get(docCategory.slug) || {
        id: docCategory.id,
        slug: docCategory.slug,
        name: docCategory.name,
        label: docCategory.name,
        title: docCategory.name,
        description: '',
        shortDescription: '',
        heroImage: '',
        editorialImage: '',
        products: [],
        index: index + 200
      };
      const derivedDescriptions = buildDerivedDescriptions(docCategory.name || existing.name, existing.products || []);
      map.set(docCategory.slug, {
        id: docCategory.id || existing.id,
        slug: docCategory.slug || existing.slug,
        name: docCategory.name || existing.name,
        label: docCategory.name || existing.label,
        title: docCategory.title || docCategory.name || existing.title,
        description: docCategory.description || existing.description || derivedDescriptions.description,
        shortDescription: docCategory.shortDescription || existing.shortDescription || derivedDescriptions.shortDescription,
        heroImage: docCategory.heroImage || existing.heroImage || getBestImage(existing.products || [], 0),
        editorialImage: docCategory.editorialImage || existing.editorialImage || getBestImage(existing.products || [], 1),
        products: existing.products || [],
        index: existing.index
      });
    });

    return Array.from(map.values()).sort(function (a, b) {
      if (a.index !== b.index) return a.index - b.index;
      return String(a.name || '').localeCompare(String(b.name || ''));
    }).map(function (category) {
      category.productCount = (category.products || []).length;
      return category;
    });
  }

  async function fetchProducts(pageSize) {
    const size = Number(pageSize) > 0 ? Number(pageSize) : 80;
    const response = await fetch(API_BASE + '/products?pageSize=' + size + '&key=' + FIREBASE_CONFIG.apiKey);
    if (!response.ok) {
      throw new Error('Failed to fetch products: ' + response.status);
    }
    const json = await response.json();
    return (json.documents || []).map(parseFirestoreProduct).filter(function (product) {
      return product && product.price > 0 && product.category;
    });
  }

  async function fetchCategoryDocs() {
    try {
      const response = await fetch(API_BASE + '/categories?pageSize=20&key=' + FIREBASE_CONFIG.apiKey);
      if (!response.ok) {
        return [];
      }
      const json = await response.json();
      return (json.documents || []).map(parseCategoryDoc).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async function loadCategoryDataset() {
    if (datasetPromise) return datasetPromise;
    datasetPromise = Promise.all([fetchProducts(80), fetchCategoryDocs()]).then(function (results) {
      const products = results[0] || [];
      const categoryDocs = results[1] || [];
      const derivedCategories = buildDerivedCategories(products);
      const categories = mergeCategoryData(categoryDocs, derivedCategories);
      const categoryMap = new Map();
      categories.forEach(function (category) {
        categoryMap.set(category.slug, category);
      });
      return { products: products, categories: categories, categoryMap: categoryMap };
    });
    return datasetPromise;
  }

  function getCategoryByInput(input, dataset) {
    const source = dataset || { categories: [] };
    const normalized = normalizeText(input);
    const slug = slugify(input);
    return (source.categories || []).find(function (category) {
      return category.slug === slug || normalizeText(category.name) === normalized || normalizeText(category.id) === normalized;
    }) || null;
  }

  function resolveProductsForCategory(products, categoryInput, dataset) {
    const source = dataset || { categories: [] };
    const category = getCategoryByInput(categoryInput, source);
    if (!category) return [];
    const target = normalizeText(category.name);
    return (products || []).filter(function (product) {
      return normalizeText(product.category) === target;
    });
  }

  function getCategoryCounts(dataset) {
    const source = dataset || { categories: [] };
    const counts = {};
    (source.categories || []).forEach(function (category) {
      counts[category.slug] = (category.products || []).length;
    });
    return counts;
  }

  function findMatchingCategories(query, dataset) {
    const source = dataset || { categories: [], products: [] };
    const q = normalizeText(query);
    if (!q) return source.categories || [];

    const matchedProductSlugs = new Set((source.products || []).filter(function (product) {
      return productMatchesQuery(product, q);
    }).map(function (product) {
      return product.categorySlug;
    }));

    return (source.categories || []).filter(function (category) {
      const nameText = normalizeText(category.name);
      const nameMatch = q.split(' ').filter(Boolean).every(function (token) {
        return nameText.indexOf(token) !== -1;
      });
      return nameMatch || matchedProductSlugs.has(category.slug);
    });
  }

  function getCategoryProductCountsForQuery(query, dataset) {
    const source = dataset || { categories: [], products: [] };
    const counts = {};
    (source.categories || []).forEach(function (category) {
      counts[category.slug] = 0;
    });
    (source.products || []).forEach(function (product) {
      if (productMatchesQuery(product, query)) {
        counts[product.categorySlug] = (counts[product.categorySlug] || 0) + 1;
      }
    });
    return counts;
  }

  window.CCCategoryUtils = {
    FIREBASE_CONFIG: FIREBASE_CONFIG,
    slugify: slugify,
    normalizeText: normalizeText,
    escapeHtml: escapeHtml,
    formatPrice: formatPrice,
    parseFirestoreProduct: parseFirestoreProduct,
    fetchProducts: fetchProducts,
    fetchCategoryDocs: fetchCategoryDocs,
    loadCategoryDataset: loadCategoryDataset,
    getCategoryByInput: getCategoryByInput,
    resolveProductsForCategory: resolveProductsForCategory,
    getCategoryCounts: getCategoryCounts,
    getCategoryProductCountsForQuery: getCategoryProductCountsForQuery,
    findMatchingCategories: findMatchingCategories,
    productMatchesQuery: productMatchesQuery
  };
})();
