import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreStackParamList } from "./types";
import { MoreScreen } from "@/screens/More/MoreScreen";
import { HistoryScreen } from "@/screens/History/HistoryScreen";
import { StockScreen } from "@/screens/Stock/StockScreen";
import { AppointmentsScreen } from "@/screens/Appointments/AppointmentsScreen";
import { AppointmentFormScreen } from "@/screens/Appointments/AppointmentFormScreen";
import { MeasurementsScreen } from "@/screens/Measurements/MeasurementsScreen";
import { FamilyScreen } from "@/screens/Family/FamilyScreen";
import { AIAssistantScreen } from "@/screens/AI/AIAssistantScreen";
import { PlanScreen } from "@/screens/Premium/PlanScreen";
import { SettingsScreen } from "@/screens/Settings/SettingsScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Stock" component={StockScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
      <Stack.Screen name="Measurements" component={MeasurementsScreen} />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
