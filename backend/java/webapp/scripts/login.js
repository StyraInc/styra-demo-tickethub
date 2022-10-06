const users = [
  "alice@acmecorp",
  "bob@acmecorp",
  "cesar@acmecorp",
  "dylan@hooli",
  "eva@hooli",
  "frank@hooli",
]

function displayUsers() {
  let currentUser = users[0]
  document.cookie.split(';').forEach((c) => {
    currentUser = c.split('=')[1]
  })
  const menu = document.getElementById('login-menu')
  const html = `<div id="login" class="login">
    <form class="login-form">
      <label for="user-picker">Current User:</label><br>
      <select id="user-picker" name="user" class="user" onchange="doLogin(true)">
        ${users.map(u => makeOption(u, currentUser))}
      </select>
    </form>
  </div>`
  menu.innerHTML = html;
}

function makeOption(candidate, currentUser) {
  return `<option ${candidate == currentUser ? "selected" : ""}>${candidate}</option>`
}

function doLogin(reload) {
  const user = document.getElementsByName('user')[0].value
  document.cookie = "user=" + user + "; Path=/"
  if (reload) {
    location.reload()
  }
}

displayUsers()
doLogin(false)