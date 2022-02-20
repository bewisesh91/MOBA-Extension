import React from 'react';
import './Popup.css';
const cheerio = require('cheerio');
const axios = require('axios');
let new_product;

const Popup = () => {
  console.log('befor hi');
  chrome.runtime.sendMessage(
    {
      message: 'userStatus',
    },
    (response) => {
      if (response.message === 'success') {
        console.log('로그인 성공');
      } else if (response.message === 'login') {
        console.log('로그인하세요');
        alert('로그인 하세요.');
      }
    }
  );
  console.log('after hi');

  chrome.tabs.query(
    { currentWindow: true, active: true },
    async function (tabs) {
      // console.log(tabs[0].url);
      const shopUrl = tabs[0].url;
      new_product = await parse_product(shopUrl);
      console.log(new_product);
      let imageBox = document.querySelector('#imageBox');
      let totalImg = '';

      console.log(new_product.img);

      let imageUrl = new_product.img;
      totalImg = `
        <img src=${imageUrl} alt='img1'/>
        `;

      // append child 방식으로 시도해보기
      // for (let i = 0; i < new_product.img.length; i++) {
      //   let imageUrl = new_product.img[i].attribs.src;
      //   totalImg += `
      //   <div className='imageCard'>
      //   <img src='https:${imageUrl}' alt='img1'/>
      //   <input type='radio' name='img' value=${i}>
      //   <button id=${i} className='btns'>check!</button>
      //   </div>
      //   `;
      // }
      imageBox.innerHTML += totalImg;
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
    // img_url = $("meta[property='og:image']").attr('content');
    img_url = $('#detail_thumb > ul > li > img');
    const parsed_img_url = 'https:' + img_url[0].attribs.src;
    console.log('img_url 뭘까?', 'https:' + img_url[0].attribs.src);

    const new_product = {
      product_name: product_name,
      price: Number(price),
      sale_price: sale_price,
      shop_name: shop_name,
      shop_url: shop_url,
      img: parsed_img_url,
    };
    return new_product;
  }

  // seoul store
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

  function cartClick(event) {
    console.log('카트 입니다');
    var authToken = '';
    chrome.storage.local.get(['userStatus'], function (items) {
      authToken = items.userStatus;
      console.log(`authToken??? : ${authToken}`);
      axios
        .post('http://127.0.0.1:8000/privatebasket/basket', {
          token: authToken,
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
      <span>이 옷을 내 장바구니에 넣으시겠습니까?</span>
      <div id="imageBox"></div>
      <button onClick={handleClick}>전송하기</button>
      <button onClick={cartClick}>장바구니 확인하기</button>
    </div>
  );
};

export default Popup;
