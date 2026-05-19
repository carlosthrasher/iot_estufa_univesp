# Projeto IoT Estufa Inteligente --- CONTEXTO COMPLETO

## Objetivo do Projeto

Projeto acadêmico (UNIVESP) de automação e monitoramento de estufa IoT.

Objetivo: - coletar dados ambientais via ESP32 - armazenar leituras em
banco NoSQL (MongoDB Atlas) - gerar alertas automáticos - disponibilizar
dashboard e histórico via API - consumir dados via app mobile React
Native / Expo

Fluxo arquitetural: ESP32 → FastAPI → MongoDB Atlas → Mobile App

## Stack Tecnológica

### Hardware

-   ESP32 DOIT DEVKIT V1
-   ESP32-WROOM-32
-   DHT11
-   Sensor de umidade do solo (resistivo)
-   Sensor LDR

### Firmware

-   MicroPython
-   dht
-   machine
-   network
-   ujson
-   requests (MicroPython)

### Backend

-   Python
-   FastAPI
-   Uvicorn
-   PyMongo
-   MongoDB Atlas
-   python-dotenv
-   tzdata

### Mobile

-   React Native
-   Expo
-   TypeScript
-   Axios
-   AsyncStorage
-   react-native-chart-kit

## Estrutura do Projeto

-   api/
-   esp32/
-   mobile/
-   CONTEXTO_PROJETO.md
-   README.md
-   .gitignore

## Configuração ESP32

### GPIOs

-   DHT_PIN = 14
-   SOIL_POWER_PIN = 25
-   SOIL_ANALOG_PIN = 34
-   LDR_ANALOG_PIN = 35

### Calibração

Solo: - seco: 4025 - úmido: 2126

Luminosidade: - escuro: 3931 - claro: 0

### Intervalo de leitura

-   30 minutos

## API

### Base URL local

-   http://192.168.15.6:8000 (pode mudar conforme IP)

### Endpoints

-   POST /api/leituras
-   GET /api/dashboard
-   GET /api/leituras/historico
-   GET /api/alertas/ativos
-   GET /api/alertas
-   PATCH /api/alertas/{id}/lido
-   GET /api/health

## Alertas implementados

-   temperatura alta
-   temperatura crítica
-   solo seco
-   solo crítico
-   baixa luminosidade instantânea
-   luminosidade acumulada diária

## Problemas enfrentados e aprendizados

-   DHT timeout (ETIMEDOUT)
-   COM port busy / COM4 → COM3
-   ECONNABORTED
-   ObjectId não serializável
-   CORS
-   ZoneInfo/tzdata
-   mismatch contrato API/mobile
-   venv quebrada
-   npm/node PATH
-   exposição de credenciais

## Melhorias futuras

-   histórico mobile
-   alertas mobile
-   marcar alerta como lido
-   configuração dinâmica por cultura
-   autenticação
-   multi-device
-   push notifications
-   irrigação automática
-   deploy cloud
-   Docker
-   CI/CD

## Método de troubleshooting

1.  hardware
2.  rede
3.  API
4.  banco
5.  frontend

## Evolução de aprendizado

Conceitos adquiridos: - arquitetura cliente-servidor - REST APIs -
MongoDB CRUD - debugging - integração IoT - contratos frontend/backend -
serialização JSON - CORS - timezone - gestão de dependências - Git
hygiene

## Recomendações de estudo

-   formular hipóteses
-   ler stack trace
-   entender causa-raiz
-   documentar contratos API
-   estudar HTTP, JSON, FastAPI, MongoDB, TypeScript
