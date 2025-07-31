// log htmx on dev
// htmx.logAll();

// add text/html accept header to receive html instead of json for the requests
document.body.addEventListener("htmx:configRequest", function (evt) {
  evt.detail.headers["Accept"] = "text/html,*/*";
});

// redirect to homepage
document.body.addEventListener("redirectToHomepage", function () {
  setTimeout(() => {
    window.location.replace("/");
  }, 1500);
});

// reset form if event is sent from the backend
function resetForm(id) {
  return function () {
    const form = document.getElementById(id);
    if (!form) return;
    form.reset();
  }
}
document.body.addEventListener("resetChangePasswordForm", resetForm("change-password"));
document.body.addEventListener("resetChangeEmailForm", resetForm("change-email"));

// an htmx extension to use the specifed params in the path instead of the query or body
htmx.defineExtension("path-params", {
  onEvent: function (name, evt) {
    if (name === "htmx:configRequest") {
      evt.detail.path = evt.detail.path.replace(/{([^}]+)}/g, function (_, param) {
        var val = evt.detail.parameters[param]
        delete evt.detail.parameters[param]
        return val === undefined ? "{" + param + "}" : encodeURIComponent(val)
      })
    }
  }
})

// find closest element
function closest(selector, elm) {
  let element = elm || this;

  while (element && element.nodeType === 1) {
    if (element.matches(selector)) {
      return element;
    }

    element = element.parentNode;
  }

  return null;
};

// get url query param
function getQueryParams() {
  const search = window.location.search.replace("?", "");
  const query = {};
  search.split("&").map(q => {
    const keyvalue = q.split("=");
    query[keyvalue[0]] = keyvalue[1];
  });
  return query;
}

// trim text
function trimText(selector, length) {
  const element = document.querySelector(selector);
  if (!element) return;
  let text = element.textContent;
  if (typeof text !== "string") return;
  text = text.trim();
  if (text.length > length) {
    element.textContent = text.split("").slice(0, length).join("") + "...";
  }
}

function formatDateHour(selector) {
  const element = document.querySelector(selector);
  if (!element) return;
  const dateString = element.dataset.date;
  if (!dateString) return;
  const date = new Date(dateString);
  element.textContent = date.getHours() + ":" + date.getMinutes();
}

// show QR code
function handleQRCode(element, id) {
  const dialog = document.getElementById(id);
  const dialogContent = dialog.querySelector(".content-wrapper");
  if (!dialogContent) return;

  openDialog(id, "qrcode");
  dialogContent.textContent = "";

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = `
    text-align: center;
    margin-bottom: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    width: 400px;
    box-sizing: border-box;
    position: relative;
  `;

  const linkTitle = document.createElement('div');
  linkTitle.style.cssText = `
    font-size: 14px;
    color: #007bff;
    word-break: break-all;
    font-family: monospace;
    cursor: pointer;
    padding: 8px 12px;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    transition: all 0.2s ease;
    position: relative;
  `;
  linkTitle.textContent = element.dataset.url;

  linkTitle.addEventListener('mouseenter', function () {
    this.style.backgroundColor = '#e3f2fd';
    this.style.borderColor = '#007bff';
  });
  linkTitle.addEventListener('mouseleave', function () {
    this.style.backgroundColor = 'white';
    this.style.borderColor = '#dee2e6';
  });

  linkTitle.addEventListener('click', function () {
    copyToClipboard(element.dataset.url, titleContainer);
  });

  titleContainer.appendChild(linkTitle);

  const qrContainer = document.createElement('div');
  qrContainer.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  const qrcode = new QRCode(qrContainer, {
    text: element.dataset.url,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download QR Code';
  downloadBtn.style.cssText = `
    margin-top: 15px !important;
    padding: 10px 20px !important;
    background-color: #007bff !important;
    background: #007bff !important;
    color: white !important;
    border: none !important;
    border-radius: 5px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
    font-family: inherit !important;
    font-weight: normal !important;
    text-decoration: none !important;
    outline: none !important;
  `;

  downloadBtn.addEventListener('click', function () {
    downloadQRCode(qrContainer, element.dataset.url);
  });

  downloadBtn.addEventListener('mouseenter', function () {
    this.style.setProperty('background-color', '#0056b3', 'important');
    this.style.setProperty('background', '#0056b3', 'important');
  });
  downloadBtn.addEventListener('mouseleave', function () {
    this.style.setProperty('background-color', '#007bff', 'important');
    this.style.setProperty('background', '#007bff', 'important');
  });

  dialogContent.appendChild(titleContainer);
  dialogContent.appendChild(qrContainer);
  dialogContent.appendChild(downloadBtn);
}

function copyToClipboard(text, container) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () {
      showCopySuccess(container);
    }).catch(function (err) {
      fallbackCopyTextToClipboard(text, container);
    });
  } else {
    fallbackCopyTextToClipboard(text, container);
  }
}

function fallbackCopyTextToClipboard(text, container) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    showCopySuccess(container);
  } catch (err) {
    console.error('Copy failed:', err);
  }

  document.body.removeChild(textArea);
}

function showCopySuccess(container) {
  const successIcon = document.createElement('div');
  successIcon.innerHTML = 'Copied ✓';
  successIcon.style.cssText = `
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #28a745;
    color: white;
    width: 100px;
    height: 30px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
    animation: copySuccess 0.3s ease-out;
    z-index: 1000;
  `;

  if (!document.getElementById('copySuccessStyle')) {
    const style = document.createElement('style');
    style.id = 'copySuccessStyle';
    style.textContent = `
      @keyframes copySuccess {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(successIcon);

  setTimeout(() => {
    if (successIcon.parentNode) {
      successIcon.parentNode.removeChild(successIcon);
    }
  }, 2000);
}

function downloadQRCode(container, url) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const borderSize = 40; 
  canvas.width = 200 + borderSize;
  canvas.height = 200 + borderSize;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const qrImg = container.querySelector('img');
  if (qrImg) {
    ctx.drawImage(qrImg, borderSize / 2, borderSize / 2, 200, 200);

    canvas.toBlob(function (blob) {
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  } else {
    setTimeout(() => downloadQRCode(container, url), 100);
  }
}

function downloadQRCode(container, url) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const borderSize = 40; 
  canvas.width = 200 + borderSize;
  canvas.height = 200 + borderSize;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const qrImg = container.querySelector('img');
  if (qrImg) {
    ctx.drawImage(qrImg, borderSize / 2, borderSize / 2, 200, 200);

    canvas.toBlob(function (blob) {
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  } else {
    setTimeout(() => downloadQRCode(container, url), 100);
  }
}

function handleCopyLink(element) {
  navigator.clipboard.writeText(element.dataset.url);
}

function handleShortURLCopyLink(element) {
  handleCopyLink(element);
  const clipboard = element.parentNode.querySelector(".clipboard") || closest(".clipboard", element);
  if (!clipboard || clipboard.classList.contains("copied")) return;
  clipboard.classList.add("copied");
  setTimeout(function () {
    clipboard.classList.remove("copied");
  }, 1000);
}

function openDialog(id, name) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  dialog.classList.add("open");
  if (name) {
    dialog.classList.add(name);
  }
}

function closeDialog() {
  const dialog = document.querySelector(".dialog");
  if (!dialog) return;
  while (dialog.classList.length > 0) {
    dialog.classList.remove(dialog.classList[0]);
  }
  dialog.classList.add("dialog");
}

window.addEventListener("click", function (event) {
  const dialog = document.querySelector(".dialog");
  if (dialog && event.target === dialog) {
    closeDialog();
  }
});

// handle navigation in the table of links
function setLinksLimit(event) {
  const buttons = Array.from(document.querySelectorAll("table .nav .limit button"));
  const limitInput = document.querySelector("#limit");
  if (!limitInput || !buttons || !buttons.length) return;
  limitInput.value = event.target.textContent;
  buttons.forEach(b => {
    b.disabled = b.textContent === event.target.textContent;
  });
}

function setLinksSkip(event, action) {
  const buttons = Array.from(document.querySelectorAll("table .nav .pagination button"));
  const limitElm = document.querySelector("#limit");
  const totalElm = document.querySelector("#total");
  const skipElm = document.querySelector("#skip");
  if (!buttons || !limitElm || !totalElm || !skipElm) return;
  const skip = parseInt(skipElm.value);
  const limit = parseInt(limitElm.value);
  const total = parseInt(totalElm.value);
  skipElm.value = action === "next" ? skip + limit : Math.max(skip - limit, 0);
  document.querySelectorAll(".pagination .next").forEach(elm => {
    elm.disabled = total <= parseInt(skipElm.value) + limit;
  });
  document.querySelectorAll(".pagination .prev").forEach(elm => {
    elm.disabled = parseInt(skipElm.value) <= 0;
  });
}

function updateLinksNav() {
  const totalElm = document.querySelector("#total");
  const skipElm = document.querySelector("#skip");
  const limitElm = document.querySelector("#limit");
  if (!totalElm || !skipElm || !limitElm) return;
  const total = parseInt(totalElm.value);
  const skip = parseInt(skipElm.value);
  const limit = parseInt(limitElm.value);
  document.querySelectorAll(".pagination .next").forEach(elm => {
    elm.disabled = total <= skip + limit;
  });
  document.querySelectorAll(".pagination .prev").forEach(elm => {
    elm.disabled = skip <= 0;
  });
}

function resetTableNav() {
  const totalElm = document.querySelector("#total");
  const skipElm = document.querySelector("#skip");
  const limitElm = document.querySelector("#limit");
  if (!totalElm || !skipElm || !limitElm) return;
  skipElm.value = 0;
  limitElm.value = 10;
  const total = parseInt(totalElm.value);
  const skip = parseInt(skipElm.value);
  const limit = parseInt(limitElm.value);
  document.querySelectorAll(".pagination .next").forEach(elm => {
    elm.disabled = total <= skip + limit;
  });
  document.querySelectorAll(".pagination .prev").forEach(elm => {
    elm.disabled = skip <= 0;
  });
  document.querySelectorAll("table .nav .limit button").forEach(b => {
    b.disabled = b.textContent === limit.toString();
  });
}

// tab click
function setTab(event, targetId) {
  const tabs = Array.from(closest("nav", event.target).children);
  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });
  if (targetId) {
    document.getElementById(targetId).classList.add("active");
  } else {
    event.target.classList.add("active");
  }
}

// show clear search button
function onSearchChange(event) {
  const clearButton = event.target.parentElement.querySelector("button.clear");
  if (!clearButton) return;
  clearButton.style.display = event.target.value.length > 0 ? "block" : "none";
}

function clearSeachInput(event) {
  event.preventDefault();
  const button = closest("button", event.target);
  const input = button.parentElement.querySelector("input");
  if (!input) return;
  input.value = "";
  button.style.display = "none";
  htmx.trigger("body", "reloadMainTable");
}

// detect if search inputs have value on load to show clear button
function onSearchInputLoad() {
  const linkSearchInput = document.getElementById("search");
  if (!linkSearchInput) return;
  const linkClearButton = linkSearchInput.parentElement.querySelector("button.clear")
  linkClearButton.style.display = linkSearchInput.value.length > 0 ? "block" : "none";

  const userSearchInput = document.getElementById("search_user");
  if (!userSearchInput) return;
  const userClearButton = userSearchInput.parentElement.querySelector("button.clear")
  userClearButton.style.display = userSearchInput.value.length > 0 ? "block" : "none";

  const domainSearchInput = document.getElementById("search_domain");
  if (!domainSearchInput) return;
  const domainClearButton = domainSearchInput.parentElement.querySelector("button.clear")
  domainClearButton.style.display = domainSearchInput.value.length > 0 ? "block" : "none";
}

onSearchInputLoad();

// create user checkbox control
function canSendVerificationEmail() {
  const canSendVerificationEmail = !document.getElementById("create-user-verified").checked && !document.getElementById("create-user-banned").checked;
  const checkbox = document.getElementById("send-email-label");
  if (canSendVerificationEmail)
    checkbox.classList.remove("hidden");
  if (!canSendVerificationEmail && !checkbox.classList.contains("hidden"))
    checkbox.classList.add("hidden");
}

// htmx prefetch extension
// https://github.com/bigskysoftware/htmx-extensions/blob/main/src/preload/README.md
htmx.defineExtension("preload", {
  onEvent: function (name, event) {
    if (name !== "htmx:afterProcessNode") {
      return
    }
    var attr = function (node, property) {
      if (node == undefined) { return undefined }
      return node.getAttribute(property) || node.getAttribute("data-" + property) || attr(node.parentElement, property)
    }
    var load = function (node) {
      var done = function (html) {
        if (!node.preloadAlways) {
          node.preloadState = "DONE"
        }

        if (attr(node, "preload-images") == "true") {
          document.createElement("div").innerHTML = html
        }
      }

      return function () {
        if (node.preloadState !== "READY") {
          return
        }
        var hxGet = node.getAttribute("hx-get") || node.getAttribute("data-hx-get")
        if (hxGet) {
          htmx.ajax("GET", hxGet, {
            source: node,
            handler: function (elt, info) {
              done(info.xhr.responseText)
            }
          })
          return
        }
        if (node.getAttribute("href")) {
          var r = new XMLHttpRequest()
          r.open("GET", node.getAttribute("href"))
          r.onload = function () { done(r.responseText) }
          r.send()
        }
      }
    }
    var init = function (node) {
      if (node.getAttribute("href") + node.getAttribute("hx-get") + node.getAttribute("data-hx-get") == "") {
        return
      }
      if (node.preloadState !== undefined) {
        return
      }
      var on = attr(node, "preload") || "mousedown"
      const always = on.indexOf("always") !== -1
      if (always) {
        on = on.replace("always", "").trim()
      }
      node.addEventListener(on, function (evt) {
        if (node.preloadState === "PAUSE") {
          node.preloadState = "READY"
          if (on === "mouseover") {
            window.setTimeout(load(node), 100)
          } else {
            load(node)()
          }
        }
      })
      switch (on) {
        case "mouseover":
          node.addEventListener("touchstart", load(node))
          node.addEventListener("mouseout", function (evt) {
            if ((evt.target === node) && (node.preloadState === "READY")) {
              node.preloadState = "PAUSE"
            }
          })
          break

        case "mousedown":
          node.addEventListener("touchstart", load(node))
          break
      }
      node.preloadState = "PAUSE"
      node.preloadAlways = always
      htmx.trigger(node, "preload:init")
    }
    const parent = event.target || event.detail.elt;
    parent.querySelectorAll("[preload]").forEach(function (node) {
      init(node)
      node.querySelectorAll("a,[hx-get],[data-hx-get]").forEach(init)
    })
  }
})