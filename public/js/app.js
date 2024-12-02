let auth0Client = null;

const router = {
  "/": () => showContent("app"),
  "/profile": () =>
    requireAuth("/profile", () => showContent("content-profile")),
  "/login": () => login(),
};

async function configureClient() {
  if (!auth0Client) {
    auth0Client = await auth0.createAuth0Client({
      domain: window.config.AUTH0_DOMAIN,
      clientId: window.config.AUTH0_CLIENT_ID,
    });
  }
}

async function login(targetUrl) {
  try {
    const options = {
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0Client.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed:", err);
  }
}

async function logout() {
  try {
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  } catch (err) {
    console.log("Log out failed:", err);
  }
}

async function requireAuth(targetUrl, fn) {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
}

// Helper functions

/**
 * Iterates over the elements matching 'selector' and passes them
 * to 'fn'
 * @param {*} selector The CSS selector to find
 * @param {*} fn The function to execute for every element
 */
function eachElement(selector, fn) {
  for (let e of document.querySelectorAll(selector)) {
    fn(e);
  }
}

/**
 * Tries to display a content panel that is referenced
 * by the specified route URL. These are matched using the
 * router, defined above.
 * @param {*} url The route URL
 */
function showContentFromUrl(url) {
  if (router[url]) {
    router[url]();
    return true;
  }
  return false;
}

/**
 * Returns true if `element` is a hyperlink that can be considered a link to another SPA route
 * @param {*} element The element to check
 */
const isRouteLink = (element) =>
  element.tagName === "A" && element.classList.contains("route-link");

/**
 * Displays a content panel specified by the given element id.
 * All the panels that participate in this flow should have the 'page' class applied,
 * so that it can be correctly hidden before the requested content is shown.
 * @param {*} id The id of the content to show
 */
function showContent(id) {
  eachElement(".page", (p) => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

async function updateUI() {
  try {
    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0Client.getUser();

      document.getElementById("profile-data").innerText = JSON.stringify(
        user,
        null,
        2
      );

      eachElement(".auth-visible", (e) => e.classList.remove("hidden"));
      eachElement(".auth-invisible", (e) => e.classList.add("hidden"));
    } else {
      eachElement(".auth-visible", (e) => e.classList.add("hidden"));
      eachElement(".auth-invisible", (e) => e.classList.remove("hidden"));
    }
  } catch (err) {
    console.log("Error updating UI:", err);
    return;
  }
}

window.onpopstate = (e) => {
  if (e.state && e.state.url && router[e.state.url]) {
    showContentFromUrl(e.state.url);
  }
};

window.onload = async () => {
  await configureClient();

  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const query = window.location.search;
  const mustParseResult =
    query.includes("code=") &&
    (query.includes("state=") || query.includes("error="));

  if (mustParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0Client.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
