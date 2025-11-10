// src/screens/Explore.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { getEventsByCountry, searchEventsByKeyword } from "../services/api";

export default function Explore({ navigation }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [events, setEvents] = useState([]);
  const [participation, setParticipation] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const webviewRef = useRef(null);
  const isInitialLoad = useRef(true);

  const countryMap = {
    "România": "RO", "Romania": "RO",
    "Brazilia": "BR", "Brazil": "BR",
    "Japonia": "JP", "Japan": "JP",
    "Germania": "DE", "Germany": "DE",
    "Mexic": "MX", "Mexico": "MX",
    "Polonia": "PL", "Poland": "PL",
  };

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("participation");
        if (stored) setParticipation(JSON.parse(stored));
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const saveParticipation = async (newP) => {
    try {
      await AsyncStorage.setItem("participation", JSON.stringify(newP));
    } catch (e) { console.error(e); }
  };

  const handleWebViewMessage = async (event) => {
    const countryName = event.nativeEvent.data?.trim();
    if (!countryName || isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    console.log("Țară primită:", countryName);

    const code = countryMap[countryName];
    if (!code) {
      Alert.alert("Eroare", `Țara "${countryName}" nu e suportată.`);
      return;
    }

    setLoading(true);
    setSelectedCountry(countryName);
    try {
      const res = await getEventsByCountry(code);
      setEvents(res);
    } catch (e) {
      Alert.alert("Eroare", "Nu s-au putut încărca evenimentele.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSelectedCountry(null);

    try {
      const results = await searchEventsByKeyword(search);
      setEvents(results);
    } catch (e) {
      Alert.alert("Eroare", "Probleme la căutare.");
    } finally {
      setLoading(false);
      setSearch("");
    }
  };

  const toggleParticipate = (title) => {
    setParticipation(prev => {
      const newP = { ...prev, [title]: !prev[title] };
      saveParticipation(newP);
      return newP;
    });
  };

  const clearSelection = () => {
    setEvents([]);
    setSelectedCountry(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.logoText}>Folkline</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Caută evenimente sau postări..."
          placeholderTextColor="#C9C1B1"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          onFocus={() => setEvents([])}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={22} color="#FFB162" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          source={require("../../web/map.html")}
          onMessage={handleWebViewMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FFB162" />
        </View>
      )}

      {!loading && events.length === 0 && selectedCountry && (
        <View style={styles.eventsPanel}>
          <Text style={styles.noEventsText}>
            Nu sunt postări pentru {selectedCountry}.
          </Text>
        </View>
      )}

      {!loading && events.length > 0 && (
        <TouchableOpacity onPress={clearSelection} style={styles.eventsOverlay}>
          <View style={styles.eventsPanel}>
            {selectedCountry && (
              <Text style={styles.countryTitle}>
                {selectedCountry} – Evenimente & postări
              </Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {events.map((item, idx) => {
                const isEvent = !!item.title && !item.author;
                return (
                  <TouchableOpacity key={item.id || idx} style={styles.eventCard} onPress={e => e.stopPropagation()}>
                    <Text style={styles.authorText}>Postat de: {item.author || "Anonim"}</Text>
                    {item.video ? (
                      <Video source={{ uri: item.video }} useNativeControls resizeMode="cover" style={styles.media} />
                    ) : item.image ? (
                      <Image source={{ uri: item.image }} style={styles.media} />
                    ) : null}
                    <Text style={styles.eventTitle}>{item.title || "Postare"}</Text>
                    <Text style={styles.eventDesc}>{item.description || ""}</Text>
                    {isEvent && (
                      <TouchableOpacity
                        style={[styles.participateBtn, participation[item.title] ? styles.participateBtnActive : null]}
                        onPress={e => { e.stopPropagation(); toggleParticipate(item.title); }}
                      >
                        <Text style={styles.participateText}>
                          {participation[item.title] ? "Participi" : "Participă"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B2632" },
  topbar: { padding: 15, alignItems: "center" },
  logoText: { fontSize: 22, fontWeight: "bold", color: "#FFB162" },
  searchContainer: { flexDirection: "row", padding: 10, backgroundColor: "#2C3E50", alignItems: "center" },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  mapContainer: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  eventsOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  eventsPanel: { maxHeight: 400, backgroundColor: "#2C3E50", padding: 15, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  countryTitle: { color: "#FFB162", fontWeight: "bold", fontSize: 16, marginBottom: 10, textAlign: "center" },
  noEventsText: { color: "#ccc", fontSize: 14, textAlign: "center", fontStyle: "italic", marginTop: 20 },
  eventCard: { backgroundColor: "#34495E", padding: 12, borderRadius: 10, marginBottom: 12 },
  authorText: { color: "#FFB162", fontSize: 13, fontWeight: "bold", marginBottom: 8 },
  media: { width: "100%", height: 180, borderRadius: 8, marginBottom: 10 },
  eventTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  eventDesc: { color: "#ddd", fontSize: 14, marginVertical: 5 },
  participateBtn: { backgroundColor: "#FFB162", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  participateBtnActive: { backgroundColor: "#F5F5DC" },
  participateText: { color: "#1B2632", fontWeight: "bold" },
});