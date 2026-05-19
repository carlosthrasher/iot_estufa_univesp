import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { ApiService, Alerta } from '../api';
import { Colors } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

/**
 * Controller focado no fluxo de urgências e contingências do cultivo.
 * Demonstra notificações push ou chamadas de log que necessitem de intervenção 
 * humana (ex: temperatura além do limite, falha de água).
 */
export default function AlertsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

    /**
     * Efetua a verificação condicional na API: 
     * Traz as ocorrências vivas (requerendo atenção) ou o rastreio (já lidas).
     */
    const loadData = async () => {
        setLoading(true);
        try {
            let data: Alerta[] = [];
            if (activeTab === 'ativos') {
                data = await ApiService.getAlertasAtivos();
            } else {
                data = await ApiService.getTodosAlertas();
            }
            setAlertas(data);
        } catch (error) {
            console.error("Erro ao carregar alertas:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Interface de acionamento do trabalhador da estufa.
     * Sinaliza para a placa/backend remoto que a condição impeditiva já foi avaliada e sanada localmente.
     * @param {string} id O registro a ser desativado.
     */
    const handleMarkAsRead = async (id: string | undefined) => {
        if(!id) return;
        try {
            await ApiService.marcarAlertaLido(id);
            await loadData();
        } catch(error) {
            console.error("Erro ao marcar lido:", error);
        }
    };

    // Monitora a troca de abas para refazer o pull da API
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const MemoizedAlertItem = React.memo(({ item, theme, colorScheme, activeTab, onMarkAsRead }: any) => (
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: colorScheme === 'dark' ? '#000' : '#101828', opacity: item.is_active ? 1 : 0.7 }]}>
            <View style={[styles.severityStrip, { backgroundColor: Colors.severity[item.severity] }]} />
            <View style={{ padding: 16, flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={[styles.typeText, { color: Colors.severity[item.severity] }]}>
                        {item.type.replace(/_/g, ' ').toUpperCase()}
                        {!item.is_active && <Text style={{fontSize: 10, color: theme.icon}}> (Resolvido)</Text>}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.icon }}>
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>
                <Text style={{ marginTop: 8, color: theme.text, fontSize: 15, lineHeight: 22 }}>
                    {item.message}
                </Text>
                
                {(item.is_active && activeTab === 'ativos') && (
                    <TouchableOpacity 
                        style={[styles.readButton, { borderColor: theme.border }]} 
                        onPress={() => onMarkAsRead(item._id || item.device_id)}
                    >
                        <MaterialCommunityIcons name="check-all" size={16} color={theme.tint} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.tint, fontWeight: '600' }}>Marcar como Lido</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ));

    const renderItem = React.useCallback(({ item }: { item: Alerta }) => (
        <MemoizedAlertItem 
            item={item} 
            theme={theme} 
            colorScheme={colorScheme} 
            activeTab={activeTab} 
            onMarkAsRead={handleMarkAsRead} 
        />
    ), [theme, colorScheme, activeTab]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'ativos' && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                    onPress={() => setActiveTab('ativos')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'ativos' ? '#FFF' : theme.text }]}>Alerta Ativos</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'historico' && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                    onPress={() => setActiveTab('historico')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'historico' ? '#FFF' : theme.text }]}>Histórico Geral</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={alertas}
                keyExtractor={(item, index) => (item._id || item.device_id) + index.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.tint} />}
                initialNumToRender={8}
                windowSize={5}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <MaterialCommunityIcons name={activeTab === 'ativos' ? "shield-check" : "history"} size={64} color={Colors.severity.normal} />
                        <Text style={{ textAlign: 'center', marginTop: 16, color: theme.icon, fontSize: 16 }}>
                            {activeTab === 'ativos' ? "Nenhum alerta ativo no momento. Estufa segura!" : "Nenhum registro no histórico."}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    tabText: {
        fontWeight: 'bold',
    },
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        marginBottom: 16,
        elevation: 3,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        overflow: 'hidden'
    },
    severityStrip: {
        width: 8,
    },
    typeText: { fontSize: 14, fontWeight: 'bold' },
    readButton: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    }
});
