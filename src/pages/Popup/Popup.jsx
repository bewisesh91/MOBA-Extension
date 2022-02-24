import React, { useState, useRef } from 'react';
import './Popup.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      })
      .catch((Error) => {
        console.log(Error);
      });
  });

  chrome.tabs.query(
    { currentWindow: true, active: true },
    async function (tabs) {
      const shopUrl = tabs[0].url;
      chrome.storage.local.set({ moba: shopUrl }); // url chrome storage 저장

      chrome.storage.local.get(['products'], function (items) {
        console.log(items.products, 'item.products');
        new_product = items.products;
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
      });
      chrome.storage.local.get(['products'], function (items) {
        console.log(items, 'remove 전 products');
      });
      chrome.storage.local.get(['moba'], function (items) {
        console.log(items, 'remove 전 moba');
      });
      // chrome.storage.local.remove(['products', 'moba'], function () {
      //   var error = chrome.runtime.lastError;
      //   if (error) {
      //     console.error(error);
      //   }
      // });
      // chrome.storage.local.get(['products'], function (items) {
      //   console.log(items, 'remove 후 products');
      // });
      // chrome.storage.local.get(['moba'], function (items) {
      //   console.log(items, 'remove 후 moba');
      // });
    }
  );

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
      // new_product.removedBgImg = removedBgImg;
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
