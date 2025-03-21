import { ethers } from "ethers";
import { CONFIG, ABI } from "./config.js";
import { showNotification, showLoading, hideLoading } from "./ui.js";

export class ContractManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
    }

    async initialize(provider) {
        this.provider = provider;
        this.signer = provider.getSigner();
        this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, this.signer);
        await this.setupEventListeners();
    }

    async setupEventListeners() {
        this.contract.on("HuntStateChanged", (state) => {
            showNotification("Hunt State Changed", `New state: ${this.getHuntStateText(state)}`, "success");
            updateHuntStatus(state);
        });

        this.contract.on("ClueSolved", (clueId, solver) => {
            showNotification("Clue Solved!", `Clue #${clueId} solved by ${solver.slice(0, 6)}...`, "success");
        });

        this.contract.on("NFTAwarded", (tokenId, recipient) => {
            showNotification("NFT Awarded!", `Token #${tokenId} awarded to ${recipient.slice(0, 6)}...`, "success");
        });

        this.contract.on("TreasureHuntCompleted", (winner, tokenId) => {
            showNotification("Hunt Completed!", `Winner: ${winner.slice(0, 6)}... Token: ${tokenId}`, "success");
        });
    }

    async getHuntState() {
        return await this.contract.huntState();
    }

    async getTotalClues() {
        return await this.contract.totalClues();
    }

    async getCurrentClueId() {
        return await this.contract.currentClueId();
    }

    async getCurrentClueURI() {
        try {
            return await this.contract.getCurrentClueURI();
        } catch (error) {
            return "";
        }
    }

    async startHunt() {
        showLoading("Starting Treasure Hunt...");
        try {
            const tx = await this.contract.startHunt({ gasLimit: CONFIG.DEFAULT_GAS_LIMIT });
            await tx.wait();
            showNotification("Success", "Treasure hunt has started!", "success");
        } catch (error) {
            showNotification("Error", error.message, "error");
        }
        hideLoading();
    }

    async addClue(clueURI, answer) {
        showLoading("Adding New Clue...");
        try {
            const tx = await this.contract.addClue(clueURI, answer, { gasLimit: CONFIG.DEFAULT_GAS_LIMIT });
            await tx.wait();
            showNotification("Success", "Clue added successfully!", "success");
        } catch (error) {
            showNotification("Error", error.message, "error");
        }
        hideLoading();
    }

    async submitAnswer(answer) {
        showLoading("Submitting Answer...");
        try {
            const tx = await this.contract.submitAnswer(answer, { gasLimit: CONFIG.DEFAULT_GAS_LIMIT });
            await tx.wait();
            showNotification("Success", "Answer submitted successfully!", "success");
        } catch (error) {
            showNotification("Error", error.message, "error");
        }
        hideLoading();
    }

    async getBalanceOf(address) {
        return await this.contract.balanceOf(address);
    }

    async getTokenURI(tokenId) {
        return await this.contract.tokenURI(tokenId);
    }

    async getOwner() {
        return await this.contract.owner();
    }

    getHuntStateText(state) {
        const states = ["Inactive", "Active", "Completed"];
        return states[state] || "Unknown";
    }
}

export const contractManager = new ContractManager();