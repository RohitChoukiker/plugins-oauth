const signinBtn = document.getElementById('signin');
const signoutBtn = document.getElementById('signout');
const statusDiv = document.getElementById('status');
const userinfoPre = document.getElementById('userinfo');
const avatar = document.getElementById('avatar');
const welcomeText = document.getElementById('welcome');

async function updateUI() {
  chrome.identity.getAuthToken({ interactive: false }, async (token) => {
    if (chrome.runtime.lastError || !token) {
      statusDiv.textContent = "Not signed in 😔";
      avatar.style.display = "none";
      welcomeText.style.display = "none";
      userinfoPre.textContent = "";
      return;
    }

    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (res.ok) {
      const data = await res.json();
      statusDiv.textContent = `Signed in as ${data.name}`;
      avatar.src = data.picture;
      avatar.style.display = "block";
      welcomeText.style.display = "block";
      userinfoPre.textContent = JSON.stringify(data, null, 2);
    } else {
      statusDiv.textContent = "Error fetching user info";
      avatar.style.display = "none";
      welcomeText.style.display = "none";
    }
  });
}

signinBtn.addEventListener('click', () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = "Login failed 😕";
      console.error(chrome.runtime.lastError);
      return;
    }
    updateUI();
  });
});

signoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage('logout', () => {
    chrome.identity.getAuthToken({interactive: false}, (token) => {
      if (token) {
        fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token)
          .then(() => {
            chrome.identity.removeCachedAuthToken({ token }, () => updateUI());
          });
      } else updateUI();
    });
  });
});

updateUI();
