function forEachWithDelay(array, callback, delay) {
    let i = 0;
    let interval = setInterval(() => {
        callback(array[i]);
        if (++i === array.length) clearInterval(interval);
    }, delay);
}

const downloadChapter = (href, doc) => {
    let images = [...doc.querySelectorAll("div.reader > img")]
        .map(element => element.getAttribute("src") ?? "");

    let chapterNumberRegex = /^.*\/?(?<num>\d(\.\d)?)$/;
    let {groups: {num}} = href.match(chapterNumberRegex);
    chrome.runtime.sendMessage([num, ...images]);
}

const isChapter = (url) => /^.*\/?\d(\.\d)?$/.test(url);

const button = document.createElement("a");

button.addEventListener("click", () => {
    let url = document.location.href;

    if (isChapter(url)) {
        console.log("downloading chapter")
        downloadChapter(url, document);
    } else {
        console.log("downloading multiple chapters")
        let chapters = document.querySelectorAll("ul.chapter-list span.read > a");
        let urls = [...chapters].map(element => element.getAttribute("href"));

        const delayNode = document.querySelector("div.desc > div.social-btn.social-btn-block > input.form-control");
        let delay = parseInt(delayNode.value, 10)

        const parser = new DOMParser();
        forEachWithDelay(urls, chapterUrl => {
            fetch(chapterUrl)
                .then(response => response.text())
                .then(html => parser.parseFromString(html, "text/html"))
                .then(doc => downloadChapter(chapterUrl, doc))
                .catch(err => console.warn("Something went wrong while parsing the chapters", err));
        }, delay);
    }
});

button.setAttribute("data-label", "Download");
button.className = "facebook";

if (isChapter(document.location.href)) {
    const container = document.querySelector("div.pager.row.gap-2.mb-2 > div.nav-page");
    button.innerHTML = "Download"
    button.href = "";
    container.insertBefore(button, container.firstChild)
} else {
    const container = document.querySelector("div.desc > div.social-btn.social-btn-block");
    button.href = "#";
    container.appendChild(button);

    const delay = document.createElement("input")
    delay.className = "form-control"
    delay.setAttribute("type", "text");
    delay.value = "5000";
    container.appendChild(delay);
}