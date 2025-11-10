// App.js
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Text, View } from "react-native";

import Account from "./src/screens/Account"; // dacă ai deja, păstrează-l
import Add from "./src/screens/Add";
import Explore from "./src/screens/Explore";
import Home from "./src/screens/Home";
import Messages from "./src/screens/Messages";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#1B2632",
            borderTopColor: "#2C3B4D",
            borderTopWidth: 1,
            height: 70,
          },
          tabBarActiveTintColor: "#FFB162",
          tabBarInactiveTintColor: "#C9C1B1",
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={28} color={color} />,
          }}
        />
        <Tab.Screen
          name="Explore"
          component={Explore}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="compass-outline" size={28} color={color} />,
          }}
        />
        <Tab.Screen
          name="Add"
          component={Add}
          options={{
            tabBarIcon: () => (
              <View
                style={{
                  backgroundColor: "#FFB162",
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: "center",
                  alignItems: "center",
                  top: -20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <Text style={{ fontSize: 32, color: "#1B2632" }}>+</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Messages"
          component={Messages}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={28} color={color} />,
          }}
        />
        <Tab.Screen
          name="Account"
          component={Account}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={28} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}