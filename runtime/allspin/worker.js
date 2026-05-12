importScripts('./cold_clear_2.js');

let service;

async function loadRuntimeConfig() {
    try {
        const response = await fetch('./allspin.json', { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch (_) {
        return null;
    }
}

// 初始化 WebAssembly 模組
wasm_bindgen('./cold_clear_2_bg.wasm').then(() => {
    // 重定義 Rust 中的 `log` 函數，用於輸出到主線程
    globalThis.log = (output) => {
        self.postMessage(JSON.parse(output));
    };

    // 創建 Rust Service 實例
    loadRuntimeConfig().then((configJson) => {
        service = new wasm_bindgen.Service(configJson ?? undefined);

        if (configJson) {
            console.log('Service initialized with runtime allspin.json');
        } else {
            console.log('Service initialized with embedded default config');
        }
    });
});

// 處理來自主線程的輸入
self.onmessage = (event) => {
    const input = JSON.stringify(event.data);

    if (service) {
        service.send_input(input); // 發送輸入給 Rust 服務
    } else {
        console.error("Service not initialized yet.");
    }
};