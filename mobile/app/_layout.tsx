import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useColorScheme, Platform } from 'react-native';

/**
 * Roteador Raiz e Base Estrutural do App.
 * Implementa a barra de abas nativa e o comportamento visual central atrelado ao tema 
 * noturno (Dark/Light) impulsionado pelo Expo Router nativo.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarStyle: { 
            backgroundColor: theme.background, 
            borderTopColor: theme.border,
            height: Platform.OS === 'ios' ? 90 : 75,
            paddingBottom: Platform.OS === 'ios' ? 30 : 15,
            paddingTop: 8,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        },
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="leaf" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bell-alert" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="diagnostico"
        options={{
          title: 'Diagnóstico',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="monitor-dashboard" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
