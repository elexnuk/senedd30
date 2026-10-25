
export function downloadSVG(svg: Element) {
    return new Promise((accept, reject) => {
        // let { width: svgWidth, height: svgHeight } = svg.getBBox(); // Could do tighter cropping here?
        let width = 1920, height = 1080;
        let clone = svg.cloneNode(true) as Element;
        clone.setAttribute("width", width.toString());
        clone.setAttribute("height", height.toString());

        let blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
        let blobURL = window.URL.createObjectURL(blob);

        console.log("Download blob", blobURL);

        (function (href, name) {
            let link = document.createElement("a");
            link.download = name;
            link.href = href;

            link.style.opacity = "0";
            link.style.position = "absolute";
            document.body.appendChild(link);
            link.click();
            link.remove();
        })(blobURL, `senedd2030-boundary.svg`);

        accept(svg);
    });
}

export function downloadPNG(svg: Element) {
    return new Promise((accept, reject) => {
        let width = 1920, height = 1080;
        let clone = svg.cloneNode(true) as Element;
        clone.setAttribute("width", width.toString());
        clone.setAttribute("height", height.toString());

        let blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
        let blobURL = window.URL.createObjectURL(blob);

        let image = new Image();
        image.onload = () => {
            let canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            let context = canvas.getContext("2d");
            if (!context) {
                alert("Unable to create canvas for png drawing");
                reject("Unable to create a 2D canvas for png");
                return;
            }
            setDPI(canvas, 300);
            context.drawImage(image, 0, 0, width, height);

            let png = canvas.toDataURL();
            console.log("Download PNG", png);
            (function (href, name) {
                let link = document.createElement("a");
                link.download = name;
                link.href = href;

                link.style.opacity = "0";
                link.style.position = "absolute";
                document.body.appendChild(link);
                link.click();
                link.remove();
            })(png, `senedd2030-boundary.png`)

            accept(png);
        }
        image.src = blobURL;
    })
}

function setDPI(canvas: HTMLCanvasElement, dpi: number) {
    canvas.style.width = canvas.style.width || canvas.width + 'px';
    canvas.style.height = canvas.style.height || canvas.height + 'px';

    // Resize canvas and scale future draws.
    var scaleFactor = dpi / 96;
    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    var ctx = canvas.getContext('2d');
    if (!ctx) {
        alert("Unable to create canvas context for png drawing.");
        return
    }
    ctx.scale(scaleFactor, scaleFactor);
}
