import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.appName}>
          <Text style={styles.venciText}>Venci</Text>
          <Text style={styles.scanText}>Scan</Text>
        </Text>
      </View>
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentView === ViewMode.DASHBOARD && styles.activeNavButton,
          ]}
          onPress={() => onNavigate(ViewMode.DASHBOARD)}
        >
          <Text style={[
            styles.navText,
            currentView === ViewMode.DASHBOARD && styles.activeNavText,
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentView === ViewMode.CALENDAR && styles.activeNavButton,
          ]}
          onPress={() => onNavigate(ViewMode.CALENDAR)}
        >
          <Text style={[
            styles.navText,
            currentView === ViewMode.CALENDAR && styles.activeNavText,
          ]}>
            Calendario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentView === ViewMode.SCAN && styles.activeNavButton,
          ]}
          onPress={() => onNavigate(ViewMode.SCAN)}
        >
          <Text style={[
            styles.navText,
            currentView === ViewMode.SCAN && styles.activeNavText,
          ]}>
            Escanear
          </Text>
        </TouchableOpacity>
      </View>

      {currentView === ViewMode.DASHBOARD && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    padding: 16,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  venciText: {
    color: '#fff',
  },
  scanText: {
    color: '#0ea5e9',
  },
  navContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#0ea5e9',
  },
  navText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  activeNavText: {
    color: '#ffffff',
  },
  searchContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default Navbar; 