export function showNotification(title, message, type = "info") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"} notification-icon"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
        <div class="notification-progress"></div>
    `;

    container.appendChild(notification);

    notification.querySelector(".notification-close").addEventListener("click", () => {
        notification.remove();
    });

    setTimeout(() => notification.remove(), 5000);
}

export function showLoading(message) {
    const overlay = document.getElementById("loading-overlay");
    document.getElementById("loading-message").textContent = message;
    overlay.classList.remove("hidden");
}

export function hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden");
}

export function showModal(title, content, onConfirm) {
    const modal = document.getElementById("modal-container");
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = content;
    
    const confirmBtn = document.getElementById("modal-confirm");
    const cancelBtn = document.getElementById("modal-cancel");
    const closeBtn = document.querySelector(".modal-close");

    modal.classList.remove("hidden");

    const hideModal = () => modal.classList.add("hidden");
    
    confirmBtn.onclick = () => {
        onConfirm();
        hideModal();
    };
    cancelBtn.onclick = hideModal;
    closeBtn.onclick = hideModal;
}

export async function updateNFTGallery(contractManager, account) {
    const container = document.getElementById("nft-container");
    container.innerHTML = "";
    
    const balance = await contractManager.getBalanceOf(account);
    if (balance.toNumber() === 0) {
        container.innerHTML = `
            <div class="empty-gallery-message">
                <i class="fas fa-search"></i>
                <p>You don't have any achievement NFTs yet. Solve clues to earn them!</p>
            </div>
        `;
        return;
    }

    // This is a simplified version - in production, you'd need to track token IDs owned by the user
    for (let i = 1; i <= balance; i++) {
        try {
            const tokenURI = await contractManager.getTokenURI(i);
            const response = await fetch(`${CONFIG.IPFS_GATEWAY}${tokenURI.split("ipfs://")[1]}`);
            const metadata = await response.json();

            const card = document.createElement("div");
            card.className = "nft-card";
            card.innerHTML = `
                <div class="nft-image">
                    ${metadata.image ? `<img src="${CONFIG.IPFS_GATEWAY}${metadata.image.split("ipfs://")[1]}" alt="${metadata.name}">` : 
                    '<div class="placeholder"><i class="fas fa-image"></i></div>'}
                    <span class="badge">Achievement</span>
                </div>
                <div class="nft-content">
                    <div class="nft-title">${metadata.name || `Achievement #${i}`}</div>
                    <div class="nft-info">
                        <span class="nft-id">Token #${i}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        } catch (error) {
            console.error(`Error loading NFT ${i}:`, error);
        }
    }
}

export function updateHuntStatus(state) {
    const stateText = ["Inactive", "Active", "Completed"][state] || "Unknown";
    const badges = document.querySelectorAll(".status-badge");
    badges.forEach(badge => {
        badge.textContent = stateText;
        badge.className = `status-badge ${stateText.toLowerCase()}`;
    });
}