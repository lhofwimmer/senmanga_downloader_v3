navigator.serviceWorker.ready.then(swr => swr.active.postMessage('sendBlob'));
navigator.serviceWorker.onmessage = async e => {
    if (e.data.blob) {
        await chrome.downloads.download({
            url: URL.createObjectURL(e.data.blob),
            filename: e.data.name,
        });
    }
    if (e.data.close) {
        window.close();
    }
}