// DEPLOYMENT CONFIG: Replace with your actual Render URL
const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? ''
    : 'https://siram-ai-sita-ai.hf.space';

const videoInput = document.getElementById('videoInput');
const uploadOverlay = document.getElementById('uploadOverlay');
const loaderOverlay = document.getElementById('loaderOverlay');
const mainVideo = document.getElementById('mainVideo');
const downloadBtn = document.getElementById('downloadBtn');
const videoDownloadBtn = document.getElementById('videoDownloadBtn');

videoInput.addEventListener('change', async () => {
    if (!videoInput.files.length) return;
    const file = videoInput.files[0];
    const formData = new FormData();
    formData.append('video', file);

    // UI: Processing State
    uploadOverlay.classList.add('hidden');
    loaderOverlay.classList.remove('hidden');
    document.getElementById('resultBody').innerHTML = `
        <tr class="animate-pulse">
            <td colspan="4" class="px-6 py-4 text-center text-blue-400">
                Analyzing video stream... Live data incoming.
            </td>
        </tr>
    `;

    try {
        const upRes = await fetch(`${API_BASE}/upload_video`, { method: 'POST', body: formData });
        const upData = await upRes.json();

        if (upData.success) {
            pollStatus();
        } else {
            alert('Upload Error');
            location.reload();
        }
    } catch (e) {
        console.error(e);
        alert('Connection Error');
        location.reload();
    }
});

async function pollStatus() {
    const interval = setInterval(async () => {
        const res = await fetch(`${API_BASE}/status`);
        const status = await res.json();

        updateStats(status.counters);

        if (status.status === 'completed') {
            clearInterval(interval);
            finishAnalysis(status);
        } else if (status.status === 'error') {
            clearInterval(interval);
            alert("Analysis Failed: " + status.error);
            location.reload();
        }
    }, 1000);
}

async function finishAnalysis(status) {
    loaderOverlay.classList.add('hidden');
    downloadBtn.href = `${API_BASE}/download/` + status.csv_link;
    downloadBtn.classList.remove('hidden');
    videoDownloadBtn.href = `${API_BASE}/download/` + status.video_link;
    videoDownloadBtn.classList.remove('hidden');

    try {
        const rep = await fetch(`${API_BASE}/traffic_report`);
        const data = await rep.json();
        renderTable(data.data);
    } catch (e) {
        console.error("Table Fetch Error", e);
    }

    mainVideo.classList.remove('hidden');
    mainVideo.controls = true;
    mainVideo.src = `${API_BASE}/download/` + status.video_link;

    mainVideo.onerror = function () {
        alert("Video Playback Error: Please download the video to view it.");
    };

    mainVideo.play().catch(e => console.log("Auto-play blocked"));
}

function updateStats(c) {
    if (!c) return;
    document.getElementById('countTotal').innerText = c.total || 0;
    document.getElementById('countCars').innerText = c.cars || 0;
    document.getElementById('countBikes').innerText = c.bikes || 0;
    document.getElementById('countTrucks').innerText = c.trucks || 0;
}

function renderTable(rows) {
    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No vehicles detected</td></tr>';
        return;
    }

    rows.forEach(r => {
        const tr = document.createElement('tr');
        const vType = r.vehicle_type || 'Unknown';
        const vColor = r.color || 'Unknown';
        let plateDisplay = r.number_plate || 'Not Detected';
        let plateClass = "text-blue-400 font-bold";
        if (plateDisplay === "Not Detected" || plateDisplay.trim() === "") {
            plateDisplay = "Not Detected";
            plateClass = "text-slate-500 italic opacity-50";
        }
        const vFrame = r.frame || '-';

        tr.className = "hover:bg-blue-500/10 transition-colors";
        tr.innerHTML = `
            <td class="px-3 sm:px-6 py-4 font-bold text-white capitalize">${vType}</td>
            <td class="px-3 sm:px-6 py-4">${vColor}</td>
            <td class="px-3 sm:px-6 py-4 font-mono ${plateClass}">${plateDisplay}</td>
            <td class="px-3 sm:px-6 py-4 text-slate-500 font-mono text-xs">${vFrame}</td>
        `;
        tbody.appendChild(tr);
    });
}
