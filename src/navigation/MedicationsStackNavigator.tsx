import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MedicationsStackParamList } from "./types";
import { MedicationsListScreen } from "@/screens/Medications/MedicationsListScreen";
import { MedicationDetailScreen } from "@/screens/Medications/MedicationDetailScreen";
import { MedicationFormScreen } from "@/screens/Medications/MedicationFormScreen";

const Stack = createNativeStackNavigator<MedicationsStackParamList>();

export function MedicationsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MedicationsList" component={MedicationsListScreen} />
      <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <Stack.Screen name="MedicationForm" component={MedicationFormScreen} />
    </Stack.Navigator>
  );
}
