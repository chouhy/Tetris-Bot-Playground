importScripts("cc_tbp.js");
const { start } = wasm_bindgen;
async function run() {
    await wasm_bindgen("cc_tbp_bg.wasm");
    start();
}
run();
