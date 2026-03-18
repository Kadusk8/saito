"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionAPI = void 0;
// Simple Evolution API Client
const fs = __importStar(require("fs"));
class EvolutionAPI {
    baseUrl;
    apikey;
    constructor(baseUrl, apikey) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apikey = apikey;
    }
    async request(endpoint, method, body) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apikey
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Evolution API Error [${method} ${endpoint}]:`, errorText);
            let errMsg = response.statusText;
            try {
                const parsed = JSON.parse(errorText);
                errMsg = parsed.response?.message?.[0] || parsed.message || parsed.error || errorText;
            }
            catch {
                errMsg = errorText;
            }
            // Write to a temp file since terminal logs are hard to read
            try {
                const logMsg = `\n[${new Date().toISOString()}] ${method} ${endpoint}\nStatus: ${response.status}\nError: ${errorText}\n------------------\n`;
                fs.appendFileSync('/tmp/evolution-errors.log', logMsg);
            }
            catch (e) { }
            throw new Error(`Evolution API Error: ${errMsg}`);
        }
        return response.json();
    }
    // --- Message & Group Actions ---
    async sendText(instanceName, number, text) {
        return this.request(`/message/sendText/${instanceName}`, 'POST', {
            number,
            text
        });
    }
    async removeParticipant(instanceName, groupJid, participantJid) {
        return this.request(`/group/updateParticipant/${instanceName}`, 'PUT', {
            groupJid,
            action: 'remove',
            participants: [participantJid]
        });
    }
    async deleteMessage(instanceName, remoteJid, messageId, fromMe = false) {
        return this.request(`/chat/deleteMessageForEveryone/${instanceName}`, 'DELETE', {
            remoteJid,
            id: messageId,
            fromMe
        });
    }
    async fetchAllGroups(instanceName) {
        return this.request(`/group/fetchAllGroups/${instanceName}?getParticipants=true`, 'GET');
    }
    // --- Instance Management ---
    async createInstance(instanceName) {
        // Creates the instance and generates a QRCode (base64) by default
        return this.request('/instance/create', 'POST', {
            instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        });
    }
    async setWebhook(instanceName, url, enabledEvents = ['MESSAGES_UPSERT']) {
        return this.request(`/webhook/set/${instanceName}`, 'POST', {
            webhook: {
                enabled: true,
                url,
                byEvents: false, // Allow all if base is false, or specific events
                base64: false, // Send media as base64 or not
                events: enabledEvents
            }
        });
    }
    async getInstanceConnectionState(instanceName) {
        return this.request(`/instance/connectionState/${instanceName}`, 'GET');
    }
    async getInstanceConnect(instanceName) {
        return this.request(`/instance/connect/${instanceName}`, 'GET');
    }
    async fetchInstances() {
        return this.request('/instance/fetchInstances', 'GET');
    }
    async logoutInstance(instanceName) {
        return this.request(`/instance/logout/${instanceName}`, 'DELETE');
    }
    async deleteInstance(instanceName) {
        return this.request(`/instance/delete/${instanceName}`, 'DELETE');
    }
    async addParticipants(instanceName, groupJid, numbers) {
        return this.request(`/group/updateParticipant/${instanceName}`, 'PUT', {
            groupJid,
            action: 'add',
            participants: numbers.map(n => `${n.replace(/\D/g, '')}@s.whatsapp.net`)
        });
    }
    async createGroup(instanceName, subject, participants) {
        return this.request(`/group/create/${instanceName}`, 'POST', {
            subject,
            participants: participants.map(n => `${n.replace(/\D/g, '')}@s.whatsapp.net`)
        });
    }
    async sendGroupMessage(instanceName, groupJid, text) {
        return this.request(`/message/sendText/${instanceName}`, 'POST', {
            number: groupJid,
            text
        });
    }
    async sendMedia(instanceName, number, mediatype, media, caption, fileName) {
        return this.request(`/message/sendMedia/${instanceName}`, 'POST', {
            number,
            mediatype,
            media, // URL or base64
            caption: caption || '',
            fileName: fileName || ''
        });
    }
    async sendWhatsAppAudio(instanceName, number, audio) {
        // audio = URL or base64 of ogg/opus
        return this.request(`/message/sendWhatsAppAudio/${instanceName}`, 'POST', {
            number,
            audio,
            encoding: true
        });
    }
    async sendButtons(instanceName, number, title, description, footer, buttons) {
        return this.request(`/message/sendButtons/${instanceName}`, 'POST', {
            number,
            title,
            description,
            footer,
            buttons
        });
    }
    async sendList(instanceName, number, title, description, footer, buttonText, sections) {
        return this.request(`/message/sendList/${instanceName}`, 'POST', {
            number,
            title,
            description,
            footerText: footer, // Evolution API v2 uses footerText, not footer
            buttonText,
            sections
        });
    }
    async sendCarousel(instanceName, number, cards) {
        return this.request(`/message/sendCarousel/${instanceName}`, 'POST', {
            number,
            cards
        });
    }
}
exports.EvolutionAPI = EvolutionAPI;
//# sourceMappingURL=evolution.js.map