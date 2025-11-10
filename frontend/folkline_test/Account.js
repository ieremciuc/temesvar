// src/screens/Account.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Account() {
  const [participation, setParticipation] = useState({});

  const loadParticipation = async () => {
    try {
      const stored = await AsyncStorage.getItem("participation");
      if (stored) {
        setParticipation(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadParticipation();
    // Ascultă schimbări în AsyncStorage
    const interval = setInterval(loadParticipation, 1000);
    return () => clearInterval(interval);
  }, []);

  const participatingEvents = Object.keys(participation).filter(
    (title) => participation[title]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contul Meu</Text>
      <Text style={styles.subtitle}>Evenimente la care participi:</Text>

      {participatingEvents.length > 0 ? (
        <ScrollView style={styles.list}>
          {participatingEvents.map((title) => (
            <View key={title} style={styles.eventItem}>
              <Text style={styles.eventText}>{title}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>
          Nu participi la niciun eveniment încă.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B2632", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFB162", marginBottom: 20 },
  subtitle: { fontSize: 18, color: "#EEE9DF", marginBottom: 15 },
  list: { flex: 1 },
  eventItem: { backgroundColor: "#2C3B4D", padding: 15, borderRadius: 10, marginBottom: 10 },
  eventText: { color: "#EEE9DF", fontSize: 16 },
  emptyText: { color: "#C9C1B1", fontSize: 16, fontStyle: "italic" },
});