import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, PermissionsAndroid, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Geolocation from '@react-native-community/geolocation';
import {CONFIG} from './src/config';
import {searchPlaces} from './src/services/places';
import {calculateRoute} from './src/services/routing';
import {navigationReaction, parseLocalCommand, askLocalAssistant} from './src/services/assistant';
import type {AssistantChatMessage} from './src/services/assistant';
import {evaluateRouteProgress} from './src/services/routeProgress';
import {speakNavigation, stopSpeech, startSpeechRecognition, stopSpeechRecognition, setSpeechRecognitionHandlers, destroySpeechRecognition} from './src/services/speech';
import type {Coordinate, Place, Personality, RouteSummary} from './src/types/navigation';

export default function App() {
  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [personality, setPersonality] = useState<Personality>('friendly');
  const [status, setStatus] = useState('Ready when you are');
  const [assistantInput, setAssistantInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speechLocale, setSpeechLocale] = useState<'en-US'|'bn-BD'>('en-US');
  const [conversation, setConversation] = useState<AssistantChatMessage[]>([]);
  const [activeInstruction, setActiveInstruction] = useState('Follow the highlighted route.');
  const nextManeuverIndex = useRef(1);
  const previousRouteProgress = useRef<number | undefined>(undefined);
  const assistantMessageHandler = useRef<(text: string) => void>(() => {});
  const [mapError, setMapError] = useState(false);
  const offRouteSamples = useRef(0);
  const wrongWaySamples = useRef(0);
  const lastRerouteAt = useRef(0);
  const rerouteInFlight = useRef(false);
  const routeFeature = useMemo(() => route ? ({type: 'Feature' as const, properties: {}, geometry: {type: 'LineString' as const, coordinates: route.shape}}) : null, [route]);

  async function locate() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Location permission is required.');
      }
      Geolocation.getCurrentPosition(
        position => {
          const point: Coordinate = [position.coords.longitude, position.coords.latitude];
          setOrigin(point);
          setStatus('Your location is ready');
        },
        error => Alert.alert('Location unavailable', error.message),
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
      );
    } catch (error) {
      Alert.alert('Location permission', error instanceof Error ? error.message : 'Unable to access location.');
    }
  }

  async function findPlaces(value: string) {
    setQuery(value); setDestination(null); setRoute(null);
    if (value.trim().length < 2) {setResults([]); return;}
    setBusy(true);
    try {setResults(await searchPlaces(value, origin ?? undefined));}
    catch (error) {setStatus(error instanceof Error ? error.message : 'Search unavailable');}
    finally {setBusy(false);}
  }

  async function startRoute(place: Place) {
    setDestination(place); setResults([]); setQuery(place.name);
    if (!origin) {Alert.alert('Find your location first', 'Tap the location button, then select the destination again.'); return;}
    setBusy(true);
    try {
      const nextRoute = await calculateRoute(origin, place.coordinate);
      setRoute(nextRoute);
      nextManeuverIndex.current = 1;
      setActiveInstruction(nextRoute.maneuvers[0]?.instruction ?? 'Follow the highlighted route.');
      setStatus(`${(nextRoute.distanceMeters / 1000).toFixed(1)} km · ${Math.round(nextRoute.durationSeconds / 60)} min`);
      announceNavigation(nextRoute.instructions[0] ?? 'Route ready. Follow the highlighted route.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Routing unavailable');
      Alert.alert('Route unavailable', 'Check that your self-hosted Valhalla service is running and has map data.');
    } finally {setBusy(false);}
  }

  function announceNavigation(message: string) {
    if (!voiceMuted) speakNavigation(message, personality, speechLocale);
  }

  useEffect(() => {
    nextManeuverIndex.current = 1;
    previousRouteProgress.current = undefined;
    offRouteSamples.current = 0;
    wrongWaySamples.current = 0;
    setActiveInstruction(route?.maneuvers[0]?.instruction ?? route?.instructions[0] ?? 'Follow the highlighted route.');
  }, [route]);

  useEffect(() => {
    if (!route || !destination) return;
    const watchId = Geolocation.watchPosition(
      position => {
        const current: Coordinate = [position.coords.longitude, position.coords.latitude];
        const progress = evaluateRouteProgress(route.shape, current, position.coords.speed ?? undefined, position.coords.heading ?? undefined, previousRouteProgress.current);
        if (!progress) return;
        previousRouteProgress.current = progress.distanceAlongRouteMeters;
        // Skip a maneuver only after passing it by a GPS-jitter tolerance.
        while (nextManeuverIndex.current < route.maneuvers.length &&
          route.maneuvers[nextManeuverIndex.current].distanceAlongRouteMeters - progress.distanceAlongRouteMeters < -60) {
          nextManeuverIndex.current += 1;
        }
        const upcoming = route.maneuvers[nextManeuverIndex.current];
        if (upcoming) {
          const remainingMeters = upcoming.distanceAlongRouteMeters - progress.distanceAlongRouteMeters;
          if (remainingMeters <= 250 && remainingMeters >= -60) {
            setActiveInstruction(upcoming.instruction);
            setStatus(upcoming.instruction);
            announceNavigation(upcoming.instruction);
            nextManeuverIndex.current += 1;
          }
        }
        offRouteSamples.current = progress.offRouteCandidate ? offRouteSamples.current + 1 : 0;
        wrongWaySamples.current = progress.wrongWayCandidate ? wrongWaySamples.current + 1 : 0;
        if (wrongWaySamples.current >= 2) {
          const warning = 'Warning. Possible wrong-way movement. Follow road signs and do not make a sudden maneuver.';
          setStatus('⚠ ' + warning);
          announceNavigation(warning);
          wrongWaySamples.current = 0;
        }
        const now = Date.now();
        if (offRouteSamples.current >= 3 && !rerouteInFlight.current && now - lastRerouteAt.current > 30000) {
          rerouteInFlight.current = true; lastRerouteAt.current = now; offRouteSamples.current = 0;
          const offRouteMessage = navigationReaction('off_route', personality);
          setStatus(offRouteMessage);
          announceNavigation(offRouteMessage);
          calculateRoute(current, destination.coordinate)
            .then(nextRoute => {setRoute(nextRoute); const message = navigationReaction('rerouted', personality); setStatus(message); announceNavigation(nextRoute.instructions[0] ? message + ' ' + nextRoute.instructions[0] : message);})
            .catch(() => setStatus('Off route. Stay safe; a new route could not be calculated.'))
            .finally(() => {rerouteInFlight.current = false;});
        }
      },
      error => setStatus('Location tracking paused: ' + error.message),
      {enableHighAccuracy: true, distanceFilter: 8, interval: 2500, fastestInterval: 1000},
    );
    return () => Geolocation.clearWatch(watchId);
  }, [route, destination, personality, voiceMuted, speechLocale]);

  async function handleAssistantMessage(rawMessage: string) {
    const command = parseLocalCommand(rawMessage);
    if (command === 'repeat') {
      const instruction = activeInstruction || route?.instructions[0] || 'There is no active route to repeat yet.';
      setStatus(instruction);
      announceNavigation(instruction);
    } else if (command === 'mute') {
      setVoiceMuted(true);
      stopSpeech();
      setStatus('Voice guidance muted. Say unmute to turn it back on.');
    } else if (command === 'unmute') {
      setVoiceMuted(false);
      setStatus('Voice guidance is back on.');
      speakNavigation('Voice guidance is back on.', personality, speechLocale);
    } else {
      setStatus('Thinking with your local AI…');
      try {
        const response = await askLocalAssistant(rawMessage, personality, conversation, route, destination?.name);
        setConversation(previous => [...previous, {role: 'user', content: rawMessage}, {role: 'assistant', content: response}].slice(-12));
        setStatus(response);
        announceNavigation(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Local assistant is unavailable.';
        setStatus(message);
      }
    }
  }

  assistantMessageHandler.current = text => { void handleAssistantMessage(text); };

  function sendAssistantMessage() {
    const message = assistantInput.trim();
    if (!message) return;
    void handleAssistantMessage(message);
    setAssistantInput('');
  }

  async function toggleListening() {
    if (listening) {
      await stopSpeechRecognition();
      setListening(false);
      return;
    }
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Microphone permission is required.');
      }
      await startSpeechRecognition(speechLocale);
      setListening(true);
      setStatus('Listening for a short navigation command…');
    } catch (error) {
      setListening(false);
      setStatus(error instanceof Error ? error.message : 'Speech recognition is unavailable.');
    }
  }

  useEffect(() => {
    setSpeechRecognitionHandlers(text => {
      setAssistantInput(text);
      setListening(false);
      assistantMessageHandler.current(text);
    }, message => {
      setListening(false);
      setStatus('Voice input error: ' + message);
    }, () => setListening(false));
    return () => { destroySpeechRecognition(); stopSpeech(); };
  }, []);

  const center: Coordinate = origin ?? [-75.1652, 39.9526];
  const personalityNames: Personality[] = ['friendly', 'strict', 'funny', 'angry', 'professional'];
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9F7" />
      <View style={styles.header}><View><Text style={styles.brand}>AI Navigator</Text><Text style={styles.kicker}>FREE · LOCAL-FIRST · OPEN MAP DATA</Text></View><TouchableOpacity style={styles.locationButton} onPress={locate}><Text style={styles.locationButtonText}>◎</Text></TouchableOpacity></View>
      <View style={styles.mapWrap}>
        {!mapError ? <MapLibreGL.MapView style={styles.map} mapStyle={CONFIG.mapStyleURL} onDidFailLoadingMap={() => setMapError(true)}>
          <MapLibreGL.Camera centerCoordinate={center} zoomLevel={origin ? 14 : 11} animationMode="flyTo" animationDuration={600}/>
          {origin && <MapLibreGL.PointAnnotation id="origin" coordinate={origin}><View style={styles.userDot}/></MapLibreGL.PointAnnotation>}
          {destination && <MapLibreGL.PointAnnotation id="destination" coordinate={destination.coordinate}><View style={styles.destinationPin}><Text style={styles.pinText}>●</Text></View></MapLibreGL.PointAnnotation>}
          {routeFeature && <MapLibreGL.ShapeSource id="active-route" shape={routeFeature}><MapLibreGL.LineLayer id="route-line" style={{lineColor:'#287BDE',lineWidth:5,lineCap:'round',lineJoin:'round'}}/></MapLibreGL.ShapeSource>}
          <MapLibreGL.UserLocation visible showsUserHeadingIndicator={true}/>
        </MapLibreGL.MapView> : <View style={styles.mapFallback}><Text style={styles.mapFallbackIcon}>⌖</Text><Text style={styles.mapFallbackTitle}>Map service not connected</Text><Text style={styles.mapFallbackBody}>Start your self-hosted tile server and configure MAP_STYLE_URL in src/config.ts.</Text></View>}
        <View style={styles.mapBadge}><View style={styles.onlineDot}/><Text style={styles.mapBadgeText}>OPEN MAP DATA</Text></View>
      </View>
      <View style={styles.searchCard}><Text style={styles.label}>WHERE TO?</Text><TextInput value={query} onChangeText={findPlaces} placeholder="Search a place or address" placeholderTextColor="#89938B" style={styles.input} returnKeyType="search"/>{busy && <ActivityIndicator color="#287BDE" style={{marginTop:8}}/>}{results.length > 0 && <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" nestedScrollEnabled>{results.map(item => <TouchableOpacity key={item.id} style={styles.resultRow} onPress={() => startRoute(item)}><Text style={styles.resultName}>{item.name}</Text><Text style={styles.resultLabel}>{item.label}</Text></TouchableOpacity>)}</ScrollView>}</View>
      {route && <View style={styles.routeCard}><Text style={styles.routeTitle}>{destination?.name}</Text><Text style={styles.routeMeta}>{(route.distanceMeters / 1000).toFixed(1)} km · {Math.round(route.durationSeconds / 60)} min estimated</Text><Text style={styles.instruction}>{activeInstruction}</Text></View>}
      <View style={styles.assistantCard}><View style={styles.orb}><Text style={styles.orbText}>AI</Text></View><View style={{flex:1}}><Text style={styles.assistantTitle}>Your driving companion</Text><Text style={styles.assistantStatus}>{status}</Text><Text style={styles.assistantHint}>{navigationReaction('rerouted', personality)}</Text></View></View>
      <View style={styles.chatRow}><TextInput value={assistantInput} onChangeText={setAssistantInput} placeholder={voiceMuted ? 'Voice muted · say unmute' : 'Talk to your local AI assistant'} placeholderTextColor="#89938B" style={styles.chatInput} onSubmitEditing={sendAssistantMessage} returnKeyType="send"/><TouchableOpacity style={styles.chatSend} onPress={sendAssistantMessage}><Text style={styles.chatSendText}>Send</Text></TouchableOpacity><TouchableOpacity style={styles.languageButton} onPress={() => setSpeechLocale(current => current === 'en-US' ? 'bn-BD' : 'en-US')}><Text style={styles.languageText}>{speechLocale === 'en-US' ? 'EN' : 'বাংলা'}</Text></TouchableOpacity><TouchableOpacity style={[styles.micButton, listening && styles.micButtonActive]} onPress={toggleListening}><Text style={styles.chatSendText}>{listening ? "Stop" : "Mic"}</Text></TouchableOpacity></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personalityRow}>{personalityNames.map(item => <TouchableOpacity key={item} onPress={() => setPersonality(item)} style={[styles.personality, personality === item && styles.personalityActive]}><Text style={[styles.personalityText, personality === item && styles.personalityTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={styles.footer}>Foreground GPS rerouting, maneuver prompts and system speech are enabled. Background tracking and offline AI/voice models remain future work.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F9F7',paddingHorizontal:16},chatRow:{marginTop:8,flexDirection:'row',gap:8,alignItems:'center'},chatInput:{flex:1,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E5EAE5',borderRadius:12,paddingHorizontal:12,paddingVertical:9,fontSize:13,color:'#26352B'},chatSend:{backgroundColor:'#245B39',paddingHorizontal:16,paddingVertical:11,borderRadius:12},chatSendText:{color:'#FFFFFF',fontSize:12,fontWeight:'800'},micButton:{backgroundColor:'#386B9A',paddingHorizontal:13,paddingVertical:11,borderRadius:12},languageButton:{backgroundColor:'#E4EFE6',paddingHorizontal:11,paddingVertical:11,borderRadius:12},languageText:{color:'#245B39',fontSize:12,fontWeight:'800'},micButtonActive:{backgroundColor:'#B34B3F'},header:{paddingTop:8,paddingBottom:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{fontSize:25,fontWeight:'800',color:'#17251D'},kicker:{marginTop:4,fontSize:9,letterSpacing:1.1,color:'#47785A',fontWeight:'800'},locationButton:{width:42,height:42,borderRadius:21,backgroundColor:'#E4EFE6',alignItems:'center',justifyContent:'center'},locationButtonText:{fontSize:27,color:'#28603A'},mapWrap:{flex:1,minHeight:230,maxHeight:430,borderRadius:22,overflow:'hidden',backgroundColor:'#E6EEE7'},map:{flex:1},mapFallback:{flex:1,alignItems:'center',justifyContent:'center',padding:24},mapFallbackIcon:{fontSize:48,color:'#53745A'},mapFallbackTitle:{fontSize:16,fontWeight:'800',color:'#24392B',marginTop:8},mapFallbackBody:{fontSize:12,lineHeight:18,color:'#526B58',textAlign:'center',marginTop:6},mapBadge:{position:'absolute',top:12,left:12,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#FFFFFF',paddingHorizontal:10,paddingVertical:7,borderRadius:20},onlineDot:{width:7,height:7,borderRadius:4,backgroundColor:'#26965B'},mapBadgeText:{fontSize:9,fontWeight:'800',letterSpacing:.8,color:'#315B3D'},userDot:{width:18,height:18,borderRadius:9,backgroundColor:'#287BDE',borderWidth:4,borderColor:'#FFFFFF'},destinationPin:{width:24,height:24,borderRadius:12,backgroundColor:'#287BDE',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#FFFFFF'},pinText:{color:'#FFFFFF',fontSize:10},searchCard:{marginTop:12,padding:15,borderRadius:18,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E5EAE5'},label:{fontSize:9,letterSpacing:1.2,fontWeight:'800',color:'#748078'},input:{marginTop:5,paddingVertical:7,fontSize:15,color:'#26352B'},results:{maxHeight:150,marginTop:5},resultRow:{paddingVertical:10,borderTopWidth:1,borderTopColor:'#EEF1EE'},resultName:{fontWeight:'700',fontSize:13,color:'#26352B'},resultLabel:{fontSize:11,color:'#758078',marginTop:2},routeCard:{marginTop:10,padding:13,backgroundColor:'#E7F0FA',borderRadius:16},routeTitle:{fontSize:14,fontWeight:'800',color:'#173B63'},routeMeta:{fontSize:11,color:'#42698E',marginTop:3},instruction:{fontSize:12,color:'#173B63',marginTop:8,fontWeight:'700'},assistantCard:{marginTop:10,flexDirection:'row',alignItems:'center',padding:13,borderRadius:18,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E5EAE5'},orb:{width:42,height:42,borderRadius:21,backgroundColor:'#E4EFE6',alignItems:'center',justifyContent:'center'},orbText:{fontWeight:'900',color:'#28603A'},assistantTitle:{fontSize:13,fontWeight:'800',color:'#26352B'},assistantStatus:{fontSize:10,color:'#758078',marginTop:3},assistantHint:{fontSize:10,color:'#526B58',marginTop:4},personalityRow:{paddingVertical:9,gap:7},personality:{paddingHorizontal:12,paddingVertical:7,borderRadius:18,backgroundColor:'#E9EDE9'},personalityActive:{backgroundColor:'#245B39'},personalityText:{fontSize:10,color:'#526158',textTransform:'capitalize',fontWeight:'700'},personalityTextActive:{color:'#FFFFFF'},footer:{textAlign:'center',fontSize:9,color:'#89928B',paddingBottom:5},
});
