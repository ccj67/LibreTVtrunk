require('./test_setup.cjs'); // Load environment, which also initializes UI from localStorage

console.log('--- Test Step 3: Verification After Page Reload ---');

// At the start of this script, test_setup.cjs has already run.
// test_setup.cjs initializes the UI (updateApiSelectionUI) based on localStorage.
// We need to ensure localStorage from the previous "session" (test_step1.cjs) is what's being used.
// For this simulation, we assume test_step1.cjs has already run and populated localStorage.
// The current global.localStorage in this Node process will retain its state from the previous script if it's the same process.
// If it were a new process, we would need to manually set up localStorage to the state after test_step1.cjs.
// For this environment, we'll proceed assuming localStorage is already populated as if test_step1.cjs just finished.

// To be absolutely sure for an isolated test, let's set localStorage to the expected state post-step1/2
const expectedNonAdultApis = Object.keys(global.window.API_SITES).filter(key => !global.window.API_SITES[key].adult);
const passwordVerificationData = {
    verified: true,
    timestamp: Date.now(), // Fresh timestamp, still valid
    passwordHash: global.window.__ENV__.PASSWORD // Assuming it's set or we can use the mock one
};
if (!global.window.__ENV__.PASSWORD || global.window.__ENV__.PASSWORD === 'correct_password_hash_simulated') {
    // If the hash wasn't updated by a real sha256('testpass') in a previous step in this same process,
    // we might need to set it to something that isPasswordVerified would deem correct.
    // However, our isPasswordVerified mock in test_setup.cjs is simplified if password.js didn't load window.isPasswordVerified.
    // The one from password.js *does* check the hash. Let's assume a correct hash is present.
    // For robustness, let's set a believable hash if the default one is still there.
    // This simulates that `verifyPassword` was successfully called earlier.
    global.window.__ENV__.PASSWORD = "13d249f2cb4127b40cfa757866850278793f814ded3c587fe5889e889a7a9f6c"; // Hash for 'testpass'
    passwordVerificationData.passwordHash = global.window.__ENV__.PASSWORD;
}

global.localStorage.setItem(global.PASSWORD_CONFIG.localStorageKey, JSON.stringify(passwordVerificationData));
global.localStorage.setItem('selectedAPIs', JSON.stringify(expectedNonAdultApis));
console.log("Simulated pre-existing localStorage for Step 3:", global.localStorage.getStore());


// Simulate UI update on "page load"
console.log("Simulating page reload by re-running UI update logic...");
if (typeof global.updateApiSelectionUI === 'function') {
    global.updateApiSelectionUI();
} else {
    global.renderCheckboxesFromLocalStorage();
}

console.log('Is password verified on "reload":', global.window.isPasswordVerified()); // Should be true

console.log('Checkbox states on "reload":');
console.log(global.getCheckboxStates());
const countElementStep3 = global.window.document.getElementById('selectedApiCount');
console.log('Selected API Count on "reload":', countElementStep3.textContent);

// Verification for Step 3
const nonAdultCountStep3 = expectedNonAdultApis.length;
if (countElementStep3.textContent === nonAdultCountStep3.toString()) {
    console.log(`SUCCESS (Step 3): API count is correct (${nonAdultCountStep3}).`);
} else {
    console.error(`ERROR (Step 3): Count mismatch! Expected ${nonAdultCountStep3}, Got ${countElementStep3.textContent}`);
}

let allNonAdultCheckedStep3 = true;
expectedNonAdultApis.forEach(key => {
    if (!global.window.document.getElementById(`api-checkbox-${key}`).checked) {
        allNonAdultCheckedStep3 = false;
        console.error(`ERROR (Step 3): Non-adult API ${key} should be checked but is not.`);
    }
});
Object.keys(global.window.API_SITES).forEach(key => {
    if (global.window.API_SITES[key].adult && global.window.document.getElementById(`api-checkbox-${key}`).checked) {
        allNonAdultCheckedStep3 = false;
        console.error(`ERROR (Step 3): Adult API ${key} should NOT be checked but is.`);
    }
});
if (allNonAdultCheckedStep3) {
    console.log("SUCCESS (Step 3): All non-adult APIs are checked, and adult APIs are unchecked, as expected.");
}

console.log('\\n--- Test Step 4: Manual Deselection and Adult API Selection ---');

// 4.1. Manually uncheck a non-adult API and check an adult API
const nonAdultToUncheck = expectedNonAdultApis[0]; // e.g., 'dyttzy'
const adultToCheckBoxName = 'testSource'; // The adult API

console.log(`Simulating user unchecking: ${nonAdultToUncheck}`);
global.simulateUserToggleCheckbox(nonAdultToUncheck); // This calls saveApiSelection via mock

console.log(`Simulating user checking adult API: ${adultToCheckBoxName}`);
global.simulateUserToggleCheckbox(adultToCheckBoxName); // This calls saveApiSelection via mock

console.log('LocalStorage after manual changes:');
console.log(global.localStorage.getStore());
const manuallySelectedAPIs = JSON.parse(global.localStorage.getItem('selectedAPIs'));
console.log('Manually selected APIs from localStorage:', manuallySelectedAPIs);

console.log('Checkbox states after manual changes:');
console.log(global.getCheckboxStates());
const countElementStep4_manual = global.window.document.getElementById('selectedApiCount');
console.log('Selected API Count after manual changes:', countElementStep4_manual.textContent);


// 4.2. Simulate another "page reload"
console.log('\\nSimulating another page reload after manual changes...');
if (typeof global.updateApiSelectionUI === 'function') {
    global.updateApiSelectionUI();
} else {
    global.renderCheckboxesFromLocalStorage();
}

console.log('Is password verified on second "reload":', global.window.isPasswordVerified()); // Should still be true

console.log('Checkbox states after second "reload" (should reflect manual changes):');
const finalCheckboxStates = global.getCheckboxStates();
console.log(finalCheckboxStates);
const countElementStep4_reload = global.window.document.getElementById('selectedApiCount');
console.log('Selected API Count after second "reload":', countElementStep4_reload.textContent);

// Verification for Step 4
if (finalCheckboxStates[nonAdultToUncheck]) { // Should be false
    console.error(`ERROR (Step 4): API ${nonAdultToUncheck} was unchecked, but is now checked after reload.`);
} else {
    console.log(`SUCCESS (Step 4): API ${nonAdultToUncheck} remains unchecked as expected.`);
}
if (!finalCheckboxStates[adultToCheckBoxName]) { // Should be true
    console.error(`ERROR (Step 4): Adult API ${adultToCheckBoxName} was checked, but is now unchecked after reload.`);
} else {
    console.log(`SUCCESS (Step 4): Adult API ${adultToCheckBoxName} remains checked as expected.`);
}

const expectedCountAfterManualChange = manuallySelectedAPIs.length;
if (countElementStep4_reload.textContent === expectedCountAfterManualChange.toString()) {
    console.log(`SUCCESS (Step 4): API count (${expectedCountAfterManualChange}) is correct after manual changes and reload.`);
} else {
    console.error(`ERROR (Step 4): Count mismatch after manual changes and reload! Expected ${expectedCountAfterManualChange}, Got ${countElementStep4_reload.textContent}`);
}

// Double check localStorage to ensure it wasn't overwritten by the "select all non-adult" logic
const finalSelectedAPIs = JSON.parse(global.localStorage.getItem('selectedAPIs'));
if (finalSelectedAPIs.includes(nonAdultToUncheck)) {
     console.error(`ERROR (Step 4): API ${nonAdultToUncheck} is in localStorage selectedAPIs, but should have been removed.`);
}
if (!finalSelectedAPIs.includes(adultToCheckBoxName)) {
     console.error(`ERROR (Step 4): Adult API ${adultToCheckBoxName} is NOT in localStorage selectedAPIs, but should have been added.`);
}
if (!finalSelectedAPIs.includes(nonAdultToUncheck) && finalSelectedAPIs.includes(adultToCheckBoxName)) {
    console.log("SUCCESS (Step 4): localStorage 'selectedAPIs' correctly reflects manual changes and was not overwritten by initial password verification logic.");
}

console.log("All test steps simulated.");
