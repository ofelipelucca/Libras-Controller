interface Gesto {
    bind: string;
    tempo_pressionado: number;
}

class WebSocketClient {
    public socket: WebSocket | null = null;
    public uri: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private pingIntervalId: any = null;
    private PING_INTERVAL: number = 10000;

    constructor(uri: string) {
        this.uri = uri;
        this.connect();
    }

    private connect() {
        this.socket = new WebSocket(this.uri);
        console.log("Tentando conectar ao servidor:", this.uri);
        this.setupListeners();
    }

    public close() {
        if (this.socket) {
            console.log('Fechando a conexão com o servidor:', this.uri);
            this.socket.close();
            this.socket = null;
        }
        this.stopHeartbeat();
        this.reconnectAttempts = 0;
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.onopen = () => {
            console.log('Conectado ao servidor:', this.uri);
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
            console.log('Desconectado do servidor:', this.uri);
            this.stopHeartbeat();
            this.tryReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };
    }

    private handleMessage(data: string) {
        try {
            const message = JSON.parse(data);

            if (message.status) {
                console.log(`Status: ${message.message}`);
            }

            if (message.cameras_disponiveis) {
                this.handleCameraList(message.cameras_disponiveis);
            }

            if (message.allBinds) {
                this.handleBindsList(message.allBinds);
            }

            if (message.camera_selecionada) {
                this.handleCameraSelecionada(message.camera_selecionada);
            }

            if (message.frame) {
                this.handleFrame(message.frame);
            }
        } catch (e) {
            console.error('Falha no JSON:', e);
        }
    }

    public handleCameraList(cameras: string[]) { }
    public handleBindsList(bindsList: { [key: string]: Gesto }) { }
    public handleCameraSelecionada(camera_selecionada: string) { }
    public handleFrame(frame: string) { }

    public sendStartDetection() {
        this.send({ startDetection: true });
    }

    public sendGetAllBinds() {
        this.send({ getAllBinds: true });
    }

    public sendGetGesto(nome: string) {
        this.send({ getGesto: nome });
    }

    public sendSaveGesto(gesto: object, sobreescrever: boolean) {
        this.send({ saveGesto: gesto, sobreescrever });
    }

    public sendSetCamera(nomeCamera: string) {
        this.send({ setCamera: nomeCamera });
    }

    public sendGetCamera() {
        this.send({ getCamera: true });
    }

    public sendGetCamerasDisponiveis() {
        this.send({ getCamerasDisponiveis: true });
    }

    public sendGetFrame() {
        this.send({ getFrame: true });
    }

    private send(data: object) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket não está aberto. Mensagem não enviada:', data);
        }
    }

    private tryReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const timeout = Math.pow(2, this.reconnectAttempts) * 1000;
            setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`Tentando reconectar... Tentativa ${this.reconnectAttempts}`);
                this.connect();
            }, timeout);
        } else {
            console.error(`Falha ao reconectar após ${this.reconnectAttempts} tentativas.`);
        }
    }

    private startHeartbeat() {
        this.pingIntervalId = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.send({ ping: true });
                console.log('Enviando ping ao servidor...');
            }
        }, this.PING_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
    }
}

export default WebSocketClient;
