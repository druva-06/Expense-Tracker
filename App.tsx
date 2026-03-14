import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { AppProvider } from './src/contexts/AppContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { theme } from './src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#EEF2FF',
  },
};

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setBackgroundColorAsync('#EEF2FF');
    void NavigationBar.setButtonStyleAsync('dark');
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <View style={styles.appBackground}>
          <NavigationContainer theme={navigationTheme}>
            <Tab.Navigator
              screenOptions={{
                sceneStyle: { backgroundColor: '#EEF2FF' },
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: '#64748B',
                tabBarStyle: {
                  height: 74,
                  paddingTop: 8,
                  paddingBottom: 12,
                  marginHorizontal: 14,
                  marginBottom: 12,
                  borderRadius: 18,
                  borderTopWidth: 0,
                  backgroundColor: '#FFFFFF',
                  elevation: 0,
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.14,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                },
                tabBarLabelStyle: {
                  fontSize: 12,
                  fontWeight: '600',
                },
                headerShown: false,
              }}
            >
              <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                  tabBarLabel: 'Chat',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="chat-processing-outline" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  tabBarLabel: 'Home',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                  tabBarLabel: 'History',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="history" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' },
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </View>
        <StatusBar style="light" />
      </AppProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
});
