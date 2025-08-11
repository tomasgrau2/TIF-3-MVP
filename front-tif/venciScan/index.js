import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Registra el componente principal de la aplicación usando Expo Router
export default function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App); 