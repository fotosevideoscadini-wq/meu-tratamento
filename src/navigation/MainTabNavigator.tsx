import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { MainTabParamList } from "./types";
import { useTheme } from "@/theme/ThemeContext";
import { HomeStackNavigator } from "./HomeStackNavigator";
import { MedicationsStackNavigator } from "./MedicationsStackNavigator";
import { CalendarScreen } from "@/screens/Calendar/CalendarScreen";
import { ReportsScreen } from "@/screens/Reports/ReportsScreen";
import { MoreStackNavigator } from "./MoreStackNavigator";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Ícones definitivos da navegação inferior (grandes, conforme referência visual).
const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: "home",
  MedicationsTab: "medkit",
  CalendarTab: "calendar",
  ReportsTab: "bar-chart",
  MoreTab: "ellipsis-horizontal",
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: "Início",
  MedicationsTab: "Medicamentos",
  CalendarTab: "Calendário",
  ReportsTab: "Relatórios",
  MoreTab: "Mais",
};

export function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabel: TAB_LABELS[route.name as keyof MainTabParamList],
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="MedicationsTab" component={MedicationsStackNavigator} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} />
      <Tab.Screen name="ReportsTab" component={ReportsScreen} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}
