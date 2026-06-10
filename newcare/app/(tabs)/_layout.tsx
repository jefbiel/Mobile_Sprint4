
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, PALETA_PADRAO } from '@/constants/theme';

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[PALETA_PADRAO].primary,
            tabBarInactiveTintColor: Colors[PALETA_PADRAO].secondary,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              backgroundColor: Colors[PALETA_PADRAO].card,
              borderTopColor: Colors[PALETA_PADRAO].secondary,
              height: 68,
              paddingBottom: 16,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Início',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
            }}
          />
        </Tabs>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
