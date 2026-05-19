import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ApiService, HealthData } from '../api';
import { Colors } from '../constants/theme';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Controller focado na Engenharia do Sistema.
 * Permite que a equipe altere dinamicamente a rota da API (Hot-Swap) sem necessidade 
 * de recompilação do App, além de verificar se o Hardware está trafegando pro MongoDB.
 */
export default function DiagnosticScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    // Status vital dos serviços atrelados a estufa
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    const [ipInput, setIpInput] = useState('');
    const [loadingIp, setLoadingIp] = useState(false);

    /**
     * Ciclo de validação de conectividade. 
     * Resgata qual é a URL física configurada e tenta dar um "Ping" no Backend Python.
     */
    const loadData = async () => {
        setLoadingIp(true);
        try {
            await ApiService.getCustomApiHost().then(setIpInput);
            // Ignora o health caso o Node Python esteja fora do ar, garantindo que UI não congele
            const health = await ApiService.getHealth().catch(() => null);
            setData(health);
        } catch (error) {
            console.error("Erro ao carregar health:", error);
        } finally {
            setLoadingIp(false);
        }
    };

    /**
     * Sobrecreve a memória persistente do dispositivo com a nova antena receptora (IP da placa/PC).
     */
    const saveIp = async () => {
        setLoadingIp(true);
        if (!ipInput.startsWith('http://') && !ipInput.startsWith('https://')) {
            alert('Aviso: Inclua o http:// no começo da URL!');
            setLoadingIp(false);
            return;
        }
        await ApiService.setCustomApiHost(ipInput);
        alert('🌐 Antena reconectada ao novo Host!');
        loadData(); // Tenta pingar a saúde com o novo IP inserido
    };

    useEffect(() => {
        loadData();
    }, []);

    const StatusItem = ({ label, value, isOnline }: { label: string, value: string, isOnline: boolean }) => (
        <View style={[styles.statusItem, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text, fontSize: 16 }}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons 
                    name={isOnline ? "check-circle" : "close-circle"} 
                    size={20} 
                    color={isOnline ? Colors.severity.normal : Colors.severity.critica} 
                    style={{ marginRight: 6 }} 
                />
                <Text style={{ color: isOnline ? Colors.severity.normal : Colors.severity.critica, fontWeight: 'bold' }}>
                    {value.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={loadingIp} onRefresh={loadData} tintColor={theme.tint} />}
        >
            {/* NOVO: Bloco de Direcionador de API Dinâmico */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={{ alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={[styles.title, { color: theme.text, fontSize: 18, marginTop: 0 }]}>
                        Conexão do Servidor IoT
                    </Text>
                    <Text style={{ color: theme.icon, fontSize: 13, marginBottom: 16 }}>
                        Endereço IPv4 do servidor de telemetria (Gateway IoT). Ex: http://192.168.1.5:8000
                    </Text>
                    <View style={{ flexDirection: 'row', width: '100%' }}>
                        <TextInput
                            style={{ flex: 1, backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginRight: 8 }}
                            value={ipInput}
                            onChangeText={setIpInput}
                            placeholder="http://"
                            placeholderTextColor={theme.icon}
                        />
                        <TouchableOpacity style={{ backgroundColor: theme.tint, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8 }} onPress={saveIp} disabled={loadingIp}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Antigo Bloco de Saúde do Sistema */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                   <MaterialCommunityIcons name="server-network" size={48} color={theme.tint} />
                   <Text style={[styles.title, { color: theme.text }]}>Status do Sistema</Text>
                   <Text style={{ color: theme.icon, marginTop: 4 }}>
                       Último check: {data ? new Date(data.checked_at).toLocaleString() : '---'}
                   </Text>
                </View>

                {data ? (
                    <View>
                        <View style={{ backgroundColor: theme.background, borderRadius: 12, padding: 16 }}>
                            <StatusItem label="Situação Geral" value={data.status} isOnline={data.status === 'ok'} />
                            <StatusItem label="API Backend" value={data.api} isOnline={data.api.toLowerCase().includes('online')} />
                            <StatusItem label="MongoDB Atlas" value={data.mongodb} isOnline={data.mongodb.toLowerCase().includes('online')} />
                        </View>

                        {/* Detalhes Técnicos da Última Telemetria */}
                        <View style={{ marginTop: 20, padding: 10, borderLeftWidth: 3, borderLeftColor: theme.tint, backgroundColor: theme.background + '50' }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 8 }}>Último Payload de Sensores:</Text>
                            {data.latest_reading ? (
                                <Text style={{ color: theme.icon, fontSize: 13, lineHeight: 18 }}>
                                    Temp: {data.latest_reading.temperature}°C | Ar: {data.latest_reading.humidity}% | Solo: {data.latest_reading.soil_moisture_percent}%{"\n"}
                                    {new Date(data.latest_reading.timestamp).toLocaleTimeString()}
                                </Text>
                            ) : (
                                <Text style={{ color: theme.icon, fontSize: 13 }}>Nenhuma leitura vinculada.</Text>
                            )}
                        </View>

                        {/* Detalhes do Alerta Retornado */}
                        {data.latest_alert && (
                            <View style={{ marginTop: 12, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.severity[data.latest_alert.severity], backgroundColor: theme.background + '50' }}>
                                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>Alerta em Cache:</Text>
                                <Text style={{ color: theme.icon, fontSize: 13 }}>
                                    [{data.latest_alert.type.toUpperCase()}] {data.latest_alert.message}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Text style={{ textAlign: 'center', color: theme.icon, marginVertical: 20 }}>Carregando diagnóstico...</Text>
                )}
            </View>
            
            <View style={{ marginTop: 20, padding: 16 }}>
                <Text style={{ color: theme.icon, textAlign: 'center', fontSize: 12 }}>
                    Estufa IoT v1.0.0
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: {
        padding: 24,
        borderRadius: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginTop: 16
    },
    title: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    }
});
