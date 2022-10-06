import userList from './users.js'

initialize();

function initialize() {
  window.login = login;
  displayUsers();
  login(false);
}

// Renders the user dropdown menu
function displayUsers() {
  let [currentUser] = userList;

  document.cookie.split(';').forEach((c) => {
    [, currentUser] = c.split('=');
  })

  const menu = document.getElementById('login-menu');
  menu.innerHTML = `\
  <form id="login">
    <label for="user-picker">Current tenant / user</label>
    <select id="user-picker" name="user" class="user" onchange="login(true)">
      ${userList.map((user) => 
        `<option ${user == currentUser ? "selected" : ""}>${user}</option>`
      )}
    </select>
  </form>`;
}

function login(reload) {
  const [user] = document.getElementsByName('user');
  document.cookie = `user=${user.value}; Path=/; SameSite=Lax`;
  if (reload) {
    location.reload();
  }
}