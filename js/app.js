import { walletManager } from "./wallet.js";
import { contractManager } from "./contract.js";
import { showNotification, showModal, updateNFTGallery, updateHuntStatus } from "./ui.js";
import { CONFIG } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Elements
    const connectWalletBtn = document.getElementById("connect-wallet");
    const startHuntBtn = document.getElementById("start-hunt");
    const resetHuntBtn = document.getElementById("reset-hunt");
    const addClueBtn = document.getElementById("add-clue");
    const submitAnswerBtn = document.getElementById("submit-answer");
    const refreshGalleryBtn = document.getElementById("refresh-gallery");
    const adminPanel = document.getElementById("admin-panel");

    // Initial setup
    document.getElementById("contract-address").textContent = CONFIG.CONTRACT_ADDRESS;

    // Event Listeners
    connectWalletBtn.addEventListener("click", async () => {
        const connected = await walletManager.connectWallet();
        if (connected) {
            await contractManager.initialize(walletManager.getProvider());
            await initializeApp();
        }
    });

    startHuntBtn.addEventListener("click", () => contractManager.startHunt());
    
    resetHuntBtn.addEventListener("click", () => {
        showModal("Confirm Reset", "Are you sure you want to reset the hunt?", async () => {
            await contractManager.resetHunt();
        });
    });

    addClueBtn.addEventListener("click", async () => {
        const clueURI = document.getElementById("clue-uri").value;
        const answer = document.getElementById("clue-answer").value;
        if (clueURI && answer) {
            await contractManager.addClue(clueURI, answer);
            document.getElementById("clue-uri").value = "";
            document.getElementById("clue-answer").value = "";
            updateClueCount();
        }
    });

    submitAnswerBtn.addEventListener("click", async () => {
        const answer = document.getElementById("player-answer").value;
        if (answer) {
            await contractManager.submitAnswer(answer);
            document.getElementById("player-answer").value = "";
            updatePlayerUI();
        }
    });

    refreshGalleryBtn.addEventListener("click", () => {
        updateNFTGallery(contractManager, walletManager.getAccount());
    });

    async function initializeApp() {
        const account = walletManager.getAccount();
        const owner = await contractManager.getOwner();
        
        // Show/hide admin panel
        if (account.toLowerCase() === owner.toLowerCase()) {
            adminPanel.classList.remove("hidden");
        }

        await updateHuntUI();
        await updatePlayerUI();
        await updateNFTGallery(contractManager, account);
    }

    async function updateHuntUI() {
        const state = await contractManager.getHuntState();
        const totalClues = await contractManager.getTotalClues();
        
        updateHuntStatus(state);
        document.getElementById("total-clues").textContent = `Total Clues: ${totalClues}`;
        document.getElementById("player-total-clues").textContent = totalClues;
    }

    async function updatePlayerUI() {
        const state = await contractManager.getHuntState();
        const currentClueId = await contractManager.getCurrentClueId();
        const clueURI = await contractManager.getCurrentClueURI();

        document.getElementById("current-clue-id").textContent = currentClueId;

        if (state === 0) { // Inactive
            document.getElementById("inactive-hunt-message").classList.remove("hidden");
            document.getElementById("clue-content").classList.add("hidden");
            document.getElementById("completed-hunt-message").classList.add("hidden");
        } else if (state === 1) { // Active
            document.getElementById("inactive-hunt-message").classList.add("hidden");
            document.getElementById("clue-content").classList.remove("hidden");
            document.getElementById("completed-hunt-message").classList.add("hidden");
            document.getElementById("current-clue-display").classList.remove("hidden");

            if (clueURI) {
                try {
                    const response = await fetch(`${CONFIG.IPFS_GATEWAY}${clueURI.split("ipfs://")[1]}`);
                    const clueData = await response.json();
                    document.getElementById("clue-text").textContent = clueData.description || "No description available";
                    if (clueData.image) {
                        const img = document.getElementById("clue-image");
                        img.src = `${CONFIG.IPFS_GATEWAY}${clueData.image.split("ipfs://")[1]}`;
                        img.classList.remove("hidden");
                    }
                } catch (error) {
                    document.getElementById("clue-text").textContent = "Failed to load clue content";
                }
            }
        } else if (state === 2) { // Completed
            document.getElementById("inactive-hunt-message").classList.add("hidden");
            document.getElementById("clue-content").classList.add("hidden");
            document.getElementById("completed-hunt-message").classList.remove("hidden");
            // Winner address would need to be fetched from events in a production environment
        }
    }

    // Check if wallet is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        await walletManager.connectWallet();
        await contractManager.initialize(walletManager.getProvider());
        await initializeApp();
    }
});