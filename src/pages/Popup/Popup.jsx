import React, { useState, useRef } from 'react';
import './Popup.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cheerio = require('cheerio');
const axios = require('axios');
let new_product;

const Popup = React.memo(function Popup(props) {
  // 공부해서 useState 쓰고싶다...
  // const [products, setProducts] = useState([]);
  // const [curProducts, setCurProducts] = useState({});
  // const [isLoading, setIsLoading] = useState(true);

  // chrome.storage.local.get(['moba'], function (items) {
  //   if (typeof items.moba == 'undefined') {
  //     console.log('ㅜㅡㅜ');
  //   } else {
  //     console.log(items.moba, 'items.count');
  //     console.log(items, 'items');
  //   }
  // });

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
        const myBasket = document.querySelector('.myBasket');
        let temp = '';
        for (let i = Response.data.length - 1; 0 <= i; i--) {
          temp += `
          <div class="container">
              <img src=${Response.data[i].img} alt="img" />
              <p>
                <strong>${Response.data[i].shop_name}</strong>
              </p>
              <p>${Response.data[i].product_name}</p>
              <p>
                <strong>${Response.data[i].sale_price}</strong>
              </p>
            </div>
          `;
        }
        myBasket.innerHTML += temp;
        // myBasket.addClass("")
        // setProducts(Response.data);
      })
      .catch((Error) => {
        console.log(Error);
      });
  });

  chrome.tabs.query(
    { currentWindow: true, active: true },
    async function (tabs) {
      const shopUrl = tabs[0].url;
      chrome.storage.local.set({ moba: shopUrl });

      chrome.tabs.sendMessage(tabs[0].id, { shopUrl: shopUrl }, (response) => {
        console.log(response, 'response!!!!!!!@'); // Yeah
      });

      new_product = await parse_product(shopUrl);
      chrome.storage.local.get(['products'], function (items) {
        console.log(items.products, 'item.products');
      });
      let imageBox = document.querySelector('#imageBox');
      let totalImg = '';

      let imageUrl = new_product.img;
      let product_name = new_product.product_name;
      let sale_price = new_product.sale_price;
      let shop_name = new_product.shop_name;

      totalImg = `
        <div class='image__container'>
        <img class='currentImg' src=${imageUrl} alt='img1'/>
        </div>
        <div class='image__description'>
        <p>${shop_name}</p>
        <p>${product_name}</p>
        <p>${sale_price} 원</p>
        </div>
        `;
      imageBox.innerHTML = totalImg;
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

  async function removeBackground(new_product) {
    const canvas = document.querySelector('#myCanvas');
    const originalImg = document.querySelector('.img__original');
    let removedBgImg;
    originalImg.src = new_product.img; //불러온 이미지로 변경
    // canvas에 이미지 복제
    let ctx = canvas.getContext('2d');
    console.log(ctx, 'ctx');
    originalImg.onload = function () {
      console.log(originalImg, 'original img!');
      canvas.width = originalImg.naturalWidth;
      canvas.height = originalImg.naturalHeight;
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      // 복제된 이미지에 대한 pixel정보 가져옴
      let _id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log(_id, 'id');
      // 픽셀 순회
      for (var i = 0; i < _id.data.length; i += 4) {
        if (
          _id.data[i] === 255 &&
          _id.data[i + 1] === 255 &&
          _id.data[i + 2] === 255
        ) {
          _id.data[i] = 0;
          _id.data[i + 1] = 0;
          _id.data[i + 2] = 0;
          _id.data[i + 3] = 0;
        }
      }
      ctx.putImageData(_id, 0, 0);
      removedBgImg = canvas.toDataURL('image/png');
      console.log(removedBgImg, 'return 전 removedBg');

      //누끼딴거 넣어주기
      new_product.removedBgImg = removedBgImg;
      console.log(new_product, 'new_product@#!#!');

      chrome.storage.local.get(['userStatus'], function (items) {
        const authToken = items.userStatus;

        axios
          .post('http://127.0.0.1:8000/privatebasket', {
            token: authToken,
            products: [new_product],
          })
          .then((response) => {
            console.log(response, 'response');
            toast.success('장바구니 담기 완료!', {
              position: 'top-center',
              autoClose: 1000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
            setTimeout(() => {
              window.location.reload();
            }, 1800);
          })
          .catch((Error) => {
            console.log(Error);
          });
      });
    };
  }

  async function handleClick() {
    console.log('np', new_product);
    await removeBackground(new_product);
  }

  function moveToMain() {
    chrome.tabs.create({ url: 'localhost:3000/createroom' });
  }

  return (
    <div className="popup">
      <header>
        <span>MOBA</span>
      </header>
      <div style={{ display: 'none' }}>
        <img className="img__original" alt="img" />
        <h1>RemoveBackground Page</h1>
        <canvas id="myCanvas"></canvas>
      </div>
      <div className="currentTitleBox">
        <span className="currentTitle">지금 보고있는 상품</span>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="currentBox">
        <div id="imageBox">
          {/* {
          (isLoading ? (
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
          ),
          console.log('curProducts!', curProducts))
        } */}
          {/* {console.log('curProducts!', curProducts)}
        <div className="image__container">
          <img src={curProducts.img} alt="img" />
          <h4>{curProducts.shop_name}</h4>
          <span>{curProducts.product_name}</span>
          <h4>{curProducts.sale_price}</h4>
        </div> */}
        </div>
        <button id="addBtn" onClick={handleClick}>
          추가하기
        </button>
      </div>

      {/* 혁주 여기 고쳐놨음 여기 수정하면됨 */}
      <button onClick={moveToMain}>모바로 이동하기</button>

      <span className="myBasket__title">내 장바구니</span>
      <div className="myBasket">
        {/* {products.map((item, index) => (
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
        ))} */}
      </div>
    </div>
  );
});

export default Popup;
