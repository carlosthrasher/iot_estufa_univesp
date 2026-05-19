import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { ApiService, Leitura } from '../api';
import { Colors } from '../constants/theme';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width - 32;

/**
 * Controller da Tela de Histórico e Gráficos da Estufa.
 * Traz as métricas anteriores solicitadas do MongoDB para visualização de tendências.
 */
export default function HistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const [leituras, setLeituras] = useState<Leitura[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Coleta a lista paginada do banco de dados invocando a camada de API.
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await ApiService.getHistoricoLeituras();
            setLeituras(data);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    /**
     * Componente encapsulado para otimização do React Native (FlatList).
     * Renderiza o card individual demonstrando exatamente o registro fotográfico 
     * no exato instante onde o microcontrolador efetuou o upload.
     */
    const MemoizedHistoryItem = React.memo(({ item, theme, colorScheme }: any) => (
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: colorScheme === 'dark' ? '#000' : '#101828' }]}>
            <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.icon} />
                <Text style={[styles.timeText, { color: theme.icon }]}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
            <View style={styles.dataRow}>
                <Text style={{color: theme.text, flex: 1}}>🌡 Temp: {item.temperature.toFixed(1)}°C</Text>
                <Text style={{color: theme.text, flex: 1}}>💧 Umidade Ar: {item.humidity.toFixed(0)}%</Text>
            </View>
            <View style={styles.dataRow}>
                <Text style={{color: theme.text, flex: 1}}>🌱 Solo: {item.soil_moisture_percent.toFixed(0)}%</Text>
                <Text style={{color: theme.text, flex: 1}}>☀️ Luz: {item.luminosity_percent.toFixed(0)}%</Text>
            </View>
        </View>
    ));

    const renderItem = React.useCallback(({ item }: { item: Leitura }) => (
        <MemoizedHistoryItem item={item} theme={theme} colorScheme={colorScheme} />
    ), [theme, colorScheme]);

    /**
     * Motor Gráfico (react-native-chart-kit).
     * Transforma as informações brutas (Array Json) em curvas no plano cartesiano.
     */
    const renderCharts = () => {
        if (leituras.length === 0) return null;

        const sortedData = [...leituras].reverse(); // Do mais antigo pro mais novo
        const labels = sortedData.map(l => {
            const d = new Date(l.timestamp);
            return `${d.getHours()}h`;
        });
        const tempData = sortedData.map(l => l.temperature);
        const soloData = sortedData.map(l => l.soil_moisture_percent);

        const chartConfig = {
            backgroundColor: theme.card,
            backgroundGradientFrom: theme.card,
            backgroundGradientTo: theme.card,
            decimalPlaces: 1, 
            color: (opacity = 1) => theme.tint,
            labelColor: (opacity = 1) => theme.icon,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: theme.tint }
        };

        return (
            <View style={{ marginBottom: 24 }}>
                <Text style={[styles.chartTitle, { color: theme.text }]}>Evolução da Temperatura (°C)</Text>
                <LineChart
                    data={{ labels, datasets: [{ data: tempData }] }}
                    width={screenWidth}
                    height={220}
                    chartConfig={{ ...chartConfig, color: () => Colors.severity.critica, propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.severity.critica } }}
                    bezier
                    style={styles.chartStyle}
                />

                <Text style={[styles.chartTitle, { color: theme.text, marginTop: 24 }]}>Umidade do Solo (%)</Text>
                <LineChart
                    data={{ labels, datasets: [{ data: soloData }] }}
                    width={screenWidth}
                    height={220}
                    chartConfig={{ ...chartConfig, color: () => Colors.severity.normal, propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.severity.normal } }}
                    bezier
                    style={styles.chartStyle}
                />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={leituras}
                keyExtractor={(item, index) => item.device_id + index.toString()}
                renderItem={renderItem}
                ListHeaderComponent={renderCharts}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.tint} />}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.icon }}>Nenhum dado encontrado.</Text>}
                initialNumToRender={8}
                windowSize={5}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    timeText: { marginLeft: 6, fontSize: 14, fontWeight: '500' },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 },
    chartStyle: { marginVertical: 8, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }
});
