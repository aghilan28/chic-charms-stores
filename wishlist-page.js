(function () {
  'use strict';
  var grid = document.getElementById('wishlistGrid'); var empty = document.getElementById('wishlistEmpty'); var count = document.getElementById('wishlistPageCount');
  var fallback = 'images/editorial-light-meets-gold.png';
  function esc(value) { var d = document.createElement('div'); d.textContent = value == null ? '' : String(value); return d.innerHTML; }
  function price(value) { return '₹' + Number(value || 0).toLocaleString('en-IN'); }
  function icon(name) { return name === 'trash' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"/></svg>' : ''; }
  function card(item) {
    var old = item.oldPrice > item.price ? '<span class="wl-old">' + price(item.oldPrice) + '</span><span class="wl-discount">' + Math.round((item.oldPrice-item.price)/item.oldPrice*100) + '% off</span>' : '';
    var stock = item.stock === null || item.stock > 0; var url = item.url || ('product.html?id=' + encodeURIComponent(item.id));
    return '<article class="wl-card" data-card-id="'+esc(item.id)+'"><a class="wl-image" href="'+esc(url)+'"><img src="'+esc(item.image || fallback)+'" alt="'+esc(item.name)+'" loading="lazy" onerror="this.src=\''+fallback+'\'"></a>'+
      '<div class="wl-content"><div class="wl-top"><div><a class="wl-name" href="'+esc(url)+'">'+esc(item.name)+'</a>'+(item.rating ? '<div class="wl-rating" aria-label="Rated '+esc(item.rating)+' out of 5"><span aria-hidden="true">★</span> '+esc(item.rating)+'</div>' : '')+'</div>'+
      '<button class="wl-remove" type="button" data-remove="'+esc(item.id)+'" aria-label="Remove '+esc(item.name)+' from wishlist">'+icon('trash')+'<span>Remove</span></button></div>'+
      '<div class="wl-price"><strong>'+price(item.price)+'</strong>'+old+'</div><p class="wl-stock '+(stock?'in':'out')+'"><span aria-hidden="true"></span>'+(stock?'In stock':'Currently unavailable')+'</p>'+
      '<button class="wl-move" type="button" data-move="'+esc(item.id)+'" '+(stock?'':'disabled')+'>'+(stock?'Move to Bag':'Unavailable')+'</button></div></article>';
  }
  function render() {
    var items = window.CCWishlist.get(); count.textContent = String(items.length); grid.innerHTML = items.map(card).join('');
    grid.hidden = !items.length; empty.hidden = !!items.length;
  }
  grid.addEventListener('click', function (event) {
    var remove = event.target.closest('[data-remove]'); var move = event.target.closest('[data-move]'); if (!remove && !move) return;
    var id = (remove || move).dataset.remove || (remove || move).dataset.move; var cardNode = grid.querySelector('[data-card-id="'+CSS.escape(id)+'"]');
    if (remove && cardNode) { cardNode.classList.add('is-removing'); setTimeout(function(){ window.CCWishlist.remove(id); render(); }, 230); }
    if (move) { var item = window.CCWishlist.get().find(function(x){return x.id===id;}); if (item && window.CCWishlist.moveToCart(item)) { if(cardNode) cardNode.classList.add('is-removing'); setTimeout(render,230); } }
  });
  window.addEventListener('cc:wishlist-change', render); render();
})();
