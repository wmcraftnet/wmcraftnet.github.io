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
    const VIDEO_LOAD_TIMEOUT_MS = 8000;
    const VIDEO_PRELOAD_ROOT_MARGIN = '900px 0px';
    const INITIAL_VIDEO_LOAD_COUNT = 4;

    const getVideoSource = (video) => {
        const sourceTag = video.querySelector('source');
        return (
            video.getAttribute('src') ||
            video.getAttribute('data-src') ||
            (sourceTag && (sourceTag.getAttribute('src') || sourceTag.getAttribute('data-src'))) ||
            ''
        );
    };

    const attachVideoSource = (video) => {
        const src = getVideoSource(video);
        const sourceTag = video.querySelector('source');

        if (!src) {
            return false;
        }

        if (sourceTag && !sourceTag.getAttribute('src')) {
            sourceTag.setAttribute('src', src);
        } else if (!sourceTag && !video.getAttribute('src')) {
            video.setAttribute('src', src);
        }

        video.dataset.deferredLoaded = 'true';
        return true;
    };

    const getPosterPath = (src) => {
        const normalized = src.replace(/^\.?\//, '');
        return normalized ? `./static/video-posters/${normalized.replace(/\.mp4$/i, '.jpg')}` : '';
    };

    const getBufferedPercent = (video) => {
        if (!Number.isFinite(video.duration) || video.duration <= 0 || video.buffered.length === 0) {
            return 0;
        }

        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        return Math.max(0, Math.min(100, Math.round((bufferedEnd / video.duration) * 100)));
    };

    const updateLoadingIndicator = (video, indicator, fallbackText = 'Loading video') => {
        const percent = getBufferedPercent(video);
        indicator.textContent = `${fallbackText} ${percent}%`;
    };

    const setupVideoLoadingState = (video) => {
        if (video.parentElement && video.parentElement.classList.contains('video-loading-shell')) {
            return;
        }

        const videoSrc = getVideoSource(video);
        const posterPath = getPosterPath(videoSrc);
        video.setAttribute('preload', 'none');

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
        indicator.textContent = 'Queued video 0%';
        video._loadingIndicator = indicator;

        const parent = video.parentNode;
        parent.insertBefore(shell, video);
        shell.appendChild(video);
        shell.appendChild(posterFrame);
        shell.appendChild(indicator);

        let loadedScheduled = false;
        const markLoaded = () => {
            if (loadedScheduled || shell.classList.contains('is-loaded')) {
                return;
            }
            loadedScheduled = true;
            shell.classList.remove('is-error');
            indicator.textContent = 'Ready 100%';
            window.setTimeout(() => {
                shell.classList.add('is-loaded');
            }, 350);
        };

        const markError = () => {
            shell.classList.remove('is-loaded');
            shell.classList.add('is-error');
            indicator.textContent = 'Video unavailable';
        };

        if (video.readyState >= 2) {
            markLoaded();
        } else {
            video.addEventListener('loadstart', () => {
                updateLoadingIndicator(video, indicator);
            });
            video.addEventListener('loadedmetadata', () => {
                updateLoadingIndicator(video, indicator);
            });
            video.addEventListener('progress', () => {
                updateLoadingIndicator(video, indicator);
            });
            video.addEventListener('timeupdate', () => {
                updateLoadingIndicator(video, indicator);
            });
            video.addEventListener('loadeddata', markLoaded, { once: true });
            video.addEventListener('canplay', markLoaded, { once: true });
            video.addEventListener('playing', markLoaded, { once: true });
            video.addEventListener('error', markError, { once: true });
        }
    };

    const playIfAllowed = (video) => {
        if (!video.autoplay || !video.muted) {
            return;
        }

        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
            playAttempt.catch(() => {
                // Mobile browsers may defer autoplay until the user interacts.
            });
        }
    };

    const loadVideo = (video) => new Promise((resolve) => {
        if (video.readyState >= 2 || video.dataset.deferredLoaded === 'true') {
            resolve();
            return;
        }

        let resolved = false;
        const finish = () => {
            if (resolved) {
                return;
            }
            resolved = true;
            clearTimeout(timeoutId);
            video.removeEventListener('loadeddata', finish);
            video.removeEventListener('canplay', finish);
            video.removeEventListener('error', finish);
            resolve();
        };

        const timeoutId = window.setTimeout(finish, VIDEO_LOAD_TIMEOUT_MS);
        video.addEventListener('loadeddata', finish);
        video.addEventListener('canplay', finish);
        video.addEventListener('error', finish);

        if (!attachVideoSource(video)) {
            finish();
            return;
        }

        if (video._loadingIndicator) {
            updateLoadingIndicator(video, video._loadingIndicator);
        }
        video.setAttribute('preload', 'metadata');
        video.load();
        playIfAllowed(video);
    });

    const setupViewportPlayback = (videos) => {
        if (!('IntersectionObserver' in window)) {
            videos.forEach(playIfAllowed);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    playIfAllowed(video);
                } else {
                    video.pause();
                }
            });
        }, { rootMargin: '240px 0px', threshold: 0.05 });

        videos.forEach((video) => observer.observe(video));
    };

    const createVideoLoadQueue = (videos) => {
        const pending = new Set(videos);
        const queued = [];
        let active = false;

        const run = async () => {
            if (active) {
                return;
            }
            active = true;
            while (queued.length > 0) {
                await loadVideo(queued.shift());
            }
            active = false;
        };

        return {
            enqueue(video) {
                if (!pending.has(video)) {
                    return;
                }
                pending.delete(video);
                queued.push(video);
                run();
            },
            enqueueMany(nextVideos) {
                nextVideos.forEach((video) => this.enqueue(video));
            },
            enqueueRemaining() {
                this.enqueueMany(videos.filter((video) => pending.has(video)));
            },
        };
    };

    const setupViewportLoading = (videos, loadQueue) => {
        if (!('IntersectionObserver' in window)) {
            loadQueue.enqueueRemaining();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            const visibleVideos = entries
                .filter((entry) => entry.isIntersecting)
                .map((entry) => entry.target)
                .sort((a, b) => videos.indexOf(a) - videos.indexOf(b));

            loadQueue.enqueueMany(visibleVideos);
            visibleVideos.forEach((video) => observer.unobserve(video));
        }, { rootMargin: VIDEO_PRELOAD_ROOT_MARGIN, threshold: 0.01 });

        videos.forEach((video) => observer.observe(video));
    };

    const scheduleIdleLoading = (loadQueue) => {
        const loadRemaining = () => loadQueue.enqueueRemaining();
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadRemaining, { timeout: 6000 });
        } else {
            window.setTimeout(loadRemaining, 3000);
        }
    };

    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach(setupVideoLoadingState);
    const loadQueue = createVideoLoadQueue(videos);
    loadQueue.enqueueMany(videos.slice(0, INITIAL_VIDEO_LOAD_COUNT));
    setupViewportLoading(videos, loadQueue);
    setupViewportPlayback(videos);
    scheduleIdleLoading(loadQueue);
});