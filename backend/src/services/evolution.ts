// Simple Evolution API Client
import * as fs from 'fs';
import * as path from 'path';

export class EvolutionAPI {
    private baseUrl: string;
    private apikey: string;

    constructor(baseUrl: string, apikey: string) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apikey = apikey;
    }

    private async request(endpoint: string, method: string, body?: any) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apikey
            },
            body: body ? JSON.stringify(body) : undefined
        } as any);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Evolution API Error [${method} ${endpoint}]:`, errorText);
            
            let errMsg = response.statusText;
            try {
                const parsed = JSON.parse(errorText);
                errMsg = parsed.response?.message?.[0] || parsed.message || parsed.error || errorText;
            } catch {
                errMsg = errorText;
            }

            // Write to a temp file since terminal logs are hard to read
            try {
                const logMsg = `\n[${new Date().toISOString()}] ${method} ${endpoint}\nStatus: ${response.status}\nError: ${errorText}\n------------------\n`;
                fs.appendFileSync('/tmp/evolution-errors.log', logMsg);
            } catch (e) {}
            
            throw new Error(`Evolution API Error: ${errMsg}`);
        }

        return response.json();
    }

    // --- Message & Group Actions ---

    async sendText(instanceName: string, number: string, text: string) {
        return this.request(`/message/sendText/${instanceName}`, 'POST', {
            number,
            text
        });
    }

    async removeParticipant(instanceName: string, groupJid: string, participantJid: string) {
        return this.request(`/group/updateParticipant/${instanceName}`, 'PUT', {
            groupJid,
            action: 'remove',
            participants: [participantJid]
        });
    }

    async deleteMessage(instanceName: string, remoteJid: string, messageId: string, fromMe: boolean = false) {
        return this.request(`/chat/deleteMessageForEveryone/${instanceName}`, 'DELETE', {
            remoteJid,
            id: messageId,
            fromMe
        });
    }

    async fetchAllGroups(instanceName: string) {
        return this.request(`/group/fetchAllGroups/${instanceName}?getParticipants=true`, 'GET');
    }

    // --- Instance Management ---

    async createInstance(instanceName: string) {
        // Creates the instance and generates a QRCode (base64) by default
        return this.request('/instance/create', 'POST', {
            instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        });
    }

    async setWebhook(instanceName: string, url: string, enabledEvents: string[] = ['MESSAGES_UPSERT']) {
        return this.request(`/webhook/set/${instanceName}`, 'POST', {
            webhook: {
                enabled: true,
                url,
                byEvents: false,     // Allow all if base is false, or specific events
                base64: false,       // Send media as base64 or not
                events: enabledEvents
            }
        });
    }

    async getInstanceConnectionState(instanceName: string) {
        return this.request(`/instance/connectionState/${instanceName}`, 'GET');
    }

    async getInstanceConnect(instanceName: string) {
        return this.request(`/instance/connect/${instanceName}`, 'GET');
    }

    async fetchInstances() {
        return this.request('/instance/fetchInstances', 'GET');
    }

    async logoutInstance(instanceName: string) {
        return this.request(`/instance/logout/${instanceName}`, 'DELETE');
    }

    async deleteInstance(instanceName: string) {
        return this.request(`/instance/delete/${instanceName}`, 'DELETE');
    }

    async addParticipants(instanceName: string, groupJid: string, numbers: string[]) {
        return this.request(`/group/updateParticipant/${instanceName}`, 'PUT', {
            groupJid,
            action: 'add',
            participants: numbers.map(n => `${n.replace(/\D/g, '')}@s.whatsapp.net`)
        });
    }

    async createGroup(instanceName: string, subject: string, participants: string[]) {
        return this.request(`/group/create/${instanceName}`, 'POST', {
            subject,
            participants: participants.map(n => `${n.replace(/\D/g, '')}@s.whatsapp.net`)
        });
    }

    async sendGroupMessage(instanceName: string, groupJid: string, text: string) {
        return this.request(`/message/sendText/${instanceName}`, 'POST', {
            number: groupJid,
            text
        });
    }

    async sendMedia(instanceName: string, number: string, mediatype: 'image' | 'video' | 'document', media: string, caption?: string, fileName?: string) {
        return this.request(`/message/sendMedia/${instanceName}`, 'POST', {
            number,
            mediatype,
            media,   // URL or base64
            caption: caption || '',
            fileName: fileName || ''
        });
    }

    async sendWhatsAppAudio(instanceName: string, number: string, audio: string) {
        // audio = URL or base64 of ogg/opus
        return this.request(`/message/sendWhatsAppAudio/${instanceName}`, 'POST', {
            number,
            audio,
            encoding: true
        });
    }

    async sendButtons(instanceName: string, number: string, title: string, description: string, footer: string, buttons: { type: string; displayText: string; url?: string; id?: string; phoneNumber?: string }[]) {
        return this.request(`/message/sendButtons/${instanceName}`, 'POST', {
            number,
            title,
            description,
            footer,
            buttons
        });
    }

    async sendList(instanceName: string, number: string, title: string, description: string, footer: string, buttonText: string, sections: { title: string; rows: { title: string; description?: string; rowId: string }[] }[]) {
        return this.request(`/message/sendList/${instanceName}`, 'POST', {
            number,
            title,
            description,
            footerText: footer,   // Evolution API v2 uses footerText, not footer
            buttonText,
            sections
        });
    }

    async sendCarousel(instanceName: string, number: string, cards: { title: string; description: string; footer?: string; mediaUrl?: string; buttons: { type: string; displayText: string; url?: string }[] }[]) {
        return this.request(`/message/sendCarousel/${instanceName}`, 'POST', {
            number,
            cards
        });
    }
}

