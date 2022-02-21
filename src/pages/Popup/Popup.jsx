import React, { useState } from 'react';
import './Popup.css';
const cheerio = require('cheerio');
const axios = require('axios');
let new_product;

const Popup = () => {
  console.log('무한 재시작');
  const [products, setProducts] = useState([]);
  const [curProducts, setCurProducts] = useState();
  const [isLoading, setIsLoading] = useState(false);

  let authToken = '';
  chrome.storage.local.get(['userStatus'], function (items) {
    authToken = items.userStatus;
    console.log(`authToken??? : ${authToken}`);
    axios
      .post('http://127.0.0.1:8000/privatebasket/basket', {
        token: authToken,
      })
      .then((Response) => {
        console.log('내 장바구니 상품들', Response.data);
        setProducts(Response.data);
      })
      .catch((Error) => {
        console.log(Error);
      });
  });
  setIsLoading(true);
  chrome.tabs.query(
    { currentWindow: true, active: true },
    async function (tabs) {
      const shopUrl = tabs[0].url;
      console.log('shopUrl:', shopUrl);
      axios.post('http://127.0.0.1:8000/');
      new_product = await parse_product(shopUrl);
      setIsLoading(false);
      console.log('loading:', isLoading);
      console.log('현재 상품:', new_product);
      setCurProducts(new_product);

      // let imageBox = document.querySelector('#imageBox');
      // let totalImg = '';

      // let imageUrl = new_product.img;
      // let product_name = new_product.product_name;
      // let sale_price = new_product.sale_price;
      // let shop_name = new_product.shop_name;

      // totalImg = `
      //   <div className='image__container'>
      //   <img className='currentImg' src=${imageUrl} alt='img1'/>
      //   </div>
      //   <div className='image__description'>
      //   <p>${shop_name}</p>
      //   <p>${product_name}</p>
      //   <p>${sale_price}</p>
      //   </div>
      //   `;
      // imageBox.innerHTML = totalImg;
    }
  );
  // w-concept
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
    console.log(price);
    // price parsing - e.g. 110,000원 -> 110000
    price = Number(
      price
        .slice(0, -1)
        .split(',')
        .reduce((a, b) => a + b)
    );

    sale_price = $(
      '#sPrice > ul > li > span.txt_price_member.m_list_price'
    ).text();
    console.log(sale_price);
    sale_price = Number(
      sale_price
        .slice(0, -1)
        .split(',')
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
    price = Number(price.split(',').reduce((a, b) => a + b));
    sale_price = $(
      '#container > div > div.wrap-products-info > div.wrap-detail_info > div.detail_basic-info > div.detail-price-wrapper.hideFinalPriceSection > div > div > em > span'
    ).text();
    sale_price = Number(sale_price.split(',').reduce((a, b) => a + b));

    const new_product = {
      product_name: product_name,
      price: price,
      sale_price: sale_price,
      shop_name: shop_name,
      shop_url: shop_url,
      img: img_url,
    };
    console.log(new_product);

    return new_product;
  }

  async function parse_product(url) {
    let new_product;
    console.log(url);
    const split_url = url.split('/');
    const cur_shop = split_url[2];
    // 서비스 가능한 사이트만 req 요청 보내기
    if (
      ['www.wconcept.co.kr', 'store.musinsa.com', 'www.brandi.co.kr'].includes(
        cur_shop
      )
    ) {
      await axios
        .get(url)
        .then((dataa) => {
          const html = dataa.data;
          switch (cur_shop) {
            case 'www.wconcept.co.kr':
              new_product = w_concept(html, url);
              break;
            case 'store.musinsa.com':
              new_product = musinsa(html, url);
              break;
            case 'www.brandi.co.kr':
              new_product = brandi(html, url);
              break;
            default:
              break;
          }
        })
        .catch(
          // 리퀘스트 실패 - then 보다 catch 가 먼저 실행됨..
          console.log('get shopping mall html request is failed')
        );
    }
    return new_product;
  }

  function handleClick(event) {
    console.log('np', new_product);
    var authToken = '';
    chrome.storage.local.get(['userStatus'], function (items) {
      authToken = items.userStatus;
      console.log(`hihihihihi : ${authToken}`);
      axios
        .post('http://127.0.0.1:8000/privatebasket', {
          token: authToken,
          products: [new_product],
        })
        .then((Response) => {
          console.log('save success:', Response.data);
        })
        .catch((Error) => {
          console.log(Error);
        });
    });
  }

  return (
    <div className="popup">
      <header>
        <span>MOBA</span>
      </header>
      <div id="imageBox">
        {isLoading ? (
          <div>
            <span>로딩중</span>
          </div>
        ) : (
          <div className="image__container">
            <img src={curProducts.img} alt="img" />
            <h4>{curProducts.shop_name}</h4>
            <span>{curProducts.product_name}</span>
            <h4>{curProducts.sale_price}</h4>
          </div>
        )}
      </div>
      <button onClick={handleClick}>추가하기</button>
      <h3>내 장바구니</h3>
      <div className="myBasket">
        {products.map((item, index) => (
          <div key={index} className="container">
            <img src={item.img} alt="img" />
            <p>
              <strong>{item.shop_name}</strong>
            </p>
            <p>{item.product_name}</p>
            <p>
              <strong>{item.sale_price}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Popup;
