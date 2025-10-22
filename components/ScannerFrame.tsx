import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ScannerFrame() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Left Corner */}
      <View style={styles.cornerTopLeft}>
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLine} />
      </View>

      {/* Top Right Corner */}
      <View style={styles.cornerTopRight}>
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLineRight} />
      </View>

      {/* Bottom Left Corner */}
      <View style={styles.cornerBottomLeft}>
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLine} />
      </View>

      {/* Bottom Right Corner */}
      <View style={styles.cornerBottomRight}>
        <View style={styles.horizontalLine} />
        <View style={styles.verticalLineRight} />
      </View>

      {/* Center crosshair */}
      <View style={styles.centerContainer}>
        <View style={styles.centerHorizontal} />
        <View style={styles.centerVertical} />
      </View>
    </View>
  );
}

const cornerSize = 40;
const lineWidth = 4;

const styles = StyleSheet.create({
  // Top Left
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: cornerSize,
    height: cornerSize,
  },
  // Top Right
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: cornerSize,
    height: cornerSize,
  },
  // Bottom Left
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: cornerSize,
    height: cornerSize,
  },
  // Bottom Right
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: cornerSize,
    height: cornerSize,
  },
  horizontalLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: cornerSize,
    height: lineWidth,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: lineWidth,
    height: cornerSize,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  verticalLineRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: lineWidth,
    height: cornerSize,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  // Center crosshair
  centerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
  },
  centerHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: 60,
    height: 2,
    backgroundColor: '#3B82F6',
    opacity: 0.6,
  },
  centerVertical: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: 60,
    backgroundColor: '#3B82F6',
    opacity: 0.6,
  },
});
