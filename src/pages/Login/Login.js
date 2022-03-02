var authToken = '';
chrome.storage.local.get(['userStatus'], function (items) {
  authToken = items.userStatus;
  if (authToken) {
    window.location.href = 'popup.html';
  }
});

document.querySelector('.login__form').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.querySelector('#id').value;
  const password = document.querySelector('#password').value;
  console.log(id, 'id');
  console.log(password, 'pw');
  // eslint-disable-next-line no-undef
  $.ajax({
    url: 'http://127.0.0.1:8000/api/users/login',
    type: 'POST',
    data: {
      username: id,
      password: password,
    },
    success: function (result) {
      if (result.token) {
        alert('성공');
        chrome.storage.local.set({
          userStatus: result.token,
        });
        window.location.href = 'popup.html';
      } else {
        alert('실패');
      }
    },
  });
});

document.getElementById('register').addEventListener('submit', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'localhost:3000/register' });
});
