(function () {
  'use strict';

  function onHomePage() {
    var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return page === 'index.html' || page === '';
  }

  function buildCategoryLink(category, extraClass) {
    var img = category.heroImage || category.editorialImage || 'images/hero-quiet-luxury-main.jpg';
    return '<a href="category.html?category=' + encodeURIComponent(category.slug) + '" class="' + extraClass + '" data-mobile-category="' + category.slug + '">' +
      '<span class="mobile-category-img"><img src="' + img + '" alt="" loading="lazy" /></span>' +
      '<span>' + category.name + '</span>' +
    '</a>';
  }

  function syncDesktopCards(categories) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.cat-grid .cat-card'));
    if (!cards.length) return;
    cards.forEach(function (card, index) {
      var category = categories[index];
      if (!category) {
        card.style.display = 'none';
        return;
      }
      card.style.display = '';
      card.setAttribute('href', 'category.html?category=' + encodeURIComponent(category.slug));
      card.setAttribute('data-category', category.slug);
      card.setAttribute('aria-label', 'Shop ' + category.name);
      var image = card.querySelector('.cat-img-wrap img');
      if (image) {
        image.src = category.heroImage || category.editorialImage || image.src;
        image.alt = category.name;
      }
      var title = card.querySelector('.cat-info h3');
      if (title) title.textContent = category.name;
      var copy = card.querySelector('.cat-info p');
      if (copy) copy.textContent = category.shortDescription || category.description || 'Live backend category';
    });
  }

  function syncMobileStrip(categories) {
    var strip = document.querySelector('.mobile-category-strip');
    if (!strip) return;
    strip.innerHTML = categories.map(function (category) {
      return buildCategoryLink(category, 'mobile-category-pill');
    }).join('');
  }

  function syncCollectionLinks(categories) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.cat-grid .cat-card'));
    if (!cards.length) return;
    cards.forEach(function (card, index) {
      var category = categories[index];
      if (!category) return;
      card.setAttribute('href', 'category.html?category=' + encodeURIComponent(category.slug));
    });
  }

  function boot() {
    if (!onHomePage() || !window.CCCategoryUtils) return;
    window.CCCategoryUtils.loadCategoryDataset().then(function (dataset) {
      var categories = (dataset.categories || []).slice(0, 4);
      if (!categories.length) return;
      syncDesktopCards(categories);
      syncMobileStrip(categories);
      syncCollectionLinks(categories);
    }).catch(function (error) {
      console.warn('Home category sync skipped:', error);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
