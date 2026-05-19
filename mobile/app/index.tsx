import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Easing } from 'react-native';
import { ApiService, DashboardData } from '../api';
import { Colors } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

/**
 * Mapeia o esquema de cores global (seguro contra falhas) para cada nível de criticidade 
 * identificado pelos microcontroladores no solo ou no ar.
 * 
 * @param {string} status - O status em formato de texto ('critico', 'alerta', 'normal', etc).
 * @returns {string} Código HEX da cor vinculada para renderização das badges e bordas
 */
const getStatusColor = (status: string) => {
    switch (status) {
        case 'critico': return Colors.severity.critica;
        case 'alerta': return Colors.severity.alta;
        case 'normal': return Colors.severity.normal;
        default: return Colors.severity.sem_dados;
    }
};

/**
 * Subcomponente de apresentação de dados métricos em formato Tile.
 * Utiliza o React.memo para evitar re-renderizações onerosas de árvore estrutural secundária.
 * Adicionalmente orquestra interpolação para efeito "Stagger/Cascata" nos bloquinhos do painel.
 */
const MemoizedCard = React.memo(({ title, value, icon, color, isCritical, colorScheme, theme, animValue }: any) => {
    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [25, 0]
    });

    const cardStyle = [
        styles.card,
        { 
            // Calcula o gradiente e contraste de forma programática baseando-se se a malha de estufa falhou.
            backgroundColor: isCritical ? (colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)') : theme.card, 
            shadowColor: colorScheme === 'dark' ? '#000' : '#101828' 
        }
    ];

    return (
        <Animated.View style={[cardStyle, { opacity: animValue, transform: [{ translateY }] }]}>
            <MaterialCommunityIcons name={icon as any} size={32} color={color} style={{ marginBottom: 8 }} />
            <Text style={[styles.cardTitle, { color: isCritical && colorScheme === 'dark' ? '#FFF' : theme.icon }]}>{title}</Text>
            <Text style={[styles.cardValue, { color: isCritical && colorScheme === 'dark' ? '#FFF' : theme.text }]}>{value}</Text>
        </Animated.View>
    );
});

/**
 * Função Raiz do Componente "Dashboard" (Tela Inicial).
 * Esta interface consolida tudo o que os módulos ESP32 da Estufa estão injetando no backend.
 */
export default function DashboardScreen() {
    // Determina o tema do aparelho móvel globalmente.
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    // Hook de controle de estado (Payload central da API e o de Carregamento)
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // Pilha de Referências para os vetores físicos de animação dos 4 cards de temperatura e do vídeo imersivo
    const cardAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
    const videoScaleAnim = useRef(new Animated.Value(1)).current;
    const videoOpacAnim = useRef(new Animated.Value(1)).current;
    
    /**
     * Motor gráfico para efeito de Fundo Imersivo (Ken Burns).
     * Interpolação de valores muito suaves e cíclicos sobre as constantes de Scale e Apacity
     */
    const runVideoAnimation = () => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(videoScaleAnim, {
                        toValue: 1.05,
                        duration: 10000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(videoScaleAnim, {
                        toValue: 1,
                        duration: 10000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ]),
                Animated.sequence([
                    Animated.timing(videoOpacAnim, {
                        toValue: 0.85,
                        duration: 5000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(videoOpacAnim, {
                        toValue: 1,
                        duration: 5000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ])
        ).start();
    };

    /**
     * Orquestrador de cascata: Mostra os 4 cartões em pequenos arranques intervalados de 150ms 
     * a cada vez que a malha atualizar seu payload.
     */
    const runAnimations = () => {
        cardAnims.forEach(anim => anim.setValue(0));
        Animated.stagger(150, cardAnims.map(anim => 
            Animated.timing(anim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        )).start();
    };

    /**
     * Carrega diretamente do módulo de Serviço a integridade atual do Hardware
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const dashboardStatus = await ApiService.getDashboard();
            setData(dashboardStatus);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const isTempCritical = data?.latest_alert?.severity === 'critica';
    const isNormalStatus = !isTempCritical;

    useEffect(() => {
        if (data?.latest_reading) {
            runAnimations();
            runVideoAnimation(); // Agora inicia a animação de fundo pros dois estados (crítico e normal)
        }
    }, [data]);

    useEffect(() => {
        loadData();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: isTempCritical ? '#000' : theme.background }}>
            {/* O Background Animado de Solo Seco só roda no Critico, e o de Solo Bom roda no Normal */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: videoOpacAnim, transform: [{ scale: videoScaleAnim }] }]}>
                {isTempCritical ? (
                    <Video
                        source={require('../assets/videos/temperatura_critica_solo_seco.mp4')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                    />
                ) : (
                    <Video
                        source={require('../assets/videos/temperatura_normal_boa_umidade.mp4')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                    />
                )}
            </Animated.View>
            
            <ScrollView 
                style={[styles.container, { backgroundColor: isTempCritical ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)' }]}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={isTempCritical ? '#FFF' : theme.tint} />}
            >
                <View style={[styles.header, { marginTop: 8 }]}>
                    <View>
                        <Text style={[styles.title, { color: (isTempCritical || isNormalStatus) ? '#FFF' : theme.text }]}>Visão Geral</Text>
                    </View>
                    {data && (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
                            <Text style={styles.statusText}>STATUS: {data.status.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {data?.latest_reading ? (
                    <View style={styles.grid}>
                        <MemoizedCard title="Temperatura" value={`${data.latest_reading.temperature}°C`} icon="thermometer" color="#EF4444" isCritical={isTempCritical} colorScheme={colorScheme} theme={theme} animValue={cardAnims[0]} />
                        <MemoizedCard title="Umidade Ar" value={`${data.latest_reading.humidity}%`} icon="water-percent" color="#3B82F6" isCritical={isTempCritical} colorScheme={colorScheme} theme={theme} animValue={cardAnims[1]} />
                        <MemoizedCard title="Umidade Solo" value={`${data.latest_reading.soil_moisture_percent}%`} icon="sprout" color="#10B981" isCritical={isTempCritical} colorScheme={colorScheme} theme={theme} animValue={cardAnims[2]} />
                        <MemoizedCard title="Luz" value={`${data.latest_reading.luminosity_percent}%`} icon="white-balance-sunny" color="#F59E0B" isCritical={isTempCritical} colorScheme={colorScheme} theme={theme} animValue={cardAnims[3]} />
                    </View>
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 40, color: isTempCritical ? '#FFF' : theme.icon }}>Nenhuma leitura recente encontrada.</Text>
                )}

                {data?.latest_alert && (
                    <View style={[styles.alertContainer, { 
                        backgroundColor: isTempCritical ? 'rgba(239, 68, 68, 0.85)' : Colors.severity[data.latest_alert.severity] + '20', 
                        borderColor: isTempCritical ? '#EF4444' : Colors.severity[data.latest_alert.severity] 
                    }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <MaterialCommunityIcons name="alert-circle" size={24} color={isTempCritical ? '#FFF' : Colors.severity[data.latest_alert.severity]} />
                            <Text style={[styles.alertTitle, { color: isTempCritical ? '#FFF' : Colors.severity[data.latest_alert.severity] }]}>Último Alerta</Text>
                        </View>
                        <Text style={{ color: isTempCritical ? '#FFF' : theme.text, fontSize: 16, fontWeight: isTempCritical ? '500' : 'normal' }}>
                            {data.latest_alert.message}
                        </Text>
                        <Text style={{ color: isTempCritical ? '#FCA5A5' : theme.icon, fontSize: 12, marginTop: 12 }}>
                            {new Date(data.latest_alert.timestamp).toLocaleString()}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: { 
        width: '48%', 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 16,
        elevation: 4, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 10 
    },
    cardTitle: { fontSize: 14, fontWeight: '500' },
    cardValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
    alertContainer: { padding: 18, borderRadius: 16, borderWidth: 1, marginTop: 10, marginBottom: 30 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});