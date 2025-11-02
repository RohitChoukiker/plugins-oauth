const signinBtn = document.getElementById('signin');
const signoutBtn = document.getElementById('signout');
const statusDiv = document.getElementById('status');
const userinfoPre = document.getElementById('userinfo');
const avatar = document.getElementById('avatar');
const welcomeText = document.getElementById('welcome');

// overlay elements for transient welcome screen
const welcomeOverlay = document.getElementById('welcomeOverlay');
const overlayAvatar = document.getElementById('overlayAvatar');
const overlayText = document.getElementById('overlayText');
const overlayAction = document.getElementById('overlayAction');

// profile elements
const profileCard = document.getElementById('profile');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileAction = document.getElementById('profileAction');

function showWelcomeOverlay(data) {
  if (!welcomeOverlay) return;
  overlayAvatar.src = data.picture || '';
  overlayText.textContent = `Welcome, ${data.given_name || data.name || 'there'}!`;
  welcomeOverlay.style.display = 'flex';
  welcomeOverlay.setAttribute('aria-hidden', 'false');
  // hide after 3 seconds
  setTimeout(hideWelcomeOverlay, 3000);
}

function hideWelcomeOverlay() {
  if (!welcomeOverlay) return;
  welcomeOverlay.style.display = 'none';
  welcomeOverlay.setAttribute('aria-hidden', 'true');
}

async function updateUI(showOverlay = false) {
  chrome.identity.getAuthToken({ interactive: false }, async (token) => {
    if (chrome.runtime.lastError || !token) {
      statusDiv.textContent = "Not signed in ";
      avatar.style.display = "none";
      welcomeText.style.display = "none";
      // toggle buttons: show sign-in, hide sign-out when not signed in
      if (signinBtn) signinBtn.style.display = 'block';
      if (signoutBtn) signoutBtn.style.display = 'none';
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
  // toggle buttons: hide sign-in, show sign-out when signed in
  if (signinBtn) signinBtn.style.display = 'none';
  if (signoutBtn) signoutBtn.style.display = 'block';
      // populate nicer profile card
      if (profileCard) profileCard.style.display = 'flex';
      if (profileAvatar) profileAvatar.src = data.picture || '';
      if (profileName) profileName.textContent = data.name || '';
      if (profileEmail) profileEmail.textContent = data.email || '';
      if (profileAction) profileAction.onclick = () => hideWelcomeOverlay();

      // keep raw JSON hidden by default but set content for debugging
      userinfoPre.textContent = JSON.stringify(data, null, 2);
      userinfoPre.style.display = 'none';
      // show transient overlay only when explicitly requested (e.g. interactive signin)
      if (showOverlay) showWelcomeOverlay(data);
    } else {
      statusDiv.textContent = "Error fetching user info";
      avatar.style.display = "none";
      welcomeText.style.display = "none";
    }
  });
}

signinBtn.addEventListener('click', () => {
  // interactive sign-in: ask for token and show welcome overlay after success
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = "Login failed 😕";
      console.error(chrome.runtime.lastError);
      return;
    }
    // pass true so the UI will display the welcome overlay
    updateUI(true);
  });
});

signoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage('logout', () => {
    // hide any welcome overlay immediately
    hideWelcomeOverlay();

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
