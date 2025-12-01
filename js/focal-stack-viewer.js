// Initial frame settings for each stack
const initialFrames = {
    "img_00_position_01": 3,
    "img_01_position_02": 2,
    "img_01_position_09": 5,
    "img_02_position_03": 4,
    "img_02_position_07": 3,
    "img_03_position_03": 6,
    "img_03_position_08": 2,
    "img_04_position_03": 1,
    "img_04_position_08": 3,
    "img_05_position_08": 4,
    "img_06_position_01": 2,
    "img_06_position_08": 5,
    "img_07_position_04": 3,
    "img_07_position_07": 2,
    "img_08_position_09": 6,
    "img_09_position_02": 3,
    "img_10_position_09": 4,
    "img_11_position_01": 2,
    "img_12_position_09": 5,
    "img_13_position_07": 3,
    "img_14_position_08": 2,
    "img_15_position_03": 4,
    "img_16_position_08": 1,
    "img_17_position_08": 3,
    "img_18_position_04": 2
};

const stacks = [
    "img_00_position_01", "img_01_position_02", "img_02_position_03", "img_04_position_08",
    "img_05_position_08", "img_06_position_01", "img_07_position_07", "img_08_position_09",
    "img_09_position_02", "img_10_position_09", "img_11_position_01", "img_12_position_09",
    "img_13_position_07", "img_14_position_08", "img_15_position_03", "img_16_position_08",
    "img_17_position_08", "img_18_position_04"
];

let currentStack = "img_00_position_01";
let currentFrame = initialFrames[currentStack] || 1;
let currentDataset = "naf";
let isHovering = false;

// zoom stuff
const defaultFilterSize = 100;
const defaultZoomFactor = 3.0;
let filterSize = defaultFilterSize;
let zoomFactor = defaultZoomFactor;
let lastX = 0, lastY = 0, lastWidth = 0, lastHeight = 0;
let lastImageId = '';

// custom scrollbar vars
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// runs when the page loads
document.addEventListener("DOMContentLoaded", function () {
    populateThumbnails();
    setupZoomWindow();
    setupMagnifiers();
    updateFilterZoom(3.0);

    // set initial frame from config
    document.getElementById('global-slider').value = currentFrame;
    document.getElementById('slider-value').textContent = currentFrame;

    // set initial dataset to NAF
    switchDataset(currentDataset, false);

    // update all images with initial vals
    updateAllImages();

    // Setup custom scrollbar
    setupCustomScrollbar();

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Global slider
    document.getElementById('global-slider').addEventListener('input', updateAllImages);

    // Filter size slider
    document.getElementById('filter-size').addEventListener('input', function () {
        updateFilterZoom(this.value);
    });

    // Dataset selectors
    document.getElementById('naf-selector').addEventListener('click', function () {
        switchDataset('naf');
    });
    document.getElementById('ip2p-selector').addEventListener('click', function () {
        switchDataset('ip2p');
    });
}

// setup custom scrollbar and its behavior
function setupCustomScrollbar() {
    const container = document.getElementById('thumbnail-container');
    const scrollbar = document.getElementById('custom-scrollbar');
    const thumb = document.getElementById('scrollbar-thumb');
    const btnLeft = document.getElementById('scroll-left');
    const btnRight = document.getElementById('scroll-right');

    // initial thumb size and position
    updateScrollbarAndButtons();

    // listen for container scroll
    container.addEventListener('scroll', function () {
        updateScrollbarAndButtons();
    });

    // handle click on track to jump
    scrollbar.addEventListener('click', function (e) {
        if (e.target === thumb) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const percent = (e.clientX - trackRect.left) / trackRect.width;

        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = percent * maxScroll;
    });

    // thumb drag functionality
    thumb.addEventListener('mousedown', function (e) {
        isDragging = true;
        startX = e.clientX - thumb.offsetLeft;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const maxLeft = trackRect.width - thumb.offsetWidth;

        let newLeft = e.clientX - startX - trackRect.left;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));

        const scrollPercent = newLeft / maxLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = scrollPercent * maxScroll;
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // nav buttons
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

    // update button states on load and scroll
    updateScrollbarAndButtons();
    container.addEventListener('scroll', updateScrollbarAndButtons);

    // also update on window resize
    window.addEventListener('resize', function () {
        updateScrollbarAndButtons();
    });
}

// switch between NAF and InstructPix2Pix datasets
function switchDataset(dataset, updateImages = true) {
    currentDataset = dataset;

    document.getElementById('naf-selector').classList.toggle('active', dataset === 'naf');
    document.getElementById('ip2p-selector').classList.toggle('active', dataset === 'ip2p');

    if (updateImages) {
        updateAllImages();
    }
}

// fill the thumbnail scroller
function populateThumbnails() {
    const thumbnailScroll = document.getElementById('thumbnail-scroll');
    let loadedImages = 0;
    const totalImages = stacks.length;

    stacks.forEach((stack, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `assets/focal-stack-viewer/start/${stack}/start.jpg`;
        thumbnail.alt = `Stack ${index + 1}`;
        thumbnail.className = 'thumbnail';
        thumbnail.loading = 'eager'; // Force immediate loading of all thumbnails
        if (stack === currentStack) {
            thumbnail.classList.add('active');
        }
        thumbnail.dataset.stack = stack;

        // Update scrollbar when each image loads
        thumbnail.addEventListener('load', function () {
            loadedImages++;
            if (loadedImages === totalImages) {
                // All images loaded, update scrollbar
                setTimeout(updateScrollbarAndButtons, 100);
            }
        });

        thumbnail.addEventListener('click', function () {
            selectStack(stack);

            document.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });

            this.classList.add('active');
        });

        thumbnailScroll.appendChild(thumbnail);
    });

    // Also update immediately in case images are cached
    setTimeout(updateScrollbarAndButtons, 100);
}

// Helper function to update scrollbar state
function updateScrollbarAndButtons() {
    const container = document.getElementById('thumbnail-container');
    const scrollbar = document.getElementById('custom-scrollbar');
    const thumb = document.getElementById('scrollbar-thumb');
    const btnLeft = document.getElementById('scroll-left');
    const btnRight = document.getElementById('scroll-right');
    const scrollbarContainer = document.querySelector('.custom-scrollbar-container');
    const scrollHint = document.getElementById('scroll-hint');

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

// builds the zoom window with panels for each image
function setupZoomWindow() {
    const zoomWindow = document.getElementById('zoom-window');

    zoomWindow.innerHTML = '';

    const placeholder = document.createElement('div');
    placeholder.className = 'zoom-placeholder';
    placeholder.textContent = 'Hover over an image to visualize';
    zoomWindow.appendChild(placeholder);

    const imageIds = ['still-image', 'image1', 'image2', 'image3'];
    const panelLabels = ['Input', currentDataset === 'naf' ? 'NAF' : 'InstructPix2Pix', 'Ours', 'GT'];

    imageIds.forEach((id, index) => {
        const panel = document.createElement('div');
        panel.className = 'zoom-panel';
        panel.style.display = 'none';

        const label = document.createElement('div');
        label.className = 'zoom-panel-label';
        label.textContent = panelLabels[index];

        const img = document.createElement('img');
        img.id = `zoom-${id}`;

        panel.appendChild(label);
        panel.appendChild(img);
        zoomWindow.appendChild(panel);
    });
}

// handles the zoom slider changes
function updateFilterZoom(zoom) {
    zoomFactor = parseFloat(zoom);
    document.getElementById('filter-size-value').textContent = `${zoom}x`;

    const newSize = Math.round(200 / zoomFactor);
    filterSize = newSize;

    const magnifiers = document.querySelectorAll('.magnifier');
    magnifiers.forEach(magnifier => {
        magnifier.style.width = `${newSize}px`;
        magnifier.style.height = `${newSize}px`;
    });

    if (isHovering && lastX && lastY) {
        updateAllZoomImages(lastX, lastY, lastWidth, lastHeight);
    }
}

// setup magnifiers for all images
function setupMagnifiers() {
    setupMagnifier('still-image', 'magnifier-still');
    setupMagnifier('image1', 'magnifier-1');
    setupMagnifier('image2', 'magnifier-2');
    setupMagnifier('image3', 'magnifier-3');
}

// show zoom window - called when hovering an image
function showZoomWindow() {
    const zoomWindow = document.getElementById('zoom-window');
    const placeholder = zoomWindow.querySelector('.zoom-placeholder');

    if (placeholder) {
        placeholder.style.display = 'none';
    }

    const panelLabels = document.querySelectorAll('.zoom-panel-label');
    if (panelLabels.length >= 2) {
        panelLabels[1].textContent = currentDataset === 'naf' ? 'NAF' : 'InstructPix2Pix';
    }

    const panels = zoomWindow.querySelectorAll('.zoom-panel');
    panels.forEach(panel => {
        panel.style.display = 'block';
    });

    isHovering = true;
}

// hide zoom window
function hideZoomWindow() {
    const zoomWindow = document.getElementById('zoom-window');
    const placeholder = zoomWindow.querySelector('.zoom-placeholder');

    if (placeholder) {
        placeholder.style.display = 'flex';
    }

    const panels = zoomWindow.querySelectorAll('.zoom-panel');
    panels.forEach(panel => {
        panel.style.display = 'none';
    });

    isHovering = false;
    lastX = 0;
    lastY = 0;
}

// setup and handle the magnifier glass
function setupMagnifier(imageId, magnifierId) {
    const image = document.getElementById(imageId);
    const magnifier = document.getElementById(magnifierId);

    image.addEventListener('mouseenter', function () {
        magnifier.style.display = 'block';
        showZoomWindow();
        lastImageId = imageId;
        updateZoomSources();
    });

    image.addEventListener('mouseleave', function () {
        magnifier.style.display = 'none';
        hideZoomWindow();
    });

    image.addEventListener('mousemove', function (e) {
        const container = magnifier.parentElement;
        const containerBounds = container.getBoundingClientRect();
        const xRelativeToContainer = e.clientX - containerBounds.left;
        const yRelativeToContainer = e.clientY - containerBounds.top;

        magnifier.style.left = `${xRelativeToContainer}px`;
        magnifier.style.top = `${yRelativeToContainer}px`;

        const imgBounds = image.getBoundingClientRect();
        const xRelativeToImage = e.clientX - imgBounds.left;
        const yRelativeToImage = e.clientY - imgBounds.top;

        lastX = xRelativeToImage;
        lastY = yRelativeToImage;
        lastWidth = imgBounds.width;
        lastHeight = imgBounds.height;

        updateAllZoomImages(xRelativeToImage, yRelativeToImage, imgBounds.width, imgBounds.height);
    });
}

// copy current img sources into the zoom window
function updateZoomSources() {
    document.getElementById('zoom-still-image').src = document.getElementById('still-image').src;
    document.getElementById('zoom-image1').src = document.getElementById('image1').src;
    document.getElementById('zoom-image2').src = document.getElementById('image2').src;
    document.getElementById('zoom-image3').src = document.getElementById('image3').src;
}

// update all zoomed imgs based on where cursor is
function updateAllZoomImages(x, y, width, height) {
    if (!isHovering) return;

    const relX = x / width;
    const relY = y / height;

    updateZoomImage('zoom-still-image', relX, relY, zoomFactor);
    updateZoomImage('zoom-image1', relX, relY, zoomFactor);
    updateZoomImage('zoom-image2', relX, relY, zoomFactor);
    updateZoomImage('zoom-image3', relX, relY, zoomFactor);
}

// calculates correct position for a zoomed image
function updateZoomImage(imageId, relX, relY, zoomFactor) {
    const zoomImg = document.getElementById(imageId);
    const panel = zoomImg.parentElement;

    const originalImg = document.getElementById(imageId.replace('zoom-', ''));
    zoomImg.style.width = `${originalImg.offsetWidth * zoomFactor}px`;
    zoomImg.style.height = `${originalImg.offsetHeight * zoomFactor}px`;

    const posX = -((relX * zoomImg.offsetWidth) - panel.offsetWidth / 2);
    const posY = -((relY * zoomImg.offsetHeight) - panel.offsetHeight / 2);

    zoomImg.style.left = `${posX}px`;
    zoomImg.style.top = `${posY}px`;
}

// handles thumbnail selection and loading a new stack
function selectStack(stack) {
    currentStack = stack;

    if (initialFrames[stack]) {
        currentFrame = initialFrames[stack];

        document.getElementById('global-slider').value = currentFrame;
        document.getElementById('slider-value').textContent = currentFrame;
    }

    document.getElementById('still-image').src = `assets/focal-stack-viewer/start/${stack}/start.jpg`;

    const positionNumber = stack.match(/position_(\d+)/)[1];
    document.getElementById('still-text').textContent = `Input Focal Position ${positionNumber}`;

    updateAllImages();
}

// load frame images based on current settings
function updateAllImages() {
    const sliderValue = document.getElementById('global-slider').value;
    currentFrame = sliderValue;
    document.getElementById('slider-value').textContent = sliderValue;

    const basePaths = {
        1: `assets/focal-stack-viewer/${currentDataset}/${currentStack}/`,
        2: `assets/focal-stack-viewer/ours/${currentStack}/`,
        3: `assets/focal-stack-viewer/gt/${currentStack}/`,
    };

    for (let i = 1; i <= 3; i++) {
        document.getElementById('image' + i).src = `${basePaths[i]}frame_${sliderValue}.jpg`;
    }

    if (isHovering) {
        updateZoomSources();
    }
}