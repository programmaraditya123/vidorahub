import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { VideoPlayerScreen } from '@/screens/video/VideoPlayerScreen';
import { ChannelScreen } from '@/screens/channel/ChannelScreen';
import { EarnScreen } from '@/screens/earn/EarnScreen';
import { HistoryScreen } from '@/screens/history/HistoryScreen';
import { UploadChooserScreen } from '@/screens/upload/UploadChooserScreen';
import { UploadVideoScreen } from '@/screens/upload/UploadVideoScreen';
import { UploadVibeScreen } from '@/screens/upload/UploadVibeScreen';
import { UploadContentScreen } from '@/screens/upload/UploadContentScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { colors } from '@/theme';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Channel" component={ChannelScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Earn" component={EarnScreen} options={{ title: 'Earn' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen
        name="UploadChooser"
        component={UploadChooserScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="UploadVideo"
        component={UploadVideoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UploadVibe"
        component={UploadVibeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UploadDetails"
        component={UploadContentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
