import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

/**
 * Sinalizador para forçar a renderização com dados falsos (Mock) ou usar os módulos de IoT reais.
 * ATENÇÃO BRUNO: Variável alterada para 'false' para consumir a API do seu colega e parar de ignorá-la!
 */
export const USE_MOCK_API = false;

/** Chave do banco embutido do dispositivo para guardar o IP do Backend da nossa estufa */
export const API_STORAGE_KEY = '@estufa_api_host';

/** IP base para a comunicação primária caso o app acabe de ser instalado */
const DEFAULT_API_URL = 'http://192.168.15.6:8000'; // IP Padrão 

/**
 * Objeto central do Axios configurado para a API de monitoramento.
 */
const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 5000,
});

/**
 * Interceptor global de segurança e rede.
 * Injeta a URL atualizada gravada pelo usuário na tela de Diagnóstico antes da chamada de rede ser concretizada.
 * Adverte automaticamente serviços de túnel (como ngrok ou localtunnel) para pular as telas de aviso.
 */
apiClient.interceptors.request.use(async (config) => {
  try {
    const customUrl = await AsyncStorage.getItem(API_STORAGE_KEY);
    if (customUrl) {
      config.baseURL = customUrl;
    }
    // Bypass automático para as telas de "Aviso" do Localtunnel/Ngrok
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    config.headers['ngrok-skip-browser-warning'] = '69420';
  } catch (e) {
    console.log("Erro lendo custom URL", e);
  }
  return config;
});

// --- Tipos Globais baseados no Relatório Técnico ---

/**
 * Representa os dados consolidados extraídos pelo ESP32 a partir do ar e solo da estufa.
 */
export type Leitura = {
  device_id: string;
  temperature: number;
  humidity: number;
  soil_moisture_raw: number;
  soil_moisture_percent: number;
  luminosity_raw: number;
  luminosity_percent: number;
  timestamp: string;
};

/**
 * Representação de alertas críticos detectados caso métricas infrinjam faixas seguras do hardware.
 */
export type Alerta = {
  _id?: string;
  device_id: string;
  type: string;
  message: string;
  severity: 'critica' | 'alta' | 'media' | 'normal';
  is_read: boolean;
  is_active: boolean;
  timestamp: string;
  read_at?: string;
};

/** Payload principal que atualiza a folha de rosto (dashboard) do App */
export type DashboardData = {
  status: 'normal' | 'alerta' | 'critico' | 'sem_dados';
  latest_reading: Leitura | null;
  latest_alert: Alerta | null;
};

/** Status de latência e conexão do banco MongoDB e da API FastAPI */
export type HealthData = {
  status: string;
  api: string;
  mongodb: string;
  latest_reading: Leitura | null;
  latest_alert: Alerta | null;
  checked_at: string;
};

// --- MOCK DATA ---
// Dados fictícios para demonstrações do TCC isoladas da rede.

let mockAlertas: Alerta[] = [
  {
    _id: "alert_01",
    device_id: "estufa_01",
    type: "temperatura_e_solo",
    message: "Temperatura crítica (42.5°C) e solo seco. Irrigar imediatamente.",
    severity: "critica",
    is_active: true,
    is_read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins atrás
  },
  {
    _id: "alert_02",
    device_id: "estufa_01",
    type: "luminosidade_baixa",
    message: "Luz abaixo do ideal (18%). Considere abrir a lona.",
    severity: "media",
    is_active: true,
    is_read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 horas atrás
  },
  {
    _id: "alert_03",
    device_id: "estufa_01",
    type: "temperatura_alta",
    message: "Atenção: Temperatura passou de 35°C (36.0°C).",
    severity: "alta",
    is_active: false,
    is_read: true,
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(), // 1 dia atrás
    read_at: new Date(Date.now() - 1000 * 3600 * 23.5).toISOString()
  },
  {
    _id: "alert_04",
    device_id: "estufa_01",
    type: "solo_seco",
    message: "Umidade do solo abaixo do ideal.",
    severity: "media",
    is_active: false,
    is_read: true,
    timestamp: new Date(Date.now() - 1000 * 3600 * 48).toISOString(), // 2 dias atrás
    read_at: new Date(Date.now() - 1000 * 3600 * 46).toISOString()
  }
];

const mockLeituras: Leitura[] = [
  {
    device_id: "estufa_01",
    temperature: 42.5,
    humidity: 30,
    soil_moisture_raw: 3900,
    soil_moisture_percent: 5,
    luminosity_raw: 3200,
    luminosity_percent: 18,
    timestamp: new Date().toISOString(),
  },
  {
    device_id: "estufa_01",
    temperature: 30.0,
    humidity: 50,
    soil_moisture_raw: 2800,
    soil_moisture_percent: 40,
    luminosity_raw: 1000,
    luminosity_percent: 75,
    timestamp: new Date(Date.now() - 1000 * 3600).toISOString(),
  },
  {
    device_id: "estufa_01",
    temperature: 28.5,
    humidity: 65,
    soil_moisture_raw: 2400,
    soil_moisture_percent: 60,
    luminosity_raw: 1800,
    luminosity_percent: 55,
    timestamp: new Date(Date.now() - 1000 * 7200).toISOString(),
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Service Exposto ---

/**
 * Controlador singleton principal do sistema gerenciando toda a integração Mobile -> Backend IoT
 */
export const ApiService = {

  /**
   * Resgata a carga primária com as métricas mais atualizadas consolidadas.
   * @returns {Promise<DashboardData>} Estrutura contendo as métricas de leitura e situação atual da estufa
   */
  getDashboard: async (): Promise<DashboardData> => {
    if (USE_MOCK_API) {
      await delay(600);

      // Lógica de Teste em Mock: Alterna automaticamente entre Normal e Crítico a cada 20 segundos
      const isCriticalCycle = Math.floor(Date.now() / 20000) % 2 === 0;

      return {
        status: isCriticalCycle ? 'critico' : 'normal',
        latest_reading: isCriticalCycle ? mockLeituras[0] : mockLeituras[1], // [0] = Quente (42C), [1] = Bom (30C)
        latest_alert: isCriticalCycle ? (mockAlertas.find(a => a.is_active && !a.is_read) || null) : null,
      };
    }
    const response = await apiClient.get<DashboardData>('/api/dashboard');
    return response.data;
  },

  /**
   * Coleta retroativa de log métrico para prover os desenhos de gráficos temporais
   * @param limit A quantidade de horas/registros a serem obtidos
   * @returns {Promise<Leitura[]>} 
   */
  getHistoricoLeituras: async (limit: number = 20): Promise<Leitura[]> => {
    if (USE_MOCK_API) {
      await delay(600);
      return mockLeituras.slice(0, limit);
    }
    const response = await apiClient.get<{
      total: number;
      items: Leitura[];
    }>(`/api/leituras/historico?limit=${limit}`);

    return response.data.items;
  },

  /**
   * Filtra e recolhe apenas ocorrências ativas ou não descartadas.
   */
  getAlertasAtivos: async (): Promise<Alerta[]> => {
    if (USE_MOCK_API) {
      await delay(600);
      return mockAlertas.filter(a => a.is_active && !a.is_read);
    }
    const response = await apiClient.get<{
      total: number;
      items: Alerta[];
    }>('/api/alertas/ativos');

    return response.data.items;
  },

  /**
   * Solicita do MongoDB toda a malha histórica formatada das condições fora do padrão da flora
   */
  getTodosAlertas: async (): Promise<Alerta[]> => {
    if (USE_MOCK_API) {
      await delay(600);
      return [...mockAlertas].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    const response = await apiClient.get<{
      total: number;
      items: Alerta[];
    }>('/api/alertas');
    return response.data.items;
  },

  /**
   * Sinaliza remotamente no Node/FastAPI que o agricultor mitigou aquele alerta
   * @param {string} id Protocolo de identificação único da notificação
   */
  marcarAlertaLido: async (id: string): Promise<void> => {
    if (USE_MOCK_API) {
      await delay(300);
      const alert = mockAlertas.find(a => a._id === id || a.device_id === id);
      if (alert) {
        alert.is_read = true;
        alert.is_active = false;
        alert.read_at = new Date().toISOString();
      }
      return;
    }
    await apiClient.patch(`/api/alertas/${id}/lido`);
  },

  /**
   * Dispara um PING simples à API FastAPI verificando a cadeia toda (inclusive o Mongo).
   */
  getHealth: async (): Promise<HealthData> => {
    if (USE_MOCK_API) {
      await delay(400);
      return {
        status: "ok",
        api: "online (MOCK)",
        mongodb: "online (MOCK)",
        latest_reading: mockLeituras[0],
        latest_alert: mockAlertas[0],
        checked_at: new Date().toISOString()
      };
    }
    const response = await apiClient.get<HealthData>('/api/health');
    return response.data;
  },

  /**
   * Resgata apenas o registro pontual mais recente de telemetria.
   */
  getUltimaLeitura: async (): Promise<Leitura> => {
    if (USE_MOCK_API) {
      await delay(300);
      return mockLeituras[0];
    }
    const response = await apiClient.get<Leitura>('/api/leituras/ultimas');
    return response.data;
  },

  // ---- CONFIGURAÇÃO DINÂMICA DE REDE ----

  /**
   * Atualiza permanentemente a ponta de comunicação que o app mobile vai escutar via IPv4.
   * Útil em ambiente de desenvolvimento híbrido ou se o IP da Raspberry/PC host da estufa mudar na planta.
   */
  setCustomApiHost: async (hostUrl: string): Promise<void> => {
    await AsyncStorage.setItem(API_STORAGE_KEY, hostUrl);
  },

  /**
   * Lê a âncora pré-definida das rotas ou faz o fallback caso seja a primeira abertura do app.
   */
  getCustomApiHost: async (): Promise<string> => {
    const stored = await AsyncStorage.getItem(API_STORAGE_KEY);
    return stored || DEFAULT_API_URL;
  }
};