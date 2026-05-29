class BeforeAfter {
    constructor(enteryObject) {

        const beforeAfterContainer = document.querySelector(enteryObject.id);
        const before = beforeAfterContainer.querySelector('.bal-before');
        const beforeText = beforeAfterContainer.querySelector('.bal-beforePosition');
        const afterText = beforeAfterContainer.querySelector('.bal-afterPosition');
        const handle = beforeAfterContainer.querySelector('.bal-handle');
        var widthChange = 0;

        beforeAfterContainer.querySelector('.bal-before-inset').setAttribute("style", "width: " + beforeAfterContainer.offsetWidth + "px;")
        window.onresize = function () {
            beforeAfterContainer.querySelector('.bal-before-inset').setAttribute("style", "width: " + beforeAfterContainer.offsetWidth + "px;")
        }
        before.setAttribute('style', "width: 50%;");
        handle.setAttribute('style', "left: 50%;");

        //touch screen event listener
        beforeAfterContainer.addEventListener("touchstart", (e) => {

            beforeAfterContainer.addEventListener("touchmove", (e2) => {
                let containerWidth = beforeAfterContainer.offsetWidth;
                let currentPoint = e2.changedTouches[0].clientX;

                let startOfDiv = beforeAfterContainer.offsetLeft;

                let modifiedCurrentPoint = currentPoint - startOfDiv;

                if (modifiedCurrentPoint > 10 && modifiedCurrentPoint < beforeAfterContainer.offsetWidth - 10) {
                    let newWidth = modifiedCurrentPoint * 100 / containerWidth;

                    before.setAttribute('style', "width:" + newWidth + "%;");
                    afterText.setAttribute('style', "z-index: 1;");
                    handle.setAttribute('style', "left:" + newWidth + "%;");
                }
            });
        });

        //mouse move event listener
        beforeAfterContainer.addEventListener('mousemove', (e) => {
            let containerWidth = beforeAfterContainer.offsetWidth;
            widthChange = e.offsetX;
            let newWidth = widthChange * 100 / containerWidth;

            if (e.offsetX > 10 && e.offsetX < beforeAfterContainer.offsetWidth - 10) {
                before.setAttribute('style', "width:" + newWidth + "%;");
                afterText.setAttribute('style', "z-index:" + "1;");
                handle.setAttribute('style', "left:" + newWidth + "%;");
            }
        })

    }
}

document.addEventListener('DOMContentLoaded', () => {
    const getVideoSource = (video) => {
        const sourceTag = video.querySelector('source');
        return video.getAttribute('src') || (sourceTag && sourceTag.getAttribute('src')) || '';
    };

    const getPosterPath = (src) => {
        const normalized = src.replace(/^\.?\//, '');
        return normalized ? `./static/video-posters/${normalized.replace(/\.mp4$/i, '.jpg')}` : '';
    };

    const setupVideoLoadingState = (video) => {
        if (video.parentElement && video.parentElement.classList.contains('video-loading-shell')) {
            return;
        }

        const videoSrc = getVideoSource(video);
        const posterPath = getPosterPath(videoSrc);

        const shell = document.createElement('div');
        shell.className = 'video-loading-shell';

        const posterFrame = document.createElement('div');
        posterFrame.className = 'video-poster-frame';
        if (posterPath) {
            posterFrame.style.backgroundImage = `url("${posterPath}")`;
            video.setAttribute('poster', posterPath);
        }

        const indicator = document.createElement('div');
        indicator.className = 'video-loading-indicator';
        indicator.textContent = 'Loading video';

        const parent = video.parentNode;
        parent.insertBefore(shell, video);
        shell.appendChild(video);
        shell.appendChild(posterFrame);
        shell.appendChild(indicator);

        const markLoaded = () => {
            shell.classList.remove('is-error');
            shell.classList.add('is-loaded');
        };

        const markError = () => {
            shell.classList.remove('is-loaded');
            shell.classList.add('is-error');
            indicator.textContent = 'Video unavailable';
        };

        if (video.readyState >= 2) {
            markLoaded();
        } else {
            video.addEventListener('loadeddata', markLoaded, { once: true });
            video.addEventListener('canplay', markLoaded, { once: true });
            video.addEventListener('playing', markLoaded, { once: true });
            video.addEventListener('error', markError, { once: true });
        }
    };

    document.querySelectorAll('video').forEach(setupVideoLoadingState);
});