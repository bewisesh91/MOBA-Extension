import cheerio from 'cheerio';


chrome.storage.local.get(['moba'], function (items) {
  let curShop = items.moba;
  let new_product;

  const html = document.documentElement.innerHTML;
  const split_url = curShop.split('/');
  const cur_shop = split_url[2];
  if (
    ['www.wconcept.co.kr', 'store.musinsa.com', 'www.brandi.co.kr'].includes(
      cur_shop
    )
  ) {

    switch (cur_shop) {
      case 'www.wconcept.co.kr':
        new_product = w_concept(html, cur_shop);
        break;
      case 'store.musinsa.com':

        new_product = musinsa(html, curShop); //curShop까지 동일


        chrome.storage.local.set({ products: new_product });
        break;
      case 'www.brandi.co.kr':
        // eslint-disable-next-line no-unused-vars
        new_product = brandi(html, cur_shop);
        break;
      default:
        break;
    }
  }
});
function w_concept(html, url) {
  let shop_name, shop_url, img_url, product_name, price, sale_price;
  const $ = cheerio.load(html); // html load

  product_name = $("meta[property='og:description']").attr('content');
  price = $("meta[property='eg:originalPrice']").attr('content');
  sale_price = $("meta[property='eg:salePrice']").attr('content');
  shop_name = $("meta[property='og:site_name']").attr('content');
  shop_url = url;
  img_url = $("meta[property='og:image']").attr('content');

  const new_product = {
    product_name: product_name,
    price: price,
    sale_price: sale_price,
    shop_name: shop_name,
    shop_url: shop_url,
    img: img_url,
  };

  return new_product;
}

// 무신사
function musinsa(html, url) {

  let shop_name, shop_url, img_url, product_name, price, sale_price;
  const $ = cheerio.load(html); // html load

  product_name = $(
    '#page_product_detail > div.right_area.page_detail_product > div.right_contents.section_product_summary > span > em'
  ).text();

  price = $('#goods_price').text().trim();

  // price parsing - e.g. 110,000원 -> 110000
  price = Number(
    price
      .slice(0, -1)
      ?.split(',')
      .reduce((a, b) => a + b)
  );

  sale_price = $(
    '#sPrice > ul > li > span.txt_price_member.m_list_price'
  ).text();

  sale_price = Number(
    sale_price
      .slice(0, -1)
      ?.split(',')
      .reduce((a, b) => a + b)
  );
  shop_name = 'Musinsa';
  shop_url = url;
  img_url = $("meta[property='og:image']").attr('content');

  const new_product = {
    product_name: product_name,
    price: Number(price),
    sale_price: sale_price,
    shop_name: shop_name,
    shop_url: shop_url,
    img: img_url,
  };
  return new_product;
}

// 브랜디
function brandi(html, url) {
  let shop_name, img_url, product_name, price, sale_price, shop_url;
  const $ = cheerio.load(html); // html load

  shop_name = '브랜디';
  shop_url = url;
  img_url = $("meta[property='og:image']").attr('content');
  product_name = $(
    '#container > div > div.wrap-products-info > div.wrap-detail_info > div.detail_basic-info > div.detail_title_area > h1'
  ).text();
  price = $(
    '#container > div > div.wrap-products-info > div.wrap-detail_info > div.detail_basic-info > div.detail-price-wrapper.hideFinalPriceSection > div > div > span > span'
  ).text();
  price = Number(price?.split(',').reduce((a, b) => a + b));
  sale_price = $(
    '#container > div > div.wrap-products-info > div.wrap-detail_info > div.detail_basic-info > div.detail-price-wrapper.hideFinalPriceSection > div > div > em > span'
  ).text();
  sale_price = Number(sale_price?.split(',').reduce((a, b) => a + b));

  const new_product = {
    product_name: product_name,
    price: price,
    sale_price: sale_price,
    shop_name: shop_name,
    shop_url: shop_url,
    img: img_url,
  };


  return new_product;
}

