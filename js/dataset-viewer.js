const datasetScenes = [
    "FSK_20241026073527GMT-04:00",
    "FSK_20241026083022GMT-04:00",
    "FSK_20241026083156GMT-04:00",
    "FSK_20241117195226GMT-05:00",
    "FSK_20241124181123GMT-05:00",
    "FSK_20241214144113GMT-05:00",
    "FSK_20241214165044GMT-05:00",
    "FSK_20241215201929GMT-05:00",
    "FSK_20241217213904GMT-05:00",
    "FSK_20241219151355GMT-05:00"
];

// TODO: Remove these variables and other reminicients of the animation I tried to do
let currentDatasetScene = datasetScenes[0];
let currentFocalPosition = 0;
let datasetAnimationId = null;
let isDatasetPlaying = true;
let datasetDirection = 1; // 1 for forward, -1 for backward
const DATASET_ANIMATION_INTERVAL = 500; // 0.5 seconds

// Dataset scrollbar vars
let isDatasetDragging = false;
let datasetStartX = 0;
let datasetScrollLeft = 0;

document.addEventListener("DOMContentLoaded", function () {
    populateDatasetThumbnails();
    setupDatasetCustomScrollbar();
    setupDatasetEventListeners();
    populateDownloadButtonBackground();

    // Start auto-play
    startDatasetAnimation();
});

function setupDatasetEventListeners() {
    // Dataset slider
    const datasetSlider = document.getElementById('dataset-slider');
    datasetSlider.addEventListener('input', function () {
        stopDatasetAnimation();
        updateDatasetImage(parseInt(this.value));
    });

    // Play/Pause/Reset buttons
    document.getElementById('dataset-play-button').addEventListener('click', startDatasetAnimation);
    document.getElementById('dataset-pause-button').addEventListener('click', stopDatasetAnimation);
    document.getElementById('dataset-reset-button').addEventListener('click', resetDatasetAnimation);
}

function populateDatasetThumbnails() {
    const thumbnailScroll = document.getElementById('dataset-thumbnail-scroll');
    let loadedImages = 0;
    const totalImages = datasetScenes.length;

    datasetScenes.forEach((scene, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `assets/dataset-sample/${scene}/midsize/undistorted/RigCenter/focal_position_0000_frame_0000.jpg`;
        thumbnail.alt = `Dataset ${index + 1}`;
        thumbnail.className = 'thumbnail';
        thumbnail.loading = 'eager'; // Force immediate loading of all thumbnails
        if (scene === currentDatasetScene) {
            thumbnail.classList.add('active');
        }
        thumbnail.dataset.scene = scene;

        // Update scrollbar when each image loads
        thumbnail.addEventListener('load', function () {
            loadedImages++;
            if (loadedImages === totalImages) {
                // All images loaded, update scrollbar
                setTimeout(updateDatasetScrollbarAndButtons, 100);
            }
        });

        thumbnail.addEventListener('click', function () {
            selectDatasetScene(scene);

            document.querySelectorAll('#dataset-thumbnail-scroll .thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });

            this.classList.add('active');
        });

        thumbnailScroll.appendChild(thumbnail);
    });

    // Also update immediately in case images are cached
    setTimeout(updateDatasetScrollbarAndButtons, 100);
}

// Helper function to update dataset scrollbar state
function updateDatasetScrollbarAndButtons() {
    const container = document.getElementById('dataset-thumbnail-container');
    const scrollbar = document.getElementById('dataset-custom-scrollbar');
    const thumb = document.getElementById('dataset-scrollbar-thumb');
    const btnLeft = document.getElementById('dataset-scroll-left');
    const btnRight = document.getElementById('dataset-scroll-right');
    const scrollbarContainer = container ? container.parentElement : null;
    const scrollHint = document.getElementById('dataset-scroll-hint');

    if (!container || !scrollbar || !thumb || !btnLeft || !btnRight) return;

    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const scrollLeft = container.scrollLeft;

    const thumbWidth = Math.max(30, containerWidth * containerWidth / scrollWidth);
    thumb.style.width = thumbWidth + 'px';

    const maxScrollLeft = scrollWidth - containerWidth;
    const scrollPercent = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    const maxThumbLeft = scrollbar.offsetWidth - thumbWidth;
    const thumbLeft = scrollPercent * maxThumbLeft;

    thumb.style.left = thumbLeft + 'px';

    btnLeft.disabled = scrollLeft <= 0;
    btnRight.disabled = scrollLeft >= maxScrollLeft;

    // Hide scroll hint if user has scrolled or if all content is visible
    if (scrollHint) {
        if (scrollLeft > 10 || maxScrollLeft <= 0) {
            scrollHint.style.display = 'none';
        }
    }

    // Manage fade gradient visibility
    if (scrollbarContainer) {
        if (scrollLeft >= maxScrollLeft - 5 || maxScrollLeft <= 0) { // Within 5px of the end or no overflow
            scrollbarContainer.classList.add('scrolled-end');
        } else {
            scrollbarContainer.classList.remove('scrolled-end');
        }
    }
}

function setupDatasetCustomScrollbar() {
    const container = document.getElementById('dataset-thumbnail-container');
    const scrollbar = document.getElementById('dataset-custom-scrollbar');
    const thumb = document.getElementById('dataset-scrollbar-thumb');
    const btnLeft = document.getElementById('dataset-scroll-left');
    const btnRight = document.getElementById('dataset-scroll-right');

    updateDatasetScrollbarAndButtons();

    container.addEventListener('scroll', function () {
        updateDatasetScrollbarAndButtons();
    });

    scrollbar.addEventListener('click', function (e) {
        if (e.target === thumb) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const percent = (e.clientX - trackRect.left) / trackRect.width;

        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = percent * maxScroll;
    });

    thumb.addEventListener('mousedown', function (e) {
        isDatasetDragging = true;
        datasetStartX = e.clientX - thumb.offsetLeft;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDatasetDragging) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const maxLeft = trackRect.width - thumb.offsetWidth;

        let newLeft = e.clientX - datasetStartX - trackRect.left;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));

        const scrollPercent = newLeft / maxLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = scrollPercent * maxScroll;
    });

    document.addEventListener('mouseup', function () {
        isDatasetDragging = false;
        document.body.style.userSelect = '';
    });

    btnLeft.addEventListener('click', function () {
        container.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    btnRight.addEventListener('click', function () {
        container.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });

    updateDatasetScrollbarAndButtons();
    container.addEventListener('scroll', updateDatasetScrollbarAndButtons);

    window.addEventListener('resize', function () {
        updateDatasetScrollbarAndButtons();
    });
}

function selectDatasetScene(scene) {
    currentDatasetScene = scene;
    currentFocalPosition = 0;

    document.getElementById('dataset-slider').value = 0;
    document.getElementById('dataset-slider-value').textContent = 0;

    updateDatasetImage(0);

    // Restart animation if it was playing
    if (isDatasetPlaying) {
        stopDatasetAnimation();
        startDatasetAnimation();
    }
}

function updateDatasetImage(focalPosition) {
    currentFocalPosition = focalPosition;

    const imagePath = `assets/dataset-sample/${currentDatasetScene}/midsize/undistorted/RigCenter/focal_position_${String(focalPosition).padStart(4, '0')}_frame_0000.jpg`;
    document.getElementById('dataset-image').src = imagePath;

    document.getElementById('dataset-slider').value = focalPosition;
    document.getElementById('dataset-slider-value').textContent = focalPosition;
}

function startDatasetAnimation() {
    if (datasetAnimationId) return; // Already playing

    isDatasetPlaying = true;

    datasetAnimationId = setInterval(function () {
        let nextPosition = currentFocalPosition + datasetDirection;

        // Check boundaries and reverse direction
        if (nextPosition > 8) {
            datasetDirection = -1;
            nextPosition = 8;
        } else if (nextPosition < 0) {
            datasetDirection = 1;
            nextPosition = 0;
        }

        updateDatasetImage(nextPosition);
    }, DATASET_ANIMATION_INTERVAL);

    // Update button styles
    document.getElementById('dataset-play-button').style.backgroundColor = '#95a5a6';
    document.getElementById('dataset-pause-button').style.backgroundColor = 'rgb(240,240,240)';
}

function stopDatasetAnimation() {
    if (datasetAnimationId) {
        clearInterval(datasetAnimationId);
        datasetAnimationId = null;
    }

    isDatasetPlaying = false;

    // Update button styles
    document.getElementById('dataset-play-button').style.backgroundColor = 'rgb(240,240,240)';
    document.getElementById('dataset-pause-button').style.backgroundColor = '#95a5a6';
}

function resetDatasetAnimation() {
    stopDatasetAnimation();
    datasetDirection = 1;
    updateDatasetImage(0);
    startDatasetAnimation();
}

// Populate download button with static background images
function populateDownloadButtonBackground() {
    const bgContainer = document.getElementById('download-button-bg');
    if (!bgContainer) return;

    // Just use first 5 scenes as static background
    for (let i = 0; i < 5 && i < datasetScenes.length; i++) {
        const img = document.createElement('img');
        img.src = `assets/dataset-sample/${datasetScenes[i]}/midsize/undistorted/RigCenter/focal_position_0004_frame_0000.jpg`;
        img.alt = 'Dataset sample';
        bgContainer.appendChild(img);
    }
}