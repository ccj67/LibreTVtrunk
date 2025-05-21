require('./test_setup.cjs'); // Load environment and password.js

console.log('--- Test Step 1: Initial Load & Password Entry ---');

// 1.1. Simulate initial load (localStorage is clear or passwordVerified is false)
global.localStorage.clear(); // Use global.localStorage
console.log('Initial localStorage:', global.localStorage.getStore());

console.log('Initial checkbox states (simulated before password verification):');
if (typeof global.updateApiSelectionUI === 'function') { // Functions are on global
    console.log('Calling updateApiSelectionUI from settings.js mock');
    global.updateApiSelectionUI();
} else {
    console.log('Falling back to renderCheckboxesFromLocalStorage');
    global.renderCheckboxesFromLocalStorage();
}
console.log('Checkbox states before verification:', global.getCheckboxStates()); // Use global.getCheckboxStates
const initialCountElement = global.window.document.getElementById('selectedApiCount'); // Use global.window.document
console.log('Initial Selected API Count:', initialCountElement.textContent);

// 1.2. Simulate successful password verification
console.log('\\nSimulating successful password verification...');
async function performVerification() {
    // Ensure window.__ENV__.PASSWORD is set to a hash that sha256('testpass') will match
    // The sha256 function is now on global.window after password.js eval
    const correctHash = await global.window.sha256('testpass');
    global.window.__ENV__.PASSWORD = correctHash;
    console.log('Set window.__ENV__.PASSWORD to hash of \'testpass\' for testing verifyPassword.');

    // Before calling verifyPassword, ensure passwordVerified is false or expired
    // For this test, localStorage is clear, so isPasswordVerified should be false.
    console.log('Is password verified before calling verifyPassword():', global.window.isPasswordVerified());

    // verifyPassword is on global.window after password.js eval
    const verificationResult = await global.window.verifyPassword('testpass');
    console.log('verifyPassword result:', verificationResult); // Should be true

    console.log('\\nAfter password verification:');
    console.log('localStorage content:', global.localStorage.getStore());

    // The 'passwordVerified' event is dispatched on global.window.document.
    // The listener in test_setup.cjs calls global.updateApiSelectionUI.
    // We can also call it explicitly here to ensure the UI state is logged correctly post-event.
    if (typeof global.updateApiSelectionUI === 'function') {
        console.log("Manually calling updateApiSelectionUI to log state after event.");
        global.updateApiSelectionUI();
    }

    console.log('\\nCheckbox states after password verification (should reflect non-adult APIs):');
    console.log('Checkbox states after verification and UI update:', global.getCheckboxStates());
    const selectedApiCountElement = global.window.document.getElementById('selectedApiCount');
    console.log('Selected API Count after verification:', selectedApiCountElement.textContent);

    // Verification checks
    const expectedNonAdultApis = Object.keys(global.window.API_SITES).filter(key => !global.window.API_SITES[key].adult);
    const storedSelectedApis = JSON.parse(global.localStorage.getItem('selectedAPIs') || '[]');

    if (selectedApiCountElement.textContent !== expectedNonAdultApis.length.toString()) {
        console.error(`ERROR: Count mismatch! Expected ${expectedNonAdultApis.length}, Got ${selectedApiCountElement.textContent}`);
    } else {
        console.log(`SUCCESS: API count is correct (${expectedNonAdultApis.length}).`);
    }

    if (storedSelectedApis.length !== expectedNonAdultApis.length) {
        console.error(`ERROR: Stored API count mismatch! Expected ${expectedNonAdultApis.length}, Got ${storedSelectedApis.length}`);
    } else {
        console.log(`SUCCESS: Stored API count in localStorage is correct (${storedSelectedApis.length}).`);
    }

    let allExpectedSelectedCorrectly = true;
    for (const apiKey of expectedNonAdultApis) {
        if (!storedSelectedApis.includes(apiKey)) {
            allExpectedSelectedCorrectly = false;
            console.error(`ERROR: Expected non-adult API ${apiKey} not found in storedSelectedApis.`);
        }
        // Checkbox state directly via our mock DOM
        const checkbox = global.window.document.getElementById(`api-checkbox-${apiKey}`);
        if (!checkbox.checked) {
             allExpectedSelectedCorrectly = false;
             console.error(`ERROR: Checkbox for expected non-adult API ${apiKey} is not checked.`);
        }
    }
    if (allExpectedSelectedCorrectly) {
        console.log('SUCCESS: All expected non-adult APIs are correctly selected and stored, and their checkboxes are checked.');
    }

    let adultApiIncorrectlySelected = false;
    for (const apiKey in global.window.API_SITES) {
        if (global.window.API_SITES[apiKey].adult) {
            if (storedSelectedApis.includes(apiKey)) {
                adultApiIncorrectlySelected = true;
                console.error(`ERROR: Adult API ${apiKey} found in storedSelectedApis.`);
            }
            const adultCheckbox = global.window.document.getElementById(`api-checkbox-${apiKey}`);
            if (adultCheckbox.checked) {
                adultApiIncorrectlySelected = true;
                console.error(`ERROR: Checkbox for adult API ${apiKey} is checked.`);
            }
        }
    }
    if (!adultApiIncorrectlySelected) {
        console.log('SUCCESS: No adult APIs are selected or stored, and their checkboxes are unchecked, as expected.');
    }
}

performVerification();
