import {downloadZip} from "client-zip";

async function downloadBlob(blob, name, destroyBlob = true) {
    // When `destroyBlob` parameter is true, the blob is transferred instantly,
    // but it's unusable in SW afterwards, which is fine as we made it only to download
    const send = async (dst, close) => {
        dst.postMessage({blob, name, close}, destroyBlob ? [await blob.arrayBuffer()] : []);
    };
    // try an existing page/frame
    const [client] = await self.clients.matchAll({type: 'window'});
    if (client) return send(client);
    const WAR = chrome.runtime.getManifest().web_accessible_resources;
    const tab = WAR?.some(r => r.resources?.includes('../pages/downloader.html'))
        && (await chrome.tabs.query({url: '*://*/*'})).find(t => t.url);
    if (tab) {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                const iframe = document.createElement('iframe');
                iframe.src = chrome.runtime.getURL('../pages/downloader.html');
                iframe.style.cssText = 'display:none!important';
                document.body.appendChild(iframe);
            }
        });
    } else {
        chrome.windows.create({url: '../pages/downloader.html', state: 'minimized'});
    }
    self.addEventListener('message', function onMsg(e) {
        if (e.data === 'sendBlob') {
            self.removeEventListener('message', onMsg);
            send(e.source, !tab);
        }
    });
}

// images array content
// 0: name
// 1-n: image urls
async function download(data) {
    const chapterNumber = data[0];
    data.shift(); // remove chapter number from image url list

    console.log("fetching images")
    let files = await Promise.all(data.map(async (img) => {
        return await fetch(img);
    }));

    let filename = `chapter_${chapterNumber.replaceAll(".","_")}.zip`
    console.log(`packaging to ${filename}`);
    let blob = await downloadZip([...files]).blob()
    await downloadBlob(blob, filename);
}

chrome.runtime.onMessage.addListener(async (response, _, __) => {
    await download(response)
});