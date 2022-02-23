import React, { useState, useRef } from 'react';
import './Popup.css';
const cheerio = require('cheerio');
const axios = require('axios');
let new_product;

const Popup = React.memo(function Popup(props) {
  // 공부해서 useState 쓰고싶다...
  // const [products, setProducts] = useState([]);
  // const [curProducts, setCurProducts] = useState({});
  // const [isLoading, setIsLoading] = useState(true);

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
        for (let i = 0; i < Response.data.length; i++) {
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
      new_product = await parse_product(shopUrl);
      // console.log('현재 상품:', new_product);
      // console.log('shopUrl:', shopUrl);
      // axios
      //   .post('http://127.0.0.1:8000/privatebasket/basketParsing', {
      //     shopUrl: shopUrl,
      //   })
      //   .then((Response) => {
      //     // setIsLoading(false);
      //     console.log('파싱결과받기:', Response.data);
      //     // setCurProducts(Response.data);
      //   });

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

  function ImageLoader(url) {
    console.log('image loader 들어옴');
    console.log('url', url);
    var imgxhr = new XMLHttpRequest();
    imgxhr.open('GET', url + '?' + new Date().getTime());
    imgxhr.responseType = 'blob';
    imgxhr.onload = function () {
      if (imgxhr.status === 200) {
        reader.readAsDataURL(imgxhr.response);
      }
    };
    var reader = new FileReader();
    reader.onloadend = function () {
      // document.getElementById('image').src = reader.result;
      chrome.storage.local.set({ Image: reader.result });
    };
    imgxhr.send();
  }

  function handleClick() {
    console.log('np', new_product);
    var authToken = '';
    ImageLoader(new_product.img); // 이미지 크롬 스토리지에 저장
    // 크롬스토리지에서 가져옴
    chrome.storage.local.get(['Image'], function (items) {
      let image = items.Image;

      const canvas = document.querySelector('#myCanvas');
      const originalImg = document.querySelector('.img__original');
      console.log(document, 'document');
      console.log(originalImg, 'originalImg');
      canvas.height = originalImg.height;
      canvas.width = originalImg.width;
      console.log(canvas, 'canvas');
      console.log(canvas.height, 'canvas.height'); //됨

      // canvas에 이미지 복제
      let ctx = canvas.getContext('2d');
      console.log(ctx, 'ctx');
      ctx.drawImage(originalImg, 0, 0);

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
      let answer = canvas.toDataURL('image/jpg');
      console.log(answer, '누끼 따진 애');
    });

    // chrome.storage.local.remove(['Image'], function () {
    //   console.log('삭제 성공!');
    // });
    // chrome.storage.local.get(['Image'], function (items) {
    //   let image = items.Image;
    //   console.log(image, ' after image del!!');
    // });

    chrome.storage.local.get(['userStatus'], function (items) {
      authToken = items.userStatus;
      console.log(`hihihihihi : ${authToken}`);

      axios
        .all([
          axios.post('http://127.0.0.1:8000/privatebasket', {
            token: authToken,
            products: [new_product],
          }),
          // axios.post('http://127.0.0.1:8000/removebg', {
          //   token: authToken,
          //   products: [new_product],
          // }),
        ])
        .then(
          axios.spread((res1, res2) => {
            console.log(res1, res2);
          })
        )
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
      <div>
        <img
          src="data:image/jpeg;base64,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"
          className="img__original"
          alt="img"
        />
        <h1>RemoveBackground Page</h1>
        <canvas id="myCanvas"></canvas>
      </div>
      <div className="currentTitleBox">
        <span className="currentTitle">지금 보고있는 상품</span>
      </div>
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
