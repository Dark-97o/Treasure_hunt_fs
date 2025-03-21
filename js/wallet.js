import { ethers } from "ethers";
import { CONFIG } from "./config.js";
import { showNotification } from "./ui.js";

export class WalletManager {
    constructor() {
        this.provider = null;
        this.account = null;
    }

    async connectWallet() {
        if (!window.ethereum) {
            showNotification("Error", "Please install MetaMask!", "error");
            return false;
        }

        try {
            await window.ethereum.request({ 
                method: "wallet_switchEthereumChain",
                params: [{ chainId: CONFIG.NETWORK.chainId }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [CONFIG.NETWORK]
                    });
                } catch (addError) {
                    showNotification("Error", "Failed to add network", "error");
                    return false;
                }
            } else {
                showNotification("Error", "Failed to switch network", "error");
                return false;
            }
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: "eth_requestAccounts" 
            });
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.account = accounts[0];
            
            this.updateWalletUI();
            this.setupWalletListeners();
            return true;
        } catch (error) {
            showNotification("Error", "Failed to connect wallet", "error");
            return false;
        }
    }

    updateWalletUI() {
        document.getElementById("network-name").textContent = CONFIG.NETWORK.chainName;
        document.getElementById("network-name").classList.remove("not-connected");
        document.getElementById("connect-wallet").classList.add("hidden");
        document.getElementById("account-address").textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
        this.provider.getBalance(this.account).then(balance => {
            document.getElementById("account-balance").textContent = `${ethers.utils.formatEther(balance)} ETH`;
        });
        document.querySelector(".account-info").classList.remove("hidden");
    }

    setupWalletListeners() {
        window.ethereum.on("accountsChanged", (accounts) => {
            this.account = accounts[0];
            this.updateWalletUI();
            showNotification("Account Changed", `Connected to ${this.account.slice(0, 6)}...`, "info");
        });

        window.ethereum.on("chainChanged", (chainId) => {
            window.location.reload();
        });
    }

    getProvider() {
        return this.provider;
    }

    getAccount() {
        return this.account;
    }
}

export const walletManager = new WalletManager();