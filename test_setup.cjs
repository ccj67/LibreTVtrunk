// Mock localStorage
global.localStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        getStore: () => store // Helper to inspect the store
    };
})();

// Mock window object
global.window = {
    __ENV__: {
        PASSWORD: 'correct_password_hash_simulated' // SHA-256 hash
    },
    API_SITES: {
        dyttzy: { name: '电影天堂资源', detail: 'http://caiji.dyttzyapi.com' },
        ruyi: { name: '如意资源' },
        bfzy: { name: '暴风资源' },
        tyyszy: { name: '天涯资源' },
        ffzy: { name: '非凡影视', detail: 'http://ffzy5.tv' },
        heimuer: { name: '黑木耳', detail: 'https://heimuer.tv' },
        zy360: { name: '360资源' },
        iqiyi: { name: 'iqiyi资源' },
        wolong: { name: '卧龙资源' },
        hwba: { name: '华为吧资源' },
        jisu: { name: '极速资源', detail: 'https://jszyapi.com' },
        dbzy: { name: '豆瓣资源' },
        mozhua: { name: '魔爪资源' },
        mdzy: { name: '魔都资源' },
        zuid: { name: '最大资源' },
        yinghua: { name: '樱花资源' },
        baidu: { name: '百度云资源' },
        wujin: { name: '无尽资源' },
        wwzy: { name: '旺旺短剧' },
        ikun: { name: 'iKun资源' },
        testSource: { name: '空内容测试源', adult: true },
        anotherAdult: { name: 'Another Adult Source', adult: true }
    },
    crypto: require('crypto').webcrypto,
    TextEncoder: require('util').TextEncoder,
    initDouban: () => console.log("SIM: initDouban called"),
    localStorage: global.localStorage, // Make sure window.localStorage points to global.localStorage
    document: {
        _elements: {},
        _eventListeners: {},
        getElementById: function(id) {
            if (!this._elements[id]) {
                this._elements[id] = {
                    id: id,
                    style: {},
                    classList: {
                        _classes: new Set(),
                        add: function(cn) { this._classes.add(cn); },
                        remove: function(cn) { this._classes.delete(cn); },
                        contains: function(cn) { return this._classes.has(cn); }
                    },
                    value: '',
                    _eventListeners: {},
                    addEventListener: function(event, handler) {
                        this._eventListeners[event] = handler;
                    },
                    dispatchEvent: function(event) { // event is an object like {type: '...', detail: ...}
                         if (this._eventListeners[event.type]) {
                             this._eventListeners[event.type](event); // Pass event object
                         }
                    },
                    focus: () => console.log(`SIM_DOM: ${id}.focus()`),
                    checked: false,
                    textContent: '',
                    remove: function() { console.log(`SIM_DOM: ${id}.remove() called`); delete global.window.document._elements[id]; }
                };
            }
            return this._elements[id];
        },
        querySelector: function(selector) {
            if (selector.startsWith('#')) {
                const id = selector.substring(1);
                return this.getElementById(id);
            }
            return null;
        },
        querySelectorAll: function(selector) {
             if (selector === '#api-settings-panel input[type="checkbox"]') {
                return Object.keys(global.window.API_SITES).map(key => {
                    const checkboxId = `api-checkbox-${key}`;
                    return this.getElementById(checkboxId);
                });
             }
             return [];
        },
        addEventListener: function(event, handler) {
            if (!this._eventListeners['document']) this._eventListeners['document'] = {};
            this._eventListeners['document'][event] = handler;
        },
        dispatchEvent: function(event) { // event is an object like {type: '...', detail: ...}
            console.log(`SIM_DOM: document.dispatchEvent('${event.type}') with detail:`, event.detail);
            if (this._eventListeners['document'] && this._eventListeners['document'][event.type]) {
                 this._eventListeners['document'][event.type](event); // Pass the whole event object
            }
        },
        createElement: function(tagName) {
            const id = `temp-created-${Math.random().toString(36).substring(7)}`;
            const newElement = this.getElementById(id);
            newElement.tagName = tagName.toUpperCase();
            newElement.remove = () => { delete this._elements[id]; };
            newElement.appendChild = (child) => {};
            newElement.setAttribute = (name, value) => { newElement[name] = value; };
            return newElement;
        },
        _customEventConstructed: null, 
        CustomEvent: function(type, options) { 
            global.window.document._customEventConstructed = {
                type: type,
                detail: options ? options.detail : undefined
            };
            return global.window.document._customEventConstructed;
        }
    }
};

global.PASSWORD_CONFIG = {
    localStorageKey: 'passwordVerification',
    verificationTTL: 90 * 24 * 60 * 60 * 1000,
};

global.renderCheckboxesFromLocalStorage = () => {
    const selectedAPIs = JSON.parse(global.localStorage.getItem('selectedAPIs') || '[]');
    Object.keys(global.window.API_SITES).forEach(key => {
        const checkbox = global.window.document.getElementById(`api-checkbox-${key}`);
        checkbox.checked = selectedAPIs.includes(key);
    });
    const countElement = global.window.document.getElementById('selectedApiCount');
    if (countElement) {
        countElement.textContent = selectedAPIs.length.toString();
    }
};

global.getCheckboxStates = () => {
    const states = {};
    Object.keys(global.window.API_SITES).forEach(key => {
        const checkbox = global.window.document.getElementById(`api-checkbox-${key}`);
        states[key] = checkbox.checked;
    });
    return states;
};

global.simulateUserToggleCheckbox = (apiKey) => {
    const checkbox = global.window.document.getElementById(`api-checkbox-${apiKey}`);
    checkbox.checked = !checkbox.checked;
    console.log(`SIM_USER_ACTION: Toggled checkbox for ${apiKey} to ${checkbox.checked}`);
    if (typeof global.saveApiSelection === "function") {
        global.saveApiSelection();
    } else {
        console.warn("SIM_USER_ACTION: saveApiSelection is not defined. Cannot save changes automatically.");
    }
};

const fs = require('fs');
let passwordJsContent = fs.readFileSync('js/password.js', 'utf8');
passwordJsContent = passwordJsContent.replace("document.addEventListener('DOMContentLoaded', initPasswordProtection);", "// SIM_COMMENTED: document.addEventListener('DOMContentLoaded', initPasswordProtection);");

const context = {
    window: global.window,
    document: global.window.document, 
    localStorage: global.localStorage, // Make localStorage available in the context
    PASSWORD_CONFIG: global.PASSWORD_CONFIG, 
    TextEncoder: global.window.TextEncoder, // Needs to be available for sha256
    crypto: global.window.crypto, // Needs to be available for sha256
    // Functions to be defined by password.js
    sha256: undefined,
    verifyPassword: undefined,
    isPasswordProtected: undefined,
    isPasswordVerified: undefined,
    showPasswordModal: undefined,
    hidePasswordModal: undefined,
    showPasswordError: undefined,
    hidePasswordError: undefined,
    handlePasswordSubmit: undefined,
    initPasswordProtection: undefined,
};

const Script = require('vm').Script;
const script = new Script(passwordJsContent);
script.runInNewContext(context);

// Assign functions from the context back to global.window
for (const key in context) {
    if (typeof context[key] === 'function' && key !== 'TextEncoder') { 
        global.window[key] = context[key];
    }
}
// Also ensure functions explicitly assigned to window in password.js are on global.window
if (context.window && context.window.isPasswordProtected) global.window.isPasswordProtected = context.window.isPasswordProtected;
if (context.window && context.window.isPasswordVerified) global.window.isPasswordVerified = context.window.isPasswordVerified;


const settingsJsMockContent = `
global.updateApiSelectionUI = function() {
    const selectedAPIs = JSON.parse(global.localStorage.getItem('selectedAPIs') || '[]');
    const apiListUl = global.window.document.querySelector('#api-list-ul');
    if (apiListUl) {
        apiListUl.innerHTML = '';
        Object.keys(global.window.API_SITES).forEach(key => {
            const checkbox = global.window.document.getElementById(\`api-checkbox-\${key}\`);
            checkbox.checked = selectedAPIs.includes(key);
        });
    }
    const countElement = global.window.document.getElementById('selectedApiCount');
    if (countElement) {
        countElement.textContent = selectedAPIs.length.toString();
    }
};
global.saveApiSelection = function() {
    console.log("SIM_SETTINGS: saveApiSelection called");
    const checkboxes = global.window.document.querySelectorAll('#api-settings-panel input[type="checkbox"]');
    const selectedAPIs = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedAPIs.push(checkbox.id.replace('api-checkbox-', ''));
        }
    });
    global.localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    global.updateApiSelectionUI();
};
global.initApiSettings = function() {
    global.updateApiSelectionUI();
};
`;
eval(settingsJsMockContent);

global.window.document.addEventListener('passwordVerified', (event) => {
    console.log("SIM_EVENT: 'passwordVerified' event caught by global listener. Detail:", event.detail);
    if (typeof global.updateApiSelectionUI === 'function') {
        global.updateApiSelectionUI();
    }
});

['selectedApiCount', 'api-list-ul', 'passwordModal', 'passwordError', 'passwordInput', 'passwordSubmitBtn', 'api-settings-panel'].forEach(id => {
    global.window.document.getElementById(id);
});
Object.keys(global.window.API_SITES).forEach(key => {
    global.window.document.getElementById(`api-checkbox-${key}`);
});

if (typeof global.updateApiSelectionUI === 'function') global.updateApiSelectionUI();
else global.renderCheckboxesFromLocalStorage();
