<div align="center">
  <img src="./logo-univesp.jpeg" alt="Logo UNIVESP" width="600" />

  # 🌱 Sistema IoT para Monitoramento e Automação de Estufa de Hortaliças

  **UNIVERSIDADE VIRTUAL DO ESTADO DE SÃO PAULO (UNIVESP)** <br>
  **Projeto Integrador GRP9 - PJ510 - A2026S1NI**

  ---

  <!-- Badges -->
  <p align="center">
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
  </p>
</div>

## 📌 Sobre o Projeto

Este projeto consiste em uma solução de **Internet das Coisas (IoT)** desenvolvida para o monitoramento e automação inteligente de estufas de hortaliças. A plataforma visa aumentar a eficiência no cultivo e reduzir o desperdício de recursos através do controle preciso de variáveis ambientais.

O sistema é composto por:
- **Dispositivo Embarcado**: Um microcontrolador ESP32 integrado a sensores (DHT11 para temperatura e umidade do ar, LDR para luminosidade e sensor de umidade do solo) instalados fisicamente na estufa.
- **Backend/API**: Uma API robusta desenvolvida em FastAPI e Python que recebe, processa e armazena dados em um banco de dados NoSQL (MongoDB).
- **Frontend/Mobile**: Um aplicativo intuitivo e moderno desenvolvido em React Native e Expo, permitindo o acompanhamento em tempo real, visualização de históricos e geração de alertas críticos para a tomada instantânea de decisão.

## 🏗️ Arquitetura do Sistema

O fluxo de dados da nossa solução é distribuído e projetado em camadas interconectadas:

1. **Hardware (Percepção)**: Sensores monitoram o ambiente em tempo real e enviam leituras analógicas/digitais continuamente para o ESP32.
2. **Comunicação (Borda)**: O ESP32, operando via protocolo WiFi, empacota os dados em JSON e realiza requisições HTTP (POST) para o nosso servidor em nuvem.
3. **Backend (Processamento)**: A API RESTful (FastAPI) recepciona, valida e normaliza as informações. Se métricas como temperatura ou umidade ultrapassam limites seguros, ocorrências extras são geradas.
4. **Persistência (Armazenamento)**: Registros de telemetria e o controle de estado atual são persistidos no banco de dados MongoDB, visando estabilidade e fácil auditoria e criação de gráficos.
5. **Mobile (Aplicação)**: O app mobile consome a nossa API de forma resiliente para prover um _dashboard_ atualizado, acesso ao log de sensores, acionamentos de estufa e tela de alertas ativos ao produtor agrícola.

## 💻 Tecnologias Utilizadas

### 📱 Mobile (Frontend)
- **React Native** & **Expo**
- **TypeScript**
- **Axios** (Comunicação HTTP)

### ⚙️ Backend (API e Banco de Dados)
- **Python 3**
- **FastAPI**
- **Uvicorn**
- **MongoDB** / **PyMongo**

### 🔧 IoT & Hardware
- **ESP32** (Microcontrolador com WiFi nativo)
- **C/C++** (Arduino IDE)
- Sensores: **DHT11** (Temp/Umidade do Ar), **LDR** (Sensor de Luminosidade), **Sensor de Umidade do Solo**

## 🚀 Pré-requisitos e Instalação

Siga os passos abaixo para configurar o ambiente e testar o projeto localmente em sua máquina.

### 🔙 Executando o Backend (API)

```bash
# Supondo que você clonou o repositório, acesse a raiz e navegue até a pasta correspondente (Ajuste caso o nome difira)
cd caminho-do-projeto/

# Crie um ambiente virtual (venv) na pasta de backend ou raiz
python -m venv venv

# Windows (Ative a VENV)
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Instale as dependências essenciais
pip install fastapi uvicorn pymongo python-dotenv

# Inicie o servidor FastAPI em modo de desenvolvimento (o parâmetro reload atualiza o server em live)
uvicorn main:app --reload

# A API estará automaticamente exposta em http://localhost:8000
```

### 📱 Executando o App Mobile

Certifique-se de que possui o **Node.js** e o utilitário do **Expo CLI** devidamente instalados no seu SO.

```bash
# Abra uma nova aba no seu terminal e navegue para o diretório do app
cd estufa-mobile/

# Instale os pacotes NPM necessários
npm install

# Inicie o servidor do projeto Mobile
npx expo start

# Obs: Escaneie o QR Code no terminal com o aplicativo "Expo Go" no seu smartphone, ou aperte "a" para iniciar o emulador de Android.
```

## 🔌 Acesso à API

A API entrega endpoints modernos via protocolo HTTP para alimentar o Mobile e receber dados do Hardware. As rotas principais incluem:

- **`GET /api/health`**: Verifica o status da API e MongoDB, retornando também a última leitura e alerta para diagnóstico.
- **`GET /api/dashboard`**: Retorna o resumo operacional da estufa (status, última leitura e alerta ativo).
- **`POST /api/leituras`**: Rota de borda que recebe o payload JSON enviado pelo ESP32 para persistência.
- **`GET /api/leituras/ultimas`**: Recupera apenas o registro mais recente de telemetria.
- **`GET /api/leituras/historico`**: Recupera a série temporal de métricas para geração de gráficos.
- **`GET /api/alertas/ativos`**: Lista as notificações críticas que ainda não foram tratadas.
- **`GET /api/alertas`**: Histórico completo de ocorrências da estufa.
- **`PATCH /api/alertas/{id}/lido`**: Sinaliza que o agricultor mitigou a condição de alerta.

> **💡 Dica de Documentação**: Acesse o contrato da API completamente interativo via Swagger digitando `http://localhost:8000/docs` enquanto executa o backend FastAPI.

## 👥 Equipe

Abaixo estão os integrantes responsáveis pelo projeto, pesquisa e engenharia desse sistema de monitoramento para suporte da UNIVESP.

| Nome Completo | Registro Acadêmico (RA) |
| :--- | :---: |
| **Caio César Caetano Silva** | 2214077 |
| **Bruno Figueredo dos Santos** | 2204478 |
| **Carlos Henrique Costa Pereira** | 21087889 |

<br>

---
<p align="center">
Desenvolvido com 💡 e ☕ pelo grupo GRP9 - pólos parceiros.
</p>
