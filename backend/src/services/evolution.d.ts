export declare class EvolutionAPI {
    private baseUrl;
    private apikey;
    constructor(baseUrl: string, apikey: string);
    private request;
    sendText(instanceName: string, number: string, text: string): Promise<any>;
    removeParticipant(instanceName: string, groupJid: string, participantJid: string): Promise<any>;
    deleteMessage(instanceName: string, remoteJid: string, messageId: string, fromMe?: boolean): Promise<any>;
    fetchAllGroups(instanceName: string): Promise<any>;
    createInstance(instanceName: string): Promise<any>;
    setWebhook(instanceName: string, url: string, enabledEvents?: string[]): Promise<any>;
    getInstanceConnectionState(instanceName: string): Promise<any>;
    getInstanceConnect(instanceName: string): Promise<any>;
    fetchInstances(): Promise<any>;
    logoutInstance(instanceName: string): Promise<any>;
    deleteInstance(instanceName: string): Promise<any>;
    addParticipants(instanceName: string, groupJid: string, numbers: string[]): Promise<any>;
    createGroup(instanceName: string, subject: string, participants: string[]): Promise<any>;
    sendGroupMessage(instanceName: string, groupJid: string, text: string): Promise<any>;
    sendMedia(instanceName: string, number: string, mediatype: 'image' | 'video' | 'document', media: string, caption?: string, fileName?: string): Promise<any>;
    sendWhatsAppAudio(instanceName: string, number: string, audio: string): Promise<any>;
    sendButtons(instanceName: string, number: string, title: string, description: string, footer: string, buttons: {
        type: string;
        displayText: string;
        url?: string;
        id?: string;
        phoneNumber?: string;
    }[]): Promise<any>;
    sendList(instanceName: string, number: string, title: string, description: string, footer: string, buttonText: string, sections: {
        title: string;
        rows: {
            title: string;
            description?: string;
            rowId: string;
        }[];
    }[]): Promise<any>;
    sendCarousel(instanceName: string, number: string, cards: {
        title: string;
        description: string;
        footer?: string;
        mediaUrl?: string;
        buttons: {
            type: string;
            displayText: string;
            url?: string;
        }[];
    }[]): Promise<any>;
}
//# sourceMappingURL=evolution.d.ts.map