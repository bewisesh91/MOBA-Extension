import React, { useEffect, useState } from 'react';
import './Popup.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { ThreeDots } from 'react-loader-spinner';
import '@fortawesome/fontawesome-free/js/all.js';
import { FiPlusCircle } from 'react-icons/fi';

const cheerio = require('cheerio');
const axios = require('axios');
let new_product;
const Popup = React.memo(function Popup() {
  const [products, setProducts] = useState([]);
  const [curProducts, setCurProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [needUrlInput, setNeedUrlInput] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['userStatus'], function (items) {
      const authToken = items.userStatus;

      axios
        .post('http://127.0.0.1:8000/privatebasket/basket', {
          token: authToken,
        })
        .then((Response) => {
          setProducts(Response.data.reverse());
        })
        .catch((Error) => {
          console.log(Error);
        });
    });

    chrome.tabs.query(
      { currentWindow: true, active: true },
      async function (tabs) {
        setIsLoading(true);
        const shopUrl = tabs[0].url;

        new_product = await parse_product(shopUrl);
        setCurProducts(new_product);
        setIsLoading(false);
      }
    );
    async function parse_product(url) {
      let new_product;
      const split_url = url?.split('/');
      const cur_shop = split_url[2];

      // 서비스 가능한 사이트만 req 요청 보내기
      if (
        [
          'www.wconcept.co.kr',
          'store.musinsa.com',
          'www.brandi.co.kr',
        ].includes(cur_shop)
      ) {
        await axios.get(url).then((dataa) => {
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
        });
      } else {
        // 서비스 가능한 사이트가 아닌 경우
        setIsSupported(true);
        const currBox = document.querySelector('.currentBox');
        if (currBox) {
          currBox.style.display = 'none';
        }
        const imageBox = document.querySelector('#imageBox');
        if (imageBox) {
          imageBox.style.display = 'none';
        }
      }
      return new_product;
    }
  }, []);
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

  // inputs의 useState 여기서 진행
  const [inputs, setInputs] = useState({
    productName: '',
    url: '',
    price: '',
    shopName: '',
  });
  const onChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const onReset = async (e) => {
    e.preventDefault();

    const productName = inputs.productName;
    const imgUrl = inputs.url;
    const productPrice = inputs.price;
    const shopName = inputs.shopName;

    chrome.tabs.query(
      { currentWindow: true, active: true },
      async function (tabs) {
        const shopUrl = tabs[0].url;

        const new_product = {
          product_name: productName,
          price: productPrice,
          sale_price: productPrice,
          shop_name: shopName,
          shop_url: shopUrl,
          img: imgUrl,
        };
        await removeBackground(new_product);
      }
    );
    setInputs({
      productName: '',
      url: '',
      price: '',
      shopName: '',
    });
  };

  async function removeBackground(new_product) {
    const canvas = document.querySelector('#myCanvas');
    const originalImg = document.querySelector('.img__original');
    originalImg.src = new_product.img; //불러온 이미지로 변경

    originalImg.onload = async () => {
      if (await Nooki(canvas, originalImg)) {
        try {
          const removedBgImg = canvas.toDataURL('image/png');
          /** ---------------- S3  start ---------------- */
          // get secure S3 url from our server
          const target =
            'http://127.0.0.1:8000/s3Url/' +
            new_product.img?.split('https://')[1].replaceAll('/', '-');
          const S3url = await fetch(target).then((res) => res.json());

          // make ascii to binary file
          let bstr = atob(removedBgImg?.split(',')[1]);
          let n = bstr.length;
          let u8arr = new Uint8Array(n);

          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }

          let file = new File([u8arr], 'imgFile.png', { type: 'mime' });

          await fetch(S3url.url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: file,
          });

          // put S3 removedBgImg url in new_product info
          const imageUrl = S3url.url?.split('?')[0];

          new_product.removedBgImg = imageUrl;

          /** ---------------- S3  end ---------------- */

          chrome.storage.local.get(['userStatus'], function (items) {
            const authToken = items.userStatus;

            axios
              .post('http://127.0.0.1:8000/privatebasket', {
                token: authToken,
                products: [new_product],
              })
              .then((response) => {
                toast.success('장바구니 담기 완료!', {
                  position: 'top-center',
                  autoClose: 500,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
                setProducts([new_product, ...products]);
              })
              .catch((Error) => {
                alert('중복된 상품입니다!');
              });
          });
        } catch {
          alert('이미지 저장이 불가능한 쇼핑몰입니다!');
        }
      }
    };
  }

  async function handleClick() {
    if (needUrlInput) {
      new_product.img = inputs.url;
    }
    await removeBackground(new_product);
    setNeedUrlInput(false);
    setInputs({
      productName: '',
      url: '',
      price: '',
      shopName: '',
    });
  }

  function moveToMain() {
    chrome.tabs.create({ url: 'localhost:3000/createroom' });
  }
  function logOut() {
    chrome.storage.local.set({
      userStatus: '',
    });

    window.location.href = 'login.html';
  }

  async function deleteItem(product, shop_url) {
    chrome.storage.local.get(['userStatus'], function (items) {
      const authToken = items.userStatus;
      axios
        .delete('http://127.0.0.1:8000/privatebasket/product', {
          data: { token: authToken, products: product, shop_url: shop_url },
        })
        .then((response) => {
          // console.log(response);
        })
        .then((response) => {
          toast.success('장바구니 삭제 완료!', {
            position: 'top-center',
            autoClose: 500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          //reloading 하지 않고(setTimeout 쓰지 않고) useState활용하여 다시 그려줌
          setProducts(
            products?.filter((product) => product.shop_url !== shop_url)
          );
        });
    });
  }
  async function Nooki(canvas, originalImg) {
    let ctx = canvas.getContext('2d');
    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;
    await ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
    try {
      const _id = await ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = _id.data;

      let arr = [];
      let idx = 0;
      for (let i = 0; i < canvas.height; i++) {
        let arrayOfImgInRow = [];
        for (let j = 0; j < canvas.width; j++) {
          let arrayOfRgb = [];
          for (let k = 0; k < 4; k++) {
            arrayOfRgb.push(_id.data[idx++]);
          }
          arrayOfImgInRow.push(arrayOfRgb);
        }
        arr.push(arrayOfImgInRow);
      }

      let visited = [];
      for (let i = 0; i < arr.length; i++) {
        let tmp = [];
        for (let j = 0; j < arr[0].length; j++) {
          tmp.push(false);
        }
        visited.push(tmp);
      }
      await stack_DFS(0, 0);
      await stack_DFS(0, canvas.width - 1);
      await stack_DFS(canvas.height - 1, canvas.width - 1);
      await stack_DFS(canvas.height - 1, 0);

      async function stack_DFS(x, y) {
        let queue = [];
        queue.push([x, y]);

        while (queue.length > 0) {
          let [current_x, current_y] = queue.pop();
          visited[current_x][current_y] = true;
          let dir_array = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
          for (let i = 0; i < 4; i++) {
            let new_x = current_x + dir_array[i][0];
            let new_y = current_y + dir_array[i][1];
            if (
              0 <= new_x &&
              new_x < arr.length &&
              0 <= new_y &&
              new_y < arr[0].length
            ) {
              if (
                visited[new_x][new_y] === false &&
                arr[new_x][new_y][0] >= arr[current_x][current_y][0] - 1 &&
                arr[new_x][new_y][0] <= arr[current_x][current_y][0] + 1 &&
                arr[new_x][new_y][1] >= arr[current_x][current_y][1] - 1 &&
                arr[new_x][new_y][1] <= arr[current_x][current_y][1] + 1 &&
                arr[new_x][new_y][2] >= arr[current_x][current_y][2] - 1 &&
                arr[new_x][new_y][2] <= arr[current_x][current_y][2] + 1
              ) {
                queue.push([new_x, new_y]);
              }
            }
          }
        }
      }

      let idx_ = 0;
      for (let i = 0; i < canvas.height; i++) {
        for (let j = 0; j < canvas.width; j++) {
          if (visited[i][j]) {
            pixels[idx_] = 0;
            pixels[idx_ + 1] = 0;
            pixels[idx_ + 2] = 0;
            pixels[idx_ + 3] = 0;
          }
          idx_ = idx_ + 4;
        }
      }
      await ctx.putImageData(_id, 0, 0);
      return ctx;
    } catch {
      alert('이미지 데이터를 제공하지 않는 쇼핑몰입니다.');
    }
  }
  return (
    <div className="popup">
      <header>
        <span>MOBA</span>
        <button className="logoutBtn" onClick={logOut}>
          로그아웃
        </button>
      </header>
      <div style={{ display: 'none' }}>
        <img className="img__original" alt="img" />
        <h1>RemoveBackground Page</h1>
        <canvas id="myCanvas"></canvas>
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
      {isSupported ? (
        <>
          <div className="currentTitleBox">
            <span className="currentTitle">상품정보 입력</span>
          </div>
          <div className="conditional__container">
            <div className="conditional__formBox">
              <form
                id="addMyCart"
                className="conditionalInputBox"
                onSubmit={onReset}
              >
                <div className="input__box">
                  <label htmlFor="productName">상품명</label>
                  <input
                    autoFocus
                    className="input"
                    name="productName"
                    type="text"
                    placeholder="상품명을 입력해주세요"
                    onChange={onChange}
                    value={inputs.productName}
                  ></input>
                </div>
                <div className="input__box">
                  <label htmlFor="imgUrl">이미지 주소</label>
                  <input
                    className="input"
                    name="url"
                    type="url"
                    placeholder="이미지 오른쪽클릭후 이미지 주소 복사"
                    onChange={onChange}
                    value={inputs.url}
                  ></input>
                </div>
                <div className="input__box">
                  <label htmlFor="productPrice">상품 가격</label>
                  <input
                    className="input"
                    name="price"
                    type="text"
                    placeholder="상품 가격을 입력해주세요"
                    onChange={onChange}
                    value={inputs.price}
                  ></input>
                </div>
                <div className="input__box">
                  <label htmlFor="shopName">쇼핑몰 이름</label>
                  <input
                    className="input"
                    name="shopName"
                    type="text"
                    placeholder="쇼핑몰 이름을 입력해주세요"
                    onChange={onChange}
                    value={inputs.shopName}
                  />
                </div>
              </form>
            </div>
            <div className="image__addBtn">
              <button form="addMyCart" id="inputBoxBtn" type="submit">
                담기
              </button>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}

      <div className="currentBox">
        <div className="currentTitleBox">
          <span className="currentTitle">지금 보고있는 상품</span>
        </div>
        {isLoading ? (
          <div className="loading__oval">
            <ThreeDots
              height="100"
              width="100"
              color="#f37423"
              ariaLabel="loading"
            />
          </div>
        ) : (
          <div id="imageBox">
            <div className="image__container">
              <div
                onClick={() => {
                  needUrlInput ? setNeedUrlInput(false) : setNeedUrlInput(true);
                }}
                className="productBox"
              >
                <img className="currentImg" src={curProducts?.img} alt="img" />
                <FiPlusCircle
                  className="addProductIcon"
                  color="orange"
                  size="50"
                />
              </div>
              <div className="addProductText"> 다른 이미지로 바꾸기</div>
            </div>
            {!needUrlInput ? (
              <>
                <div className="image__description">
                  <p>{curProducts?.shop_name}</p>
                  <p>{curProducts?.product_name}</p>
                  <p>{curProducts?.sale_price} 원</p>
                </div>
                <div className="image__addBtn">
                  <button onClick={handleClick} type="submit" id="addBtn">
                    담기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="image__description">
                  <form onSubmit={handleClick} id="changeImgUrl">
                    <label className="newImg__title" htmlFor="imgUrl">
                      새로운 이미지로 저장
                    </label>
                    <input
                      className="inputUrl"
                      name="url"
                      type="url"
                      placeholder="이미지 url을 넣으세요"
                      onChange={onChange}
                      value={inputs.url}
                    ></input>
                  </form>
                </div>
                <div className="image__addBtn">
                  <button form="changeImgUrl" type="submit" id="addBtn">
                    담기
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="myBasket__container">
        <div className="myBasket__title__box">
          <span className="myBasket__title">내 장바구니</span>
          <button className="mobaBtn" onClick={moveToMain}>
            모바로 이동
          </button>
        </div>
        <div className="myBasket">
          {products?.map((item, index) => (
            <div key={index} className="container">
              <img src={item.img} alt="img" />
              <p>
                <strong>{item.shop_name}</strong>
              </p>
              <div className="product__name">
                <p>{item.product_name}</p>
              </div>
              <p className="product__price">
                <strong>{item.sale_price}원</strong>
              </p>
              <button
                className="delBtn"
                onClick={() => deleteItem(products, item.shop_url)}
              >
                <i className="fa-solid fa-xmark fa-2xl"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Popup;
